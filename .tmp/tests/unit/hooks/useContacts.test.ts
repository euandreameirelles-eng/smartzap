import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useContactsController } from '@/hooks/useContacts';
import { contactService } from '@/services';
import { ContactStatus } from '@/types';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

// Mock the contact service
vi.mock('@/services', () => ({
  contactService: {
    getAll: vi.fn(),
    getStats: vi.fn(),
    getTags: vi.fn(),
    add: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    import: vi.fn(),
    importFromFile: vi.fn(),
    validatePhone: vi.fn(),
  },
}));

const mockContacts = [
  {
    id: 'contact-1',
    name: 'João Silva',
    phone: '+5511999999999',
    status: ContactStatus.OPT_IN,
    tags: ['VIP', 'Cliente'],
    lastActive: '2025-11-29T10:00:00Z',
  },
  {
    id: 'contact-2',
    name: 'Maria Santos',
    phone: '+5511988888888',
    status: ContactStatus.OPT_IN,
    tags: ['Lead'],
    lastActive: '2025-11-28T15:30:00Z',
  },
  {
    id: 'contact-3',
    name: 'Pedro Costa',
    phone: '+5511977777777',
    status: ContactStatus.OPT_OUT,
    tags: ['Inativo'],
    lastActive: '2025-10-15T08:00:00Z',
  },
];

const mockStats = { total: 3, optIn: 2, optOut: 1 };
const mockTags = ['VIP', 'Cliente', 'Lead', 'Inativo'];

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

