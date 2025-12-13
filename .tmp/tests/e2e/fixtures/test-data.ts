/**
 * Test Data Fixtures
 * 
 * Dados de teste reutilizáveis para testes E2E e de integração.
 * Seguem o padrão do types.ts do projeto.
 */

import { CampaignStatus, ContactStatus, MessageStatus } from '../../../types';

// ============================================
// CONTACTS
// ============================================

export const testContacts = {
  valid: {
    name: 'João Silva',
    phone: '+5511999999999',
    tags: 'VIP, Cliente',
  },
  validWithoutName: {
    name: '',
    phone: '+5511988888888',
    tags: 'Lead',
  },
  invalidPhone: {
    name: 'Maria Santos',
    phone: '123',
    tags: '',
  },
  international: {
    name: 'John Doe',
    phone: '+14155552671',
    tags: 'Internacional',
  },
};

export const testContactsList = [
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

// ============================================
// CAMPAIGNS
// ============================================

export const testCampaigns = {
  draft: {
    id: 'campaign-draft-1',
    name: 'Campanha de Teste Draft',
    status: CampaignStatus.DRAFT,
    recipients: 0,
    sent: 0,
    delivered: 0,
    read: 0,
    failed: 0,
    createdAt: '2025-11-30T10:00:00Z',
    templateName: 'template_promocao',
  },
  sending: {
    id: 'campaign-sending-1',
    name: 'Campanha Enviando',
    status: CampaignStatus.SENDING,
    recipients: 100,
    sent: 45,
    delivered: 40,
    read: 20,
    failed: 2,
    createdAt: '2025-11-30T09:00:00Z',
    templateName: 'template_black_friday',
    startedAt: '2025-11-30T09:30:00Z',
  },
  completed: {
    id: 'campaign-completed-1',
    name: 'Campanha Concluída',
    status: CampaignStatus.COMPLETED,
    recipients: 500,
    sent: 500,
    delivered: 480,
    read: 350,
    failed: 20,
    createdAt: '2025-11-25T14:00:00Z',
    templateName: 'template_boas_vindas',
    startedAt: '2025-11-25T14:30:00Z',
    completedAt: '2025-11-25T16:00:00Z',
  },
  scheduled: {
    id: 'campaign-scheduled-1',
    name: 'Campanha Agendada',
    status: CampaignStatus.SCHEDULED,
    recipients: 200,
    sent: 0,
    delivered: 0,
    read: 0,
    failed: 0,
    createdAt: '2025-11-30T08:00:00Z',
    templateName: 'template_natal',
    scheduledAt: '2025-12-15T10:00:00Z',
  },
};

export const testCampaignsList = Object.values(testCampaigns);

// ============================================
// TEMPLATES
// ============================================

export const testTemplates = {
  marketing: {
    id: 'template-1',
    name: 'template_promocao',
    category: 'MARKETING' as const,
    language: 'pt_BR',
    status: 'APPROVED' as const,
    content: 'Olá {{1}}! Confira nossa promoção especial com até 50% de desconto!',
    preview: 'Olá João! Confira nossa promoção especial com até 50% de desconto!',
    lastUpdated: '2025-11-28T10:00:00Z',
    components: [
      {
        type: 'BODY' as const,
        text: 'Olá {{1}}! Confira nossa promoção especial com até 50% de desconto!',
      },
    ],
  },
  utility: {
    id: 'template-2',
    name: 'template_confirmacao',
    category: 'UTILIDADE' as const,
    language: 'pt_BR',
    status: 'APPROVED' as const,
    content: 'Seu pedido #{{1}} foi confirmado! Entrega prevista: {{2}}',
    preview: 'Seu pedido #12345 foi confirmado! Entrega prevista: 02/12',
    lastUpdated: '2025-11-27T14:00:00Z',
    components: [
      {
        type: 'BODY' as const,
        text: 'Seu pedido #{{1}} foi confirmado! Entrega prevista: {{2}}',
      },
    ],
  },
  pending: {
    id: 'template-3',
    name: 'template_novo',
    category: 'MARKETING' as const,
    language: 'pt_BR',
    status: 'PENDING' as const,
    content: 'Novidades incríveis chegando!',
    preview: 'Novidades incríveis chegando!',
    lastUpdated: '2025-11-30T09:00:00Z',
    components: [],
  },
};

export const testTemplatesList = Object.values(testTemplates);

// ============================================
// MESSAGES
// ============================================

export const testMessages = [
  {
    id: 'msg-1',
    campaignId: 'campaign-sending-1',
    contactName: 'João Silva',
    contactPhone: '+5511999999999',
    status: MessageStatus.DELIVERED,
    messageId: 'wamid.12345',
    sentAt: '2025-11-30T09:35:00Z',
    deliveredAt: '2025-11-30T09:35:05Z',
  },
  {
    id: 'msg-2',
    campaignId: 'campaign-sending-1',
    contactName: 'Maria Santos',
    contactPhone: '+5511988888888',
    status: MessageStatus.READ,
    messageId: 'wamid.12346',
    sentAt: '2025-11-30T09:35:10Z',
    deliveredAt: '2025-11-30T09:35:15Z',
    readAt: '2025-11-30T09:40:00Z',
  },
  {
    id: 'msg-3',
    campaignId: 'campaign-sending-1',
    contactName: 'Pedro Costa',
    contactPhone: '+5511977777777',
    status: MessageStatus.FAILED,
    sentAt: '2025-11-30T09:35:20Z',
    error: 'Número inválido ou bloqueado',
  },
];

// ============================================
// SETTINGS
// ============================================

export const testSettings = {
  valid: {
    phoneNumberId: '123456789',
    businessAccountId: '987654321',
    accessToken: 'EAAtest123...',
    isConnected: true,
    displayPhoneNumber: '+55 11 99999-9999',
    qualityRating: 'GREEN',
    verifiedName: 'SmartZap Test',
    testContact: {
      name: 'Contato de Teste',
      phone: '+5511999999999',
    },
  },
  disconnected: {
    phoneNumberId: '',
    businessAccountId: '',
    accessToken: '',
    isConnected: false,
  },
};

// ============================================
// DASHBOARD STATS
// ============================================

export const testDashboardStats = {
  sent24h: '1,234',
  deliveryRate: '96.5%',
  activeCampaigns: '3',
  failedMessages: '42',
  chartData: [
    { name: 'Seg', sent: 200 },
    { name: 'Ter', sent: 350 },
    { name: 'Qua', sent: 280 },
    { name: 'Qui', sent: 420 },
    { name: 'Sex', sent: 380 },
    { name: 'Sáb', sent: 150 },
    { name: 'Dom', sent: 100 },
  ],
};

// ============================================
// CSV IMPORT DATA
// ============================================

export const testCSVContent = `Nome,Telefone,Tags
João Silva,11999999999,VIP
Maria Santos,11988888888,Lead
Pedro Costa,11977777777,Cliente`;

export const testCSVContentWithErrors = `Nome,Telefone,Tags
João Silva,11999999999,VIP
Inválido,123,
,11966666666,Sem Nome`;

// ============================================
// API RESPONSES
// ============================================

export const mockApiResponses = {
  health: {
    overall: 'healthy',
    services: {
      database: { status: 'ok', latency: 15 },
      redis: { status: 'ok', latency: 5 },
      qstash: { status: 'ok' },
      whatsapp: { status: 'ok', source: 'redis', phoneNumber: '+5511999999999' },
    },
    timestamp: new Date().toISOString(),
  },

  healthDegraded: {
    overall: 'degraded',
    services: {
      database: { status: 'ok', latency: 15 },
      redis: { status: 'error', message: 'Connection timeout' },
      qstash: { status: 'ok' },
      whatsapp: { status: 'ok', source: 'env' },
    },
    timestamp: new Date().toISOString(),
  },

  contactsSuccess: {
    contacts: testContactsList,
    total: testContactsList.length,
    page: 1,
    limit: 50,
  },

  templatesSuccess: {
    templates: testTemplatesList,
    synced: true,
    lastSync: new Date().toISOString(),
  },

  campaignsSuccess: testCampaignsList,

  error: {
    error: 'Internal server error',
    message: 'Something went wrong',
  },

  validationError: {
    error: 'Validation error',
    details: {
      phone: 'Número de telefone inválido',
    },
  },
};

// ============================================
// SELECTORS (for E2E tests)
// ============================================

export const selectors = {
  // Navigation
  nav: {
    dashboard: '[href="/"]',
    campaigns: '[href="/campaigns"]',
    templates: '[href="/templates"]',
    contacts: '[href="/contacts"]',
    settings: '[href="/settings"]',
    newCampaign: '[href="/campaigns/new"]',
  },

  // Dashboard
  dashboard: {
    title: 'h1:has-text("Dashboard")',
    statsGrid: '.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4',
    chartContainer: '[class*="glass-panel"]:has(h3:has-text("Volume de Mensagens"))',
    recentCampaigns: 'h3:has-text("Campanhas Recentes")',
  },

  // Campaigns
  campaigns: {
    title: 'h1:has-text("Campanhas")',
    searchInput: 'input[placeholder*="Buscar campanhas"]',
    filterSelect: 'select',
    refreshButton: 'button[title="Atualizar"]',
    table: 'table',
    emptyState: 'text=Nenhuma campanha encontrada',
  },

  // Wizard
  wizard: {
    nameInput: 'input[placeholder*="Promoção de Verão"]',
    templateList: '.custom-scrollbar',
    templateCard: '[class*="border rounded-xl p-5"]',
    nextButton: 'button:has-text("Continuar")',
    backButton: 'button:has-text("Voltar")',
    sendButton: 'button:has-text("Disparar Campanha")',
    scheduleButton: 'button:has-text("Agendar Campanha")',
  },

  // Contacts
  contacts: {
    title: 'h1:has-text("Contatos")',
    searchInput: 'input[placeholder*="Buscar por nome ou telefone"]',
    addButton: 'button:has-text("Novo Contato")',
    importButton: 'button:has-text("Importar CSV")',
    table: 'table',
    pagination: '[class*="pagination"]',
    modal: {
      name: 'input[placeholder*="João Silva"]',
      phone: 'input[placeholder*="+55"]',
      tags: 'input[placeholder*="VIP"]',
      saveButton: 'button:has-text("Salvar Contato")',
    },
  },

  // Templates
  templates: {
    title: 'h1:has-text("Templates")',
    syncButton: 'button:has-text("Sincronizar")',
    aiButton: 'button:has-text("Criar com IA")',
    grid: '.grid',
    card: '[class*="glass-panel rounded-2xl p-6"]',
  },

  // Settings
  settings: {
    title: 'h1:has-text("Configurações")',
    phoneIdInput: 'input[name="phoneNumberId"]',
    businessIdInput: 'input[name="businessAccountId"]',
    tokenInput: 'input[name="accessToken"]',
    saveButton: 'button:has-text("Salvar")',
  },

  // Common
  common: {
    loading: 'text=Carregando',
    error: '[class*="text-red"]',
    success: '[class*="text-emerald"]',
    modal: '[class*="fixed inset-0"]',
    closeModal: 'button:has(svg[class*="X"])',
  },
};
