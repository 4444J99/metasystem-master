/**
 * Performer Subscriptions for Omni-Dromenon-Engine
 *
 * Manages performer connections, override handling, and
 * distributing consensus updates to performer dashboards.
 */

import {
  type PerformerOverride,
  type ConsensusResult,
  type ConsensusSnapshot,
  PerformerOverrideSchema,
  ParticipantRole,
} from '../types/index.js';
import { ParameterBus, BusEvent } from './parameter-bus.js';
import { authConfig } from '../config.js';

// =============================================================================
// TYPES
// =============================================================================

export interface PerformerSession {
  performerId: string;
  displayName: string;
  connectedAt: number;
  lastActiveAt: number;
  isAuthenticated: boolean;
  permissions: PerformerPermissions;
  subscriptions: Set<string>;
  activeOverrides: Set<string>;
}

export interface PerformerPermissions {
  canOverride: boolean;
  canPause: boolean;
  canEnd: boolean;
  canModifyConfig: boolean;
  overridableParameters: Set<string> | 'all';
}

export interface OverrideRequest {
  performerId: string;
  parameter: string;
  value: number;
  mode: 'absolute' | 'blend' | 'lock';
  blendFactor?: number;
  durationMs?: number;
  reason?: string;
}

// =============================================================================
// PERFORMER SUBSCRIPTIONS
// =============================================================================

export class PerformerSubscriptions {
  private bus: ParameterBus;
  private performers: Map<string, PerformerSession>;
  private overrides: Map<string, PerformerOverride>;
  private sessionId: string;
  private unsubscribers: Array<() => void>;

  constructor(bus: ParameterBus, sessionId: string) {
    this.bus = bus;
    this.sessionId = sessionId;
    this.performers = new Map();
    this.overrides = new Map();
    this.unsubscribers = [
      this.bus.subscribe(BusEvent.CONSENSUS_UPDATE, (result) => {
        this.distributeConsensusUpdate(result);
      }),
      this.bus.subscribe(BusEvent.CONSENSUS_SNAPSHOT, (snapshot) => {
        this.distributeSnapshot(snapshot);
      }),
    ];
  }

  // ===========================================================================
  // AUTHENTICATION
  // ===========================================================================

  /** Authenticate a performer with the configured prototype secret. */
  authenticate(_performerId: string, secret: string): boolean {
    return secret === authConfig.performerSecret;
  }

  /** Register a new performer session at an explicit clock. */
  registerPerformer(
    performerId: string,
    displayName: string,
    permissions?: Partial<PerformerPermissions>,
    evaluationTime: number = Date.now(),
  ): PerformerSession {
    const session: PerformerSession = {
      performerId,
      displayName,
      connectedAt: evaluationTime,
      lastActiveAt: evaluationTime,
      isAuthenticated: false,
      permissions: {
        canOverride: permissions?.canOverride ?? true,
        canPause: permissions?.canPause ?? true,
        canEnd: permissions?.canEnd ?? false,
        canModifyConfig: permissions?.canModifyConfig ?? false,
        overridableParameters: permissions?.overridableParameters ?? 'all',
      },
      subscriptions: new Set(),
      activeOverrides: new Set(),
    };

    this.performers.set(performerId, session);
    this.bus.publish(BusEvent.PARTICIPANT_JOIN, {
      clientId: performerId,
      role: ParticipantRole.PERFORMER,
    });

    return session;
  }

  /** Mark performer as authenticated. */
  setAuthenticated(
    performerId: string,
    authenticated: boolean,
    evaluationTime: number = Date.now(),
  ): void {
    const session = this.performers.get(performerId);
    if (session) {
      session.isAuthenticated = authenticated;
      session.lastActiveAt = evaluationTime;
    }
  }

  // ===========================================================================
  // OVERRIDE HANDLING
  // ===========================================================================

