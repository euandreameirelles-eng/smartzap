import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  validateCampaign,
  getUpgradeRoadmap,
  getNextTier,
  getCachedLimits,
  cacheLimits,
  areLimitsStale,
  fetchAccountLimits,
  TIER_LIMITS,
  TIER_DISPLAY_NAMES,
  THROUGHPUT_LIMITS,
  DEFAULT_LIMITS,
  LIMITS_STORAGE_KEY,
  type AccountLimits,
  type MessagingTier,
} from '@/lib/meta-limits';

describe('Meta Limits', () => {
  describe('Constants', () => {
    it('has correct tier limits', () => {
      expect(TIER_LIMITS['TIER_250']).toBe(250);
      expect(TIER_LIMITS['TIER_1K']).toBe(1000);
      expect(TIER_LIMITS['TIER_2K']).toBe(2000);
      expect(TIER_LIMITS['TIER_10K']).toBe(10000);
      expect(TIER_LIMITS['TIER_100K']).toBe(100000);
      expect(TIER_LIMITS['TIER_UNLIMITED']).toBe(Infinity);
    });

    it('has display names for all tiers', () => {
      const tiers: MessagingTier[] = [
        'TIER_250', 'TIER_1K', 'TIER_2K', 'TIER_10K', 'TIER_100K', 'TIER_UNLIMITED'
      ];

      tiers.forEach(tier => {
        expect(TIER_DISPLAY_NAMES[tier]).toBeDefined();
        expect(typeof TIER_DISPLAY_NAMES[tier]).toBe('string');
      });
    });

    it('has correct throughput limits', () => {
      expect(THROUGHPUT_LIMITS['STANDARD']).toBe(80);
      expect(THROUGHPUT_LIMITS['HIGH']).toBe(1000);
    });

    it('has sensible default limits', () => {
      expect(DEFAULT_LIMITS.messagingTier).toBe('TIER_250');
      expect(DEFAULT_LIMITS.maxUniqueUsersPerDay).toBe(250);
      expect(DEFAULT_LIMITS.throughputLevel).toBe('STANDARD');
      expect(DEFAULT_LIMITS.maxMessagesPerSecond).toBe(80);
    });
  });

  describe('validateCampaign', () => {
    it('allows campaign within limits', () => {
      const limits: AccountLimits = {
        ...DEFAULT_LIMITS,
        maxUniqueUsersPerDay: 1000,
        usedToday: 0,
      };

      const result = validateCampaign(500, limits);

      expect(result.canSend).toBe(true);
      expect(result.blockedReason).toBeUndefined();
    });

    it('blocks campaign exceeding daily limit', () => {
      const limits: AccountLimits = {
        ...DEFAULT_LIMITS,
        maxUniqueUsersPerDay: 250,
        usedToday: 0,
      };

      const result = validateCampaign(500, limits);

      expect(result.canSend).toBe(false);
      expect(result.blockedReason).toContain('500');
      expect(result.blockedReason).toContain('250');
    });

    it('blocks campaign exceeding remaining quota', () => {
      const limits: AccountLimits = {
        ...DEFAULT_LIMITS,
        maxUniqueUsersPerDay: 1000,
        usedToday: 800,
      };

      const result = validateCampaign(300, limits);

      expect(result.canSend).toBe(false);
      expect(result.blockedReason).toContain('800');
      expect(result.blockedReason).toContain('200');
    });

    it('allows unlimited tier', () => {
      const limits: AccountLimits = {
        ...DEFAULT_LIMITS,
        messagingTier: 'TIER_UNLIMITED',
        maxUniqueUsersPerDay: Infinity,
      };

      const result = validateCampaign(1000000, limits);

      expect(result.canSend).toBe(true);
    });

    it('adds quality warning for RED quality on unlimited tier', () => {
      const limits: AccountLimits = {
        ...DEFAULT_LIMITS,
        messagingTier: 'TIER_UNLIMITED',
        maxUniqueUsersPerDay: Infinity,
        qualityScore: 'RED',
      };

      const result = validateCampaign(1000, limits);

      expect(result.canSend).toBe(true);
      expect(result.warnings.some(w => w.includes('BAIXA'))).toBe(true);
    });

    it('returns quality warning for RED quality', () => {
      const limits: AccountLimits = {
        ...DEFAULT_LIMITS,
        maxUniqueUsersPerDay: 1000,
        qualityScore: 'RED',
      };

      const result = validateCampaign(100, limits);

      expect(result.warnings.some(w => w.includes('BAIXA'))).toBe(true);
    });

    it('returns quality warning for YELLOW quality', () => {
      const limits: AccountLimits = {
        ...DEFAULT_LIMITS,
        maxUniqueUsersPerDay: 1000,
        qualityScore: 'YELLOW',
      };

      const result = validateCampaign(100, limits);

      expect(result.warnings.some(w => w.includes('MÉDIA'))).toBe(true);
    });

    it('warns about large campaigns', () => {
      const limits: AccountLimits = {
        ...DEFAULT_LIMITS,
        maxUniqueUsersPerDay: 100000,
        throughputLevel: 'STANDARD',
      };

      const result = validateCampaign(10000, limits);

      expect(result.warnings.some(w => w.includes('grande'))).toBe(true);
    });

    it('warns when near limit', () => {
      const limits: AccountLimits = {
        ...DEFAULT_LIMITS,
        maxUniqueUsersPerDay: 1000,
        usedToday: 0,
      };

      const result = validateCampaign(900, limits);

      expect(result.warnings.some(w => w.includes('90%'))).toBe(true);
    });

    it('calculates estimated duration', () => {
      const limits: AccountLimits = {
        ...DEFAULT_LIMITS,
        maxUniqueUsersPerDay: 10000,
      };

      const result = validateCampaign(1000, limits);

      expect(result.estimatedDuration).toBeDefined();
      expect(typeof result.estimatedDuration).toBe('string');
    });

    it('uses correct singular form for 1 segundo (regression: pluralization fix)', () => {
      // With 72 messages (90% of 80 mps = 72), duration = 72/72 = 1 second
      const limits: AccountLimits = {
        ...DEFAULT_LIMITS,
        maxUniqueUsersPerDay: 10000,
        maxMessagesPerSecond: 80, // 90% = 72 mps effective
      };

      // 72 contacts = exactly 1 second
      const result = validateCampaign(72, limits);

      // Should say "1 segundo" not "1 segundos"
      expect(result.estimatedDuration).toBe('1 segundo');
    });

    it('includes upgrade roadmap when blocked', () => {
      const limits: AccountLimits = {
        ...DEFAULT_LIMITS,
        messagingTier: 'TIER_250',
        maxUniqueUsersPerDay: 250,
      };

      const result = validateCampaign(500, limits);

      expect(result.upgradeRoadmap).toBeDefined();
      expect(result.upgradeRoadmap!.length).toBeGreaterThan(0);
    });
  });

  describe('getUpgradeRoadmap', () => {
    it('returns steps for TIER_250', () => {
      const limits: AccountLimits = {
        ...DEFAULT_LIMITS,
        messagingTier: 'TIER_250',
      };

      const steps = getUpgradeRoadmap(limits);

      expect(steps.length).toBeGreaterThan(0);
      expect(steps.some(s => s.title.includes('Verificar'))).toBe(true);
    });

    it('returns steps for TIER_2K', () => {
      const limits: AccountLimits = {
        ...DEFAULT_LIMITS,
        messagingTier: 'TIER_2K',
      };

      const steps = getUpgradeRoadmap(limits);

      expect(steps.length).toBeGreaterThan(0);
      expect(steps.some(s => s.title.includes('50%'))).toBe(true);
    });

    it('returns steps for TIER_10K', () => {
      const limits: AccountLimits = {
        ...DEFAULT_LIMITS,
        messagingTier: 'TIER_10K',
      };

      const steps = getUpgradeRoadmap(limits);

      expect(steps.length).toBeGreaterThan(0);
    });

    it('returns steps for TIER_100K', () => {
      const limits: AccountLimits = {
        ...DEFAULT_LIMITS,
        messagingTier: 'TIER_100K',
      };

      const steps = getUpgradeRoadmap(limits);

      expect(steps.length).toBeGreaterThan(0);
    });

    it('marks quality step as completed when quality is good', () => {
      const limits: AccountLimits = {
        ...DEFAULT_LIMITS,
        messagingTier: 'TIER_250',
        qualityScore: 'GREEN',
      };

      const steps = getUpgradeRoadmap(limits);
      // The quality step mentions "Manter qualidade" in the title
      const qualityStep = steps.find(s =>
        s.title.toLowerCase().includes('manter qualidade')
      );

      // Should find the "Manter qualidade alta" step and it should be completed for GREEN
      expect(qualityStep).toBeDefined();
      expect(qualityStep?.completed).toBe(true);
    });
  });

  describe('getNextTier', () => {
    it('returns next tier for TIER_250', () => {
      expect(getNextTier('TIER_250')).toBe('TIER_2K');
    });

    it('returns next tier for TIER_2K', () => {
      expect(getNextTier('TIER_2K')).toBe('TIER_10K');
    });

    it('returns next tier for TIER_10K', () => {
      expect(getNextTier('TIER_10K')).toBe('TIER_100K');
    });

    it('returns next tier for TIER_100K', () => {
      expect(getNextTier('TIER_100K')).toBe('TIER_UNLIMITED');
    });

    it('returns null for TIER_UNLIMITED', () => {
      expect(getNextTier('TIER_UNLIMITED')).toBeNull();
    });
  });

  describe('Storage functions', () => {
    const mockLocalStorage = (() => {
      let store: Record<string, string> = {};
      return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
          store[key] = value;
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

    describe('getCachedLimits', () => {
      it('returns null when no cached limits', () => {
        const result = getCachedLimits();
        expect(result).toBeNull();
      });

      it('returns cached limits when available', () => {
        const limits: AccountLimits = { ...DEFAULT_LIMITS };
        mockLocalStorage.setItem(LIMITS_STORAGE_KEY, JSON.stringify(limits));

        const result = getCachedLimits();
        expect(result).toEqual(limits);
      });

      it('returns null for invalid JSON', () => {
        mockLocalStorage.setItem(LIMITS_STORAGE_KEY, 'invalid json');

        const result = getCachedLimits();
        expect(result).toBeNull();
      });
    });

    describe('cacheLimits', () => {
      it('saves limits to localStorage', () => {
        const limits: AccountLimits = { ...DEFAULT_LIMITS };
        cacheLimits(limits);

        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          LIMITS_STORAGE_KEY,
          JSON.stringify(limits)
        );
      });
    });

    describe('areLimitsStale', () => {
      it('returns true for null limits', () => {
        expect(areLimitsStale(null)).toBe(true);
      });

      it('returns false for fresh limits', () => {
        const limits: AccountLimits = {
          ...DEFAULT_LIMITS,
          lastFetched: new Date().toISOString(),
        };

        expect(areLimitsStale(limits)).toBe(false);
      });

      it('returns true for limits older than 1 hour', () => {
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
        const limits: AccountLimits = {
          ...DEFAULT_LIMITS,
          lastFetched: twoHoursAgo.toISOString(),
        };

        expect(areLimitsStale(limits)).toBe(true);
      });
    });
  });

  describe('fetchAccountLimits', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('returns parsed limits on success', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            throughput: { level: 'high' },
            quality_score: { score: 'green' },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            whatsapp_business_manager_messaging_limit: 'TIER_10K',
          }),
        });

      const result = await fetchAccountLimits('12345', 'token');

      expect(result.messagingTier).toBe('TIER_10K');
      expect(result.throughputLevel).toBe('HIGH');
      expect(result.qualityScore).toBe('GREEN');
      expect(result.maxMessagesPerSecond).toBe(1000);
    });

    it('returns DEFAULT_LIMITS when API fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      const result = await fetchAccountLimits('12345', 'token');

      expect(result).toEqual(DEFAULT_LIMITS);
    });

    it('returns DEFAULT_LIMITS on network error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await fetchAccountLimits('12345', 'token');

      expect(result).toEqual(DEFAULT_LIMITS);
    });

    it('handles STANDARD throughput level', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            throughput: { level: 'standard' },
            quality_score: { score: 'yellow' },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            whatsapp_business_manager_messaging_limit: 'TIER_2K',
          }),
        });

      const result = await fetchAccountLimits('12345', 'token');

      expect(result.throughputLevel).toBe('STANDARD');
      expect(result.maxMessagesPerSecond).toBe(80);
      expect(result.qualityScore).toBe('YELLOW');
    });

    it('handles UNKNOWN quality score', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            throughput: {},
            quality_score: {},
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        });

      const result = await fetchAccountLimits('12345', 'token');

      expect(result.qualityScore).toBe('UNKNOWN');
    });
  });
});
