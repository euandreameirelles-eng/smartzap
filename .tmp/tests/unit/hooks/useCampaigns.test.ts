import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useCampaignsController, useCampaignsQuery, useCampaignMutations } from '@/hooks/useCampaigns';
import { campaignService } from '@/services';
import { CampaignStatus } from '@/types';

// Mock the campaign service
vi.mock('@/services', () => ({
  campaignService: {
    getAll: vi.fn(),
    delete: vi.fn(),
    duplicate: vi.fn(),
  },
}));

const mockCampaigns = [
  {
    id: 'camp-1',
    name: 'Black Friday',
    status: CampaignStatus.COMPLETED,
    recipients: 100,
    sent: 100,
    delivered: 95,
    read: 80,
    failed: 5,
    templateName: 'promo_template',
    createdAt: '2025-11-25T10:00:00Z',
  },
  {
    id: 'camp-2',
    name: 'Welcome Campaign',
    status: CampaignStatus.SENDING,
    recipients: 50,
    sent: 30,
    delivered: 28,
    read: 15,
    failed: 2,
    templateName: 'welcome_template',
    createdAt: '2025-11-26T14:00:00Z',
  },
  {
    id: 'camp-3',
    name: 'Draft Test',
    status: CampaignStatus.DRAFT,
    recipients: 0,
    sent: 0,
    delivered: 0,
    read: 0,
    failed: 0,
    templateName: 'test_template',
    createdAt: '2025-11-27T09:00:00Z',
  },
];

// Helper to create wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useCampaigns Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useCampaignsQuery', () => {
    it('should fetch campaigns successfully', async () => {
      vi.mocked(campaignService.getAll).mockResolvedValue(mockCampaigns);

      const { result } = renderHook(() => useCampaignsQuery(), {
        wrapper: createWrapper(),
      });

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockCampaigns);
      expect(campaignService.getAll).toHaveBeenCalledOnce();
    });

    it('should handle fetch error', async () => {
      vi.mocked(campaignService.getAll).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useCampaignsQuery(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  describe('useCampaignsController', () => {
    it('should return campaigns with default filter', async () => {
      vi.mocked(campaignService.getAll).mockResolvedValue(mockCampaigns);

      const { result } = renderHook(() => useCampaignsController(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // All campaigns returned when filter is 'All'
      expect(result.current.campaigns).toHaveLength(3);
      expect(result.current.filter).toBe('All');
    });

    it('should filter campaigns by status', async () => {
      vi.mocked(campaignService.getAll).mockResolvedValue(mockCampaigns);

      const { result } = renderHook(() => useCampaignsController(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Filter by COMPLETED
      act(() => {
        result.current.setFilter(CampaignStatus.COMPLETED);
      });

      expect(result.current.campaigns).toHaveLength(1);
      expect(result.current.campaigns[0].name).toBe('Black Friday');
    });

    it('should filter campaigns by search term', async () => {
      vi.mocked(campaignService.getAll).mockResolvedValue(mockCampaigns);

      const { result } = renderHook(() => useCampaignsController(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Search by name
      act(() => {
        result.current.setSearchTerm('black');
      });

      expect(result.current.campaigns).toHaveLength(1);
      expect(result.current.campaigns[0].name).toBe('Black Friday');
    });

    it('should filter by template name', async () => {
      vi.mocked(campaignService.getAll).mockResolvedValue(mockCampaigns);

      const { result } = renderHook(() => useCampaignsController(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Search by template name
      act(() => {
        result.current.setSearchTerm('welcome');
      });

      expect(result.current.campaigns).toHaveLength(1);
      expect(result.current.campaigns[0].name).toBe('Welcome Campaign');
    });

    it('should combine filter and search', async () => {
      vi.mocked(campaignService.getAll).mockResolvedValue(mockCampaigns);

      const { result } = renderHook(() => useCampaignsController(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Filter by SENDING + search
      act(() => {
        result.current.setFilter(CampaignStatus.SENDING);
        result.current.setSearchTerm('welcome');
      });

      expect(result.current.campaigns).toHaveLength(1);

      // No match when combining
      act(() => {
        result.current.setFilter(CampaignStatus.DRAFT);
        result.current.setSearchTerm('black');
      });

      expect(result.current.campaigns).toHaveLength(0);
    });

    it('should call delete handler', async () => {
      vi.mocked(campaignService.getAll).mockResolvedValue(mockCampaigns);
      vi.mocked(campaignService.delete).mockResolvedValue(undefined);

      const { result } = renderHook(() => useCampaignsController(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify onDelete is a function and can be called
      expect(typeof result.current.onDelete).toBe('function');

      // Delete triggers the mutation (doesn't throw)
      act(() => {
        result.current.onDelete('camp-1');
      });
    });

    it('should call duplicate handler', async () => {
      vi.mocked(campaignService.getAll).mockResolvedValue(mockCampaigns);
      vi.mocked(campaignService.duplicate).mockResolvedValue(mockCampaigns[0]);

      const { result } = renderHook(() => useCampaignsController(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify onDuplicate is a function and can be called
      expect(typeof result.current.onDuplicate).toBe('function');

      // Duplicate triggers the mutation (doesn't throw)
      act(() => {
        result.current.onDuplicate('camp-1');
      });
    });

    it('should handle refresh action', async () => {
      vi.mocked(campaignService.getAll).mockResolvedValue(mockCampaigns);

      const { result } = renderHook(() => useCampaignsController(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Clear mock and refresh
      vi.mocked(campaignService.getAll).mockClear();

      act(() => {
        result.current.onRefresh();
      });

      await waitFor(() => {
        expect(campaignService.getAll).toHaveBeenCalled();
      });
    });

    it('should return empty array when no campaigns match', async () => {
      vi.mocked(campaignService.getAll).mockResolvedValue(mockCampaigns);

      const { result } = renderHook(() => useCampaignsController(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setSearchTerm('nonexistent');
      });

      expect(result.current.campaigns).toHaveLength(0);
    });

    it('should handle empty campaigns array', async () => {
      vi.mocked(campaignService.getAll).mockResolvedValue([]);

      const { result } = renderHook(() => useCampaignsController(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.campaigns).toHaveLength(0);
    });
  });

  describe('useCampaignMutations', () => {
    it('should expose delete and duplicate functions', async () => {
      const { result } = renderHook(() => useCampaignMutations(), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.deleteCampaign).toBe('function');
      expect(typeof result.current.duplicateCampaign).toBe('function');
      expect(result.current.isDeleting).toBe(false);
      expect(result.current.isDuplicating).toBe(false);
    });
  });
});
