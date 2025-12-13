import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  validateData,
  validateOrDefault,
  validateCampaigns,
  validateContacts,
  validateTemplates,
  validateSettings,
  safeParseFromStorage,
  safeSaveToStorage,
  migrateAndValidate,
  CampaignSchema,
  ContactSchema,
  TemplateSchema,
  AppSettingsSchema,
} from '@/lib/storage-validation';
import { CampaignStatus, ContactStatus } from '@/types';

// Mock do logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Storage Validation', () => {
  describe('validateData', () => {
    it('returns success for valid data', () => {
      const data = { name: 'Test' };
      const schema = require('zod').z.object({ name: require('zod').z.string() });

      const result = validateData(schema, data);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
    });

    it('returns errors for invalid data', () => {
      const data = { name: 123 };
      const schema = require('zod').z.object({ name: require('zod').z.string() });

      const result = validateData(schema, data);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('validateOrDefault', () => {
    it('returns validated data on success', () => {
      const data = { name: 'Test' };
      const schema = require('zod').z.object({ name: require('zod').z.string() });

      const result = validateOrDefault(schema, data, { name: 'Default' });

      expect(result).toEqual(data);
    });

    it('returns default on failure', () => {
      const data = { name: 123 };
      const schema = require('zod').z.object({ name: require('zod').z.string() });
      const defaultValue = { name: 'Default' };

      const result = validateOrDefault(schema, data, defaultValue);

      expect(result).toEqual(defaultValue);
    });
  });

  describe('validateCampaigns', () => {
    it('validates array of campaigns', () => {
      const campaigns = [
        {
          id: '1',
          name: 'Campaign 1',
          status: CampaignStatus.DRAFT,
          recipients: 100,
          delivered: 50,
          read: 25,
          createdAt: new Date().toISOString(),
          templateName: 'template_1',
        },
      ];

      const result = validateCampaigns(campaigns);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('returns empty array for invalid data', () => {
      const result = validateCampaigns('not an array');
      expect(result).toEqual([]);
    });

    it('returns empty array for null', () => {
      const result = validateCampaigns(null);
      expect(result).toEqual([]);
    });
  });

  describe('validateContacts', () => {
    it('validates array of contacts', () => {
      const contacts = [
        {
          id: '1',
          name: 'John',
          phone: '+5521999999999',
          status: ContactStatus.OPT_IN,
          tags: ['vip'],
          lastActive: new Date().toISOString(),
        },
      ];

      const result = validateContacts(contacts);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('John');
    });

    it('returns empty array for invalid contacts', () => {
      const result = validateContacts([{ invalid: true }]);
      expect(result).toEqual([]);
    });
  });

  describe('validateTemplates', () => {
    it('validates array of templates', () => {
      const templates = [
        {
          id: '1',
          name: 'template_1',
          category: 'MARKETING',
          language: 'pt_BR',
          status: 'APPROVED',
          content: 'Hello {{1}}',
          preview: 'Hello World',
          lastUpdated: new Date().toISOString(),
        },
      ];

      const result = validateTemplates(templates);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('template_1');
    });
  });

  describe('validateSettings', () => {
    it('validates app settings', () => {
      const settings = {
        phoneNumberId: '12345',
        businessAccountId: '67890',
        accessToken: 'token123',
        isConnected: true,
      };

      const result = validateSettings(settings);

      expect(result.phoneNumberId).toBe('12345');
      expect(result.isConnected).toBe(true);
    });

    it('returns default settings for invalid data', () => {
      const result = validateSettings(null);

      expect(result.phoneNumberId).toBe('');
      expect(result.isConnected).toBe(false);
    });
  });

  describe('Storage Helpers', () => {
    const mockLocalStorage = (() => {
      let store: Record<string, string> = {};
      return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
          store[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete store[key];
        }),
        clear: () => {
          store = {};
        },
      };
    })();

    beforeEach(() => {
      mockLocalStorage.clear();
      vi.stubGlobal('window', { localStorage: mockLocalStorage });
      vi.stubGlobal('localStorage', mockLocalStorage);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    describe('safeParseFromStorage', () => {
      it('returns parsed and validated data', () => {
        const data = { phoneNumberId: '123', businessAccountId: '456', accessToken: 'abc', isConnected: true };
        mockLocalStorage.setItem('settings', JSON.stringify(data));

        const result = safeParseFromStorage('settings', AppSettingsSchema, {
          phoneNumberId: '',
          businessAccountId: '',
          accessToken: '',
          isConnected: false,
        });

        expect(result.phoneNumberId).toBe('123');
      });

      it('returns default for missing key', () => {
        const defaultValue = { phoneNumberId: '', businessAccountId: '', accessToken: '', isConnected: false };
        const result = safeParseFromStorage('nonexistent', AppSettingsSchema, defaultValue);

        expect(result).toEqual(defaultValue);
      });

      it('returns default for invalid JSON', () => {
        mockLocalStorage.setItem('settings', 'invalid json');
        const defaultValue = { phoneNumberId: '', businessAccountId: '', accessToken: '', isConnected: false };

        const result = safeParseFromStorage('settings', AppSettingsSchema, defaultValue);

        expect(result).toEqual(defaultValue);
      });
    });

    describe('safeSaveToStorage', () => {
      it('saves valid data', () => {
        const data = {
          phoneNumberId: '123',
          businessAccountId: '456',
          accessToken: 'abc',
          isConnected: true,
        };

        const result = safeSaveToStorage('settings', AppSettingsSchema, data);

        expect(result).toBe(true);
        expect(mockLocalStorage.setItem).toHaveBeenCalled();
      });

      it('rejects invalid data', () => {
        const invalidData = {
          phoneNumberId: 123, // Should be string
          businessAccountId: '456',
          accessToken: 'abc',
          isConnected: true,
        };

        const result = safeSaveToStorage('settings', AppSettingsSchema, invalidData as any);

        expect(result).toBe(false);
      });

      it('returns false when localStorage.setItem throws', () => {
        // Mock setItem to throw (e.g., quota exceeded)
        mockLocalStorage.setItem = vi.fn(() => {
          throw new Error('QuotaExceededError');
        });

        const data = {
          phoneNumberId: '123',
          businessAccountId: '456',
          accessToken: 'abc',
          isConnected: true,
        };

        const result = safeSaveToStorage('settings', AppSettingsSchema, data);

        expect(result).toBe(false);
      });
    });
  });

  describe('migrateAndValidate', () => {
    const simpleSchema = require('zod').z.object({
      id: require('zod').z.string(),
      value: require('zod').z.number(),
    });

    it('keeps valid entries', () => {
      const data = [
        { id: '1', value: 100 },
        { id: '2', value: 200 },
      ];

      const result = migrateAndValidate(data, simpleSchema);

      expect(result).toHaveLength(2);
    });

    it('removes invalid entries', () => {
      const data = [
        { id: '1', value: 100 },
        { id: '2', value: 'not a number' }, // Invalid
        { id: '3', value: 300 },
      ];

      const result = migrateAndValidate(data, simpleSchema);

      expect(result).toHaveLength(2);
      expect(result.map((r: any) => r.id)).toEqual(['1', '3']);
    });

    it('returns empty array for non-array input', () => {
      const result = migrateAndValidate('not an array' as any, simpleSchema);
      expect(result).toEqual([]);
    });

    it('returns empty array when all invalid', () => {
      const data = [
        { id: 1, value: 'a' },
        { id: 2, value: 'b' },
      ];

      const result = migrateAndValidate(data, simpleSchema);

      expect(result).toEqual([]);
    });
  });
});
