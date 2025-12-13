# Auditoria de Acessibilidade - SmartZap v2

**Data:** 2025-01-XX  
**Padrão:** WCAG 2.1 Nível AA  
**Escopo:** Componentes React, CSS Global, Navegação

---

## Resumo Executivo

| Severidade | Quantidade | Status |
|------------|-----------|--------|
| 🔴 Crítico | 5 | Pendente |
| 🟠 Alto | 8 | Pendente |
| 🟡 Médio | 6 | Pendente |
| 🟢 Baixo | 4 | Pendente |
| **Total** | **23** | — |

---

## Problemas Identificados

### 🔴 CRÍTICOS (Impedem uso por usuários com deficiência)

---

#### A11Y-01: Modais sem trap de foco
**Arquivos:** `CampaignWizardView.tsx`, `ContactListView.tsx`, `TemplateListView.tsx`, `SettingsView.tsx`  
**WCAG:** 2.4.3 Focus Order (Level A)

**Problema:**  
Modais abrem sem capturar o foco, permitindo que usuários de teclado naveguem para elementos ocultos atrás do modal.

**Código Atual:**
```tsx
// CampaignWizardView.tsx - Modal sem focus trap
{isLaunchConfirmOpen && (
  <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
    <div className="bg-zinc-950 rounded-2xl max-w-md p-6">
      {/* Conteúdo sem gerenciamento de foco */}
    </div>
  </div>
)}
```

**Correção Requerida:**
```tsx
// Usar biblioteca react-focus-lock ou implementar custom
import FocusLock from 'react-focus-lock';

{isLaunchConfirmOpen && (
  <div 
    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
  >
    <FocusLock returnFocus>
      <div className="bg-zinc-950 rounded-2xl max-w-md p-6">
        <h2 id="modal-title">Confirmar Lançamento</h2>
        {/* Conteúdo */}
      </div>
    </FocusLock>
  </div>
)}
```

---

#### A11Y-02: Botões de ícone sem label acessível
**Arquivos:** Múltiplos componentes  
**WCAG:** 1.1.1 Non-text Content (Level A), 4.1.2 Name, Role, Value (Level A)

**Problema:**  
Botões contendo apenas ícones (Lucide) não possuem texto acessível para leitores de tela.

**Exemplos Afetados:**
```tsx
// DashboardView.tsx
<button onClick={onRefresh} className="...">
  <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
</button>

// ContactListView.tsx
<button onClick={() => handleDelete(contact.id)} className="...">
  <Trash2 size={16} />
</button>

// CampaignListView.tsx
<button onClick={() => navigator.clipboard.writeText(c.id)} className="...">
  <Copy size={14} />
</button>
```

**Correção Requerida:**
```tsx
<button 
  onClick={onRefresh} 
  aria-label="Atualizar dados"
  className="..."
>
  <RefreshCw size={18} aria-hidden="true" />
</button>

<button 
  onClick={() => handleDelete(contact.id)} 
  aria-label={`Excluir contato ${contact.name}`}
  className="..."
>
  <Trash2 size={16} aria-hidden="true" />
</button>
```

---

#### A11Y-03: Sem link de pular navegação (Skip Link)
**Arquivo:** `app/(dashboard)/layout.tsx`  
**WCAG:** 2.4.1 Bypass Blocks (Level A)

**Problema:**  
Não existe link para pular diretamente ao conteúdo principal, obrigando usuários de teclado a navegar por toda a sidebar.

**Correção Requerida:**
```tsx
// app/(dashboard)/layout.tsx
export default function DashboardLayout({ children }) {
  return (
    <>
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-500 focus:text-white focus:rounded-lg"
      >
        Pular para o conteúdo principal
      </a>
      <Sidebar />
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
    </>
  );
}
```

---

#### A11Y-04: Tabelas sem associação header/data
**Arquivos:** `DashboardView.tsx`, `CampaignListView.tsx`, `ContactListView.tsx`  
**WCAG:** 1.3.1 Info and Relationships (Level A)

**Problema:**  
Tabelas usam `<th>` mas sem `scope` attribute, dificultando leitores de tela a associar células com cabeçalhos.

