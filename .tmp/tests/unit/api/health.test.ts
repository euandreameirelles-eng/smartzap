import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock specific modules
vi.mock('@/lib/redis', () => ({
  redis: {
    ping: vi.fn(),
  },
  isRedisAvailable: vi.fn(),
}));

// Mock Supabase client
const { mockSupabase } = vi.hoisted(() => {
  return {
    mockSupabase: {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ error: null }))
        }))
      }))
    }
  }
})

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabase,
  isSupabaseConfigured: vi.fn()
}));

vi.mock('@/lib/whatsapp-credentials', () => ({
  getWhatsAppCredentials: vi.fn(),
  getCredentialsSource: vi.fn(),
}));

// Import after mocks
import { GET } from '@/app/api/health/route';
import { redis, isRedisAvailable } from '@/lib/redis';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getWhatsAppCredentials, getCredentialsSource } from '@/lib/whatsapp-credentials';

describe('API /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('QSTASH_TOKEN', 'test-qstash-token');
    vi.stubEnv('VERCEL_URL', 'test-project-abc123-user-projects.vercel.app');
    vi.stubEnv('VERCEL_ENV', 'production');

    // Default mocks
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    vi.mocked(isRedisAvailable).mockReturnValue(true);
  });

  it('should return healthy when all services are ok', async () => {
    // Setup mocks
    vi.mocked(redis!.ping).mockResolvedValue('PONG');
    vi.mocked(getCredentialsSource).mockResolvedValue('redis');
    vi.mocked(getWhatsAppCredentials).mockResolvedValue({
      accessToken: 'test-token',
      phoneNumberId: '123456',
      businessAccountId: '789',
    });

    // Mock fetch for WhatsApp API
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ display_phone_number: '+5511999999999' }),
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.overall).toBe('healthy');
    expect(data.services.database.status).toBe('ok');
    expect(data.services.database.provider).toBe('supabase');
    expect(data.services.redis.status).toBe('ok');
    expect(data.services.qstash.status).toBe('ok');
    expect(data.services.whatsapp.status).toBe('ok');
  });

  it('should return unhealthy when Supabase fails', async () => {
    // Mock Supabase failure
    const mockSelect = vi.fn().mockReturnValue({
      limit: vi.fn().mockResolvedValue({ error: { message: 'Connection timeout' } })
    });

    vi.mocked(mockSupabase.from).mockReturnValue({
      select: mockSelect
    } as any);

    vi.mocked(redis!.ping).mockResolvedValue('PONG');
    vi.mocked(getCredentialsSource).mockResolvedValue('redis');
    vi.mocked(getWhatsAppCredentials).mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(data.overall).toBe('unhealthy');
    expect(data.services.database.status).toBe('error');
    expect(data.services.database.message).toContain('Connection timeout');
  });

  it('should handle missing Supabase config', async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(false);

    vi.mocked(redis!.ping).mockResolvedValue('PONG');
    vi.mocked(getCredentialsSource).mockResolvedValue('redis');

    const response = await GET();
    const data = await response.json();

    expect(data.services.database.status).toBe('not_configured');
    expect(data.overall).toBe('unhealthy');
  });
});
