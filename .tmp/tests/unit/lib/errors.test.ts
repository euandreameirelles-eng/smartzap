import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ErrorType,
  AppError,
  classifyHttpError,
  classifyWhatsAppError,
  getUserErrorMessage,
  handleApiError,
  handleStorageError,
  handleParseError,
  handleValidationError,
  isRetryableError,
  getRetryDelay,
  requiresUserAction,
  isPairRateLimitError,
  getPairRateLimitWait,
} from '@/lib/errors';

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('Error Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AppError', () => {
    it('creates error with all properties', () => {
      const error = new AppError(
        ErrorType.VALIDATION_ERROR,
        'Technical message',
        'User message',
        400,
        { field: 'email' }
      );

      expect(error.type).toBe(ErrorType.VALIDATION_ERROR);
      expect(error.message).toBe('Technical message');
      expect(error.userMessage).toBe('User message');
      expect(error.statusCode).toBe(400);
      expect(error.context).toEqual({ field: 'email' });
      expect(error.name).toBe('AppError');
    });

    it('extends Error class', () => {
      const error = new AppError(ErrorType.UNKNOWN_ERROR, 'msg', 'user msg');
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('classifyHttpError', () => {
    it('classifies 401 as authentication error', () => {
      expect(classifyHttpError(401)).toBe(ErrorType.AUTHENTICATION_ERROR);
    });

    it('classifies 403 as authorization error', () => {
      expect(classifyHttpError(403)).toBe(ErrorType.AUTHORIZATION_ERROR);
    });

    it('classifies 404 as not found error', () => {
      expect(classifyHttpError(404)).toBe(ErrorType.NOT_FOUND_ERROR);
    });

    it('classifies 429 as rate limit error', () => {
      expect(classifyHttpError(429)).toBe(ErrorType.RATE_LIMIT_ERROR);
    });

    it('classifies 4xx as validation error', () => {
      expect(classifyHttpError(400)).toBe(ErrorType.VALIDATION_ERROR);
      expect(classifyHttpError(422)).toBe(ErrorType.VALIDATION_ERROR);
    });

    it('classifies 5xx as server error', () => {
      expect(classifyHttpError(500)).toBe(ErrorType.SERVER_ERROR);
      expect(classifyHttpError(503)).toBe(ErrorType.SERVER_ERROR);
    });

    it('returns unknown for other status codes', () => {
      expect(classifyHttpError(200)).toBe(ErrorType.UNKNOWN_ERROR);
      expect(classifyHttpError(301)).toBe(ErrorType.UNKNOWN_ERROR);
    });
  });

  describe('classifyWhatsAppError', () => {
    it('returns unknown for null/undefined', () => {
      expect(classifyWhatsAppError(null)).toBe(ErrorType.UNKNOWN_ERROR);
      expect(classifyWhatsAppError(undefined)).toBe(ErrorType.UNKNOWN_ERROR);
    });

    it('classifies network errors', () => {
      const error = { name: 'TypeError', message: 'fetch failed' };
      expect(classifyWhatsAppError(error)).toBe(ErrorType.NETWORK_ERROR);
    });

    it('classifies timeout errors', () => {
      expect(classifyWhatsAppError({ name: 'AbortError' })).toBe(ErrorType.TIMEOUT_ERROR);
      expect(classifyWhatsAppError({ message: 'Request timeout' })).toBe(ErrorType.TIMEOUT_ERROR);
    });

    it('classifies by HTTP status', () => {
      expect(classifyWhatsAppError({ response: { status: 401 } })).toBe(ErrorType.AUTHENTICATION_ERROR);
      expect(classifyWhatsAppError({ response: { status: 500 } })).toBe(ErrorType.SERVER_ERROR);
    });

    it('classifies WhatsApp API error codes', () => {
      expect(classifyWhatsAppError({ error: { code: 190 } })).toBe(ErrorType.AUTHENTICATION_ERROR);
      expect(classifyWhatsAppError({ error: { code: 100 } })).toBe(ErrorType.VALIDATION_ERROR);
      expect(classifyWhatsAppError({ error: { code: 4 } })).toBe(ErrorType.RATE_LIMIT_ERROR);
      expect(classifyWhatsAppError({ error: { code: 10 } })).toBe(ErrorType.AUTHORIZATION_ERROR);
      expect(classifyWhatsAppError({ error: { code: 200 } })).toBe(ErrorType.AUTHORIZATION_ERROR);
    });
  });

  describe('getUserErrorMessage', () => {
    it('returns message for error type', () => {
      const message = getUserErrorMessage(ErrorType.AUTHENTICATION_ERROR);
      expect(message).toContain('Credenciais inválidas');
    });

    it('returns message from AppError', () => {
      const error = new AppError(
        ErrorType.VALIDATION_ERROR,
        'tech',
        'Campo email é obrigatório'
      );
      expect(getUserErrorMessage(error)).toBe('Campo email é obrigatório');
    });

    it('returns default message for unknown type', () => {
      // @ts-expect-error Testing invalid type
      const message = getUserErrorMessage('INVALID_TYPE');
      expect(message).toContain('erro inesperado');
    });

    it('returns all error type messages correctly', () => {
      expect(getUserErrorMessage(ErrorType.VALIDATION_ERROR)).toContain('Dados inválidos');
      expect(getUserErrorMessage(ErrorType.AUTHORIZATION_ERROR)).toContain('permissões');
      expect(getUserErrorMessage(ErrorType.NOT_FOUND_ERROR)).toContain('não encontrado');
      expect(getUserErrorMessage(ErrorType.RATE_LIMIT_ERROR)).toContain('Limite de taxa');
      expect(getUserErrorMessage(ErrorType.SERVER_ERROR)).toContain('servidor');
      expect(getUserErrorMessage(ErrorType.NETWORK_ERROR)).toContain('conexão');
      expect(getUserErrorMessage(ErrorType.TIMEOUT_ERROR)).toContain('demorou');
      expect(getUserErrorMessage(ErrorType.STORAGE_ERROR)).toContain('armazenamento');
      expect(getUserErrorMessage(ErrorType.PARSE_ERROR)).toContain('processar');
    });
  });

  describe('handleApiError', () => {
    it('creates AppError from API error', () => {
      const apiError = {
        message: 'API failed',
        response: { status: 400 },
      };

      const result = handleApiError(apiError);

      expect(result).toBeInstanceOf(AppError);
      expect(result.type).toBe(ErrorType.VALIDATION_ERROR);
      expect(result.statusCode).toBe(400);
    });

    it('includes WhatsApp API error message', () => {
      const apiError = {
        error: { message: 'Invalid phone number format' },
      };

      const result = handleApiError(apiError);
      expect(result.userMessage).toContain('Invalid phone number format');
    });

    it('handles permission error #200', () => {
      const apiError = {
        error: { message: 'Permission denied (#200)' },
      };

      const result = handleApiError(apiError);
      expect(result.userMessage).toContain('permissão');
      expect(result.userMessage).toContain('#200');
    });

    it('includes context in AppError', () => {
      const result = handleApiError({}, { requestId: '123' });
      expect(result.context?.requestId).toBe('123');
    });
  });

  describe('handleStorageError', () => {
    it('creates storage error', () => {
      const error = new Error('QuotaExceeded');
      const result = handleStorageError(error, 'save');

      expect(result.type).toBe(ErrorType.STORAGE_ERROR);
      expect(result.message).toContain('save');
      expect(result.context?.operation).toBe('save');
    });
  });

  describe('handleParseError', () => {
    it('creates parse error', () => {
      const error = new Error('Invalid JSON');
      const result = handleParseError(error, 'CSV');

      expect(result.type).toBe(ErrorType.PARSE_ERROR);
      expect(result.message).toContain('CSV');
      expect(result.context?.fileType).toBe('CSV');
    });
  });

  describe('handleValidationError', () => {
    it('creates validation error', () => {
      const result = handleValidationError('email', 'formato inválido');

      expect(result.type).toBe(ErrorType.VALIDATION_ERROR);
      expect(result.userMessage).toContain('email');
      expect(result.userMessage).toContain('formato inválido');
    });
  });

  describe('isRetryableError', () => {
    it('returns true for retryable errors', () => {
      expect(isRetryableError(new AppError(ErrorType.NETWORK_ERROR, '', ''))).toBe(true);
      expect(isRetryableError(new AppError(ErrorType.TIMEOUT_ERROR, '', ''))).toBe(true);
      expect(isRetryableError(new AppError(ErrorType.SERVER_ERROR, '', ''))).toBe(true);
    });

    it('returns false for non-retryable errors', () => {
      expect(isRetryableError(new AppError(ErrorType.AUTHENTICATION_ERROR, '', ''))).toBe(false);
      expect(isRetryableError(new AppError(ErrorType.VALIDATION_ERROR, '', ''))).toBe(false);
      expect(isRetryableError(new AppError(ErrorType.NOT_FOUND_ERROR, '', ''))).toBe(false);
    });
  });

  describe('getRetryDelay', () => {
    it('calculates exponential backoff (4^x)', () => {
      expect(getRetryDelay(0)).toBe(1000); // 1000 * 4^0 = 1000
      expect(getRetryDelay(1)).toBe(4000); // 1000 * 4^1 = 4000
      expect(getRetryDelay(2)).toBe(16000); // 1000 * 4^2 = 16000
    });

    it('uses custom base delay', () => {
      expect(getRetryDelay(0, 2000)).toBe(2000);
      expect(getRetryDelay(1, 2000)).toBe(8000);
    });

    it('caps at 60 seconds', () => {
      expect(getRetryDelay(5)).toBe(60000); // Would be 1024000, capped at 60000
      expect(getRetryDelay(10)).toBe(60000);
    });
  });

  describe('requiresUserAction', () => {
    it('returns true for user-fixable errors', () => {
      expect(requiresUserAction(new AppError(ErrorType.AUTHENTICATION_ERROR, '', ''))).toBe(true);
      expect(requiresUserAction(new AppError(ErrorType.AUTHORIZATION_ERROR, '', ''))).toBe(true);
      expect(requiresUserAction(new AppError(ErrorType.VALIDATION_ERROR, '', ''))).toBe(true);
    });

    it('returns false for system errors', () => {
      expect(requiresUserAction(new AppError(ErrorType.SERVER_ERROR, '', ''))).toBe(false);
      expect(requiresUserAction(new AppError(ErrorType.NETWORK_ERROR, '', ''))).toBe(false);
    });
  });

  describe('isPairRateLimitError', () => {
    it('identifies pair rate limit error code', () => {
      expect(isPairRateLimitError(131056)).toBe(true);
      expect(isPairRateLimitError('131056')).toBe(true);
    });

    it('returns false for other codes', () => {
      expect(isPairRateLimitError(12345)).toBe(false);
      expect(isPairRateLimitError(undefined)).toBe(false);
    });
  });

  describe('getPairRateLimitWait', () => {
    it('returns 6 seconds', () => {
      expect(getPairRateLimitWait()).toBe(6000);
    });
  });
});