**Código Atual:**
```tsx
// CampaignListView.tsx
<thead>
  <tr>
    <th className="...">Nome</th>
    <th className="...">Status</th>
    <th className="...">Enviados</th>
  </tr>
</thead>
```

**Correção Requerida:**
```tsx
<thead>
  <tr>
    <th scope="col" className="...">Nome</th>
    <th scope="col" className="...">Status</th>
    <th scope="col" className="...">Enviados</th>
  </tr>
</thead>
```

---

#### A11Y-05: Elemento div clicável sem semântica de botão
**Arquivo:** `CampaignWizardView.tsx:452`  
**WCAG:** 4.1.2 Name, Role, Value (Level A)

**Problema:**  
Steps do wizard usam `<div onClick>` em vez de `<button>`, tornando-os inacessíveis via teclado.

**Código Atual:**
```tsx
<div 
  key={s.number} 
  className="flex flex-col items-center cursor-pointer" 
  onClick={() => step > s.number && setStep(s.number)}
>
```

**Correção Requerida:**
```tsx
<button
  type="button"
  key={s.number}
  className="flex flex-col items-center"
  onClick={() => setStep(s.number)}
  disabled={step <= s.number}
  aria-current={step === s.number ? 'step' : undefined}
  aria-label={`Ir para ${s.label}`}
>
```

---

### 🟠 ALTO (Impactam significativamente a experiência)

---

#### A11Y-06: Inputs sem labels associados
**Arquivos:** `TemplateListView.tsx`, `ContactListView.tsx`, `SettingsView.tsx`  
**WCAG:** 1.3.1 Info and Relationships (Level A), 3.3.2 Labels or Instructions (Level A)

**Problema:**  
Campos de busca e inputs usam apenas `placeholder` sem `<label>` ou `aria-label`.

**Código Atual:**
```tsx
// TemplateListView.tsx
<input 
  type="text" 
  placeholder="Buscar templates..." 
  className="..."
/>
```

**Correção Requerida:**
```tsx
<label htmlFor="template-search" className="sr-only">Buscar templates</label>
<input 
  id="template-search"
  type="text" 
  placeholder="Buscar templates..." 
  className="..."
/>
// OU
<input 
  type="text" 
  placeholder="Buscar templates..." 
  aria-label="Buscar templates"
  className="..."
/>
```

---

#### A11Y-07: Checkboxes customizados não acessíveis
**Arquivo:** `ContactListView.tsx`  
**WCAG:** 4.1.2 Name, Role, Value (Level A)

**Problema:**  
Checkboxes usam `<div>` estilizado sem input nativo ou atributos ARIA.

**Código Atual:**
```tsx
<div 
  className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer ${
    selectedIds.size === filteredContacts.length && filteredContacts.length > 0 
      ? 'bg-primary-500 border-primary-500' 
      : 'border-gray-600'
  }`}
  onClick={handleSelectAll}
>
```

**Correção Requerida:**
```tsx
<label className="relative flex items-center cursor-pointer">
  <input
    type="checkbox"
    checked={selectedIds.size === filteredContacts.length && filteredContacts.length > 0}
    onChange={handleSelectAll}
    className="sr-only peer"
    aria-label="Selecionar todos os contatos"
  />
  <div className="w-4 h-4 rounded border-2 flex items-center justify-center peer-checked:bg-primary-500 peer-checked:border-primary-500 border-gray-600 peer-focus:ring-2 peer-focus:ring-primary-400">
    {/* Check icon */}
  </div>
</label>
```

---

#### A11Y-08: Estados de loading sem anúncio
**Arquivos:** Todos os componentes com loading  
**WCAG:** 4.1.3 Status Messages (Level AA)

**Problema:**  
Estados de carregamento não são anunciados para leitores de tela.

**Correção Requerida:**
```tsx
// Adicionar região aria-live
<div aria-live="polite" aria-busy={isLoading} className="sr-only">
  {isLoading ? 'Carregando...' : 'Conteúdo carregado'}
</div>

// Ou usar aria-busy no container
<div aria-busy={isLoading}>
  {isLoading ? <Loader /> : <Content />}
