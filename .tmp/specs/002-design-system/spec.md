# Feature Specification: Design System

**Feature Branch**: `002-design-system`  
**Created**: 2025-12-03  
**Status**: Draft  
**Input**: User description: "Criar um Design System eficiente baseado nas melhores práticas do mercado usando Next.js e shadcn/ui"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Desenvolvedores usam componentes base consistentes (Priority: P1)

Como desenvolvedor do SmartZap, eu preciso de componentes UI base (Button, Input, Card, Badge, etc.) que sigam um padrão visual consistente, para que eu possa construir interfaces rapidamente sem me preocupar com decisões de design a cada componente.

**Why this priority**: Componentes base são a fundação de todo o sistema. Sem eles padronizados, cada feature continuará sendo desenvolvida de forma inconsistente ("Frankenstein UI").

**Independent Test**: Pode ser testado criando uma nova página que utilize apenas componentes do Design System e verificando que a aparência é consistente com o resto da aplicação.

**Acceptance Scenarios**:

1. **Given** um desenvolvedor precisa de um botão, **When** ele importa `Button` de `@/components/ui/button`, **Then** o botão já vem com variantes (primary, secondary, destructive, ghost, outline) e tamanhos (sm, default, lg) prontos para uso.

2. **Given** um desenvolvedor precisa de um input, **When** ele importa `Input` de `@/components/ui/input`, **Then** o input já possui estados visuais corretos (focus, disabled, error) e segue o tema da aplicação.

3. **Given** um componente precisa de customização, **When** o desenvolvedor passa `className` adicional, **Then** as classes são mescladas corretamente sem conflito usando `cn()`.

---

### User Story 2 - Tema consistente através de Design Tokens (Priority: P1)

Como desenvolvedor, eu preciso de um sistema de Design Tokens (cores semânticas, espaçamentos, tipografia) definidos em CSS variables, para que mudanças de tema sejam centralizadas e não exijam busca/substituição em centenas de arquivos.

**Why this priority**: Design Tokens são o que permitem consistência. Sem eles, cores hardcoded como `bg-zinc-800` se espalham pelo código e impossibilitam manutenção.

**Independent Test**: Pode ser testado alterando uma variável CSS (ex: `--primary`) e verificando que todos os componentes que usam `bg-primary` são atualizados automaticamente.

**Acceptance Scenarios**:

1. **Given** o sistema possui tokens de cor definidos, **When** um desenvolvedor usa `bg-primary` ou `text-muted-foreground`, **Then** as cores corretas são aplicadas baseadas no tema atual.

2. **Given** o globals.css possui tokens bem organizados, **When** um designer solicita mudança de cor primária, **Then** a mudança é feita em um único lugar e reflete em toda a aplicação.

3. **Given** o Tailwind está configurado com os tokens, **When** um desenvolvedor digita `bg-`, **Then** o autocomplete mostra as cores semânticas (primary, secondary, muted, accent, destructive) ao invés de cores brutas (zinc, slate, etc.).

---

### User Story 3 - Componentes compostos reutilizáveis (Priority: P2)

Como desenvolvedor, eu preciso de componentes compostos (Modal, Form, DataTable, etc.) que combinem componentes base de forma padronizada, para que padrões de UI complexos sejam consistentes em toda a aplicação.

**Why this priority**: Componentes compostos eliminam duplicação e garantem UX consistente em fluxos complexos como formulários e modais.

**Independent Test**: Pode ser testado verificando que um Modal aberto em qualquer parte da aplicação tem a mesma estrutura visual, animação e comportamento de acessibilidade.

**Acceptance Scenarios**:

1. **Given** um desenvolvedor precisa de um modal, **When** ele usa `Dialog` do Design System, **Then** o modal já possui overlay, animações, close button e trap de foco corretos.

2. **Given** um desenvolvedor precisa de um formulário, **When** ele usa os componentes `Form`, `FormField`, `FormLabel`, `FormMessage`, **Then** validação, estados de erro e acessibilidade já estão integrados.

3. **Given** um componente composto é usado, **When** ele é renderizado, **Then** ele segue o mesmo padrão visual de outros componentes compostos da aplicação.

---

### User Story 4 - Migração gradual dos componentes existentes (Priority: P2)

Como desenvolvedor, eu preciso de uma estratégia para migrar componentes existentes para o Design System de forma gradual, para que a aplicação não quebre durante a transição.

**Why this priority**: A aplicação já existe e funciona. A migração deve ser incremental e segura.

**Independent Test**: Pode ser testado migrando um componente específico (ex: botões da página de Campanhas) e verificando que a aplicação continua funcionando normalmente.

**Acceptance Scenarios**:

