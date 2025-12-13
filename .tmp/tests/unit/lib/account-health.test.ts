import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  checkAccountHealth,
  quickHealthCheck,
  getHealthSummary,
  type AccountHealth,
  type HealthCheck,
} from '@/lib/account-health';

// Mock do logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Account Health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('checkAccountHealth', () => {
    it('returns healthy status when all services are ok', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          services: {
            redis: { status: 'ok', message: 'Conectado', latency: 5 },
            whatsapp: { status: 'ok', message: 'Conectado', phoneNumber: '+55...' },
            qstash: { status: 'ok' },
          },
        }),
      });

      const result = await checkAccountHealth();

      expect(result.isHealthy).toBe(true);
      expect(result.status).toBe('healthy');
      expect(result.checks).toHaveLength(3);
    });

    it('returns unhealthy when server is unreachable', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      const result = await checkAccountHealth();

      expect(result.isHealthy).toBe(false);
      expect(result.status).toBe('unhealthy');
      expect(result.checks[0].name).toBe('Servidor');
    });

    it('returns unhealthy when WhatsApp is not configured', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          services: {
            redis: { status: 'ok' },
            whatsapp: { status: 'not_configured' },
          },
        }),
      });

      const result = await checkAccountHealth();

      expect(result.isHealthy).toBe(false);
      expect(result.status).toBe('unhealthy');
      expect(result.checks.some(c => c.name === 'WhatsApp API' && c.status === 'fail')).toBe(true);
    });

    it('returns degraded when QStash is not configured', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          services: {
            redis: { status: 'ok' },
            whatsapp: { status: 'ok' },
            qstash: { status: 'not_configured' },
          },
        }),
      });

      const result = await checkAccountHealth();

      expect(result.isHealthy).toBe(true);
      expect(result.status).toBe('degraded');
    });

    it('returns unknown status on network error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await checkAccountHealth();

      expect(result.isHealthy).toBe(false);
      expect(result.status).toBe('unknown');
    });

    it('includes lastChecked timestamp', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ services: {} }),
      });

      const before = new Date();
      const result = await checkAccountHealth();
      const after = new Date();

      expect(result.lastChecked.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.lastChecked.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('quickHealthCheck', () => {
    it('returns canSend: true when all services are ok', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          services: {
            redis: { status: 'ok' },
            whatsapp: { status: 'ok' },
          },
        }),
      });

      const result = await quickHealthCheck();

      expect(result.canSend).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('returns canSend: false when server is unreachable', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      const result = await quickHealthCheck();

      expect(result.canSend).toBe(false);
      expect(result.reason).toContain('status');
    });

    it('returns canSend: false when WhatsApp is not configured', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          services: {
            redis: { status: 'ok' },
            whatsapp: { status: 'not_configured' },
          },
        }),
      });

      const result = await quickHealthCheck();

      expect(result.canSend).toBe(false);
      expect(result.reason).toContain('WhatsApp');
    });

    it('returns canSend: false when Redis is unavailable', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          services: {
            redis: { status: 'fail' },
            whatsapp: { status: 'ok' },
          },
        }),
      });

      const result = await quickHealthCheck();

      expect(result.canSend).toBe(false);
      expect(result.reason).toContain('dados');
    });

    it('returns canSend: false on network error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await quickHealthCheck();

      expect(result.canSend).toBe(false);
      expect(result.reason).toContain('conexão');
    });
  });

  describe('getHealthSummary', () => {
    it('returns green summary for healthy status', () => {
      const health: AccountHealth = {
        isHealthy: true,
        status: 'healthy',
        checks: [],
        lastChecked: new Date(),
      };

      const summary = getHealthSummary(health);

      expect(summary.icon).toBe('✅');
      expect(summary.color).toBe('green');
      expect(summary.title).toContain('Saudável');
    });

    it('returns yellow summary for degraded status', () => {
      const health: AccountHealth = {
        isHealthy: true,
        status: 'degraded',
        checks: [],
        lastChecked: new Date(),
      };

      const summary = getHealthSummary(health);

      expect(summary.icon).toBe('⚠️');
      expect(summary.color).toBe('yellow');
      expect(summary.title).toContain('Atenção');
    });

    it('returns red summary for unhealthy status', () => {
      const health: AccountHealth = {
        isHealthy: false,
        status: 'unhealthy',
        checks: [],
        lastChecked: new Date(),
      };

      const summary = getHealthSummary(health);

      expect(summary.icon).toBe('❌');
      expect(summary.color).toBe('red');
      expect(summary.title).toContain('Problema');
    });

    it('returns gray summary for unknown status', () => {
      const health: AccountHealth = {
        isHealthy: false,
        status: 'unknown',
        checks: [],
        lastChecked: new Date(),
      };

      const summary = getHealthSummary(health);

      expect(summary.icon).toBe('❓');
      expect(summary.color).toBe('gray');
      expect(summary.title).toContain('Desconhecido');
    });
  });
});
