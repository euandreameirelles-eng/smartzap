# shadcn/ui Component Index

**Última atualização**: 2025-12-03  
**Versão shadcn**: Latest (Tailwind CSS 4 compatible)  
**Referência oficial**: [ui.shadcn.com/docs/components](https://ui.shadcn.com/docs/components)

Este índice mapeia TODOS os componentes disponíveis no shadcn/ui e sua relevância para o SmartZap.

---

## Legenda

| Status | Significado |
|--------|-------------|
| ✅ IMPLEMENTAR | Necessário agora - incluído no escopo |
| 📋 FUTURO | Pode ser útil depois |
| ⚪ N/A | Não se aplica ao projeto |

| Prioridade | Significado |
|------------|-------------|
| 🔴 P0 | Crítico - Usado em 50+ lugares |
| 🟡 P1 | Alto - Usado frequentemente |
| 🟢 P2 | Médio - Nice-to-have |
| 🔵 P3 | Baixo - Futuro |

---

## Componentes Base (Atoms)

### Formulários

| # | Componente | Status | Prioridade | Uso no SmartZap | Instalação |
|---|------------|--------|------------|-----------------|------------|
| 1 | **Button** | ✅ IMPLEMENTAR | 🔴 P0 | 188 ocorrências de `<button>` | `npx shadcn@latest add button` |
| 2 | **Input** | ✅ IMPLEMENTAR | 🔴 P0 | 56 `<input>` + formulários | `npx shadcn@latest add input` |
| 3 | **Label** | ✅ IMPLEMENTAR | 🔴 P0 | 65 `<label>` existentes | `npx shadcn@latest add label` |
| 4 | **Textarea** | ✅ IMPLEMENTAR | 🟡 P1 | 10 `<textarea>` (bots, templates) | `npx shadcn@latest add textarea` |
| 5 | **Select** | ✅ IMPLEMENTAR | 🟡 P1 | 21 `<select>` (filtros, forms) | `npx shadcn@latest add select` |
| 6 | **Checkbox** | ✅ IMPLEMENTAR | 🟡 P1 | Seleção múltipla de contatos | `npx shadcn@latest add checkbox` |
| 7 | **Switch** | ✅ IMPLEMENTAR | 🟡 P1 | Toggles on/off (settings) | `npx shadcn@latest add switch` |
| 8 | **Radio Group** | 📋 FUTURO | 🔵 P3 | Opções exclusivas | `npx shadcn@latest add radio-group` |
| 9 | **Slider** | ⚪ N/A | - | Não usado | `npx shadcn@latest add slider` |
| 10 | **Input OTP** | ⚪ N/A | - | Não usa verificação OTP | `npx shadcn@latest add input-otp` |

### Feedback

| # | Componente | Status | Prioridade | Uso no SmartZap | Instalação |
|---|------------|--------|------------|-----------------|------------|
| 11 | **Badge** | ✅ IMPLEMENTAR | 🔴 P0 | Status tags (DRAFT, SENDING, etc) | `npx shadcn@latest add badge` |
| 12 | **Skeleton** | ✅ IMPLEMENTAR | 🟡 P1 | Loading states (35 Loader icons) | `npx shadcn@latest add skeleton` |
| 13 | **Progress** | ✅ IMPLEMENTAR | 🟢 P2 | Barra de progresso de campanhas | `npx shadcn@latest add progress` |
| 14 | **Alert** | ✅ IMPLEMENTAR | 🟢 P2 | Mensagens de erro/sucesso | `npx shadcn@latest add alert` |
| 15 | **Toast/Sonner** | ✅ IMPLEMENTAR | 🟢 P2 | Notificações temporárias | `npx shadcn@latest add sonner` |
| 16 | **Spinner** | 📋 FUTURO | 🔵 P3 | Loader animado (já tem ícone) | Usar Loader2 do lucide |

### Layout

| # | Componente | Status | Prioridade | Uso no SmartZap | Instalação |
|---|------------|--------|------------|-----------------|------------|
| 17 | **Card** | ✅ IMPLEMENTAR | 🔴 P0 | ~100+ containers com rounded-lg | `npx shadcn@latest add card` |
| 18 | **Separator** | ✅ IMPLEMENTAR | 🟢 P2 | Divisórias visuais | `npx shadcn@latest add separator` |
| 19 | **Scroll Area** | ✅ IMPLEMENTAR | 🟢 P2 | Listas longas com scroll custom | `npx shadcn@latest add scroll-area` |
| 20 | **Aspect Ratio** | ⚪ N/A | - | Não tem imagens responsivas | `npx shadcn@latest add aspect-ratio` |
| 21 | **Resizable** | ⚪ N/A | - | Não tem painéis redimensionáveis | `npx shadcn@latest add resizable` |

### Navegação

| # | Componente | Status | Prioridade | Uso no SmartZap | Instalação |
|---|------------|--------|------------|-----------------|------------|
| 22 | **Tabs** | ✅ IMPLEMENTAR | 🟢 P2 | Navegação por abas | `npx shadcn@latest add tabs` |
| 23 | **Pagination** | ✅ IMPLEMENTAR | 🟢 P2 | Paginação de listas | `npx shadcn@latest add pagination` |
| 24 | **Breadcrumb** | ⚪ N/A | - | App SPA, não usa breadcrumbs | `npx shadcn@latest add breadcrumb` |
| 25 | **Navigation Menu** | ⚪ N/A | - | Sidebar custom existente | `npx shadcn@latest add navigation-menu` |
| 26 | **Menubar** | ⚪ N/A | - | Não é app desktop | `npx shadcn@latest add menubar` |
| 27 | **Sidebar** | ⚪ N/A | - | Já tem sidebar customizada | `npx shadcn@latest add sidebar` |

---

## Componentes Overlay (Modais/Popups)

| # | Componente | Status | Prioridade | Uso no SmartZap | Instalação |
|---|------------|--------|------------|-----------------|------------|
| 28 | **Dialog** | ✅ IMPLEMENTAR | 🟡 P1 | 6+ modais (add, edit, confirm) | `npx shadcn@latest add dialog` |
| 29 | **Alert Dialog** | ✅ IMPLEMENTAR | 🟢 P2 | Confirmações de delete | `npx shadcn@latest add alert-dialog` |
| 30 | **Dropdown Menu** | ✅ IMPLEMENTAR | 🟢 P2 | Menus de ações (⋮) | `npx shadcn@latest add dropdown-menu` |
| 31 | **Popover** | ✅ IMPLEMENTAR | 🟢 P2 | Pop-ups informativos | `npx shadcn@latest add popover` |
| 32 | **Tooltip** | ✅ IMPLEMENTAR | 🟢 P2 | Hints em ícones/botões | `npx shadcn@latest add tooltip` |
| 33 | **Sheet** | 📋 FUTURO | 🔵 P3 | Painéis laterais (mobile) | `npx shadcn@latest add sheet` |
| 34 | **Drawer** | ⚪ N/A | - | Não tem drawer mobile | `npx shadcn@latest add drawer` |
| 35 | **Context Menu** | ⚪ N/A | - | Não usa right-click | `npx shadcn@latest add context-menu` |
| 36 | **Hover Card** | ⚪ N/A | - | Não tem preview cards | `npx shadcn@latest add hover-card` |
| 37 | **Command** | 📋 FUTURO | 🔵 P3 | CMD+K (busca global) | `npx shadcn@latest add command` |

---

## Componentes de Dados

| # | Componente | Status | Prioridade | Uso no SmartZap | Instalação |
|---|------------|--------|------------|-----------------|------------|
| 38 | **Table** | ✅ IMPLEMENTAR | 🟡 P1 | 5 `<table>` (campaigns, contacts) | `npx shadcn@latest add table` |
| 39 | **Data Table** | ✅ IMPLEMENTAR | 🟡 P1 | Listagens com sort/filter | Composto (Table + extras) |
| 40 | **Avatar** | 📋 FUTURO | 🔵 P3 | Fotos de perfil | `npx shadcn@latest add avatar` |
| 41 | **Calendar** | 📋 FUTURO | 🔵 P3 | Agendamento de campanhas | `npx shadcn@latest add calendar` |
| 42 | **Date Picker** | 📋 FUTURO | 🔵 P3 | Seleção de datas | `npx shadcn@latest add date-picker` |
| 43 | **Chart** | 📋 FUTURO | 🔵 P3 | Gráficos do dashboard | `npx shadcn@latest add chart` |
| 44 | **Carousel** | ⚪ N/A | - | Não tem carrosséis | `npx shadcn@latest add carousel` |

---

## Componentes Compostos

| # | Componente | Status | Prioridade | Uso no SmartZap | Instalação |
|---|------------|--------|------------|-----------------|------------|
| 45 | **Form** | ✅ IMPLEMENTAR | 🟡 P1 | Formulários com validação | `npx shadcn@latest add form` |
| 46 | **Combobox** | 📋 FUTURO | 🔵 P3 | Select com busca | Composto (Popover + Command) |
| 47 | **Accordion** | 📋 FUTURO | 🔵 P3 | FAQs, seções colapsáveis | `npx shadcn@latest add accordion` |
| 48 | **Collapsible** | ⚪ N/A | - | Não usado | `npx shadcn@latest add collapsible` |
| 49 | **Button Group** | 📋 FUTURO | 🔵 P3 | Botões agrupados | Não tem no shadcn base |
| 50 | **Toggle** | 📋 FUTURO | 🔵 P3 | Toggle buttons | `npx shadcn@latest add toggle` |
| 51 | **Toggle Group** | ⚪ N/A | - | Multi-toggle | `npx shadcn@latest add toggle-group` |

---

## Resumo por Status

### ✅ IMPLEMENTAR AGORA (23 componentes)

**P0 - Críticos (5)**
```bash
npx shadcn@latest add button input label card badge
```

**P1 - Altos (8)**
```bash
npx shadcn@latest add textarea select checkbox switch skeleton dialog table form
```

**P2 - Médios (10)**
```bash
npx shadcn@latest add progress alert sonner separator scroll-area tabs pagination alert-dialog dropdown-menu popover tooltip
```

### 📋 FUTURO (12 componentes)

Para adicionar quando necessário:
```bash
# Quando implementar features específicas:
npx shadcn@latest add radio-group    # Opções exclusivas
npx shadcn@latest add sheet          # Painéis mobile
npx shadcn@latest add command        # CMD+K busca
npx shadcn@latest add avatar         # Perfis de usuário
npx shadcn@latest add calendar       # Agendamentos
npx shadcn@latest add date-picker    # Seleção de datas
npx shadcn@latest add chart          # Dashboards avançados
npx shadcn@latest add combobox       # Select com busca
npx shadcn@latest add accordion      # Seções colapsáveis
npx shadcn@latest add toggle         # Toggle buttons
npx shadcn@latest add button-group   # Ações agrupadas (custom)
```

### ⚪ N/A (16 componentes)

Não se aplicam ao SmartZap:
- aspect-ratio, resizable, breadcrumb, navigation-menu, menubar, sidebar
- drawer, context-menu, hover-card, carousel, collapsible, toggle-group
- slider, input-otp

---

## Como Adicionar um Novo Componente

### 1. Verificar no índice acima
Antes de criar algo custom, cheque se existe no shadcn.

### 2. Instalar
```bash
npx shadcn@latest add [nome-do-componente]
```

### 3. Customizar (se necessário)
O componente será criado em `components/ui/`. Edite conforme necessário mantendo a API padrão.

### 4. Atualizar este índice
Mova de 📋 FUTURO para ✅ IMPLEMENTAR.

---

## Referências

- **Documentação oficial**: [ui.shadcn.com/docs](https://ui.shadcn.com/docs)
- **Exemplos de uso**: [ui.shadcn.com/examples](https://ui.shadcn.com/examples)
- **Temas**: [ui.shadcn.com/themes](https://ui.shadcn.com/themes)
- **Registry comunitário**: [ui.shadcn.com/docs/directory](https://ui.shadcn.com/docs/directory)