1. **Given** existe um componente com estilos hardcoded, **When** ele é migrado para usar o Design System, **Then** a aparência visual permanece a mesma (ou melhora) e não há regressões visuais.

2. **Given** um componente usa `bg-zinc-800`, **When** ele é atualizado para `bg-card` ou `bg-muted`, **Then** ele automaticamente se adapta ao tema e funciona com dark/light mode.

3. **Given** a migração está em andamento, **When** componentes novos e antigos coexistem, **Then** não há conflitos visuais ou de CSS.

---

### User Story 5 - Documentação e exemplos de uso (Priority: P3)

Como desenvolvedor novo no projeto, eu preciso de documentação clara sobre quais componentes existem e como usá-los, para que eu possa ser produtivo rapidamente.

**Why this priority**: Documentação é importante para onboarding, mas pode ser criada incrementalmente após os componentes estarem funcionando.

**Independent Test**: Pode ser testado pedindo a um desenvolvedor novo que crie uma interface usando apenas a documentação, sem ajuda externa.

**Acceptance Scenarios**:

1. **Given** a documentação existe, **When** um desenvolvedor procura como usar um Button, **Then** ele encontra exemplos de código para todas as variantes e tamanhos.

2. **Given** existe um componente no Design System, **When** um desenvolvedor consulta a documentação, **Then** ele encontra props disponíveis, exemplos de uso e boas práticas.

---

### Edge Cases

- O que acontece quando um componente precisa de estilo único que não existe no sistema? → Usar `className` para extensão, mas documentar se o padrão se repetir.
- Como lidar com componentes de terceiros (ex: XYFlow) que têm seu próprio estilo? → Criar wrappers que aplicam tokens do Design System onde possível.
- O que acontece se um token for removido ou renomeado? → Build deve falhar com erro claro indicando o problema.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Sistema DEVE incluir componentes base shadcn/ui: Button, Input, Label, Card, Badge, Dialog, DropdownMenu, Select, Tabs, Table, Skeleton, Toast.
- **FR-002**: Sistema DEVE usar CVA (Class Variance Authority) para gerenciar variantes de componentes.
- **FR-003**: Sistema DEVE definir Design Tokens como CSS variables no `globals.css` seguindo o padrão shadcn/ui.
- **FR-004**: Sistema DEVE configurar Tailwind para usar tokens semânticos (primary, secondary, muted, accent, destructive, etc.).
- **FR-005**: Sistema DEVE incluir utilitário `cn()` para merge de classes (clsx + tailwind-merge).
- **FR-006**: Componentes DEVEM suportar ref forwarding para integração com bibliotecas externas.
- **FR-007**: Componentes DEVEM ser acessíveis (ARIA labels, keyboard navigation) usando primitivos Radix UI.
- **FR-008**: Sistema DEVE suportar dark mode através de CSS variables.
- **FR-009**: Componentes existentes DEVEM ser migrados gradualmente para usar o Design System.
- **FR-010**: Sistema DEVE seguir estrutura de pastas: `components/ui/` para base, `components/composed/` para compostos.

### Key Entities

- **Design Token**: Variável CSS que define um valor de design (cor, espaçamento, sombra). Exemplo: `--primary`, `--muted-foreground`.
- **Componente Base**: Componente atômico do Design System (Button, Input, Card). Vive em `components/ui/`.
- **Componente Composto**: Componente que combina múltiplos componentes base (FormField, DataTable). Vive em `components/composed/`.
- **Variante**: Versão estilística de um componente definida via CVA (primary, secondary, ghost).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos componentes em `components/ui/` usam Design Tokens ao invés de cores hardcoded.
- **SC-002**: Desenvolvedores conseguem criar novas interfaces usando apenas componentes do Design System em menos de 50% do tempo atual.
- **SC-003**: Zero ocorrências de `bg-zinc-*`, `text-zinc-*`, `border-zinc-*` hardcoded em componentes novos.
- **SC-004**: Todos os componentes base passam em testes de acessibilidade básicos (foco visível, labels, contraste).
- **SC-005**: Mudança de cor primária afeta toda a aplicação alterando apenas uma variável CSS.
- **SC-006**: 80% dos componentes existentes migrados para o Design System em 4 semanas.

## Assumptions

- O projeto já usa Tailwind CSS v4, que será mantido.
- shadcn/ui será a base do Design System (componentes copiados, não instalados como dependência).
- O dark mode será implementado via classe `.dark` no elemento raiz.
- Radix UI será usado como base para componentes acessíveis (já é padrão do shadcn/ui).
- A migração será feita por página/feature, não em um único big-bang.
- CVA e tailwind-merge serão instalados como dependências.
