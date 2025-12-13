/**
 * Testes unitários para Zod Schemas
 * 
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import {
  campaignNameSchema,
  phoneSchema,
  emailSchema,
  campaignStep1Schema,
  campaignStep2Schema,
  campaignStep3Schema,
  contactFormSchema,
  validateField,
  validateForm,
} from '@/lib/validation/schemas';

describe('Zod Schemas', () => {
  // ============================================
  // CAMPAIGN NAME SCHEMA
  // ============================================
  describe('campaignNameSchema', () => {
    it('aceita nomes válidos', () => {
      expect(campaignNameSchema.safeParse('Minha Campanha').success).toBe(true);
      expect(campaignNameSchema.safeParse('Promoção de Verão 2025').success).toBe(true);
      expect(campaignNameSchema.safeParse('[TESTE] Campanha').success).toBe(true);
      expect(campaignNameSchema.safeParse('Campanha_v2').success).toBe(true);
    });

    it('rejeita nomes muito curtos', () => {
      const result = campaignNameSchema.safeParse('AB');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('3 caracteres');
      }
    });

    it('rejeita nomes muito longos', () => {
      const longName = 'A'.repeat(101);
      const result = campaignNameSchema.safeParse(longName);
      expect(result.success).toBe(false);
    });

    it('rejeita caracteres especiais inválidos', () => {
      const result = campaignNameSchema.safeParse('Campanha @#$%');
      expect(result.success).toBe(false);
    });
  });

  // ============================================
  // PHONE SCHEMA
  // ============================================
  describe('phoneSchema', () => {
    it('aceita números E.164 válidos', () => {
      expect(phoneSchema.safeParse('+5511999999999').success).toBe(true);
      expect(phoneSchema.safeParse('5511999999999').success).toBe(true);
      expect(phoneSchema.safeParse('+14155551234').success).toBe(true);
    });

    it('rejeita números inválidos', () => {
      expect(phoneSchema.safeParse('123').success).toBe(false); // Muito curto
      expect(phoneSchema.safeParse('abc123').success).toBe(false);
      expect(phoneSchema.safeParse('').success).toBe(false);
    });
  });

  // ============================================
  // EMAIL SCHEMA
  // ============================================
  describe('emailSchema', () => {
    it('aceita emails válidos', () => {
      expect(emailSchema.safeParse('user@example.com').success).toBe(true);
      expect(emailSchema.safeParse('user.name+tag@domain.co.uk').success).toBe(true);
    });

    it('rejeita emails inválidos', () => {
      expect(emailSchema.safeParse('invalid').success).toBe(false);
      expect(emailSchema.safeParse('user@').success).toBe(false);
      expect(emailSchema.safeParse('@domain.com').success).toBe(false);
    });
  });

  // ============================================
  // CAMPAIGN STEP 1 SCHEMA
  // ============================================
  describe('campaignStep1Schema', () => {
    it('aceita step 1 válido', () => {
      const result = campaignStep1Schema.safeParse({
        name: 'Minha Campanha',
        templateId: 'template_123',
      });
      expect(result.success).toBe(true);
    });

    it('rejeita sem nome', () => {
      const result = campaignStep1Schema.safeParse({
        name: '',
        templateId: 'template_123',
      });
      expect(result.success).toBe(false);
    });

    it('rejeita sem template', () => {
      const result = campaignStep1Schema.safeParse({
        name: 'Minha Campanha',
        templateId: '',
      });
      expect(result.success).toBe(false);
    });
  });

  // ============================================
  // CAMPAIGN STEP 2 SCHEMA
  // ============================================
  describe('campaignStep2Schema', () => {
    it('aceita "all" sem contatos selecionados', () => {
      const result = campaignStep2Schema.safeParse({
        recipientSource: 'all',
        selectedContactIds: [],
      });
      expect(result.success).toBe(true);
    });

    it('aceita "specific" com contatos', () => {
      const result = campaignStep2Schema.safeParse({
        recipientSource: 'specific',
        selectedContactIds: ['contact_1', 'contact_2'],
      });
      expect(result.success).toBe(true);
    });

    it('rejeita "specific" sem contatos', () => {
      const result = campaignStep2Schema.safeParse({
        recipientSource: 'specific',
        selectedContactIds: [],
      });
      expect(result.success).toBe(false);
    });

    it('aceita "test" sem contatos', () => {
      const result = campaignStep2Schema.safeParse({
        recipientSource: 'test',
        selectedContactIds: [],
      });
      expect(result.success).toBe(true);
    });
  });

  // ============================================
  // CAMPAIGN STEP 3 SCHEMA
  // ============================================
  describe('campaignStep3Schema', () => {
    it('aceita "now" sem data', () => {
      const result = campaignStep3Schema.safeParse({
        scheduleMode: 'now',
      });
      expect(result.success).toBe(true);
    });

    it('aceita "scheduled" com data futura', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      
      const result = campaignStep3Schema.safeParse({
        scheduleMode: 'scheduled',
        scheduledDate: futureDate.toISOString().split('T')[0],
        scheduledTime: '14:00',
      });
      expect(result.success).toBe(true);
    });

    it('rejeita "scheduled" sem data', () => {
      const result = campaignStep3Schema.safeParse({
        scheduleMode: 'scheduled',
      });
      expect(result.success).toBe(false);
    });

    it('rejeita "scheduled" com data passada', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      
      const result = campaignStep3Schema.safeParse({
        scheduleMode: 'scheduled',
        scheduledDate: pastDate.toISOString().split('T')[0],
        scheduledTime: '14:00',
      });
      expect(result.success).toBe(false);
    });
  });

  // ============================================
  // CONTACT FORM SCHEMA
  // ============================================
  describe('contactFormSchema', () => {
    it('aceita contato válido completo', () => {
      const result = contactFormSchema.safeParse({
        name: 'João Silva',
        phone: '+5511999999999',
        email: 'joao@email.com',
        tags: ['cliente', 'vip'],
      });
      expect(result.success).toBe(true);
    });

    it('aceita contato apenas com telefone', () => {
      const result = contactFormSchema.safeParse({
        phone: '+5511999999999',
      });
      expect(result.success).toBe(true);
    });

    it('aceita email vazio', () => {
      const result = contactFormSchema.safeParse({
        phone: '+5511999999999',
        email: '',
      });
      expect(result.success).toBe(true);
    });

    it('rejeita telefone inválido', () => {
      const result = contactFormSchema.safeParse({
        phone: 'invalid',
      });
      expect(result.success).toBe(false);
    });
  });

  // ============================================
  // VALIDATION HELPERS
  // ============================================
  describe('validateField', () => {
    it('retorna success true para valor válido', () => {
      const result = validateField(phoneSchema, '+5511999999999');
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('retorna error para valor inválido', () => {
      const result = validateField(phoneSchema, 'invalid');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('validateForm', () => {
    it('retorna todos os erros do form', () => {
      const result = validateForm(campaignStep1Schema, {
        name: '',
        templateId: '',
      });
      
      expect(result.success).toBe(false);
      expect(Object.keys(result.errors).length).toBeGreaterThan(0);
    });

    it('retorna vazio para form válido', () => {
      const result = validateForm(campaignStep1Schema, {
        name: 'Campanha Válida',
        templateId: 'template_123',
      });
      
      expect(result.success).toBe(true);
      expect(Object.keys(result.errors).length).toBe(0);
    });
  });
});
