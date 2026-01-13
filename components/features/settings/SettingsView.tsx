import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Calendar, HelpCircle, Save, RefreshCw, Wifi, Edit2, Shield, AlertCircle, UserCheck, Smartphone, X, Copy, Check, ExternalLink, Webhook, Clock, Phone, Trash2, Loader2, ChevronDown, ChevronUp, Zap, ArrowDown, CheckCircle2, Circle, Lock, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { AppSettings, CalendarBookingConfig, WorkflowExecutionConfig } from '../../../types';
import { AccountLimits } from '../../../lib/meta-limits';
import { PhoneNumber } from '../../../hooks/useSettings';
import { AISettings } from './AISettings';
import { TestContactPanel } from './TestContactPanel';
import { AutoSuppressionPanel } from './AutoSuppressionPanel';
import { WorkflowExecutionPanel } from './WorkflowExecutionPanel';
import { MetaAppPanel } from './MetaAppPanel';
import { StatusCard } from './StatusCard';
import { TurboConfigSection } from './TurboConfigSection';
import { WebhookConfigSection } from './WebhookConfigSection';
import type { AiFallbackConfig, AiPromptsConfig, AiRoutesConfig } from '../../../lib/ai/ai-center-defaults';
import { formatPhoneNumberDisplay } from '../../../lib/phone-formatter';
import { performanceService } from '../../../services/performanceService';

interface WebhookStats {
  lastEventAt?: string | null;
  todayDelivered?: number;
  todayRead?: number;
  todayFailed?: number;
}

interface DomainOption {
  url: string;
  source: string;
  recommended: boolean;
}

const CALENDAR_BOOKING_FALLBACK: CalendarBookingConfig = {
  timezone: 'America/Sao_Paulo',
  slotDurationMinutes: 30,
  slotBufferMinutes: 10,
  workingHours: [
    { day: 'mon', enabled: true, start: '09:00', end: '18:00' },
    { day: 'tue', enabled: true, start: '09:00', end: '18:00' },
    { day: 'wed', enabled: true, start: '09:00', end: '18:00' },
    { day: 'thu', enabled: true, start: '09:00', end: '18:00' },
    { day: 'fri', enabled: true, start: '09:00', end: '18:00' },
    { day: 'sat', enabled: false, start: '09:00', end: '13:00' },
    { day: 'sun', enabled: false, start: '09:00', end: '13:00' },
  ],
};

const CALENDAR_WEEK_LABELS: Record<string, string> = {
  mon: 'Seg',
  tue: 'Ter',
  wed: 'Qua',
  thu: 'Qui',
  fri: 'Sex',
  sat: 'Sab',
  sun: 'Dom',
};

interface SettingsViewProps {
  settings: AppSettings;
  setSettings: (settings: AppSettings) => void;
  isLoading: boolean;
  isSaving: boolean;
  onSave: () => void;
  onSaveSettings: (settings: AppSettings) => void; // Direct save with settings
  onDisconnect: () => void;
  accountLimits?: AccountLimits | null;
  tierName?: string | null;
  limitsError?: boolean;
  limitsErrorMessage?: string | null;
  limitsLoading?: boolean;
  onRefreshLimits?: () => void;
  // Webhook props
  webhookUrl?: string;
  webhookToken?: string;
  webhookStats?: WebhookStats | null;
  webhookSubscription?: {
    ok: boolean;
    wabaId?: string;
    messagesSubscribed?: boolean;
    subscribedFields?: string[];
    apps?: Array<{ id?: string; name?: string; subscribed_fields?: string[] }>;
    error?: string;
    details?: unknown;
  };
  webhookSubscriptionLoading?: boolean;
  webhookSubscriptionMutating?: boolean;
  onRefreshWebhookSubscription?: () => void;
  onSubscribeWebhookMessages?: () => Promise<void>;
  onUnsubscribeWebhookMessages?: () => Promise<void>;
  // Phone numbers for webhook override
  phoneNumbers?: PhoneNumber[];
  phoneNumbersLoading?: boolean;
  onRefreshPhoneNumbers?: () => void;
  onSetWebhookOverride?: (phoneNumberId: string, callbackUrl: string) => Promise<boolean>;
  onRemoveWebhookOverride?: (phoneNumberId: string) => Promise<boolean>;
  // Domain selection
  availableDomains?: DomainOption[];
  webhookPath?: string;
  // Hide header (when shown externally)
  hideHeader?: boolean;

  // Test connection (sem salvar)
  onTestConnection?: () => void;
  isTestingConnection?: boolean;

  // AI Settings
  aiSettings?: {
    isConfigured: boolean;
    source: 'database' | 'env' | 'none';
    tokenPreview?: string | null;
    provider?: 'google' | 'openai' | 'anthropic';
    model?: string;
    providers?: {
      google: { isConfigured: boolean; source: 'database' | 'env' | 'none'; tokenPreview?: string | null };
      openai: { isConfigured: boolean; source: 'database' | 'env' | 'none'; tokenPreview?: string | null };
      anthropic: { isConfigured: boolean; source: 'database' | 'env' | 'none'; tokenPreview?: string | null };
    };
  };
  aiSettingsLoading?: boolean;
  saveAIConfig?: (data: {
    apiKey?: string;
    apiKeyProvider?: string;
    provider?: string;
    model?: string;
    routes?: AiRoutesConfig;
    prompts?: AiPromptsConfig;
    fallback?: AiFallbackConfig;
  }) => Promise<void>;
  removeAIKey?: (provider: 'google' | 'openai' | 'anthropic') => Promise<void>;
  isSavingAI?: boolean;

  // Meta App (opcional) — debug_token no diagnóstico
  metaApp?: {
    source: 'db' | 'env' | 'none';
    appId: string | null;
    hasAppSecret: boolean;
    isConfigured: boolean;
  } | null;
  metaAppLoading?: boolean;
  refreshMetaApp?: () => void;
  // Test Contact - Supabase
  testContact?: { name?: string; phone: string } | null;
  saveTestContact?: (contact: { name?: string; phone: string }) => Promise<void>;
  removeTestContact?: () => Promise<void>;
  isSavingTestContact?: boolean;

  // WhatsApp Turbo (Adaptive Throttle)
  whatsappThrottle?: {
    ok: boolean;
    source?: 'db' | 'env';
    phoneNumberId?: string | null;
    config?: {
      enabled: boolean;
      sendConcurrency?: number;
      batchSize?: number;
      startMps: number;
      maxMps: number;
      minMps: number;
      cooldownSec: number;
      minIncreaseGapSec: number;
      sendFloorDelayMs: number;
    };
    state?: {
      targetMps: number;
      cooldownUntil?: string | null;
      lastIncreaseAt?: string | null;
      lastDecreaseAt?: string | null;
      updatedAt?: string | null;
    } | null;
  } | null;
  whatsappThrottleLoading?: boolean;
  saveWhatsAppThrottle?: (data: {
    enabled?: boolean;
    sendConcurrency?: number;
    batchSize?: number;
    startMps?: number;
    maxMps?: number;
    minMps?: number;
    cooldownSec?: number;
    minIncreaseGapSec?: number;
    sendFloorDelayMs?: number;
    resetState?: boolean;
  }) => Promise<void>;
  isSavingWhatsAppThrottle?: boolean;

  // Auto-supressão (Proteção de Qualidade)
  autoSuppression?: {
    ok: boolean;
    source?: 'db' | 'default';
    config?: {
      enabled: boolean;
      undeliverable131026: {
        enabled: boolean;
        windowDays: number;
        threshold: number;
        ttlBaseDays: number;
        ttl2Days: number;
        ttl3Days: number;
      };
    };
  } | null;
  autoSuppressionLoading?: boolean;
  saveAutoSuppression?: (data: {
    enabled?: boolean;
    undeliverable131026?: {
      enabled?: boolean;
      windowDays?: number;
      threshold?: number;
      ttlBaseDays?: number;
      ttl2Days?: number;
      ttl3Days?: number;
    };
  }) => Promise<void>;
  isSavingAutoSuppression?: boolean;