  /** Request an override from a performer. */
  requestOverride(
    request: OverrideRequest,
    evaluationTime: number = Date.now(),
  ): {
    success: boolean;
    reason?: string;
    override?: PerformerOverride;
  } {
    const session = this.performers.get(request.performerId);

    if (!session) {
      return { success: false, reason: 'performer_not_found' };
    }

    if (!session.isAuthenticated) {
      return { success: false, reason: 'not_authenticated' };
    }

    if (!session.permissions.canOverride) {
      return { success: false, reason: 'no_override_permission' };
    }

    if (
      session.permissions.overridableParameters !== 'all'
      && !session.permissions.overridableParameters.has(request.parameter)
    ) {
      return { success: false, reason: 'parameter_not_allowed' };
    }

    if (!Number.isFinite(request.value) || request.value < 0 || request.value > 1) {
      return { success: false, reason: 'invalid_value' };
    }

    if (
      request.blendFactor !== undefined
      && (!Number.isFinite(request.blendFactor)
        || request.blendFactor < 0
        || request.blendFactor > 1)
    ) {
      return { success: false, reason: 'invalid_blend_factor' };
    }

    if (
      request.durationMs !== undefined
      && (!Number.isFinite(request.durationMs) || request.durationMs <= 0)
    ) {
      return { success: false, reason: 'invalid_duration' };
    }

    const candidate: PerformerOverride = {
      performerId: request.performerId,
      parameter: request.parameter,
      value: request.value,
      mode: request.mode,
      blendFactor: request.blendFactor,
      expiresAt: request.durationMs !== undefined
        ? evaluationTime + request.durationMs
        : undefined,
      reason: request.reason,
    };
    const parsed = PerformerOverrideSchema.safeParse(candidate);
    if (!parsed.success) {
      return { success: false, reason: 'invalid_override' };
    }
    const override = parsed.data;

    // A parameter has one current owner. Replacing an override must also clear
    // the previous performer's ownership index.
    const previous = this.overrides.get(request.parameter);
    if (previous && previous.performerId !== request.performerId) {
      this.performers.get(previous.performerId)?.activeOverrides.delete(request.parameter);
    }

    this.overrides.set(request.parameter, override);
    session.activeOverrides.add(request.parameter);
    session.lastActiveAt = evaluationTime;
    this.bus.publishOverride(override);

    return { success: true, override };
  }

  /** Clear an override through the authenticated performer interface. */
  clearOverride(performerId: string, parameter: string): boolean {
    const session = this.performers.get(performerId);
    if (!session?.isAuthenticated) return false;

    const override = this.overrides.get(parameter);
    if (override?.performerId !== performerId) return false;

    this.removeStoredOverride(parameter, override, true);
    return true;
  }

  /** Clear all overrides owned by a performer, including during teardown. */
  clearAllOverrides(performerId: string): void {
    const session = this.performers.get(performerId);
    if (!session) return;

    for (const parameter of [...session.activeOverrides]) {
      const override = this.overrides.get(parameter);
      if (override?.performerId === performerId) {
        this.removeStoredOverride(parameter, override, true);
      } else {
        session.activeOverrides.delete(parameter);
      }
    }
  }

  /** Get active override for a parameter at an explicit clock. */
  getOverride(
    parameter: string,
    evaluationTime: number = Date.now(),
  ): PerformerOverride | null {
    const override = this.overrides.get(parameter);
    if (!override) return null;

    if (override.expiresAt !== undefined && evaluationTime >= override.expiresAt) {
      this.removeStoredOverride(parameter, override, false);
      return null;
    }

    return override;
  }

  /** Get all active overrides at an explicit clock. */
  getAllOverrides(
    evaluationTime: number = Date.now(),
  ): Map<string, PerformerOverride> {
    for (const [parameter, override] of [...this.overrides]) {
      if (override.expiresAt !== undefined && evaluationTime >= override.expiresAt) {
        this.removeStoredOverride(parameter, override, false);
      }
    }
    return new Map(this.overrides);
  }