describe('useContacts Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(contactService.getAll).mockResolvedValue(mockContacts);
    vi.mocked(contactService.getStats).mockResolvedValue(mockStats);
    vi.mocked(contactService.getTags).mockResolvedValue(mockTags);
  });

  describe('Data Loading', () => {
    it('should fetch contacts successfully', async () => {
      const { result } = renderHook(() => useContactsController(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.contacts).toHaveLength(3);
      expect(contactService.getAll).toHaveBeenCalledOnce();
    });

    it('should expose stats', async () => {
      const { result } = renderHook(() => useContactsController(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Stats are exposed
      expect(result.current.stats).toBeDefined();
      expect(result.current.stats).toHaveProperty('total');
      expect(result.current.stats).toHaveProperty('optIn');
      expect(result.current.stats).toHaveProperty('optOut');
    });

    it('should expose tags', async () => {
      const { result } = renderHook(() => useContactsController(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Tags are exposed
      expect(result.current.tags).toBeDefined();
      expect(Array.isArray(result.current.tags)).toBe(true);
    });
  });

  describe('Filtering', () => {
    it('should filter contacts by search term (name)', async () => {
      const { result } = renderHook(() => useContactsController(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setSearchTerm('joão');
      });

      expect(result.current.contacts).toHaveLength(1);
      expect(result.current.contacts[0].name).toBe('João Silva');
    });

    it('should filter contacts by search term (phone)', async () => {
      const { result } = renderHook(() => useContactsController(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setSearchTerm('988888888');
      });

      expect(result.current.contacts).toHaveLength(1);
      expect(result.current.contacts[0].name).toBe('Maria Santos');
    });

    it('should filter contacts by status', async () => {
      const { result } = renderHook(() => useContactsController(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setStatusFilter(ContactStatus.OPT_OUT);
      });

      expect(result.current.contacts).toHaveLength(1);
      expect(result.current.contacts[0].name).toBe('Pedro Costa');
    });

    it('should filter contacts by tag', async () => {
      const { result } = renderHook(() => useContactsController(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setTagFilter('VIP');
      });

      expect(result.current.contacts).toHaveLength(1);
      expect(result.current.contacts[0].name).toBe('João Silva');
    });

    it('should reset page when filter changes', async () => {
      const { result } = renderHook(() => useContactsController(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Set page to 2
      act(() => {
        result.current.setCurrentPage(2);
      });

      expect(result.current.currentPage).toBe(2);

      // Change filter - should reset to page 1
      act(() => {
        result.current.setSearchTerm('test');
      });

      expect(result.current.currentPage).toBe(1);
    });
  });

  describe('Selection', () => {
    it('should toggle contact selection', async () => {
      const { result } = renderHook(() => useContactsController(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.selectedIds.size).toBe(0);

      act(() => {
        result.current.toggleSelect('contact-1');
      });

      expect(result.current.selectedIds.has('contact-1')).toBe(true);
      expect(result.current.isSomeSelected).toBe(true);

      // Toggle off
      act(() => {
        result.current.toggleSelect('contact-1');
      });

      expect(result.current.selectedIds.has('contact-1')).toBe(false);
    });

    it('should select all contacts', async () => {
      const { result } = renderHook(() => useContactsController(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.toggleSelectAll();
      });

      expect(result.current.isAllSelected).toBe(true);
      expect(result.current.selectedIds.size).toBe(3);
    });

    it('should deselect all when all selected', async () => {
      const { result } = renderHook(() => useContactsController(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Select all
      act(() => {
        result.current.toggleSelectAll();
      });

      // Deselect all
      act(() => {
        result.current.toggleSelectAll();
      });

      expect(result.current.selectedIds.size).toBe(0);
      expect(result.current.isAllSelected).toBe(false);
    });
  });

  describe('Modals', () => {
    it('should open add modal', async () => {
      const { result } = renderHook(() => useContactsController(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAddModalOpen).toBe(false);

      act(() => {
        result.current.setIsAddModalOpen(true);
      });

      expect(result.current.isAddModalOpen).toBe(true);
    });

    it('should open edit modal with contact', async () => {
      const { result } = renderHook(() => useContactsController(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.onEditContact(mockContacts[0]);
      });

      expect(result.current.isEditModalOpen).toBe(true);
      expect(result.current.editingContact).toEqual(mockContacts[0]);
    });

    it('should open delete modal', async () => {
      const { result } = renderHook(() => useContactsController(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.onDeleteClick('contact-1');
      });

      expect(result.current.isDeleteModalOpen).toBe(true);
      expect(result.current.deleteTarget).toEqual({ type: 'single', id: 'contact-1' });
    });

    it('should open bulk delete modal', async () => {
      const { result } = renderHook(() => useContactsController(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Select contacts first
      act(() => {
        result.current.toggleSelect('contact-1');
        result.current.toggleSelect('contact-2');
      });

      act(() => {
        result.current.onBulkDeleteClick();
      });

      expect(result.current.isDeleteModalOpen).toBe(true);
      expect(result.current.deleteTarget).toEqual({ type: 'bulk' });
    });

    it('should cancel delete', async () => {
      const { result } = renderHook(() => useContactsController(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.onDeleteClick('contact-1');
      });

      act(() => {
        result.current.onCancelDelete();
      });

      expect(result.current.isDeleteModalOpen).toBe(false);
      expect(result.current.deleteTarget).toBe(null);
    });
  });

  describe('CRUD Operations', () => {
    it('should add contact with valid phone', async () => {
      vi.mocked(contactService.validatePhone).mockReturnValue({ isValid: true });
      vi.mocked(contactService.add).mockResolvedValue(mockContacts[0]);

      const { result } = renderHook(() => useContactsController(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.onAddContact({
          name: 'Novo Contato',
          phone: '+5511999999999',
          tags: 'VIP, Cliente',
        });
      });

      await waitFor(() => {
        expect(contactService.add).toHaveBeenCalled();
      });
    });

    it('should reject add with invalid phone', async () => {
      const { toast } = await import('sonner');
      vi.mocked(contactService.validatePhone).mockReturnValue({ 
        isValid: false, 
        error: 'Número inválido' 
      });

      const { result } = renderHook(() => useContactsController(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.onAddContact({
          name: 'Contato',
          phone: '123',
          tags: '',
        });
      });

      expect(toast.error).toHaveBeenCalledWith('Número inválido');
      expect(contactService.add).not.toHaveBeenCalled();
    });

    it('should reject add without phone', async () => {
      const { toast } = await import('sonner');

      const { result } = renderHook(() => useContactsController(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.onAddContact({
          name: 'Contato',
          phone: '',
          tags: '',
        });
      });

      expect(toast.error).toHaveBeenCalledWith('Telefone é obrigatório');
    });

    it('should call delete handler for single contact', async () => {
      vi.mocked(contactService.delete).mockResolvedValue(undefined);

      const { result } = renderHook(() => useContactsController(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Open delete modal
      act(() => {
        result.current.onDeleteClick('contact-1');
      });

      expect(result.current.deleteTarget).toEqual({ type: 'single', id: 'contact-1' });

      // Confirm delete
      expect(typeof result.current.onConfirmDelete).toBe('function');
      act(() => {
        result.current.onConfirmDelete();
      });
    });

    it('should call delete handler for multiple contacts', async () => {
      vi.mocked(contactService.deleteMany).mockResolvedValue(2);

      const { result } = renderHook(() => useContactsController(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Select contacts
      act(() => {
        result.current.toggleSelect('contact-1');
        result.current.toggleSelect('contact-2');
      });

      // Open bulk delete modal
      act(() => {
        result.current.onBulkDeleteClick();
      });

      expect(result.current.deleteTarget).toEqual({ type: 'bulk' });

      // Confirm delete
      expect(typeof result.current.onConfirmDelete).toBe('function');
      act(() => {
        result.current.onConfirmDelete();
      });
    });
  });

  describe('Pagination', () => {
    it('should paginate contacts', async () => {
      // Create 15 contacts for pagination test
      const manyContacts = Array.from({ length: 15 }, (_, i) => ({
        id: `contact-${i}`,
        name: `Contact ${i}`,
        phone: `+5511999${i.toString().padStart(6, '0')}`,
        status: ContactStatus.OPT_IN,
        tags: [],
        lastActive: '2025-11-29T10:00:00Z',
      }));
      
      vi.mocked(contactService.getAll).mockResolvedValue(manyContacts);

      const { result } = renderHook(() => useContactsController(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // First page should have 10 items
      expect(result.current.contacts).toHaveLength(10);
      expect(result.current.totalPages).toBe(2);
      expect(result.current.totalFiltered).toBe(15);

      // Go to page 2
      act(() => {
        result.current.setCurrentPage(2);
      });

      expect(result.current.contacts).toHaveLength(5);
    });
  });

  describe('Import', () => {
    it('should import contacts from file', async () => {
      vi.mocked(contactService.importFromFile).mockResolvedValue({
        imported: 5,
        failed: 1,
        duplicates: 0,
        report: 'Import report',
      });

      const { result } = renderHook(() => useContactsController(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const file = new File(['test'], 'contacts.csv', { type: 'text/csv' });
      
      await act(async () => {
        await result.current.onImportFile(file);
      });

      expect(contactService.importFromFile).toHaveBeenCalledWith(file);
      expect(result.current.importReport).toBe('Import report');
    });

    it('should clear import report', async () => {
      vi.mocked(contactService.importFromFile).mockResolvedValue({
        imported: 5,
        failed: 0,
        duplicates: 0,
        report: 'Import report',
      });

      const { result } = renderHook(() => useContactsController(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const file = new File(['test'], 'contacts.csv', { type: 'text/csv' });
      
      await act(async () => {
        await result.current.onImportFile(file);
      });

      expect(result.current.importReport).toBe('Import report');

      act(() => {
        result.current.clearImportReport();
      });

      expect(result.current.importReport).toBe(null);
    });
  });
});