  // Calendar Booking (Google Calendar)
  calendarBooking?: {
    ok: boolean;
    source?: 'db' | 'default';
    config?: CalendarBookingConfig;
  } | null;
  calendarBookingLoading?: boolean;
  saveCalendarBooking?: (data: Partial<CalendarBookingConfig>) => Promise<void>;
  isSavingCalendarBooking?: boolean;

  // Workflow Execution (global)
  workflowExecution?: {
    ok: boolean;
    source: 'db' | 'env';
    config: WorkflowExecutionConfig;
  } | null;
  workflowExecutionLoading?: boolean;
  saveWorkflowExecution?: (data: Partial<WorkflowExecutionConfig>) => Promise<WorkflowExecutionConfig | void>;
  isSavingWorkflowExecution?: boolean;

  // Workflow Builder default
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  setSettings,
  isLoading,
  isSaving,
  onSave,
  onSaveSettings,
  onDisconnect,
  accountLimits,
  tierName,
  limitsError,
  limitsErrorMessage,
  limitsLoading,
  onRefreshLimits,
  webhookUrl,
  webhookToken,
  webhookStats,
  webhookSubscription,
  webhookSubscriptionLoading,
  webhookSubscriptionMutating,
  onRefreshWebhookSubscription,
  onSubscribeWebhookMessages,
  onUnsubscribeWebhookMessages,
  phoneNumbers,
  phoneNumbersLoading,
  onRefreshPhoneNumbers,
  onSetWebhookOverride,
  onRemoveWebhookOverride,
  availableDomains,
  webhookPath,
  hideHeader,

  onTestConnection,
  isTestingConnection,

  // AI Props
  aiSettings,
  aiSettingsLoading,
  saveAIConfig,
  removeAIKey,
  isSavingAI,

  // Meta App
  metaApp,
  metaAppLoading,
  refreshMetaApp,
  // Test Contact Props - Supabase
  testContact,
  saveTestContact,
  removeTestContact,
  isSavingTestContact,

  // Turbo
  whatsappThrottle,
  whatsappThrottleLoading,
  saveWhatsAppThrottle,
  isSavingWhatsAppThrottle,

  // Auto-supressão
  autoSuppression,
  autoSuppressionLoading,
  saveAutoSuppression,
  isSavingAutoSuppression,

  // Calendar Booking
  calendarBooking,
  calendarBookingLoading,
  saveCalendarBooking,
  isSavingCalendarBooking,

