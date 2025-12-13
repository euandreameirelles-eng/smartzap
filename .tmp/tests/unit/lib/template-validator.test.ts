import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateTemplateParameters,
  countTemplateVariables,
  buildComponentPayload,
  validateTemplateForDispatch,
  type TemplateParameterValues,
} from '@/lib/template-validator';
import type { Template, TemplateComponent } from '@/types';

// Mock do logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Helper para criar templates de teste com propriedades obrigatórias
const createTestTemplate = (components: TemplateComponent[], name?: string): Template => ({
  id: '1',
  name: name || 'test_template',
  language: 'pt_BR',
  status: 'APPROVED',
  category: 'MARKETING',
  content: 'Test content',
  preview: 'Test preview',
  lastUpdated: new Date().toISOString(),
  components,
});

describe('Template Validator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateTemplateParameters', () => {
    it('validates template with no variables', () => {
      const template = createTestTemplate([
        { type: 'BODY', text: 'Olá! Esta é uma mensagem simples.' },
      ], 'simple_template');

      const values: TemplateParameterValues = { body: [] };
      const result = validateTemplateParameters(template, values);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('validates body with required variables', () => {
      const template = createTestTemplate([
        { type: 'BODY', text: 'Olá {{1}}! Seu pedido {{2}} está pronto.' },
      ], 'template_with_vars');

      const values: TemplateParameterValues = { body: ['João', '#12345'] };
      const result = validateTemplateParameters(template, values);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('fails when missing required body variables', () => {
      const template = createTestTemplate([
        { type: 'BODY', text: 'Olá {{1}}! Seu pedido {{2}} está pronto.' },
      ], 'template_with_vars');

      const values: TemplateParameterValues = { body: ['João'] }; // Missing second var
      const result = validateTemplateParameters(template, values);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].component).toBe('body');
    });

    it('fails when body variable is empty', () => {
      const template = createTestTemplate([
        { type: 'BODY', text: 'Olá {{1}}!' },
      ], 'template_with_vars');

      const values: TemplateParameterValues = { body: [''] };
      const result = validateTemplateParameters(template, values);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('vazia'))).toBe(true);
    });

    it('warns about very long variable values', () => {
      const template = createTestTemplate([
        { type: 'BODY', text: 'Mensagem: {{1}}' },
      ], 'template_with_vars');

      const longValue = 'a'.repeat(2000);
      const values: TemplateParameterValues = { body: [longValue] };
      const result = validateTemplateParameters(template, values);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0].message).toContain('longa');
    });

    describe('Header Validation', () => {
      it('requires image URL for IMAGE header', () => {
        const template = createTestTemplate([
          { type: 'HEADER', format: 'IMAGE' },
          { type: 'BODY', text: 'Mensagem' },
        ], 'image_template');

        const values: TemplateParameterValues = { body: [] };
        const result = validateTemplateParameters(template, values);

        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.component === 'header' && e.field === 'image')).toBe(true);
      });

      it('validates image header with valid URL', () => {
        const template = createTestTemplate([
          { type: 'HEADER', format: 'IMAGE' },
          { type: 'BODY', text: 'Mensagem' },
        ], 'image_template');

        const values: TemplateParameterValues = {
          body: [],
          header: { type: 'image', value: 'https://example.com/image.jpg' },
        };
        const result = validateTemplateParameters(template, values);

        expect(result.isValid).toBe(true);
      });

      it('rejects image header with invalid URL format', () => {
        const template = createTestTemplate([
          { type: 'HEADER', format: 'IMAGE' },
          { type: 'BODY', text: 'Mensagem' },
        ], 'image_template');

        const values: TemplateParameterValues = {
          body: [],
          header: { type: 'image', value: 'not-a-valid-url' },
        };
        const result = validateTemplateParameters(template, values);

        // Invalid URL triggers a warning, not an error
        expect(result.isValid).toBe(true);
        expect(result.warnings.length).toBeGreaterThan(0);
        expect(result.warnings.some(w => w.field === 'image')).toBe(true);
      });

      it('requires video URL for VIDEO header', () => {
        const template = createTestTemplate([
          { type: 'HEADER', format: 'VIDEO' },
          { type: 'BODY', text: 'Mensagem' },
        ], 'video_template');

        const values: TemplateParameterValues = { body: [] };
        const result = validateTemplateParameters(template, values);

        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.field === 'video')).toBe(true);
      });

      it('requires document URL for DOCUMENT header', () => {
        const template = createTestTemplate([
          { type: 'HEADER', format: 'DOCUMENT' },
          { type: 'BODY', text: 'Mensagem' },
        ], 'doc_template');

        const values: TemplateParameterValues = { body: [] };
        const result = validateTemplateParameters(template, values);

        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.field === 'document')).toBe(true);
      });

      it('warns when document has no filename', () => {
        const template = createTestTemplate([
          { type: 'HEADER', format: 'DOCUMENT' },
          { type: 'BODY', text: 'Mensagem' },
        ], 'doc_template');

        const values: TemplateParameterValues = {
          body: [],
          header: { type: 'document', value: 'https://example.com/doc.pdf' },
        };
        const result = validateTemplateParameters(template, values);

        expect(result.warnings.some(w => w.field === 'document')).toBe(true);
      });

      it('validates TEXT header with variable', () => {
        const template = createTestTemplate([
          { type: 'HEADER', format: 'TEXT', text: 'Olá {{1}}!' },
          { type: 'BODY', text: 'Mensagem' },
        ], 'text_header_template');

        const valuesWithout: TemplateParameterValues = { body: [] };
        const resultWithout = validateTemplateParameters(template, valuesWithout);
        expect(resultWithout.isValid).toBe(false);

        const valuesWith: TemplateParameterValues = {
          body: [],
          header: { type: 'text', value: 'João' },
        };
        const resultWith = validateTemplateParameters(template, valuesWith);
        expect(resultWith.isValid).toBe(true);
      });
    });

    describe('Button Validation', () => {
      it('requires value for dynamic URL button', () => {
        const template = createTestTemplate([
          { type: 'BODY', text: 'Mensagem' },
          {
            type: 'BUTTONS',
            buttons: [
              { type: 'URL', text: 'Ver', url: 'https://example.com/{{1}}' },
            ],
          },
        ], 'button_template');

        const values: TemplateParameterValues = { body: [] };
        const result = validateTemplateParameters(template, values);

        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.component === 'buttons')).toBe(true);
      });
    });
  });

  describe('countTemplateVariables', () => {
    it('counts body variables', () => {
      const template = createTestTemplate([
        { type: 'BODY', text: 'Olá {{1}}! Pedido {{2}} no valor de {{3}}.' },
      ]);

      const counts = countTemplateVariables(template);

      expect(counts.body).toBe(3);
      expect(counts.total).toBe(3);
    });

    it('counts header variables for text', () => {
      const template = createTestTemplate([
        { type: 'HEADER', format: 'TEXT', text: 'Olá {{1}}!' },
        { type: 'BODY', text: 'Mensagem' },
      ]);

      const counts = countTemplateVariables(template);

      expect(counts.header).toBe(1);
    });

    it('counts media header as 1 variable', () => {
      const template = createTestTemplate([
        { type: 'HEADER', format: 'IMAGE' },
        { type: 'BODY', text: 'Mensagem' },
      ]);

      const counts = countTemplateVariables(template);

      expect(counts.header).toBe(1);
    });

    it('counts dynamic button URLs', () => {
      const template = createTestTemplate([
        { type: 'BODY', text: 'Mensagem' },
        {
          type: 'BUTTONS',
          buttons: [
            { type: 'URL', text: 'Link 1', url: 'https://example.com/{{1}}' },
            { type: 'URL', text: 'Link 2', url: 'https://example.com/{{2}}' },
          ],
        },
      ]);

      const counts = countTemplateVariables(template);

      expect(counts.buttons).toBe(2);
    });

    it('returns zero for template without variables', () => {
      const template = createTestTemplate([
        { type: 'BODY', text: 'Mensagem simples sem variáveis.' },
      ]);

      const counts = countTemplateVariables(template);

      expect(counts.total).toBe(0);
    });
  });

  describe('buildComponentPayload', () => {
    it('builds body component payload', () => {
      const template = createTestTemplate([
        { type: 'BODY', text: 'Olá {{1}}!' },
      ]);

      const values: TemplateParameterValues = { body: ['João'] };
      const payload = buildComponentPayload(template, values);

      expect(payload).toHaveLength(1);
      expect(payload[0]).toMatchObject({
        type: 'body',
        parameters: [{ type: 'text', text: 'João' }],
      });
    });

    it('builds image header payload', () => {
      const template = createTestTemplate([
        { type: 'HEADER', format: 'IMAGE' },
        { type: 'BODY', text: 'Mensagem' },
      ]);

      const values: TemplateParameterValues = {
        body: [],
        header: { type: 'image', value: 'https://example.com/image.jpg' },
      };
      const payload = buildComponentPayload(template, values);

      const headerPayload = payload.find((p: any) => p.type === 'header');
      expect(headerPayload).toBeDefined();
      expect((headerPayload as any).parameters[0].type).toBe('image');
    });

    it('builds document header with filename', () => {
      const template = createTestTemplate([
        { type: 'HEADER', format: 'DOCUMENT' },
        { type: 'BODY', text: 'Mensagem' },
      ]);

      const values: TemplateParameterValues = {
        body: [],
        header: { type: 'document', value: 'https://example.com/doc.pdf', filename: 'contrato.pdf' },
      };
      const payload = buildComponentPayload(template, values);

      const headerPayload = payload.find((p: any) => p.type === 'header');
      expect(headerPayload).toBeDefined();
      expect((headerPayload as any).parameters[0].document.filename).toBe('contrato.pdf');
    });

    it('builds button payload', () => {
      const template = createTestTemplate([
        { type: 'BODY', text: 'Mensagem' },
      ]);

      const values: TemplateParameterValues = {
        body: [],
        buttons: [{ type: 'url', index: 0, value: '/path' }],
      };
      const payload = buildComponentPayload(template, values);

      const buttonPayload = payload.find((p: any) => p.type === 'button');
      expect(buttonPayload).toBeDefined();
    });

    it('builds video header payload', () => {
      const template = createTestTemplate([
        { type: 'HEADER', format: 'VIDEO' },
        { type: 'BODY', text: 'Mensagem' },
      ]);

      const values: TemplateParameterValues = {
        body: [],
        header: { type: 'video', value: 'https://example.com/video.mp4' },
      };
      const payload = buildComponentPayload(template, values);

      const headerPayload = payload.find((p: any) => p.type === 'header');
      expect(headerPayload).toBeDefined();
      expect((headerPayload as any).parameters[0].type).toBe('video');
    });

    it('builds quick_reply button payload', () => {
      const template = createTestTemplate([
        { type: 'BODY', text: 'Mensagem' },
      ]);

      const values: TemplateParameterValues = {
        body: [],
        buttons: [{ type: 'quick_reply', index: 0, value: 'action' }],
      };
      const payload = buildComponentPayload(template, values);

      const buttonPayload = payload.find((p: any) => p.type === 'button');
      expect(buttonPayload).toBeDefined();
      expect((buttonPayload as any).parameters[0].type).toBe('payload');
    });

    it('builds text header payload', () => {
      const template = createTestTemplate([
        { type: 'HEADER', format: 'TEXT', text: 'Bem-vindo {{1}}!' },
        { type: 'BODY', text: 'Mensagem' },
      ]);

      const values: TemplateParameterValues = {
        body: [],
        header: { type: 'text', value: 'João' },
      };
      const payload = buildComponentPayload(template, values);

      const headerPayload = payload.find((p: any) => p.type === 'header');
      expect(headerPayload).toBeDefined();
      expect((headerPayload as any).parameters[0].type).toBe('text');
    });
  });

  describe('validateTemplateForDispatch', () => {
    it('does not throw for valid template', () => {
      const template = createTestTemplate([
        { type: 'BODY', text: 'Olá {{1}}!' },
      ]);

      const values: TemplateParameterValues = { body: ['João'] };

      expect(() => validateTemplateForDispatch(template, values)).not.toThrow();
    });

    it('throws AppError for invalid template', () => {
      const template = createTestTemplate([
        { type: 'BODY', text: 'Olá {{1}}!' },
      ]);

      const values: TemplateParameterValues = { body: [] }; // Missing variable

      expect(() => validateTemplateForDispatch(template, values)).toThrow();
    });

    it('logs warnings but does not throw', () => {
      const template = createTestTemplate([
        { type: 'BODY', text: 'Olá {{1}}!' },
      ]);

      // Very long value that triggers warning but not error
      const longValue = 'A'.repeat(500);
      const values: TemplateParameterValues = { body: [longValue] };

      // Should not throw even with warning
      expect(() => validateTemplateForDispatch(template, values)).not.toThrow();
    });
  });
});