</div>
```

---

#### A11Y-09: Gráficos sem texto alternativo
**Arquivo:** `DashboardView.tsx`  
**WCAG:** 1.1.1 Non-text Content (Level A)

**Problema:**  
Gráfico Recharts `<AreaChart>` não possui descrição textual alternativa.

**Código Atual:**
```tsx
<ResponsiveContainer width="100%" height={300}>
  <AreaChart data={chartData}>
    {/* Configurações do gráfico */}
  </AreaChart>
</ResponsiveContainer>
```

**Correção Requerida:**
```tsx
<figure role="figure" aria-label="Gráfico de mensagens enviadas nos últimos 30 dias">
  <ResponsiveContainer width="100%" height={300}>
    <AreaChart data={chartData}>
      {/* Configurações do gráfico */}
    </AreaChart>
  </ResponsiveContainer>
  <figcaption className="sr-only">
    Resumo: Total de {totalMessages} mensagens enviadas. 
    Pico de {maxMessages} no dia {peakDate}.
  </figcaption>
</figure>
```

---

#### A11Y-10: Foco não visível em alguns elementos
**Arquivo:** `globals.css`, múltiplos componentes  
**WCAG:** 2.4.7 Focus Visible (Level AA)

**Problema:**  
Alguns elementos interativos não têm indicador de foco visível, especialmente botões customizados.

**Correção Requerida em globals.css:**
```css
/* Adicionar ao globals.css */
:focus-visible {
  outline: 2px solid var(--color-primary-400);
  outline-offset: 2px;
}

/* Para elementos com outline removido */
button:focus-visible,
a:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: 2px solid var(--color-primary-400);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(52, 211, 153, 0.2);
}
```

---

#### A11Y-11: Notificações toast sem role alert
**Arquivo:** `app/providers.tsx` (Toaster)  
**WCAG:** 4.1.3 Status Messages (Level AA)

**Problema:**  
Toast notifications podem não ser anunciadas por leitores de tela.

**Verificar configuração do Sonner:**
```tsx
<Toaster 
  position="top-right"
  toastOptions={{
    // Sonner já usa aria-live internamente, verificar configuração
  }}
/>
```

---

#### A11Y-12: Paginação sem indicação de página atual
**Arquivo:** `ContactListView.tsx`  
**WCAG:** 1.3.1 Info and Relationships (Level A)

**Problema:**  
Botões de paginação não indicam qual é a página atual para leitores de tela.

**Correção Requerida:**
```tsx
<button
  onClick={() => setCurrentPage(page)}
  aria-current={currentPage === page ? 'page' : undefined}
  aria-label={`Página ${page}`}
  className={currentPage === page ? 'bg-primary-500' : 'bg-zinc-800'}
>
  {page}
</button>
```

---

#### A11Y-13: Formulários sem mensagens de erro acessíveis
**Arquivos:** `SettingsView.tsx`, `CampaignWizardView.tsx`  
**WCAG:** 3.3.1 Error Identification (Level A), 3.3.3 Error Suggestion (Level AA)

**Problema:**  
Mensagens de erro de validação não estão associadas programaticamente aos inputs.

**Correção Requerida:**
```tsx
<div>
  <label htmlFor="phone">Telefone</label>
  <input 
    id="phone"
    aria-describedby={error ? "phone-error" : undefined}
    aria-invalid={!!error}
  />
  {error && (
    <p id="phone-error" role="alert" className="text-red-500">
      {error}
    </p>
  )}
</div>
```

---

### 🟡 MÉDIO (Dificultam a experiência)

---

#### A11Y-14: Contraste de texto placeholder
**Arquivo:** `globals.css`, múltiplos inputs  
**WCAG:** 1.4.3 Contrast (Minimum) (Level AA)

**Problema:**  
Placeholder text usa `text-gray-600` (#52525b) sobre fundo `bg-zinc-900` (#18181b), com ratio de ~3.5:1. Mínimo para texto regular é 4.5:1.

**Correção:**
```css
/* Usar gray-500 (#71717a) ou mais claro para placeholders */
::placeholder {
  color: #71717a; /* 4.7:1 contrast ratio */
}
```

---

#### A11Y-15: Links de navegação sem indicação de estado ativo
**Arquivo:** `app/(dashboard)/layout.tsx`  
**WCAG:** 2.4.4 Link Purpose (Level A)

**Correção:**
```tsx
<NavLink 
  href="/campaigns"
  aria-current={pathname === '/campaigns' ? 'page' : undefined}
