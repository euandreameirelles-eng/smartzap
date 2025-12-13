import { describe, it, expect } from 'vitest';
import {
  calculateEffectivePrice,
  calculateCampaignCost,
  usdToBrl,
  formatBRL,
  getPricingBreakdown,
  type TemplateCategory,
} from '@/lib/whatsapp-pricing';

describe('WhatsApp Pricing Calculator', () => {
  describe('calculateEffectivePrice', () => {
    describe('Marketing messages', () => {
      it('should calculate base price for low volume (<1000)', () => {
        const price = calculateEffectivePrice('MARKETING', 500);
        expect(price).toBe(0.0825);
      });

      it('should apply 3% discount for 1001-10000 messages', () => {
        const price = calculateEffectivePrice('MARKETING', 5000);
        expect(price).toBeCloseTo(0.0825 * 0.97, 4);
      });

      it('should apply 10% discount for 10001-100000 messages', () => {
        const price = calculateEffectivePrice('MARKETING', 50000);
        expect(price).toBeCloseTo(0.0825 * 0.90, 4);
      });

      it('should apply 25% discount for >100000 messages', () => {
        const price = calculateEffectivePrice('MARKETING', 150000);
        expect(price).toBeCloseTo(0.0825 * 0.75, 4);
      });
    });

    describe('Utility messages', () => {
      it('should calculate base price for low volume', () => {
        const price = calculateEffectivePrice('UTILITY', 500);
        expect(price).toBe(0.0068);
      });

      it('should not apply discount for 1001-10000 messages', () => {
        const price = calculateEffectivePrice('UTILITY', 5000);
        expect(price).toBe(0.0068);
      });

      it('should apply 5% discount for 10001-100000 messages', () => {
        const price = calculateEffectivePrice('UTILITY', 50000);
        expect(price).toBeCloseTo(0.0068 * 0.95, 4);
      });

      it('should apply 20% discount for >100000 messages', () => {
        const price = calculateEffectivePrice('UTILITY', 150000);
        expect(price).toBeCloseTo(0.0068 * 0.80, 4);
      });
    });

    describe('Authentication messages', () => {
      it('should use same pricing as utility', () => {
        const authPrice = calculateEffectivePrice('AUTENTICACAO', 500);
        const utilityPrice = calculateEffectivePrice('UTILIDADE', 500);
        expect(authPrice).toBe(utilityPrice);
      });

      it('should normalize AUTHENTICATION to AUTENTICACAO', () => {
        const price = calculateEffectivePrice('AUTHENTICATION', 500);
        expect(price).toBe(0.0068);
      });
    });

    describe('Category normalization', () => {
      it('should handle uppercase MARKETING', () => {
        const price = calculateEffectivePrice('MARKETING', 100);
        expect(price).toBe(0.0825);
      });

      it('should normalize UTILITY to UTILIDADE', () => {
        const price = calculateEffectivePrice('UTILITY', 100);
        expect(price).toBe(0.0068);
      });
    });
  });

  describe('calculateCampaignCost', () => {
    it('should calculate total cost for marketing campaign', () => {
      const cost = calculateCampaignCost('MARKETING', 100, 0);
      expect(cost).toBe(8.25); // 100 * 0.0825
    });

    it('should calculate total cost for utility campaign', () => {
      const cost = calculateCampaignCost('UTILITY', 100, 0);
      expect(cost).toBeCloseTo(0.68, 4); // 100 * 0.0068
    });

    it('should apply volume discount to total cost', () => {
      const cost = calculateCampaignCost('MARKETING', 100, 5000);
      expect(cost).toBeCloseTo(100 * 0.0825 * 0.97, 2);
    });

    it('should handle zero recipients', () => {
      const cost = calculateCampaignCost('MARKETING', 0, 0);
      expect(cost).toBe(0);
    });

    it('should handle large campaigns', () => {
      const cost = calculateCampaignCost('MARKETING', 1000000, 1000000);
      expect(cost).toBeGreaterThan(0);
      expect(cost).toBeLessThan(100000); // Sanity check
    });
  });

  describe('usdToBrl', () => {
    it('should convert USD to BRL with default rate', () => {
      const brl = usdToBrl(10);
      expect(brl).toBe(50); // 10 * 5.00
    });

    it('should convert USD to BRL with custom rate', () => {
      const brl = usdToBrl(10, 4.50);
      expect(brl).toBe(45); // 10 * 4.50
    });

    it('should handle zero USD', () => {
      const brl = usdToBrl(0);
      expect(brl).toBe(0);
    });

    it('should handle decimal values', () => {
      const brl = usdToBrl(0.0825, 5.00);
      expect(brl).toBeCloseTo(0.4125, 4);
    });
  });

  describe('formatBRL', () => {
    it('should format as Brazilian Real currency', () => {
      const formatted = formatBRL(10.50);
      expect(formatted).toContain('10,50');
      expect(formatted).toContain('R$');
    });

    it('should handle zero', () => {
      const formatted = formatBRL(0);
      expect(formatted).toContain('0,00');
    });

    it('should handle large numbers', () => {
      const formatted = formatBRL(1234567.89);
      expect(formatted).toContain('1.234.567,89');
    });

    it('should always show 2 decimal places', () => {
      const formatted = formatBRL(10);
      expect(formatted).toContain('10,00');
    });

    it('should handle negative values', () => {
      const formatted = formatBRL(-10.50);
      expect(formatted).toContain('10,50');
    });
  });

  describe('getPricingBreakdown', () => {
    it('should return complete pricing breakdown', () => {
      const breakdown = getPricingBreakdown('MARKETING', 100, 0, 5.00);

      expect(breakdown).toMatchObject({
        category: 'MARKETING',
        recipients: 100,
        pricePerMessageUSD: 0.0825,
      });

      expect(breakdown.totalUSD).toBeCloseTo(8.25, 4);
      expect(breakdown.pricePerMessageBRL).toBeCloseTo(0.4125, 4);
      expect(breakdown.totalBRL).toBeCloseTo(41.25, 2);
      expect(breakdown.totalBRLFormatted).toContain('41,25');
      expect(breakdown.pricePerMessageBRLFormatted).toContain('0,41');
    });

    it('should apply volume discount to breakdown', () => {
      const breakdown = getPricingBreakdown('MARKETING', 100, 5000, 5.00);

      expect(breakdown.pricePerMessageUSD).toBeCloseTo(0.0825 * 0.97, 4);
      expect(breakdown.totalUSD).toBeCloseTo(8.25 * 0.97, 2);
    });

    it('should handle utility messages', () => {
      const breakdown = getPricingBreakdown('UTILITY', 100, 0, 5.00);

      expect(breakdown.pricePerMessageUSD).toBe(0.0068);
      expect(breakdown.totalUSD).toBeCloseTo(0.68, 4);
      expect(breakdown.totalBRL).toBeCloseTo(3.40, 2);
    });

    it('should use custom exchange rate', () => {
      const breakdown = getPricingBreakdown('MARKETING', 100, 0, 6.00);

      expect(breakdown.totalBRL).toBeCloseTo(49.50, 2);
    });
  });

  describe('Edge cases', () => {
    it('should handle boundary volume (exactly 1000)', () => {
      const price = calculateEffectivePrice('MARKETING', 1000);
      expect(price).toBe(0.0825); // Should be base price
    });

    it('should handle boundary volume (exactly 1001)', () => {
      const price = calculateEffectivePrice('MARKETING', 1001);
      expect(price).toBeCloseTo(0.0825 * 0.97, 4); // Should have discount
    });

    it('should handle very large volumes', () => {
      const price = calculateEffectivePrice('MARKETING', 10000000);
      expect(price).toBeCloseTo(0.0825 * 0.75, 4);
    });

    it('should handle negative recipients gracefully', () => {
      const cost = calculateCampaignCost('MARKETING', -1, 0);
      expect(cost).toBeLessThan(0);
    });
  });
});
