import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  logger,
  generateTraceId,
  logApiRequest,
  logApiResponse,
  logApiError,
  logCampaignEvent,
  logMessageSend,
  type LogEntry,
} from '@/lib/logger';

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
  randomUUID: vi.fn(() => 'test-uuid-1234-5678-9012-345678901234'),
});

describe('Logger', () => {
  let consoleSpy: {
    log: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
    debug: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    // Clear logs before each test
    logger.clearLogs();
    
    // Spy on console methods
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('logger instance', () => {
    it('logs info messages', () => {
      logger.info('Test info message');

      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('info');
      expect(logs[0].message).toBe('Test info message');
    });

    it('logs warn messages', () => {
      logger.warn('Test warning');

      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('warn');
      expect(consoleSpy.warn).toHaveBeenCalled();
    });

    it('logs error messages', () => {
      logger.error('Test error');

      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('error');
      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('logs debug messages', () => {
      vi.stubEnv('NODE_ENV', 'development');

      logger.debug('Test debug');

      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('debug');

      vi.unstubAllEnvs();
    });

    it('includes context in log entry', () => {
      logger.info('User action', { userId: '123', action: 'login' });

      const logs = logger.getLogs();
      expect(logs[0].context).toEqual({ userId: '123', action: 'login' });
    });

    it('includes timestamp in log entry', () => {
      const before = Date.now();
      logger.info('Test');
      const after = Date.now();

      const logs = logger.getLogs();
      expect(logs[0].timestamp).toBeGreaterThanOrEqual(before);
      expect(logs[0].timestamp).toBeLessThanOrEqual(after);
    });

    it('includes traceId in log entry', () => {
      logger.info('Test');

      const logs = logger.getLogs();
      expect(logs[0].traceId).toBeDefined();
      expect(typeof logs[0].traceId).toBe('string');
    });
  });

  describe('getLogs', () => {
    it('returns copy of logs array', () => {
      logger.info('Test 1');
      logger.info('Test 2');

      const logs1 = logger.getLogs();
      const logs2 = logger.getLogs();

      expect(logs1).toEqual(logs2);
      expect(logs1).not.toBe(logs2); // Different array instances
    });

    it('returns all logs in order', () => {
      logger.info('First');
      logger.warn('Second');
      logger.error('Third');

      const logs = logger.getLogs();
      expect(logs).toHaveLength(3);
      expect(logs[0].message).toBe('First');
      expect(logs[1].message).toBe('Second');
      expect(logs[2].message).toBe('Third');
    });
  });

  describe('getLogsByLevel', () => {
    it('filters logs by level', () => {
      logger.info('Info 1');
      logger.error('Error 1');
      logger.info('Info 2');
      logger.warn('Warn 1');
      logger.error('Error 2');

      const errors = logger.getLogsByLevel('error');
      expect(errors).toHaveLength(2);
      expect(errors.every(log => log.level === 'error')).toBe(true);
    });

    it('returns empty array when no logs match', () => {
      logger.info('Only info');

      const errors = logger.getLogsByLevel('error');
      expect(errors).toHaveLength(0);
    });
  });

  describe('log memory limit', () => {
    it('keeps only last maxLogs entries when limit exceeded', () => {
      // Logger has maxLogs = 1000
      // Add more than 1000 logs
      for (let i = 0; i < 1050; i++) {
        logger.info(`Log message ${i}`);
      }

      const logs = logger.getLogs();
      // Should have at most 1000 logs
      expect(logs.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('getLogsByTimeRange', () => {
    it('filters logs within time range', () => {
      // Access the method via the logger instance (it's a StructuredLogger)
      const structuredLogger = logger as unknown as {
        getLogsByTimeRange: (start: number, end: number) => any[];
      };

      logger.clearLogs();
      
      const now = Date.now();
      logger.info('Log 1');
      logger.info('Log 2');
      logger.info('Log 3');

      // Get logs from just before now to now + 1 second
      const logs = structuredLogger.getLogsByTimeRange(now - 1000, now + 10000);

      expect(logs.length).toBe(3);
    });

    it('returns empty array when no logs in range', () => {
      const structuredLogger = logger as unknown as {
        getLogsByTimeRange: (start: number, end: number) => any[];
      };

      logger.clearLogs();
      logger.info('Log 1');

      // Get logs from far in the past
      const logs = structuredLogger.getLogsByTimeRange(0, 1000);

      expect(logs).toHaveLength(0);
    });
  });

  describe('clearLogs', () => {
    it('removes all logs', () => {
      logger.info('Test 1');
      logger.info('Test 2');
      expect(logger.getLogs()).toHaveLength(2);

      logger.clearLogs();

      expect(logger.getLogs()).toHaveLength(0);
    });
  });

  describe('exportLogs', () => {
    it('exports logs as JSON string', () => {
      logger.info('Test message');

      const exported = logger.exportLogs();
      const parsed = JSON.parse(exported);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed[0].message).toBe('Test message');
    });

    it('exports empty array when no logs', () => {
      logger.clearLogs();

      const exported = logger.exportLogs();
      expect(exported).toBe('[]');
    });

    it('pretty prints JSON', () => {
      logger.info('Test');

      const exported = logger.exportLogs();
      expect(exported).toContain('\n'); // Pretty printed has newlines
    });
  });

  describe('generateTraceId', () => {
    it('returns a UUID string', () => {
      const traceId = generateTraceId();
      expect(typeof traceId).toBe('string');
      expect(traceId).toBe('test-uuid-1234-5678-9012-345678901234');
    });
  });

  describe('Convenience Functions', () => {
    describe('logApiRequest', () => {
      it('logs API request details', () => {
        logApiRequest('POST', '/api/campaigns', { name: 'Test' });

        const logs = logger.getLogs();
        expect(logs).toHaveLength(1);
        expect(logs[0].message).toBe('API Request');
        expect(logs[0].context?.method).toBe('POST');
        expect(logs[0].context?.url).toBe('/api/campaigns');
      });

      it('handles undefined data', () => {
        logApiRequest('GET', '/api/users');

        const logs = logger.getLogs();
        expect(logs[0].context?.data).toBeUndefined();
      });
    });

    describe('logApiResponse', () => {
      it('logs API response details', () => {
        logApiResponse('GET', '/api/users', 200, { users: [] });

        const logs = logger.getLogs();
        expect(logs[0].message).toBe('API Response');
        expect(logs[0].context?.status).toBe(200);
      });
    });

    describe('logApiError', () => {
      it('logs API error with stack', () => {
        const error = new Error('Request failed');
        logApiError('POST', '/api/campaigns', error);

        const logs = logger.getLogs();
        expect(logs[0].level).toBe('error');
        expect(logs[0].message).toBe('API Error');
        expect(logs[0].context?.error).toBe('Request failed');
        expect(logs[0].context?.stack).toBeDefined();
      });
    });

    describe('logCampaignEvent', () => {
      it('logs campaign event', () => {
        logCampaignEvent('camp-123', 'started', { contactCount: 100 });

        const logs = logger.getLogs();
        expect(logs[0].message).toBe('Campaign Event');
        expect(logs[0].context?.campaignId).toBe('camp-123');
        expect(logs[0].context?.event).toBe('started');
        expect(logs[0].context?.contactCount).toBe(100);
      });
    });

    describe('logMessageSend', () => {
      it('logs successful message send as info', () => {
        logMessageSend('+5521999999999', 'template-1', 'success');

        const logs = logger.getLogs();
        expect(logs[0].level).toBe('info');
        expect(logs[0].message).toBe('Message Sent');
      });

      it('logs failed message send as error', () => {
        logMessageSend('+5521999999999', 'template-1', 'failed', 'Rate limit');

        const logs = logger.getLogs();
        expect(logs[0].level).toBe('error');
        expect(logs[0].message).toBe('Message Send Failed');
        expect(logs[0].context?.error).toBe('Rate limit');
      });
    });
  });
});
