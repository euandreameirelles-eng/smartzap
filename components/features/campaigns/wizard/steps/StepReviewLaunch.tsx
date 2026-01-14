'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  RefreshCw,
  ShieldAlert,
  Users,
  Wand2,
  Zap,
} from 'lucide-react';
import { Template, TestContact, CustomFieldDefinition } from '@/types';
import { ContactQuickEditModal } from '@/components/features/contacts/ContactQuickEditModal';
import { humanizePrecheckReason, humanizeVarSource, ContactFixFocus } from '@/lib/precheck-humanizer';
import type { MissingParamDetail } from '@/lib/whatsapp/template-contract';
import { QuickEditFocus } from '@/hooks/campaigns/useCampaignWizardUI';

// Inline CheckCircleFilled component (same as parent)
const CheckCircleFilled = ({ size }: { size: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-1.25 17.292l-4.5-4.364 1.857-1.858 2.643 2.506 5.643-5.784 1.857 1.857-7.5 7.643z" />
  </svg>
);

// Types for pricing breakdown (can be full or fallback)
interface PricingBreakdown {
  totalBRLFormatted: string;
  pricePerMessageBRLFormatted: string;
  // Optional fields (only present when template and rate available)
  category?: string;
  recipients?: number;
  pricePerMessageUSD?: number;
  pricePerMessageBRL?: number;
  totalUSD?: number;
  totalBRL?: number;
}

// Types for precheck result
interface PrecheckResultItem {
  ok: boolean;
  contactId?: string;
  name: string;
  phone: string;
  normalizedPhone?: string;
  skipCode?: string;
  reason?: string;
  missing?: MissingParamDetail[];
}

interface PrecheckResult {
  templateName: string;
  totals: { total: number; valid: number; skipped: number };
  results: PrecheckResultItem[];
}

// Types for missing summary
interface MissingSummaryItem {
  where: MissingParamDetail['where'];
  key: string;
  buttonIndex?: number;
  count: number;
  rawSamples: Set<string>;
}

// Types for batch fix
interface BatchFixCandidate {
  contactId: string;
  focus: QuickEditFocus;
}

// Types for fixed value dialog slot
interface FixedValueDialogSlot {
  where: 'header' | 'body' | 'button';
  key: string;
  buttonIndex?: number;
}

export interface StepReviewLaunchProps {
  // Pricing
  pricing: PricingBreakdown;

  // Recipient data
  recipientCount: number;
  recipientSource: 'all' | 'specific' | 'test' | null;

  // Template
  selectedTemplate?: Template;
  selectedTemplateId: string;

  // Campaign
  name: string;

  // Test contact
  testContact?: TestContact;
  isEnsuringTestContact?: boolean;

  // Navigation
  setStep: (step: number) => void;

  // Scheduling
  scheduleMode: 'now' | 'scheduled';
  scheduledDate: string;
  scheduledTime: string;
  setScheduleMode: (mode: 'now' | 'scheduled') => void;
  setScheduledDate: (date: string) => void;
  setScheduledTime: (time: string) => void;

  // Limits
  isOverLimit?: boolean;
  currentLimit: number;

  // Precheck
  precheckResult?: PrecheckResult | null;
  isPrechecking?: boolean;
  handlePrecheck: () => void | Promise<unknown>;

  // Derived data from precheck
  missingSummary: MissingSummaryItem[];
  customFieldLabelByKey: Record<string, string>;
  batchFixCandidates: BatchFixCandidate[];

  // Batch fix actions
  startBatchFix: () => void;

  // Quick edit modal
  quickEditContactId: string | null;
  setQuickEditContactId: (id: string | null) => void;
  setQuickEditFocusSafe: (focus: QuickEditFocus) => void;
  quickEditFocus: QuickEditFocus;

  // Batch fix queue
  batchFixQueue: BatchFixCandidate[];
  batchFixIndex: number;
  setBatchFixQueue: (queue: BatchFixCandidate[]) => void;
  setBatchFixIndex: (index: number | ((prev: number) => number)) => void;
  batchNextRef: React.MutableRefObject<BatchFixCandidate | null>;
  batchCloseReasonRef: React.MutableRefObject<'advance' | 'finish' | null>;

  // Template variables (for applyQuickFill)
  templateVariables: { header: string[]; body: string[]; buttons?: Record<string, string> };
  setTemplateVariables: (vars: { header: string[]; body: string[]; buttons?: Record<string, string> }) => void;
  templateVariableInfo?: {
    body: { index: number; key: string; placeholder: string; context: string }[];
    header: { index: number; key: string; placeholder: string; context: string }[];
    buttons: { index: number; key: string; buttonIndex: number; buttonText: string; context: string }[];
    totalExtra: number;
  };

  // Custom fields
  customFields: CustomFieldDefinition[];

  // Fixed value dialog
  fixedValueDialogOpen: boolean;
  fixedValueDialogSlot: FixedValueDialogSlot | null;
  fixedValueDialogTitle: string;
  fixedValueDialogValue: string;
  openFixedValueDialogWithSuggestion: (slot: FixedValueDialogSlot) => void;
  closeFixedValueDialog: () => void;
  setFixedValueDialogValue: (value: string) => void;
}

// Helper function to format variable key for humans
function formatVarKeyForHumans(key: string): string {
  const n = Number(key);
  if (Number.isFinite(n) && n > 0) return `${n}ª variável`;
  return `variável ${key}`;
}

export function StepReviewLaunch({
  pricing,
  recipientCount,
  recipientSource,
  selectedTemplate,
  selectedTemplateId,
  name,
  testContact,
  isEnsuringTestContact,
  setStep,
  scheduleMode,
  scheduledDate,
  scheduledTime,
  setScheduleMode,
  setScheduledDate,
  setScheduledTime,
  isOverLimit,
  currentLimit,
  precheckResult,
  isPrechecking,
  handlePrecheck,
  missingSummary,
  customFieldLabelByKey,
  batchFixCandidates,
  startBatchFix,
  quickEditContactId,
  setQuickEditContactId,
  setQuickEditFocusSafe,
  quickEditFocus,
  batchFixQueue,
  batchFixIndex,
  setBatchFixQueue,
  setBatchFixIndex,
  batchNextRef,
  batchCloseReasonRef,
  templateVariables,
  setTemplateVariables,
  templateVariableInfo,
  customFields,
  fixedValueDialogOpen,
  fixedValueDialogSlot,
  fixedValueDialogTitle,
  fixedValueDialogValue,
  openFixedValueDialogWithSuggestion,
  closeFixedValueDialog,
  setFixedValueDialogValue,
}: StepReviewLaunchProps) {
  // Helper: apply quick fill to template variables
  const applyQuickFill = (slot: FixedValueDialogSlot, value: string) => {
    if (slot.where === 'header') {
      const idx = (templateVariableInfo?.header || []).findIndex(v => String(v.key) === String(slot.key));
      if (idx < 0) return;
      const newHeader = [...templateVariables.header];
      newHeader[idx] = value;
      setTemplateVariables({ ...templateVariables, header: newHeader });
      return;
    }
    if (slot.where === 'body') {
      const idx = (templateVariableInfo?.body || []).findIndex(v => String(v.key) === String(slot.key));
      if (idx < 0) return;
      const newBody = [...templateVariables.body];
      newBody[idx] = value;
      setTemplateVariables({ ...templateVariables, body: newBody });
      return;
    }
    if (slot.where === 'button') {
      const btnKey = `button_${slot.buttonIndex ?? 0}_0`;
      setTemplateVariables({
        ...templateVariables,
        buttons: { ...templateVariables.buttons, [btnKey]: value },
      });
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-auto p-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-5 bg-zinc-900/50 border border-white/5 rounded-xl">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Custo Total</p>
          <p className="text-2xl font-bold text-white">{pricing.totalBRLFormatted}</p>
          {selectedTemplate && (
            <p className="text-xs text-gray-500 mt-1">
              {pricing.pricePerMessageBRLFormatted} × {recipientCount} msgs
            </p>
          )}
        </div>
        <div className="p-5 bg-zinc-900/50 border border-white/5 rounded-xl">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Destinatários</p>
          <p className="text-2xl font-bold text-white">{recipientCount}</p>
        </div>
      </div>

      <div className="border-t border-white/5 pt-6 space-y-4">
        <h3 className="text-sm font-bold text-white mb-4">Detalhes da Campanha</h3>

        <div className="flex items-center justify-between group">
          <span className="text-sm text-gray-500">Nome da Campanha</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-white">{name}</span>
            <button onClick={() => setStep(1)} className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-primary-400 transition-all"><small>Editar</small></button>
          </div>
        </div>

        <div className="flex items-center justify-between group">
          <span className="text-sm text-gray-500">Template</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white font-mono bg-zinc-900 px-2 py-1 rounded">{selectedTemplateId}</span>
            <button onClick={() => setStep(1)} className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-primary-400 transition-all"><small>Editar</small></button>
          </div>
        </div>

        <div className="flex items-center justify-between group">
          <span className="text-sm text-gray-500">Público</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-white">
              {recipientSource === 'test'
                ? `🧪 Contato de Teste (${testContact?.name})`
                : recipientSource === 'all'
                  ? 'Todos os Contatos'
                  : 'Contatos Selecionados'
              } ({recipientCount})
            </span>
            <button onClick={() => setStep(2)} className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-primary-400 transition-all"><small>Editar</small></button>
          </div>
        </div>
      </div>

      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex gap-3">
        <AlertCircle className="text-amber-500 shrink-0" size={20} />
        <div className="text-xs text-amber-200/70">
          <p className="font-bold text-amber-500 mb-1">Checagem Final</p>
          <p>Ao clicar em disparar, você confirma que todos os destinatários aceitaram receber mensagens do seu negócio.</p>
        </div>
      </div>

      {/* Pre-check (dry-run) */}
      <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldAlert size={16} className="text-primary-400" />
            <h3 className="text-sm font-bold text-white">Pré-check de destinatários</h3>
          </div>

          <div className="flex items-center gap-2">
            {recipientSource !== 'test' && batchFixCandidates.length > 0 && (
              <button
                type="button"
                onClick={startBatchFix}
                disabled={!!isPrechecking || !!quickEditContactId}
                className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors flex items-center gap-2 ${!!isPrechecking || !!quickEditContactId
                  ? 'bg-zinc-800 border-white/10 text-gray-500'
                  : 'bg-primary-600 text-white border-primary-500/40 hover:bg-primary-500'
                  }`}
                title="Corrigir contatos ignorados em sequência (sem sair da campanha)"
              >
                <Wand2 size={14} /> Corrigir em lote ({batchFixCandidates.length})
              </button>
            )}

            <button
              type="button"
              onClick={() => handlePrecheck()}
              disabled={!!isPrechecking || (!!isEnsuringTestContact && recipientSource === 'test')}
              className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors flex items-center gap-2 ${isPrechecking
                ? 'bg-zinc-800 border-white/10 text-gray-400'
                : 'bg-white text-black border-white hover:bg-gray-200'
                }`}
              title="Valida telefones + variáveis do template sem criar campanha"
            >
              {isPrechecking ? (
                <>
                  <RefreshCw size={14} className="animate-spin" /> Validando...
                </>
              ) : (
                <>
                  <CheckCircle size={14} /> Validar agora
                </>
              )}
            </button>

            {recipientSource === 'test' && isEnsuringTestContact && (
              <span className="text-[11px] text-gray-500">Preparando contato de teste...</span>
            )}
          </div>
        </div>

        {precheckResult?.totals && (
          <div className="mt-3 text-xs text-gray-400 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-emerald-400 font-bold">Válidos: {precheckResult.totals.valid}</span>
              <span className="text-amber-400 font-bold">Serão ignorados: {precheckResult.totals.skipped}</span>
              <span className="text-gray-500">Total: {precheckResult.totals.total}</span>
            </div>

            {/* Pre-check alteravel (Parte 2): acoes rapidas para resolver variaveis faltantes */}
            {missingSummary.length > 0 && (
              <div className="bg-zinc-950/30 border border-white/5 rounded-lg p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-gray-200 font-medium">Ajustes rápidos</p>
                    <p className="text-[11px] text-gray-500">
                      A checagem roda <span className="text-white">automaticamente</span>. Se algum contato estiver sendo ignorado por falta de dado, escolha o que usar em cada variável.
                    </p>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {missingSummary.slice(0, 6).map((m) => {
                    const rawSample = Array.from(m.rawSamples)[0] || '<vazio>';
                    const inferred = humanizeVarSource(rawSample, customFieldLabelByKey);
                    const whereLabel = m.where === 'button'
                      ? `Botão ${Number(m.buttonIndex ?? 0) + 1}`
                      : (m.where === 'header' ? 'Cabeçalho' : 'Corpo');
                    const primary = inferred.label.startsWith('Valor') ? `Variável ${formatVarKeyForHumans(String(m.key))}` : inferred.label;
                    const secondary = `Onde: ${whereLabel} - ${formatVarKeyForHumans(String(m.key))}`;

                    return (
                      <div key={`${m.where}:${m.buttonIndex ?? ''}:${m.key}`} className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between bg-zinc-900/40 border border-white/5 rounded-lg p-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-bold text-gray-200 truncate">Precisa de: {primary}</span>
                            <span className="text-[10px] text-amber-300">afetou {m.count}</span>
                          </div>
                          <p className="text-[10px] text-gray-500 truncate">{secondary}</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="px-3 py-1.5 rounded-md text-[11px] font-bold bg-white/10 hover:bg-white/15 border border-white/10 text-gray-200"
                                title="Preencher esta variável"
                              >
                                Preencher com...
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-white min-w-55">
                              {recipientSource !== 'test' && (
                                <>
                                  <DropdownMenuLabel className="text-xs text-gray-500 uppercase tracking-wider px-2 py-1.5">
                                    Dados do Contato
                                  </DropdownMenuLabel>
                                  <DropdownMenuItem
                                    className="text-sm cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800 px-2 py-1.5 rounded-sm flex items-center gap-2 outline-none"
                                    onClick={() => applyQuickFill({ where: m.where, key: m.key, buttonIndex: m.buttonIndex }, '{{nome}}')}
                                  >
                                    <Users size={14} className="text-indigo-400" />
                                    <span>Nome</span>
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    className="text-sm cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800 px-2 py-1.5 rounded-sm flex items-center gap-2 outline-none"
                                    onClick={() => applyQuickFill({ where: m.where, key: m.key, buttonIndex: m.buttonIndex }, '{{telefone}}')}
                                  >
                                    <div className="text-green-400 font-mono text-[10px] w-3.5 text-center">Ph</div>
                                    <span>Telefone</span>
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    className="text-sm cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800 px-2 py-1.5 rounded-sm flex items-center gap-2 outline-none"
                                    onClick={() => applyQuickFill({ where: m.where, key: m.key, buttonIndex: m.buttonIndex }, '{{email}}')}
                                  >
                                    <div className="text-blue-400 font-mono text-[10px] w-3.5 text-center">@</div>
                                    <span>Email</span>
                                  </DropdownMenuItem>

                                  <DropdownMenuSeparator className="bg-white/10 my-1" />
                                </>
                              )}

                              <DropdownMenuLabel className="text-xs text-gray-500 uppercase tracking-wider px-2 py-1.5">
                                {recipientSource === 'test' ? 'Preencher manualmente (teste)' : 'Valor fixo (teste)'}
                              </DropdownMenuLabel>
                              <DropdownMenuItem
                                className="text-sm cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800 px-2 py-1.5 rounded-sm flex items-center gap-2 outline-none"
                                onClick={() => {
                                  openFixedValueDialogWithSuggestion({ where: m.where, key: m.key, buttonIndex: m.buttonIndex });
                                }}
                              >
                                <div className="text-gray-300 font-mono text-[10px] w-3.5 text-center">T</div>
                                <span>Texto...</span>
                              </DropdownMenuItem>

                              {recipientSource !== 'test' && (
                                <>
                                  <DropdownMenuSeparator className="bg-white/10 my-1" />

                                  {customFields.length > 0 && (
                                    <>
                                      <DropdownMenuLabel className="text-xs text-gray-500 uppercase tracking-wider px-2 py-1.5 mt-2">
                                        Campos Personalizados
                                      </DropdownMenuLabel>
                                      {customFields.slice(0, 10).map(field => (
                                        <DropdownMenuItem
                                          key={field.id}
                                          className="text-sm cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800 px-2 py-1.5 rounded-sm flex items-center gap-2 outline-none"
                                          onClick={() => applyQuickFill({ where: m.where, key: m.key, buttonIndex: m.buttonIndex }, `{{${field.key}}}`)}
                                        >
                                          <div className="text-amber-400 font-mono text-[10px] w-3.5 text-center">#</div>
                                          <span>{field.label}</span>
                                        </DropdownMenuItem>
                                      ))}
                                    </>
                                  )}
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}

                  {missingSummary.length > 6 && (
                    <p className="text-[10px] text-gray-500">Mostrando 6 de {missingSummary.length} pendências.</p>
                  )}
                </div>
              </div>
            )}

            {precheckResult.totals.skipped > 0 && (
              <details className="bg-zinc-950/30 border border-white/5 rounded-lg p-3">
                <summary className="cursor-pointer text-gray-300 font-medium">
                  Ver ignorados (motivo + ação)
                </summary>

                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="text-[10px] uppercase tracking-wider text-gray-500">
                      <tr>
                        <th className="py-2 pr-3">Contato</th>
                        <th className="py-2 pr-3">Telefone</th>
                        <th className="py-2 pr-3">Motivo</th>
                        <th className="py-2 pr-3">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {precheckResult.results
                        .filter((r) => !r.ok)
                        .slice(0, 20)
                        .map((r, idx: number) => (
                          <tr key={`${r.phone}_${idx}`}>
                            <td className="py-2 pr-3 text-gray-200">{r.name}</td>
                            <td className="py-2 pr-3 font-mono text-[11px] text-gray-500">{r.normalizedPhone || r.phone}</td>
                            <td className="py-2 pr-3">
                              {(() => {
                                const h = humanizePrecheckReason(String(r.reason || r.skipCode || ''), { customFieldLabelByKey });
                                return (
                                  <div>
                                    <p className="text-amber-200/90">{h.title}</p>
                                  </div>
                                );
                              })()}
                            </td>
                            <td className="py-2 pr-3">
                              {r.contactId && recipientSource !== 'test' ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    // se o usuário abriu manualmente, encerra qualquer lote
                                    setBatchFixQueue([]);
                                    setBatchFixIndex(0);
                                    batchNextRef.current = null;
                                    batchCloseReasonRef.current = null;

                                    const h = humanizePrecheckReason(String(r.reason || r.skipCode || ''), { customFieldLabelByKey });
                                    setQuickEditContactId(r.contactId!);
                                    setQuickEditFocusSafe(h.focus as QuickEditFocus || null);
                                  }}
                                  className="text-primary-400 hover:text-primary-300 underline underline-offset-2"
                                >
                                  Corrigir contato
                                </button>
                              ) : (
                                <span className="text-gray-600">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {precheckResult.totals.skipped > 20 && (
                    <p className="mt-2 text-[10px] text-gray-500">Mostrando 20 de {precheckResult.totals.skipped} ignorados.</p>
                  )}
                </div>
              </details>
            )}
          </div>
        )}
      </div>

      <ContactQuickEditModal
        isOpen={!!quickEditContactId}
        contactId={quickEditContactId}
        onSaved={() => {
          if (!batchFixQueue.length) return;

          const next = batchFixQueue[batchFixIndex + 1];
          if (next) {
            batchNextRef.current = next;
            batchCloseReasonRef.current = 'advance';
            setBatchFixIndex((i) => i + 1);
            return;
          }

          batchNextRef.current = null;
          batchCloseReasonRef.current = 'finish';
        }}
        onClose={() => {
          const reason = batchCloseReasonRef.current;
          batchCloseReasonRef.current = null;

          if (reason === 'advance') {
            const next = batchNextRef.current;
            batchNextRef.current = null;
            if (next) {
              setQuickEditContactId(next.contactId);
              setQuickEditFocusSafe(next.focus);
              return;
            }
          }

          if (reason === 'finish') {
            // encerra lote e revalida
            setBatchFixQueue([]);
            setBatchFixIndex(0);
            setQuickEditContactId(null);
            setQuickEditFocusSafe(null);
            void Promise.resolve(handlePrecheck());
            return;
          }

          // fechamento manual/cancelamento
          setBatchFixQueue([]);
          setBatchFixIndex(0);
          batchNextRef.current = null;
          setQuickEditContactId(null);
          setQuickEditFocusSafe(null);
        }}
        focus={quickEditFocus as ContactFixFocus}
        mode={quickEditFocus ? 'focused' : 'full'}
        title={batchFixQueue.length > 0
          ? `Corrigir contato (${Math.min(batchFixIndex + 1, batchFixQueue.length)} de ${batchFixQueue.length})`
          : 'Corrigir contato'}
      />

      <Dialog
        open={fixedValueDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeFixedValueDialog();
          }
        }}
      >
        <DialogContent className="sm:max-w-md bg-zinc-950 border border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">{fixedValueDialogTitle || 'Valor fixo (teste)'}</DialogTitle>
            <DialogDescription className="text-gray-400">
              Use isso só para testes rápidos. Esse valor vai apenas nesta campanha (não altera o contato).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400">Digite o valor</label>
            <Input
              value={fixedValueDialogValue}
              onChange={(e) => setFixedValueDialogValue(e.target.value)}
              placeholder="Ex: Empresa Teste"
              className="bg-zinc-900 border-white/10 text-white placeholder:text-gray-600"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const v = fixedValueDialogValue.trim();
                  if (!v || !fixedValueDialogSlot) return;
                  applyQuickFill(fixedValueDialogSlot, v);
                  closeFixedValueDialog();
                }
              }}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => closeFixedValueDialog()}
              className="bg-zinc-800 text-white hover:bg-zinc-700"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => {
                const v = fixedValueDialogValue.trim();
                if (!v || !fixedValueDialogSlot) return;
                applyQuickFill(fixedValueDialogSlot, v);
                closeFixedValueDialog();
              }}
              className="bg-white text-black hover:bg-gray-200 font-bold"
              disabled={!fixedValueDialogValue.trim() || !fixedValueDialogSlot}
            >
              Aplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scheduling Options */}
      <div className="border-t border-white/5 pt-6 space-y-4">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Clock size={16} className="text-primary-400" />
          Quando enviar?
        </h3>

        <div className="grid grid-cols-2 gap-4">
          {/* Send Now Option */}
          <button
            type="button"
            onClick={() => setScheduleMode('now')}
            className={`relative p-4 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center gap-3 ${scheduleMode === 'now'
              ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.1)]'
              : 'bg-zinc-900/50 border-white/10 hover:bg-zinc-900 hover:border-white/20 text-gray-300'
              }`}
          >
            {scheduleMode === 'now' && (
              <div className="absolute top-2 right-2 text-black">
                <CheckCircle size={16} />
              </div>
            )}
            <div className={`p-2 rounded-lg ${scheduleMode === 'now'
              ? 'bg-gray-200 text-black'
              : 'bg-zinc-800 text-gray-400'
              }`}>
              <Zap size={18} />
            </div>
            <div className="text-center">
              <h4 className="font-bold text-sm">Enviar Agora</h4>
              <p className={`text-xs mt-1 ${scheduleMode === 'now' ? 'text-gray-600' : 'text-gray-500'}`}>
                Disparo imediato
              </p>
            </div>
          </button>

          {/* Schedule Option */}
          <button
            type="button"
            onClick={() => setScheduleMode('scheduled')}
            className={`relative p-4 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center gap-3 ${scheduleMode === 'scheduled'
              ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.1)]'
              : 'bg-zinc-900/50 border-white/10 hover:bg-zinc-900 hover:border-white/20 text-gray-300'
              }`}
          >
            {scheduleMode === 'scheduled' && (
              <div className="absolute top-2 right-2 text-black">
                <CheckCircle size={16} />
              </div>
            )}
            <div className={`p-2 rounded-lg ${scheduleMode === 'scheduled'
              ? 'bg-gray-200 text-black'
              : 'bg-zinc-800 text-gray-400'
              }`}>
              <Calendar size={18} />
            </div>
            <div className="text-center">
              <h4 className="font-bold text-sm">Agendar</h4>
              <p className={`text-xs mt-1 ${scheduleMode === 'scheduled' ? 'text-gray-600' : 'text-gray-500'}`}>
                Escolher data e hora
              </p>
            </div>
          </button>
        </div>

        {/* Date/Time Picker (shown when scheduled) */}
        {scheduleMode === 'scheduled' && (
          <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-4 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-2">Data</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toLocaleDateString('en-CA')}
                  className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg text-white text-sm focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-2">Horário</label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg text-white text-sm focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 outline-none"
                />
              </div>
            </div>
            {scheduledDate && scheduledTime && (
              <div className="mt-3 p-3 bg-primary-500/10 border border-primary-500/20 rounded-lg">
                <p className="text-xs text-primary-400 flex items-center gap-2">
                  <Calendar size={14} />
                  Campanha será enviada em{' '}
                  <span className="font-bold text-white">
                    {new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString('pt-BR', {
                      dateStyle: 'long',
                      timeStyle: 'short'
                    })}
                  </span>
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* LIMIT WARNING IN REVIEW */}
      {isOverLimit && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <ShieldAlert className="text-red-400 shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <p className="font-bold text-red-400 text-sm mb-1">⛔ Não é possível disparar</p>
            <p className="text-sm text-red-200/70">
              Você selecionou <span className="font-bold text-white">{recipientCount}</span> contatos,
              mas seu limite é <span className="font-bold text-white">{currentLimit}</span>/dia.
            </p>
            <button
              onClick={() => setStep(2)}
              className="mt-2 text-xs text-red-400 hover:text-red-300 underline"
            >
              ← Voltar e ajustar destinatários
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