  // Workflow Execution (global)
  workflowExecution,
  workflowExecutionLoading,
  saveWorkflowExecution,
  isSavingWorkflowExecution,

}) => {
  // Always start collapsed
  const [isEditing, setIsEditing] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Refs para UX: o formulário de credenciais fica bem abaixo do card.
  // Sem scroll automático, parece que o botão "Editar" não funcionou.
  const statusCardRef = useRef<HTMLDivElement | null>(null);
  const credentialsFormRef = useRef<HTMLDivElement | null>(null);

  // Meta App ID (rápido) — usado para uploads do Template Builder (header_handle)
  const [metaAppIdQuick, setMetaAppIdQuick] = useState('');

  useEffect(() => {
    setMetaAppIdQuick(metaApp?.appId || '');
  }, [metaApp?.appId]);

  useEffect(() => {
    // Quando o usuário ativa o modo edição, rolar até o formulário.
    if (!isEditing) return;

    // Aguarda o render do bloco condicional.
    const t = window.setTimeout(() => {
      credentialsFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);

    return () => window.clearTimeout(t);
  }, [isEditing]);

  // Calendar Booking form state
  const calendarConfig = calendarBooking?.config || CALENDAR_BOOKING_FALLBACK;
  const [isEditingCalendarBooking, setIsEditingCalendarBooking] = useState(false);
  const [calendarDraft, setCalendarDraft] = useState<CalendarBookingConfig>(calendarConfig);
  const [calendarAuthStatus, setCalendarAuthStatus] = useState<{
    connected: boolean;
    calendar?: {
      calendarId?: string | null;
      calendarSummary?: string | null;
      calendarTimeZone?: string | null;
      accountEmail?: string | null;
    } | null;
    channel?: {
      id?: string;
      expiration?: number | null;
      lastNotificationAt?: string | null;
    } | null;
    hasRefreshToken?: boolean;
    expiresAt?: number | null;
  } | null>(null);
  const [calendarAuthLoading, setCalendarAuthLoading] = useState(false);
  const [calendarAuthError, setCalendarAuthError] = useState<string | null>(null);
  const [calendarCredsStatus, setCalendarCredsStatus] = useState<{
    clientId: string | null;
    source: 'db' | 'env' | 'none';
    hasClientSecret: boolean;
    isConfigured: boolean;
  } | null>(null);
  const [calendarCredsLoading, setCalendarCredsLoading] = useState(false);
  const [calendarCredsSaving, setCalendarCredsSaving] = useState(false);
  const [calendarCredsError, setCalendarCredsError] = useState<string | null>(null);
  const [calendarClientIdDraft, setCalendarClientIdDraft] = useState('');
  const [calendarClientSecretDraft, setCalendarClientSecretDraft] = useState('');
  const [appOrigin, setAppOrigin] = useState('');
  const [isCalendarWizardOpen, setIsCalendarWizardOpen] = useState(false);
  const [calendarWizardStep, setCalendarWizardStep] = useState(0);
  const [calendarWizardError, setCalendarWizardError] = useState<string | null>(null);
  const [calendarConnectLoading, setCalendarConnectLoading] = useState(false);
  const [calendarTestLoading, setCalendarTestLoading] = useState(false);
  const [calendarTestResult, setCalendarTestResult] = useState<{ ok: boolean; link?: string | null } | null>(null);
  const [calendarBaseUrlDraft, setCalendarBaseUrlDraft] = useState('');
  const [calendarBaseUrlEditing, setCalendarBaseUrlEditing] = useState(false);
  const [calendarList, setCalendarList] = useState<Array<{ id: string; summary: string; timeZone?: string | null; primary?: boolean }>>([]);
  const [calendarListLoading, setCalendarListLoading] = useState(false);
  const [calendarListError, setCalendarListError] = useState<string | null>(null);
  const [calendarSelectionId, setCalendarSelectionId] = useState('');
  const [calendarSelectionSaving, setCalendarSelectionSaving] = useState(false);
  const [calendarListQuery, setCalendarListQuery] = useState('');

  useEffect(() => {
    if (!isEditingCalendarBooking) {
      setCalendarDraft(calendarConfig);
    }
  }, [calendarConfig, isEditingCalendarBooking]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAppOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (!appOrigin) return;
    setCalendarBaseUrlDraft((prev) => prev || appOrigin);
  }, [appOrigin]);

  useEffect(() => {
    const calendarId = calendarAuthStatus?.calendar?.calendarId;
    if (calendarId) {
      setCalendarSelectionId(calendarId);
    }
  }, [calendarAuthStatus?.calendar?.calendarId]);


  const fetchCalendarAuthStatus = useCallback(async () => {
    if (!settings.isConnected) return;
    setCalendarAuthLoading(true);
    setCalendarAuthError(null);
    try {
      const response = await fetch('/api/integrations/google-calendar/status');
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((data as any)?.error || 'Falha ao carregar status');
      }
      setCalendarAuthStatus(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao carregar status';
      setCalendarAuthError(message);
      setCalendarWizardError(message);
      setCalendarAuthStatus(null);
    } finally {
      setCalendarAuthLoading(false);
    }
  }, [settings.isConnected]);

  const fetchCalendarCredsStatus = useCallback(async () => {
    setCalendarCredsLoading(true);
    setCalendarCredsError(null);
    try {
      const response = await fetch('/api/settings/google-calendar');
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((data as any)?.error || 'Falha ao carregar credenciais');
      }
      setCalendarCredsStatus(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao carregar credenciais';
      setCalendarCredsError(message);
      setCalendarCredsStatus(null);
    } finally {
      setCalendarCredsLoading(false);
    }
  }, []);

  const fetchCalendarList = useCallback(async () => {
    if (!calendarAuthStatus?.connected) return;
    setCalendarListLoading(true);
    setCalendarListError(null);
    try {
      const response = await fetch('/api/integrations/google-calendar/calendars');
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((data as any)?.error || 'Falha ao listar calendarios');
      }
      const calendars = Array.isArray((data as any)?.calendars) ? (data as any).calendars : [];
      const sortedCalendars = [...calendars].sort((a, b) => {
        const aPrimary = Boolean(a?.primary);
        const bPrimary = Boolean(b?.primary);
        if (aPrimary !== bPrimary) return aPrimary ? -1 : 1;
        const aLabel = String(a?.summary || a?.id || '');
        const bLabel = String(b?.summary || b?.id || '');
        return aLabel.localeCompare(bLabel, 'pt-BR');
      });
      setCalendarList(sortedCalendars);
      if (!calendarSelectionId && sortedCalendars.length) {
        setCalendarSelectionId(String(sortedCalendars[0].id));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao listar calendarios';
      setCalendarListError(message);
      setCalendarWizardError(message);
      setCalendarList([]);
    } finally {
      setCalendarListLoading(false);
    }
  }, [calendarAuthStatus?.connected, calendarSelectionId]);

  useEffect(() => {
    fetchCalendarAuthStatus();
  }, [fetchCalendarAuthStatus]);

  useEffect(() => {
    fetchCalendarCredsStatus();
  }, [fetchCalendarCredsStatus]);

  useEffect(() => {
    if (isCalendarWizardOpen && calendarAuthStatus?.connected) {
      fetchCalendarList();
    }
  }, [isCalendarWizardOpen, calendarAuthStatus?.connected, fetchCalendarList]);

  useEffect(() => {
    if (calendarAuthStatus?.connected) {
      setCalendarConnectLoading(false);
    }
  }, [calendarAuthStatus?.connected]);

  useEffect(() => {
    setCalendarClientIdDraft(calendarCredsStatus?.clientId || '');
    setCalendarClientSecretDraft('');
  }, [calendarCredsStatus]);

  const updateCalendarDraft = (patch: Partial<CalendarBookingConfig>) => {
    setCalendarDraft((prev) => ({ ...prev, ...patch }));
  };

  const updateWorkingHours = (day: string, patch: Partial<{ enabled: boolean; start: string; end: string }>) => {
    setCalendarDraft((prev) => ({
      ...prev,
      workingHours: prev.workingHours.map((entry) =>
        entry.day === day
          ? { ...entry, ...patch }
          : entry
      ),
    }));
  };

  const handleSaveCalendarBooking = async () => {
    if (!saveCalendarBooking) return;
    await saveCalendarBooking(calendarDraft);
    setIsEditingCalendarBooking(false);
  };

  const handleConnectCalendar = () => {
    setCalendarConnectLoading(true);
    setCalendarWizardError(null);
    window.location.href = '/api/integrations/google-calendar/connect?returnTo=/settings?gc=1';
  };

  const handleDisconnectCalendar = async () => {
    setCalendarAuthLoading(true);
    setCalendarAuthError(null);
    try {
      const response = await fetch('/api/integrations/google-calendar/disconnect', { method: 'POST' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((data as any)?.error || 'Falha ao desconectar');
      }
      toast.success('Google Calendar desconectado');
      await fetchCalendarAuthStatus();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao desconectar';
      setCalendarAuthError(message);
      toast.error(message);
    } finally {
      setCalendarAuthLoading(false);
    }
  };

  const handleSaveCalendarCreds = async () => {
    setCalendarWizardError(null);
    if (!calendarCredsFormValid) {
      setCalendarWizardError('Informe um Client ID e Client Secret validos.');
      return;
    }

    setCalendarCredsSaving(true);
    setCalendarCredsError(null);
    try {
      const response = await fetch('/api/settings/google-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: calendarClientIdDraft.trim(),
          clientSecret: calendarClientSecretDraft.trim(),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((data as any)?.error || 'Falha ao salvar credenciais');
      }
      toast.success('Credenciais salvas.');
      await fetchCalendarCredsStatus();
      setCalendarWizardStep((prev) => (prev < 2 ? 2 : prev));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao salvar credenciais';
      setCalendarCredsError(message);
      setCalendarWizardError(message);
      toast.error(message);
    } finally {
      setCalendarCredsSaving(false);
    }
  };

  const handleRemoveCalendarCreds = async () => {
    setCalendarCredsSaving(true);
    setCalendarCredsError(null);
    try {
      const response = await fetch('/api/settings/google-calendar', { method: 'DELETE' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((data as any)?.error || 'Falha ao remover credenciais');
      }
      toast.success('Credenciais removidas.');
      await fetchCalendarCredsStatus();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao remover credenciais';
      setCalendarCredsError(message);
      setCalendarWizardError(message);
      toast.error(message);
    } finally {
      setCalendarCredsSaving(false);
    }
  };

  const handleSaveCalendarSelection = async (): Promise<boolean> => {
    if (!calendarSelectionId) {
      setCalendarWizardError('Selecione um calendario.');
      return false;
    }
    setCalendarSelectionSaving(true);
    setCalendarListError(null);
    setCalendarWizardError(null);
    try {
      const response = await fetch('/api/integrations/google-calendar/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calendarId: calendarSelectionId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((data as any)?.error || 'Falha ao salvar calendario');
      }
      toast.success('Calendario atualizado');
      await fetchCalendarAuthStatus();
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao salvar calendario';
      setCalendarListError(message);
      setCalendarWizardError(message);
      toast.error(message);
      return false;
    } finally {
      setCalendarSelectionSaving(false);
    }
  };

  const handlePrimaryCalendarAction = () => {
    setCalendarWizardError(null);
    setCalendarConnectLoading(false);
    setCalendarWizardStep(calendarStep === 3 ? 3 : calendarStep === 2 ? 2 : 0);
    setIsCalendarWizardOpen(true);
  };

  const handleCopyCalendarValue = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copiado`);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error(`Nao foi possivel copiar ${label}`);
    }
  };

  const handleCopyCalendarBundle = async () => {
    const bundle = `Redirect URI: ${calendarRedirectUrl}\nWebhook URL: ${calendarWebhookUrl}`;
    await handleCopyCalendarValue(bundle, 'URLs');
  };

  const handleCalendarTestEvent = async (): Promise<boolean> => {
    if (!calendarAuthStatus?.connected) {
      setCalendarWizardError('Conecte o Google Calendar antes de testar.');
      return false;
    }
    setCalendarTestLoading(true);
    setCalendarTestResult(null);
    try {
      const start = new Date(Date.now() + 60 * 60 * 1000);
      const end = new Date(start.getTime() + 30 * 60 * 1000);
      const response = await fetch('/api/integrations/google-calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calendarId: calendarAuthStatus?.calendar?.calendarId || undefined,
          start: start.toISOString(),
          end: end.toISOString(),
          timeZone: selectedCalendarTimeZone,
          summary: 'Teste SmartZap',
          description: 'Evento de teste criado pelo SmartZap.',
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((data as any)?.error || 'Falha ao criar evento');
      }
      setCalendarTestResult({ ok: true, link: (data as any)?.htmlLink || null });
      toast.success('Evento de teste criado.');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao criar evento';
      setCalendarTestResult({ ok: false });
      setCalendarWizardError(message);
      toast.error(message);
      return false;
    } finally {
      setCalendarTestLoading(false);
    }
  };

  const handleCalendarWizardStepClick = (step: number) => {
    if (step === 2 && !calendarCredsStatus?.isConfigured) {
      setCalendarWizardError('Complete as credenciais primeiro.');
      return;
    }
    if (step === 3 && !calendarAuthStatus?.connected) {
      setCalendarWizardError('Conecte o Google Calendar antes.');
      return;
    }
    setCalendarWizardError(null);
    setCalendarWizardStep(step);
  };

  const handleCalendarWizardBack = () => {
    setCalendarWizardError(null);
    if (calendarWizardStep === 0) {
      setIsCalendarWizardOpen(false);
      return;
    }
    setCalendarWizardStep((prev) => Math.max(0, prev - 1));
  };

  const handleCalendarWizardNext = async () => {
    if (calendarWizardStep === 0) {
      setCalendarWizardError(null);
      setCalendarWizardStep(1);
      return;
    }
    if (calendarWizardStep === 1) {
      if (!calendarCredsStatus?.isConfigured) {
        setCalendarWizardError('Salve as credenciais para continuar.');
        return;
      }
      setCalendarWizardError(null);
      setCalendarWizardStep(2);
      return;
    }
    if (calendarWizardStep === 2) {
      if (!calendarAuthStatus?.connected) {
        setCalendarWizardError('Autorize o Google para continuar.');
        return;
      }
      setCalendarWizardError(null);
      setCalendarWizardStep(3);
      return;
    }
    const effectiveCalendarId = calendarSelectionId || calendarAuthStatus?.calendar?.calendarId;
    if (!effectiveCalendarId) {
      setCalendarWizardError('Selecione um calendario antes de testar.');
      return;
    }
    if (calendarSelectionId && calendarSelectionId !== calendarAuthStatus?.calendar?.calendarId) {
      const saved = await handleSaveCalendarSelection();
      if (!saved) return;
    }
    const ok = await handleCalendarTestEvent();
    if (ok) {
      setIsCalendarWizardOpen(false);
    }
  };

  const calendarBaseUrl = (calendarBaseUrlDraft || appOrigin || '').replace(/\/$/, '');
  const calendarRedirectUrl = calendarBaseUrl
    ? `${calendarBaseUrl}/api/integrations/google-calendar/callback`
    : 'https://seu-dominio.com/api/integrations/google-calendar/callback';
  const calendarWebhookUrl = calendarBaseUrl
    ? `${calendarBaseUrl}/api/integrations/google-calendar/webhook`
    : 'https://seu-dominio.com/api/integrations/google-calendar/webhook';
  const calendarStep = !calendarCredsStatus?.isConfigured
    ? 1
    : !calendarAuthStatus?.connected
      ? 2
      : 3;
  const calendarCredsSourceLabel = calendarCredsStatus?.source === 'env'
    ? 'variaveis de ambiente'
    : calendarCredsStatus?.source === 'db'
      ? 'configurado aqui'
      : 'nao configurado';
  const calendarWizardStorageKey = 'gcWizardProgress';
  const calendarClientIdValue = calendarClientIdDraft.trim();
  const calendarClientSecretValue = calendarClientSecretDraft.trim();
  const calendarClientIdValid = !calendarClientIdValue || /\.apps\.googleusercontent\.com$/i.test(calendarClientIdValue);
  const calendarClientSecretValid = !calendarClientSecretValue || calendarClientSecretValue.length >= 10;
  const calendarCredsFormValid = Boolean(
    calendarClientIdValue &&
      calendarClientSecretValue &&
      calendarClientIdValid &&
      calendarClientSecretValid
  );
  const selectedCalendar = calendarList.find((item) => String(item.id) === calendarSelectionId);
  const selectedCalendarTimeZone = selectedCalendar?.timeZone || calendarAuthStatus?.calendar?.calendarTimeZone || calendarDraft.timezone;
  const hasCalendarSelection = Boolean(calendarSelectionId || calendarAuthStatus?.calendar?.calendarId);
  const filteredCalendarList = calendarListQuery.trim()
    ? calendarList.filter((item) => {
      const query = calendarListQuery.trim().toLowerCase();
      return String(item.summary || item.id).toLowerCase().includes(query);
    })
    : calendarList;
  const calendarWizardCanContinue = calendarWizardStep === 0
    ? true
    : calendarWizardStep === 1
      ? calendarCredsStatus?.isConfigured
      : calendarWizardStep === 2
        ? calendarAuthStatus?.connected
        : calendarWizardStep === 3
          ? Boolean(calendarAuthStatus?.connected && hasCalendarSelection)
          : false;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('gc') === '1') {
      setIsCalendarWizardOpen(true);
      setCalendarWizardError(null);
      const autoStep = calendarStep === 3 ? 3 : calendarStep === 2 ? 2 : 0;
      setCalendarWizardStep(autoStep);
      params.delete('gc');
      const next = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
      window.history.replaceState({}, '', next);
    }
  }, [calendarStep]);

  useEffect(() => {
    if (!isCalendarWizardOpen) return;
    const fromStatus = calendarStep === 3 ? 3 : calendarStep === 2 ? 2 : 0;
    setCalendarWizardStep((prev) => (prev > 0 ? prev : fromStatus));
  }, [isCalendarWizardOpen, calendarStep]);

  useEffect(() => {
    if (!isCalendarWizardOpen || typeof window === 'undefined') return;
    const storedRaw = window.localStorage.getItem(calendarWizardStorageKey);
    if (!storedRaw) return;
    try {
      const stored = JSON.parse(storedRaw) as { step?: number; selectionId?: string; baseUrl?: string };
      if (stored?.baseUrl && !calendarBaseUrlEditing) {
        setCalendarBaseUrlDraft(stored.baseUrl);
      }
      if (stored?.selectionId) {
        setCalendarSelectionId(stored.selectionId);
      }
      if (typeof stored?.step === 'number') {
        setCalendarWizardStep(stored.step);
      }
    } catch {
      // ignore
    }
  }, [isCalendarWizardOpen, calendarBaseUrlEditing]);

  useEffect(() => {
    if (!isCalendarWizardOpen || typeof window === 'undefined') return;
    const payload = {
      step: calendarWizardStep,
      selectionId: calendarSelectionId,
      baseUrl: calendarBaseUrlDraft,
    };
    window.localStorage.setItem(calendarWizardStorageKey, JSON.stringify(payload));
  }, [isCalendarWizardOpen, calendarWizardStep, calendarSelectionId, calendarBaseUrlDraft]);

  useEffect(() => {
    if (!isCalendarWizardOpen) return;
    setCalendarWizardError(null);
  }, [calendarWizardStep, isCalendarWizardOpen]);

  useEffect(() => {
    if (isCalendarWizardOpen) {
      setCalendarListQuery('');
    }
  }, [isCalendarWizardOpen]);

  useEffect(() => {
    if (!isCalendarWizardOpen) {
      setCalendarConnectLoading(false);
    }
  }, [isCalendarWizardOpen]);

  useEffect(() => {
    if (!isCalendarWizardOpen) return;
    if (calendarWizardStep === 3 && !calendarAuthStatus?.connected) {
      setCalendarWizardStep(calendarCredsStatus?.isConfigured ? 2 : 0);
      return;
    }
    if (calendarWizardStep === 2 && !calendarCredsStatus?.isConfigured) {
      setCalendarWizardStep(0);
    }
  }, [isCalendarWizardOpen, calendarWizardStep, calendarAuthStatus?.connected, calendarCredsStatus?.isConfigured]);


  if (isLoading) return <div className="text-white">Carregando configurações...</div>;

  return (
    <div>
      {!hideHeader && (
        <>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Configurações</h1>
          <p className="text-gray-400 mb-10">Gerencie sua conexão com a WhatsApp Business API</p>
        </>
      )}

      <div className="space-y-8">
        {/* Status Card */}
        <StatusCard
          ref={statusCardRef}
          settings={settings}
          limitsLoading={limitsLoading}
          limitsError={limitsError}
          limitsErrorMessage={limitsErrorMessage}
          accountLimits={accountLimits}
          onRefreshLimits={onRefreshLimits}
          onDisconnect={onDisconnect}
          isEditing={isEditing}
          onToggleEdit={() => setIsEditing((v) => !v)}
        />

        {/* AI Settings Section - New! */}
        {settings.isConnected && saveAIConfig && (
          <AISettings
            settings={aiSettings}
            isLoading={!!aiSettingsLoading}
            onSave={saveAIConfig}
            onRemoveKey={removeAIKey}
            isSaving={!!isSavingAI}
          />
        )}

        {/* Meta App (opcional) — debug_token e diagnóstico avançado */}
        {settings.isConnected && (
          <MetaAppPanel
            metaApp={metaApp}
            metaAppLoading={metaAppLoading}
            refreshMetaApp={refreshMetaApp}
          />
        )}

        {/* Form - Only visible if disconnected OR editing */}
        {(!settings.isConnected || isEditing) && (
          <div ref={credentialsFormRef} className="glass-panel rounded-2xl p-8 animate-in slide-in-from-top-4 duration-300 scroll-mt-24">
            <h3 className="text-lg font-semibold text-white mb-8 flex items-center gap-2">
              <span className="w-1 h-6 bg-primary-500 rounded-full"></span>
              Configuração da API
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ID do Número de Telefone <span className="text-primary-500">*</span>
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    value={settings.phoneNumberId}
                    onChange={(e) => setSettings({ ...settings, phoneNumberId: e.target.value })}
                    placeholder="ex: 298347293847"
                    className="w-full px-4 py-3 bg-zinc-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 outline-none font-mono text-sm text-white transition-all group-hover:border-white/20"
                  />
                  <div className="absolute right-4 top-3.5 text-gray-600 cursor-help hover:text-white transition-colors" title="Encontrado no Meta Business Manager">
                    <HelpCircle size={16} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ID da Conta Comercial (Business ID) <span className="text-primary-500">*</span>
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    value={settings.businessAccountId}
                    onChange={(e) => setSettings({ ...settings, businessAccountId: e.target.value })}
                    placeholder="ex: 987234987234"
                    className="w-full px-4 py-3 bg-zinc-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 outline-none font-mono text-sm text-white transition-all group-hover:border-white/20"
                  />
                  <div className="absolute right-4 top-3.5 text-gray-600 cursor-help hover:text-white transition-colors" title="Encontrado no Meta Business Manager">
                    <HelpCircle size={16} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Token de Acesso do Usuário do Sistema <span className="text-primary-500">*</span>
                </label>
                <div className="relative group">
                  <input
                    type="password"
                    value={settings.accessToken}
                    onChange={(e) => setSettings({ ...settings, accessToken: e.target.value })}
                    placeholder="EAAG........"
                    className="w-full px-4 py-3 bg-zinc-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 outline-none font-mono text-sm text-white transition-all group-hover:border-white/20 tracking-widest"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 font-mono">Armazenamento criptografado SHA-256.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Meta App ID <span className="text-gray-500">(opcional)</span>
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    value={metaAppIdQuick}
                    onChange={(e) => setMetaAppIdQuick(e.target.value)}
                    placeholder="ex: 123456789012345"
                    className="w-full px-4 py-3 bg-zinc-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 outline-none font-mono text-sm text-white transition-all group-hover:border-white/20"
                  />
                  <div
                    className="absolute right-4 top-3.5 text-gray-600 cursor-help hover:text-white transition-colors"
                    title="Necessário para upload de mídia no header do Template Builder (Resumable Upload API)."
                  >
                    <HelpCircle size={16} />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Usado apenas para gerar <span className="font-mono">header_handle</span> (upload de imagem/vídeo/documento/GIF) no Template Builder.
                </p>
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-white/5 flex justify-end gap-4">
              <button
                className="h-10 px-6 rounded-xl border border-white/10 text-gray-300 font-medium hover:bg-white/5 transition-colors flex items-center gap-2"
                onClick={() => onTestConnection?.()}
                disabled={!!isTestingConnection}
              >
                {isTestingConnection ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <RefreshCw size={18} />
                )}
                {isTestingConnection ? 'Testando…' : 'Testar Conexão'}
              </button>
              <button
                className="h-10 px-8 rounded-xl bg-white text-black font-bold hover:bg-gray-200 transition-colors flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                onClick={() => {
                  onSave();
                  setIsEditing(false);

                  // Best-effort: salva Meta App ID junto, sem bloquear o salvamento do WhatsApp.
                  const nextAppId = metaAppIdQuick.trim();
                  const currentAppId = String(metaApp?.appId || '').trim();
                  if (nextAppId && nextAppId !== currentAppId) {
                    fetch('/api/settings/meta-app', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ appId: nextAppId }),
                    })
                      .then(async (res) => {
                        const json = await res.json().catch(() => ({}));
                        if (!res.ok) throw new Error((json as any)?.error || 'Falha ao salvar Meta App ID');
                        refreshMetaApp?.();
                      })
                      .catch((e) => {
                        // Não bloqueia o fluxo principal.
                        toast.warning(e instanceof Error ? e.message : 'Falha ao salvar Meta App ID');
                      });
                  }
                }}
                disabled={isSaving}
              >
                <Save size={18} /> {isSaving ? 'Salvando...' : 'Salvar Config'}
              </button>
            </div>
          </div>
        )}

        {/* Workflow Builder Default moved to /workflows */}

        {/* Calendar Booking Section */}
        {settings.isConnected && (
          <div className="glass-panel rounded-2xl p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  <span className="w-1 h-6 bg-emerald-500 rounded-full"></span>
                  <Calendar size={18} className="text-emerald-300" />
                  Agendamento (Google Calendar)
                </h3>
                <p className="text-sm text-gray-400">
                  Define as regras padrao para gerar slots e validar reservas no Google Calendar.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsEditingCalendarBooking((v) => !v)}
                className="h-10 px-4 rounded-lg bg-white/5 text-white hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-sm font-medium inline-flex items-center gap-2 whitespace-nowrap"
              >
                <Edit2 size={14} /> {isEditingCalendarBooking ? 'Cancelar' : 'Editar regras'}
              </button>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-zinc-900/60 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-white">Google Calendar</div>
                  <div className="mt-1 text-xs text-gray-400">
                    {calendarAuthLoading
                      ? 'Verificando...'
                      : calendarAuthStatus?.connected
                        ? 'Conectado'
                        : 'Desconectado'}
                  </div>
                  {calendarAuthStatus?.calendar?.calendarSummary && (
                    <div className="mt-2 text-xs text-gray-400">
                      Calendario: {calendarAuthStatus.calendar.calendarSummary}
                    </div>
                  )}
                  {calendarAuthStatus?.connected && (
                    <div className="mt-2 text-xs text-gray-400">
                      Conta: {calendarAuthStatus?.calendar?.accountEmail || 'nao disponivel'}
                    </div>
                  )}
                  {calendarTestResult?.ok && calendarTestResult?.link && (
                    <a
                      href={calendarTestResult.link}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-200 hover:text-emerald-100"
                    >
                      <ExternalLink size={12} />
                      Evento de teste criado
                    </a>
                  )}
                  {calendarTestResult?.ok === false && (
                    <div className="mt-2 text-xs text-red-400">
                      Falha ao criar evento de teste.
                    </div>
                  )}
                  {!calendarAuthStatus?.connected && (
                    <div className="mt-2 text-xs text-gray-500">
                      Conecte uma vez para liberar o agendamento no WhatsApp.
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrimaryCalendarAction}
                    className="h-9 px-4 rounded-lg bg-emerald-500/90 text-white text-xs font-medium hover:bg-emerald-500 transition-colors"
                  >
                    {calendarAuthStatus?.connected ? 'Gerenciar conexao' : 'Conectar Google Calendar'}
                  </button>
                  {calendarAuthStatus?.connected && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setCalendarWizardStep(3);
                          setCalendarWizardError(null);
                          setIsCalendarWizardOpen(true);
                        }}
                        className="h-9 px-3 rounded-lg border border-white/10 bg-white/5 text-xs text-white hover:bg-white/10 transition-colors"
                      >
                        Trocar calendario
                      </button>
                      <button
                        type="button"
                        onClick={handleCalendarTestEvent}
                        disabled={calendarTestLoading}
                        className="h-9 px-3 rounded-lg border border-white/10 bg-white/5 text-xs text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                      >
                        {calendarTestLoading ? 'Testando...' : 'Testar evento'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {isCalendarWizardOpen && (
              <div className="fixed inset-0 z-50 bg-zinc-950 text-white">
                <div className="flex h-full flex-col lg:flex-row">
                  <aside className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-white/10 bg-zinc-950/80 p-6">
                    <div className="text-xs text-gray-400">Progresso</div>
                    <div className="mt-4 space-y-2">
                      {[{ id: 0, label: 'Checklist 60s' }, { id: 1, label: 'Credenciais' }, { id: 2, label: 'Conectar' }, { id: 3, label: 'Calendario' }].map((step) => {
                        const isActive = calendarWizardStep === step.id;
                        const isUnlocked = step.id === 0
                          || step.id === 1
                          || (step.id === 2 && calendarCredsStatus?.isConfigured)
                          || (step.id === 3 && calendarAuthStatus?.connected);
                        return (
                          <button
                            key={step.id}
                            type="button"
                            onClick={() => handleCalendarWizardStepClick(step.id)}
                            disabled={!isUnlocked}
                            className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-xs transition-colors ${
                              isActive
                                ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-100'
                                : isUnlocked
                                  ? 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                                  : 'border-white/5 bg-white/5 text-gray-600 cursor-not-allowed'
                            }`}
                          >
                            <span>{step.id}. {step.label}</span>
                            {isActive ? <Check size={14} className="text-emerald-300" /> : null}
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-gray-300">
                      <div className="text-xs font-semibold text-white">Ajuda rapida</div>
                      <div className="mt-2 space-y-2">
                        <a
                          href="https://developers.google.com/calendar/api/quickstart/js"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-200 hover:text-emerald-100"
                        >
                          <ExternalLink size={12} />
                          Guia oficial
                        </a>
                        <a
                          href="https://www.youtube.com/results?search_query=google+calendar+oauth+setup"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-200 hover:text-emerald-100"
                        >
                          <ExternalLink size={12} />
                          Video rapido (2 min)
                        </a>
                      </div>
                    </div>

                    <div className="mt-4 text-[11px] text-gray-500">
                      Seu progresso fica salvo automaticamente.
                    </div>
                  </aside>

                  <main className="flex-1 overflow-y-auto p-6 lg:p-10">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="text-xl font-semibold text-white">Conectar Google Calendar</div>
                        <div className="mt-1 text-sm text-gray-400">
                          Voce so faz isso uma vez. Depois o agendamento roda sozinho.
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsCalendarWizardOpen(false)}
                          className="h-9 px-4 rounded-lg border border-white/10 bg-white/5 text-xs text-white hover:bg-white/10 transition-colors"
                        >
                          Salvar e sair
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsCalendarWizardOpen(false)}
                          className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-6 max-w-3xl space-y-5">
                      {(calendarWizardError || (calendarWizardStep === 1 && calendarCredsError) || (calendarWizardStep === 2 && calendarAuthError) || (calendarWizardStep === 3 && calendarListError)) && (
                        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-100">
                          {calendarWizardError || (calendarWizardStep === 1 && calendarCredsError) || (calendarWizardStep === 2 && calendarAuthError) || (calendarWizardStep === 3 && calendarListError)}
                        </div>
                      )}

                      {calendarWizardStep === 0 && (
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                          <div className="text-sm font-semibold text-white">Checklist de 60s</div>
                          <div className="mt-1 text-xs text-gray-400">
                            Em 3 passos voce libera o Google Calendar.
                          </div>
                          <div className="mt-4 grid gap-3 md:grid-cols-3">
                            {[
                              { title: 'Ative a API', desc: 'Habilite Google Calendar API.' },
                              { title: 'Crie OAuth', desc: 'Cliente web com redirect.' },
                              { title: 'Cole as URLs', desc: 'Redirect + Webhook.' },
                            ].map((item) => (
                              <div key={item.title} className="rounded-xl border border-white/10 bg-black/30 p-3">
                                <div className="text-xs font-semibold text-white">{item.title}</div>
                                <div className="mt-1 text-[11px] text-gray-400">{item.desc}</div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-4">
                            <a
                              href="https://console.cloud.google.com/apis/credentials"
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-500/90 px-4 text-xs font-semibold text-white hover:bg-emerald-500"
                            >
                              <ExternalLink size={14} />
                              Abrir Console
                            </a>
                          </div>
                        </div>
                      )}

                      {calendarWizardStep === 1 && (
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-white">1) Credenciais</div>
                              <div className="text-xs text-gray-400">Cole o Client ID e o Client Secret.</div>
                              {calendarCredsStatus && (
                                <div className="mt-1 text-[11px] text-gray-500">Fonte: {calendarCredsSourceLabel}</div>
                              )}
                            </div>
                            {calendarCredsStatus?.isConfigured && (
                              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] text-emerald-200">Pronto</span>
                            )}
                          </div>

                          {calendarCredsLoading ? (
                            <div className="mt-3 text-xs text-gray-400">Carregando credenciais...</div>
                          ) : (
                            <>
                              {!calendarCredsStatus?.isConfigured && (
                                <div className="mt-3 text-xs text-gray-500">
                                  Ainda nao configurado.
                                </div>
                              )}
                              {calendarCredsStatus?.source === 'env' && (
                                <div className="mt-2 text-[11px] text-amber-200">
                                  Credenciais vindas do servidor. Salvar aqui sobrescreve no banco.
                                </div>
                              )}

                              <div className="mt-3 rounded-lg border border-white/10 bg-black/40 px-3 py-3">
                                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-400">
                                  <span>URL detectada do app</span>
                                  <button
                                    type="button"
                                    onClick={() => setCalendarBaseUrlEditing((prev) => !prev)}
                                    className="text-emerald-200 hover:text-emerald-100"
                                  >
                                    {calendarBaseUrlEditing ? 'OK' : 'Editar'}
                                  </button>
                                </div>
                                {calendarBaseUrlEditing ? (
                                  <input
                                    type="text"
                                    value={calendarBaseUrlDraft}
                                    onChange={(e) => setCalendarBaseUrlDraft(e.target.value)}
                                    className="mt-2 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-xs text-white font-mono"
                                    placeholder="https://app.seudominio.com"
                                  />
                                ) : (
                                  <div className="mt-2 text-xs text-white font-mono break-all">{calendarBaseUrl || 'https://seu-dominio.com'}</div>
                                )}
                              </div>

                              <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-gray-400">
                                <a
                                  href="https://console.cloud.google.com/apis/credentials"
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-emerald-200 hover:text-emerald-100"
                                >
                                  <ExternalLink size={12} />
                                  Google Cloud Console
                                </a>
                                <span className="text-gray-600">•</span>
                                <a
                                  href="https://console.cloud.google.com/apis/library/calendar-json.googleapis.com"
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-emerald-200 hover:text-emerald-100"
                                >
                                  <ExternalLink size={12} />
                                  Ativar Calendar API
                                </a>
                              </div>

                              <div className="mt-3 rounded-lg border border-white/10 bg-black/40 px-3 py-3 text-[11px] text-gray-400">
                                <div className="text-[11px] font-semibold text-gray-300">Checklist rapido</div>
                                <div className="mt-2 space-y-1">
                                  <div>1. Ative a Google Calendar API.</div>
                                  <div>2. Crie credenciais OAuth (aplicacao web).</div>
                                  <div>3. Cole o Redirect URI e o Webhook URL.</div>
                                </div>
                              </div>

                              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="rounded-lg border border-white/10 bg-black/40 px-3 py-2">
                                  <div className="text-[11px] text-gray-400">Client ID</div>
                                  <input
                                    type="text"
                                    value={calendarClientIdDraft}
                                    onChange={(e) => setCalendarClientIdDraft(e.target.value)}
                                    className="mt-1 w-full bg-transparent text-sm text-white font-mono outline-none"
                                    placeholder="ex: 1234.apps.googleusercontent.com"
                                  />
                                  {!calendarClientIdValid && (
                                    <div className="mt-1 text-[11px] text-amber-200">Use um Client ID valido.</div>
                                  )}
                                </div>
                                <div className="rounded-lg border border-white/10 bg-black/40 px-3 py-2">
                                  <div className="text-[11px] text-gray-400">Client Secret</div>
                                  <input
                                    type="password"
                                    value={calendarClientSecretDraft}
                                    onChange={(e) => setCalendarClientSecretDraft(e.target.value)}
                                    className="mt-1 w-full bg-transparent text-sm text-white font-mono outline-none"
                                    placeholder="cole seu secret"
                                  />
                                  {!calendarClientSecretValid && (
                                    <div className="mt-1 text-[11px] text-amber-200">Secret parece curto demais.</div>
                                  )}
                                </div>
                              </div>

                              <div className="mt-4 rounded-lg border border-white/10 bg-zinc-950/40 px-3 py-3">
                                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-400">
                                  <span>Copie e cole no Google Cloud</span>
                                  <button
                                    type="button"
                                    onClick={handleCopyCalendarBundle}
                                    className="text-emerald-200 hover:text-emerald-100"
                                  >
                                    Copiar tudo
                                  </button>
                                </div>
                                <div className="mt-2 text-[11px] text-gray-400">Redirect URI</div>
                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                  <div className="text-xs text-white font-mono break-all">{calendarRedirectUrl}</div>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyCalendarValue(calendarRedirectUrl, 'Redirect URI')}
                                    className="h-7 px-2 rounded-md border border-white/10 bg-white/5 text-[11px] text-white hover:bg-white/10 transition-colors"
                                  >
                                    Copiar
                                  </button>
                                </div>
                                <div className="mt-3 text-[11px] text-gray-400">Webhook URL</div>
                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                  <div className="text-xs text-white font-mono break-all">{calendarWebhookUrl}</div>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyCalendarValue(calendarWebhookUrl, 'Webhook URL')}
                                    className="h-7 px-2 rounded-md border border-white/10 bg-white/5 text-[11px] text-white hover:bg-white/10 transition-colors"
                                  >
                                    Copiar
                                  </button>
                                </div>
                              </div>

                              <div className="mt-4 flex justify-end gap-2">
                                {calendarCredsStatus?.source === 'db' && calendarCredsStatus?.isConfigured && (
                                  <button
                                    type="button"
                                    onClick={handleRemoveCalendarCreds}
                                    disabled={calendarCredsSaving}
                                    className="h-9 px-4 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-200 hover:bg-red-500/20 transition-colors"
                                  >
                                    Remover
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={handleSaveCalendarCreds}
                                  disabled={calendarCredsSaving || !calendarCredsFormValid}
                                  className="h-9 px-4 rounded-lg bg-emerald-500/90 text-white text-xs font-medium hover:bg-emerald-500 transition-colors disabled:opacity-50"
                                >
                                  {calendarCredsSaving ? 'Salvando...' : 'Salvar credenciais'}
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {calendarWizardStep === 2 && (
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-white">2) Conectar</div>
                              <div className="text-xs text-gray-400">Abra o Google e autorize o acesso.</div>
                              {calendarAuthStatus?.connected && (
                                <div className="mt-2 text-xs text-gray-300">
                                  Conta conectada:{' '}
                                  <span className="font-mono text-white">
                                    {calendarAuthStatus?.calendar?.accountEmail || 'nao disponivel'}
                                  </span>
                                </div>
                              )}
                            </div>
                            {calendarAuthStatus?.connected && (
                              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] text-emerald-200">Conectado</span>
                            )}
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={handleConnectCalendar}
                              disabled={!calendarCredsStatus?.isConfigured}
                              className="h-9 px-4 rounded-lg bg-white text-black text-xs font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
                            >
                              {calendarConnectLoading && <Loader2 className="mr-2 size-3 animate-spin" />}
                              {calendarConnectLoading ? 'Abrindo Google...' : calendarAuthStatus?.connected ? 'Reautorizar no Google' : 'Autorizar no Google'}
                            </button>
                            <button
                              type="button"
                              onClick={fetchCalendarAuthStatus}
                              className="h-9 px-3 rounded-lg border border-white/10 bg-white/5 text-xs text-white hover:bg-white/10 transition-colors"
                            >
                              Verificar status
                            </button>
                            {calendarAuthStatus?.connected && (
                              <button
                                type="button"
                                onClick={handleDisconnectCalendar}
                                className="h-9 px-3 rounded-lg border border-white/10 bg-white/5 text-xs text-white hover:bg-white/10 transition-colors"
                              >
                                Desconectar
                              </button>
                            )}
                            {!calendarCredsStatus?.isConfigured && (
                              <span className="text-[11px] text-gray-500">Adicione as credenciais primeiro.</span>
                            )}
                          </div>

                          {!calendarAuthStatus?.connected && (
                            <div className="mt-4 rounded-lg border border-white/10 bg-black/30 p-3 text-[11px] text-gray-400">
                              <div className="text-[11px] font-semibold text-gray-300">Causas comuns</div>
                              <div className="mt-2 space-y-1">
                                <div>1. Redirect URI diferente do cadastrado.</div>
                                <div>2. API nao habilitada no projeto.</div>
                                <div>3. Client ID/Secret incorretos.</div>
                              </div>
                            </div>
                          )}
                          <div className="text-[11px] text-gray-500">
                            Ao concluir, criamos um evento de teste de 30 minutos.
                          </div>
                        </div>
                      )}

                      {calendarWizardStep === 3 && (
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-white">3) Escolha o calendario</div>
                              <div className="text-xs text-gray-400">Usamos este calendario para disponibilidade e eventos.</div>
                              {selectedCalendarTimeZone && (
                                <div className="mt-2 text-xs text-gray-300">
                                  Fuso horario: <span className="font-mono text-white">{selectedCalendarTimeZone}</span>
                                </div>
                              )}
                            </div>
                            {calendarAuthStatus?.connected && calendarAuthStatus?.calendar?.calendarSummary && (
                              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] text-emerald-200">
                                {calendarAuthStatus.calendar.calendarSummary}
                              </span>
                            )}
                          </div>

                          {!calendarAuthStatus?.connected ? (
                            <div className="mt-3 text-xs text-gray-500">Conecte o Google Calendar para escolher.</div>
                          ) : (
                            <div className="mt-3 space-y-3">
                              {calendarListLoading ? (
                                <div className="text-xs text-gray-400">Carregando calendarios...</div>
                              ) : calendarListError ? (
                                <div className="text-xs text-red-400">{calendarListError}</div>
                              ) : (
                                <>
                                  {calendarList.length === 0 ? (
                                    <div className="flex flex-wrap items-center gap-2">
                                      <div className="text-xs text-gray-500">Nenhum calendario encontrado.</div>
                                      <a
                                        href="https://calendar.google.com/calendar/u/0/r/settings/createcalendar"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs text-emerald-200 hover:text-emerald-100"
                                      >
                                        Criar novo calendario
                                      </a>
                                      <button
                                        type="button"
                                        onClick={fetchCalendarList}
                                        className="h-9 px-3 rounded-lg border border-white/10 bg-white/5 text-xs text-white hover:bg-white/10 transition-colors"
                                      >
                                        Atualizar lista
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="space-y-3">
                                      <input
                                        type="text"
                                        value={calendarListQuery}
                                        onChange={(e) => setCalendarListQuery(e.target.value)}
                                        placeholder="Buscar calendario..."
                                        className="h-9 w-full rounded-lg border border-white/10 bg-zinc-900/60 px-3 text-xs text-white"
                                      />
                                      {filteredCalendarList.length === 0 ? (
                                        <div className="text-xs text-gray-500">Nenhum calendario com esse filtro.</div>
                                      ) : (
                                        <div className="flex flex-wrap items-center gap-2">
                                          <select
                                            value={calendarSelectionId}
                                            onChange={(e) => setCalendarSelectionId(e.target.value)}
                                            className="h-9 rounded-lg border border-white/10 bg-zinc-900/60 px-3 text-xs text-white"
                                          >
                                            {filteredCalendarList.map((item) => (
                                              <option key={item.id} value={item.id}>
                                                {item.summary || item.id}
                                                {item.primary ? ' (principal)' : ''}
                                              </option>
                                            ))}
                                          </select>
                                          <button
                                            type="button"
                                            onClick={fetchCalendarList}
                                            className="h-9 px-3 rounded-lg border border-white/10 bg-white/5 text-xs text-white hover:bg-white/10 transition-colors"
                                          >
                                            Atualizar lista
                                          </button>
                                          <button
                                            type="button"
                                            onClick={handleSaveCalendarSelection}
                                            disabled={!calendarSelectionId || calendarSelectionSaving}
                                            className="h-9 px-4 rounded-lg bg-emerald-500/90 text-white text-xs font-medium hover:bg-emerald-500 transition-colors disabled:opacity-50"
                                          >
                                            {calendarSelectionSaving ? 'Salvando...' : 'Salvar calendario'}
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={handleCalendarWizardBack}
                          className="h-9 px-4 rounded-lg border border-white/10 bg-white/5 text-xs text-white hover:bg-white/10 transition-colors"
                        >
                          Voltar
                        </button>
                        <button
                          type="button"
                          onClick={handleCalendarWizardNext}
                          disabled={!calendarWizardCanContinue || calendarTestLoading}
                          className="h-9 px-4 rounded-lg bg-emerald-500/90 text-white text-xs font-medium hover:bg-emerald-500 transition-colors disabled:opacity-40"
                        >
                          {calendarWizardStep === 3
                            ? (calendarTestLoading ? 'Testando...' : 'Concluir e testar')
                            : 'Continuar'}
                        </button>
                      </div>
                    </div>
                  </main>
                </div>
              </div>
            )}

            {calendarBookingLoading ? (
              <div className="mt-6 text-sm text-gray-400">Carregando configuracoes...</div>
            ) : (
              <>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-4">
                    <div className="text-xs text-gray-400">Fuso horario</div>
                    {isEditingCalendarBooking ? (
                      <input
                        type="text"
                        value={calendarDraft.timezone}
                        onChange={(e) => updateCalendarDraft({ timezone: e.target.value })}
                        className="mt-2 w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-white font-mono"
                        placeholder="America/Sao_Paulo"
                      />
                    ) : (
                      <div className="mt-2 text-sm text-white font-mono">{calendarDraft.timezone}</div>
                    )}
                  </div>

                  <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-4">
                    <div className="text-xs text-gray-400">Duracao (min)</div>
                    {isEditingCalendarBooking ? (
                      <input
                        type="number"
                        min={5}
                        max={240}
                        value={calendarDraft.slotDurationMinutes}
                        onChange={(e) => updateCalendarDraft({ slotDurationMinutes: Number(e.target.value) })}
                        className="mt-2 w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-white font-mono"
                      />
                    ) : (
                      <div className="mt-2 text-sm text-white font-mono">{calendarDraft.slotDurationMinutes} min</div>
                    )}
                  </div>

                  <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-4">
                    <div className="text-xs text-gray-400">Buffer (min)</div>
                    {isEditingCalendarBooking ? (
                      <input
                        type="number"
                        min={0}
                        max={120}
                        value={calendarDraft.slotBufferMinutes}
                        onChange={(e) => updateCalendarDraft({ slotBufferMinutes: Number(e.target.value) })}
                        className="mt-2 w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-white font-mono"
                      />
                    ) : (
                      <div className="mt-2 text-sm text-white font-mono">{calendarDraft.slotBufferMinutes} min</div>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <div className="text-xs text-gray-400 mb-3">Horario de funcionamento</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {calendarDraft.workingHours.map((day) => (
                      <div key={day.day} className="flex items-center gap-3 rounded-xl border border-white/10 bg-zinc-900/40 px-4 py-3">
                        <label className="flex items-center gap-2 text-sm text-gray-300">
                          <input
                            type="checkbox"
                            checked={day.enabled}
                            onChange={(e) => updateWorkingHours(day.day, { enabled: e.target.checked })}
                            disabled={!isEditingCalendarBooking}
                            className="accent-emerald-500"
                          />
                          <span className="w-10">{CALENDAR_WEEK_LABELS[day.day] || day.day}</span>
                        </label>
                        <div className="flex items-center gap-2 ml-auto">
                          <input
                            type="time"
                            value={day.start}
                            disabled={!isEditingCalendarBooking || !day.enabled}
                            onChange={(e) => updateWorkingHours(day.day, { start: e.target.value })}
                            className="px-2 py-1 bg-zinc-900/60 border border-white/10 rounded text-xs text-white font-mono"
                          />
                          <span className="text-gray-500 text-xs">ate</span>
                          <input
                            type="time"
                            value={day.end}
                            disabled={!isEditingCalendarBooking || !day.enabled}
                            onChange={(e) => updateWorkingHours(day.day, { end: e.target.value })}
                            className="px-2 py-1 bg-zinc-900/60 border border-white/10 rounded text-xs text-white font-mono"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-xs text-gray-500">
                    Fonte: {calendarBooking?.source || 'default'}
                  </div>
                </div>

                {isEditingCalendarBooking && (
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setCalendarDraft(calendarConfig);
                        setIsEditingCalendarBooking(false);
                      }}
                      className="h-10 px-4 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveCalendarBooking}
                      disabled={!!isSavingCalendarBooking}
                      className="h-10 px-6 rounded-lg bg-emerald-500/90 text-white hover:bg-emerald-500 transition-colors text-sm font-medium inline-flex items-center gap-2"
                    >
                      {isSavingCalendarBooking ? 'Salvando...' : 'Salvar regras'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Test Contact Section */}
        {settings.isConnected && (
          <TestContactPanel
            testContact={testContact}
            saveTestContact={saveTestContact}
            removeTestContact={removeTestContact}
            isSaving={isSavingTestContact}
          />
        )}

        {/* WhatsApp Turbo (Adaptive Throttle) */}
        {settings.isConnected && saveWhatsAppThrottle && (
          <TurboConfigSection
            whatsappThrottle={whatsappThrottle}
            whatsappThrottleLoading={whatsappThrottleLoading}
            saveWhatsAppThrottle={saveWhatsAppThrottle}
            isSaving={isSavingWhatsAppThrottle}
            settings={settings}
          />
        )}

        {/* Proteção de Qualidade (Auto-supressão) */}
        {settings.isConnected && saveAutoSuppression && (
          <AutoSuppressionPanel
            autoSuppression={autoSuppression}
            autoSuppressionLoading={autoSuppressionLoading}
            saveAutoSuppression={saveAutoSuppression}
            isSaving={isSavingAutoSuppression}
          />
        )}

        {/* Execução do workflow (global) */}
        {settings.isConnected && saveWorkflowExecution && (
          <WorkflowExecutionPanel
            workflowExecution={workflowExecution}
            workflowExecutionLoading={workflowExecutionLoading}
            saveWorkflowExecution={saveWorkflowExecution}
            isSaving={isSavingWorkflowExecution}
          />
        )}


        {/* Webhook Configuration Section */}
        {settings.isConnected && webhookUrl && (
          <WebhookConfigSection
            webhookUrl={webhookUrl}
            webhookToken={webhookToken}
            webhookStats={webhookStats}
            webhookPath={webhookPath}
            webhookSubscription={webhookSubscription}
            webhookSubscriptionLoading={webhookSubscriptionLoading}
            webhookSubscriptionMutating={webhookSubscriptionMutating}
            onRefreshWebhookSubscription={onRefreshWebhookSubscription}
            onSubscribeWebhookMessages={onSubscribeWebhookMessages}
            onUnsubscribeWebhookMessages={onUnsubscribeWebhookMessages}
            phoneNumbers={phoneNumbers}
            phoneNumbersLoading={phoneNumbersLoading}
            onRefreshPhoneNumbers={onRefreshPhoneNumbers}
            onSetWebhookOverride={onSetWebhookOverride}
            onRemoveWebhookOverride={onRemoveWebhookOverride}
            availableDomains={availableDomains}
          />
        )}
      </div>
    </div>
  );
};
