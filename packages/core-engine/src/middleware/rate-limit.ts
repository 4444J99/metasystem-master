/**
 * Rate Limiting Middleware for Omni-Dromenon-Engine
 */

import { type Request, type Response, type NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator: (request: Request) => string;
  handler: (request: Request, response: Response) => void;
}

export class RateLimiter {
  private entries: Map<string, RateLimitEntry> = new Map();
  private config: RateLimitConfig;
  private cleanupInterval: ReturnType<typeof setInterval> | null;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = {
      windowMs: config.windowMs ?? 60_000,
      maxRequests: config.maxRequests ?? 100,
      keyGenerator: config.keyGenerator ?? this.defaultKeyGenerator,
      handler: config.handler ?? this.defaultHandler,
    };

    this.cleanupInterval = setInterval(() => this.cleanup(), 60_000);
    this.cleanupInterval.unref?.();
  }

  private defaultKeyGenerator(request: Request): string {
    return request.ip || request.socket.remoteAddress || 'unknown';
  }

  private defaultHandler(_request: Request, response: Response): void {
    response.status(429).json({
      error: 'Too many requests',
      retryAfter: Math.ceil(this.config.windowMs / 1_000),
    });
  }

  /** Check whether a key is allowed at an explicit evaluation time. */
  check(
    key: string,
    evaluationTime: number = Date.now(),
  ): { allowed: boolean; remaining: number; resetAt: number } {
    let entry = this.entries.get(key);

    if (!entry || entry.resetAt <= evaluationTime) {
      entry = {
        count: 0,
        resetAt: evaluationTime + this.config.windowMs,
      };
      this.entries.set(key, entry);
    }

    entry.count += 1;

    const allowed = entry.count <= this.config.maxRequests;
    const remaining = Math.max(0, this.config.maxRequests - entry.count);

    return { allowed, remaining, resetAt: entry.resetAt };
  }

  /** Return an Express middleware function. */
  middleware(): (request: Request, response: Response, next: NextFunction) => void {
    return (request: Request, response: Response, next: NextFunction) => {
      const key = this.config.keyGenerator(request);
      const result = this.check(key);

      response.setHeader('X-RateLimit-Limit', this.config.maxRequests);
      response.setHeader('X-RateLimit-Remaining', result.remaining);
      response.setHeader('X-RateLimit-Reset', Math.ceil(result.resetAt / 1_000));

      if (!result.allowed) {
        this.config.handler(request, response);
        return;
      }

      next();
    };
  }

  /** Reset one key. */
  reset(key: string): void {
    this.entries.delete(key);
  }

  /** Remove expired entries at an explicit evaluation time. */
  cleanup(evaluationTime: number = Date.now()): void {
    for (const [key, entry] of this.entries) {
      if (entry.resetAt <= evaluationTime) {
        this.entries.delete(key);
      }
    }
  }

  /** Stop periodic work and release stored entries. */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.entries.clear();
  }
}

export const apiLimiter = new RateLimiter({
  windowMs: 60_000,
  maxRequests: 100,
});

export const authLimiter = new RateLimiter({
  windowMs: 60_000,
  maxRequests: 10,
});

export const inputLimiter = new RateLimiter({
  windowMs: 60_000,
  maxRequests: 1_000,
});

export function createRateLimiter(config?: Partial<RateLimitConfig>): RateLimiter {
  return new RateLimiter(config);
}