  private removeStoredOverride(
    parameter: string,
    override: PerformerOverride,
    publish: boolean,
  ): void {
    this.overrides.delete(parameter);
    this.performers.get(override.performerId)?.activeOverrides.delete(parameter);

    if (publish) {
      this.bus.publish(BusEvent.PERFORMER_OVERRIDE_CLEAR, {
        parameter,
        performerId: override.performerId,
      });
    }
  }

  // ===========================================================================
  // SUBSCRIPTIONS
  // ===========================================================================

  /** Subscribe performer to parameter updates. */
  subscribeToParameter(performerId: string, parameter: string): void {
    this.performers.get(performerId)?.subscriptions.add(parameter);
  }

  /** Subscribe performer to all parameters. */
  subscribeToAll(performerId: string): void {
    this.performers.get(performerId)?.subscriptions.add('*');
  }

  /** Unsubscribe performer from parameter. */
  unsubscribe(performerId: string, parameter: string): void {
    this.performers.get(performerId)?.subscriptions.delete(parameter);
  }

  // ===========================================================================
  // DISTRIBUTION
  // ===========================================================================

  private distributeConsensusUpdate(_result: ConsensusResult): void {
    // The server layer owns concrete socket delivery.
  }

  private distributeSnapshot(_snapshot: ConsensusSnapshot): void {
    // The server layer owns concrete socket delivery.
  }

  /** Get performers subscribed to a parameter. */
  getSubscribedPerformers(parameter: string): PerformerSession[] {
    const performers: PerformerSession[] = [];
    for (const session of this.performers.values()) {
      if (session.subscriptions.has('*') || session.subscriptions.has(parameter)) {
        performers.push(session);
      }
    }
    return performers;
  }

  // ===========================================================================
  // SESSION MANAGEMENT
  // ===========================================================================

  /** Get the session identifier assigned to this subscription registry. */
  getSessionId(): string {
    return this.sessionId;
  }

  /** Get performer session. */
  getPerformer(performerId: string): PerformerSession | undefined {
    return this.performers.get(performerId);
  }

  /** Get all connected performers. */
  getAllPerformers(): PerformerSession[] {
    return Array.from(this.performers.values());
  }

  /** Remove performer and every override still indexed to that performer. */
  removePerformer(performerId: string): void {
    const session = this.performers.get(performerId);
    if (!session) return;

    this.clearAllOverrides(performerId);
    this.performers.delete(performerId);
    this.bus.publish(BusEvent.PARTICIPANT_LEAVE, {
      clientId: performerId,
      reason: 'disconnected',
    });
  }

  /** Update performer activity. */
  updateActivity(
    performerId: string,
    evaluationTime: number = Date.now(),
  ): void {
    const session = this.performers.get(performerId);
    if (session) {
      session.lastActiveAt = evaluationTime;
    }
  }

  /** Get active authenticated performer count at an explicit clock. */
  getActivePerformerCount(evaluationTime: number = Date.now()): number {
    const cutoff = evaluationTime - 60_000;
    let count = 0;
    for (const session of this.performers.values()) {
      if (session.lastActiveAt > cutoff && session.isAuthenticated) {
        count += 1;
      }
    }
    return count;
  }

  // ===========================================================================
  // CLEANUP
  // ===========================================================================

  /** Cleanup performers, overrides, and bus subscriptions. */
  destroy(): void {
    for (const performerId of [...this.performers.keys()]) {
      this.removePerformer(performerId);
    }
    for (const unsubscribe of this.unsubscribers) {
      unsubscribe();
    }
    this.unsubscribers = [];
  }
}

// =============================================================================
// FACTORY
// =============================================================================

export function createPerformerSubscriptions(
  bus: ParameterBus,
  sessionId: string,
): PerformerSubscriptions {
  return new PerformerSubscriptions(bus, sessionId);
}
