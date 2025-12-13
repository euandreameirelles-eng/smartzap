import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  TokenBucketRateLimiter,
  createRateLimiter,
  DEFAULT_RATE_LIMIT,
  MAX_RATE_LIMIT,
  MIN_RATE_LIMIT,
} from '@/lib/rate-limiter';

describe('Rate Limiter', () => {
  let limiter: TokenBucketRateLimiter;

  afterEach(() => {
    if (limiter) {
      limiter.stop();
    }
  });

  describe('TokenBucketRateLimiter', () => {
    describe('constructor', () => {
      it('creates limiter with default rate', () => {
        limiter = new TokenBucketRateLimiter();
        expect(limiter.getTokensAvailable()).toBe(DEFAULT_RATE_LIMIT);
      });

      it('creates limiter with custom rate', () => {
        limiter = new TokenBucketRateLimiter(50);
        expect(limiter.getTokensAvailable()).toBe(50);
      });

      it('throws error for rate below minimum', () => {
        expect(() => new TokenBucketRateLimiter(0)).toThrow();
        expect(() => new TokenBucketRateLimiter(-1)).toThrow();
      });

      it('throws error for rate above maximum', () => {
        expect(() => new TokenBucketRateLimiter(MAX_RATE_LIMIT + 1)).toThrow();
        expect(() => new TokenBucketRateLimiter(2000)).toThrow();
      });

      it('accepts minimum rate', () => {
        limiter = new TokenBucketRateLimiter(MIN_RATE_LIMIT);
        expect(limiter.getTokensAvailable()).toBe(MIN_RATE_LIMIT);
      });

      it('accepts maximum rate', () => {
        limiter = new TokenBucketRateLimiter(MAX_RATE_LIMIT);
        expect(limiter.getTokensAvailable()).toBe(MAX_RATE_LIMIT);
      });
    });

    describe('acquire', () => {
      it('consumes one token per acquire', async () => {
        limiter = new TokenBucketRateLimiter(10);
        const initialTokens = limiter.getTokensAvailable();

        await limiter.acquire();

        expect(limiter.getTokensAvailable()).toBe(initialTokens - 1);
      });

      it('allows multiple acquires up to limit', async () => {
        limiter = new TokenBucketRateLimiter(5);

        await limiter.acquire();
        await limiter.acquire();
        await limiter.acquire();

        expect(limiter.getTokensAvailable()).toBe(2);
      });

      it('waits when no tokens available', async () => {
        vi.useFakeTimers();
        limiter = new TokenBucketRateLimiter(1);

        // Consume the only token
        await limiter.acquire();
        expect(limiter.getTokensAvailable()).toBe(0);

        // Start another acquire (will wait)
        const acquirePromise = limiter.acquire();

        // Advance time to trigger refill
        await vi.advanceTimersByTimeAsync(1100);

        // Now should complete
        await expect(acquirePromise).resolves.toBeUndefined();

        vi.useRealTimers();
      });
    });

    describe('reset', () => {
      it('refills tokens to maximum', async () => {
        limiter = new TokenBucketRateLimiter(10);

        await limiter.acquire();
        await limiter.acquire();
        await limiter.acquire();

        expect(limiter.getTokensAvailable()).toBe(7);

        limiter.reset();

        expect(limiter.getTokensAvailable()).toBe(10);
      });
    });

    describe('getTokensAvailable', () => {
      it('returns integer value', () => {
        limiter = new TokenBucketRateLimiter(10);
        expect(Number.isInteger(limiter.getTokensAvailable())).toBe(true);
      });

      it('never returns negative', async () => {
        limiter = new TokenBucketRateLimiter(2);

        await limiter.acquire();
        await limiter.acquire();

        expect(limiter.getTokensAvailable()).toBeGreaterThanOrEqual(0);
      });
    });

    describe('stop', () => {
      it('stops the refill interval', () => {
        limiter = new TokenBucketRateLimiter(10);
        limiter.stop();
        // Should not throw and interval should be cleared
        expect(() => limiter.stop()).not.toThrow(); // Safe to call twice
      });
    });

    describe('updateRate', () => {
      it('updates rate limit', () => {
        limiter = new TokenBucketRateLimiter(10);
        limiter.updateRate(20);

        // Tokens should be capped at new max initially
        expect(limiter.getTokensAvailable()).toBeLessThanOrEqual(20);
      });

      it('throws error for invalid rate', () => {
        limiter = new TokenBucketRateLimiter(10);

        expect(() => limiter.updateRate(0)).toThrow();
        expect(() => limiter.updateRate(-5)).toThrow();
        expect(() => limiter.updateRate(MAX_RATE_LIMIT + 100)).toThrow();
      });

      it('caps tokens at new max', async () => {
        limiter = new TokenBucketRateLimiter(100);
        // Start with 100 tokens
        expect(limiter.getTokensAvailable()).toBe(100);

        // Reduce max to 50
        limiter.updateRate(50);

        // Tokens should be capped at 50
        expect(limiter.getTokensAvailable()).toBeLessThanOrEqual(50);
      });
    });
  });

  describe('createRateLimiter', () => {
    it('creates limiter with default rate', () => {
      limiter = createRateLimiter() as TokenBucketRateLimiter;
      expect(limiter.getTokensAvailable()).toBe(DEFAULT_RATE_LIMIT);
    });

    it('creates limiter with custom rate', () => {
      limiter = createRateLimiter(25) as TokenBucketRateLimiter;
      expect(limiter.getTokensAvailable()).toBe(25);
    });

    it('returns RateLimiter interface', () => {
      limiter = createRateLimiter() as TokenBucketRateLimiter;

      expect(typeof limiter.acquire).toBe('function');
      expect(typeof limiter.reset).toBe('function');
      expect(typeof limiter.getTokensAvailable).toBe('function');
      expect(typeof limiter.stop).toBe('function');
      expect(typeof limiter.updateRate).toBe('function');
    });
  });

  describe('Constants', () => {
    it('has sensible default values', () => {
      expect(DEFAULT_RATE_LIMIT).toBe(80);
      expect(MIN_RATE_LIMIT).toBe(1);
      expect(MAX_RATE_LIMIT).toBe(1000);
    });

    it('default is within valid range', () => {
      expect(DEFAULT_RATE_LIMIT).toBeGreaterThanOrEqual(MIN_RATE_LIMIT);
      expect(DEFAULT_RATE_LIMIT).toBeLessThanOrEqual(MAX_RATE_LIMIT);
    });
  });
});
