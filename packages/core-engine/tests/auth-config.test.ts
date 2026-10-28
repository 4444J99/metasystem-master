import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Auth Configuration in Production and Development', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('retains default fallback secrets when NODE_ENV is development or test', async () => {
    process.env.NODE_ENV = 'development';
    delete process.env.PERFORMER_SECRET;
    delete process.env.ADMIN_SECRET;
    delete process.env.JWT_SECRET;

    const { authConfig } = await import('../src/config.js');
    expect(authConfig.performerSecret).toBe('dev-secret-change-me');
    expect(authConfig.adminSecret).toBe('admin-secret-change-me');
    expect(authConfig.jwtSecret).toBe('jwt-secret-change-me');
  });

  it('loads valid production secrets preserving exact bytes', async () => {
    process.env.NODE_ENV = 'production';
    process.env.PERFORMER_SECRET = '  prod-performer-secret-123  ';
    process.env.ADMIN_SECRET = 'prod-admin-secret-456';
    process.env.JWT_SECRET = 'prod-jwt-secret-789';

    const { authConfig } = await import('../src/config.js');
    expect(authConfig.performerSecret).toBe('  prod-performer-secret-123  ');
    expect(authConfig.adminSecret).toBe('prod-admin-secret-456');
    expect(authConfig.jwtSecret).toBe('prod-jwt-secret-789');
  });

  it('fails in production when PERFORMER_SECRET is absent', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.PERFORMER_SECRET;
    process.env.ADMIN_SECRET = 'prod-admin-secret-456';
    process.env.JWT_SECRET = 'prod-jwt-secret-789';

    await expect(import('../src/config.js')).rejects.toThrow('PERFORMER_SECRET');
  });

  it('fails in production when ADMIN_SECRET is absent', async () => {
    process.env.NODE_ENV = 'production';
    process.env.PERFORMER_SECRET = 'prod-performer-secret-123';
    delete process.env.ADMIN_SECRET;
    process.env.JWT_SECRET = 'prod-jwt-secret-789';

    await expect(import('../src/config.js')).rejects.toThrow('ADMIN_SECRET');
  });

  it('fails in production when PERFORMER_SECRET is whitespace-only', async () => {
    process.env.NODE_ENV = 'production';
    process.env.PERFORMER_SECRET = '   \t  ';
    process.env.ADMIN_SECRET = 'prod-admin-secret-456';
    process.env.JWT_SECRET = 'prod-jwt-secret-789';

    await expect(import('../src/config.js')).rejects.toThrow('PERFORMER_SECRET');
  });

  it('fails in production when ADMIN_SECRET is empty string', async () => {
    process.env.NODE_ENV = 'production';
    process.env.PERFORMER_SECRET = 'prod-performer-secret-123';
    process.env.ADMIN_SECRET = '';
    process.env.JWT_SECRET = 'prod-jwt-secret-789';

    await expect(import('../src/config.js')).rejects.toThrow('ADMIN_SECRET');
  });

  it('fails in production when PERFORMER_SECRET uses the checked-in dev placeholder', async () => {
    process.env.NODE_ENV = 'production';
    process.env.PERFORMER_SECRET = 'dev-secret-change-me';
    process.env.ADMIN_SECRET = 'prod-admin-secret-456';
    process.env.JWT_SECRET = 'prod-jwt-secret-789';

    await expect(import('../src/config.js')).rejects.toThrow('PERFORMER_SECRET');
  });

  it('fails in production when ADMIN_SECRET uses the checked-in dev placeholder', async () => {
    process.env.NODE_ENV = 'production';
    process.env.PERFORMER_SECRET = 'prod-performer-secret-123';
    process.env.ADMIN_SECRET = 'admin-secret-change-me';
    process.env.JWT_SECRET = 'prod-jwt-secret-789';

    await expect(import('../src/config.js')).rejects.toThrow('ADMIN_SECRET');
  });

  it('never exposes secret values in failure messages', async () => {
    process.env.NODE_ENV = 'production';
    const secretValue = 'SECRET_VALUE_MUST_NOT_BE_LOGGED';
    process.env.PERFORMER_SECRET = 'dev-secret-change-me';
    process.env.ADMIN_SECRET = secretValue;
    process.env.JWT_SECRET = 'prod-jwt-secret-789';

    try {
      await import('../src/config.js');
      expect.fail('Expected config import to throw in production');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      expect(message).toContain('PERFORMER_SECRET');
      expect(message).not.toContain('dev-secret-change-me');
      expect(message).not.toContain(secretValue);
    }
  });

  it('ensures production process cannot authenticate with dev-secret-change-me', async () => {
    process.env.NODE_ENV = 'production';
    process.env.PERFORMER_SECRET = 'production-only-strong-secret';
    process.env.ADMIN_SECRET = 'production-only-admin-secret';
    process.env.JWT_SECRET = 'production-only-jwt-secret';

    const { authConfig } = await import('../src/config.js');
    const { createPerformerSubscriptions } = await import('../src/bus/performer-subscriptions.js');
    const { createBus } = await import('../src/bus/parameter-bus.js');

    const bus = createBus();
    const subs = createPerformerSubscriptions(bus, 'session-1');

    expect(subs.authenticate('performer-1', 'dev-secret-change-me')).toBe(false);
    expect(subs.authenticate('performer-1', 'admin-secret-change-me')).toBe(false);
    expect(subs.authenticate('performer-1', authConfig.performerSecret)).toBe(true);

    subs.destroy();
    bus.dispose();
  });
});