>
  Campanhas
</NavLink>
```

---

#### A11Y-16: Ícones decorativos não ocultos
**Arquivos:** Múltiplos  
**WCAG:** 1.1.1 Non-text Content (Level A)

**Problema:**  
Ícones puramente decorativos (ao lado de texto) não estão marcados como `aria-hidden`.

**Correção:**
```tsx
<button>
  <Send size={16} aria-hidden="true" /> Enviar Campanha
</button>
```

---

#### A11Y-17: Ordem de leitura em cards
**Arquivo:** `CampaignListView.tsx`  
**WCAG:** 1.3.2 Meaningful Sequence (Level A)

**Problema:**  
Status badge aparece visualmente à direita mas pode ser lido primeiro no DOM.

---

#### A11Y-18: Textarea sem limite de caracteres anunciado
**Arquivo:** `TemplateListView.tsx` (AI modal)  
**WCAG:** 3.3.2 Labels or Instructions (Level A)

---

#### A11Y-19: Tempo de animações
**Arquivo:** `globals.css`  
**WCAG:** 2.3.3 Animation from Interactions (Level AAA)

**Recomendação:**
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

### 🟢 BAIXO (Melhorias recomendadas)

---

#### A11Y-20: Uso de landmarks ARIA
**Arquivos:** Layouts  
**WCAG:** 1.3.1 Info and Relationships (Level A)

**Recomendação:**  
Adicionar landmarks para melhor navegação:
```tsx
<nav aria-label="Menu principal">...</nav>
<main aria-label="Conteúdo principal">...</main>
<aside aria-label="Barra lateral">...</aside>
```

---

#### A11Y-21: Título de página dinâmico
**WCAG:** 2.4.2 Page Titled (Level A)

**Recomendação:**
```tsx
// Cada página deve atualizar o título
<Head>
  <title>Campanhas - SmartZap</title>
</Head>
```

---

#### A11Y-22: Breadcrumbs para navegação
**WCAG:** 2.4.8 Location (Level AAA)

---

#### A11Y-23: Descrições expandidas para ações complexas
**WCAG:** 3.3.5 Help (Level AAA)

---

## Plano de Remediação Priorizado

### Fase 1: Críticos (Sprint 1)
| ID | Tarefa | Estimativa |
|----|--------|-----------|
| A11Y-01 | Implementar focus trap em modais | 4h |
| A11Y-02 | Adicionar aria-label em botões de ícone | 2h |
| A11Y-03 | Criar skip link | 1h |
| A11Y-04 | Adicionar scope em tabelas | 1h |
| A11Y-05 | Converter divs clicáveis para buttons | 2h |

### Fase 2: Alto (Sprint 2)
| ID | Tarefa | Estimativa |
|----|--------|-----------|
| A11Y-06 | Associar labels a inputs | 2h |
| A11Y-07 | Refatorar checkboxes customizados | 3h |
| A11Y-08 | Implementar aria-live para loading | 2h |
| A11Y-09 | Adicionar alt text em gráficos | 2h |
| A11Y-10 | Melhorar indicadores de foco | 2h |
| A11Y-11 | Verificar configuração de toasts | 1h |
| A11Y-12 | Adicionar aria-current em paginação | 1h |
| A11Y-13 | Associar erros de validação | 2h |

### Fase 3: Médio/Baixo (Sprint 3)
- Restantes (A11Y-14 a A11Y-23)

---

## Referências

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN ARIA Authoring Practices](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)
- [React Focus Lock](https://github.com/theKashey/react-focus-lock)
- [Radix UI Primitives](https://www.radix-ui.com/primitives) (alternativa acessível)

---

## Ferramentas de Teste Recomendadas

1. **axe DevTools** - Extensão Chrome/Firefox
2. **NVDA** - Screen reader gratuito (Windows)
3. **VoiceOver** - Screen reader nativo (macOS)
4. **Lighthouse** - Auditoria automatizada
5. **WAVE** - Validador online

---

## Próximos Passos

1. ✅ Auditoria completa documentada
2. ⏳ Implementar correções da Fase 1
3. ⏳ Testes manuais com screen reader
4. ⏳ Adicionar testes E2E de acessibilidade
