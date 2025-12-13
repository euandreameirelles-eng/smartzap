# Research: Design System

**Feature**: 002-design-system  
**Date**: 2025-12-03

## 1. shadcn/ui + Tailwind CSS v4 Integration

### Decision
Usar shadcn/ui como base com adaptações para Tailwind CSS v4 + tema escuro personalizado.

### Rationale
- shadcn/ui é usado em produção pela Vercel (ai-chatbot, taxonomy)
- Componentes são copiados (não dependência), permitindo customização total
- Padrão CVA para variantes é extensível e tipado
- Radix UI garante acessibilidade sem esforço extra

### Alternatives Considered
1. **Headless UI (Tailwind Labs)**: Menos componentes, sem sistema de variantes
2. **Chakra UI**: Dependência pesada, conflita com Tailwind
3. **Custom do zero**: Muito tempo, sem benefício real

### Implementation Notes
```bash
# Dependências necessárias
npm install class-variance-authority clsx tailwind-merge tw-animate-css

# Radix UI será instalado por componente via shadcn CLI
npx shadcn@latest add button input card badge dialog
```

---

## 2. Design Tokens Strategy

### Decision
Usar CSS variables no padrão shadcn/ui com cores HSL, adaptado para o tema emerald do SmartZap.

### Rationale
- CSS variables permitem tema dinâmico (dark/light mode)
- HSL facilita manipulação de cores (transparência, hover states)
- Padrão shadcn/ui tem tokens testados em produção
- Tailwind v4 `@theme inline` mapeia variables para classes

### Token Schema (globals.css)
```css
:root {
  /* Semantic colors */
  --background: 0 0% 3.9%;        /* zinc-950 equivalent */
  --foreground: 0 0% 98%;         /* zinc-50 equivalent */
  
  --card: 0 0% 7%;                /* zinc-900 equivalent */
  --card-foreground: 0 0% 98%;
  
  --popover: 0 0% 7%;
  --popover-foreground: 0 0% 98%;
  
  --primary: 160 84% 39%;         /* emerald-500 - cor do SmartZap */
  --primary-foreground: 0 0% 98%;
  
  --secondary: 0 0% 15%;          /* zinc-800 equivalent */
  --secondary-foreground: 0 0% 98%;
  
  --muted: 0 0% 15%;
  --muted-foreground: 0 0% 64%;   /* zinc-400 equivalent */
  
  --accent: 160 84% 39%;
  --accent-foreground: 0 0% 98%;
  
  --destructive: 0 84% 60%;       /* red-500 */
  --destructive-foreground: 0 0% 98%;
  
  --border: 0 0% 15%;
  --input: 0 0% 15%;
  --ring: 160 84% 39%;
  
  --radius: 0.5rem;
}
```

### Tailwind v4 Mapping
```css
@theme inline {
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  --color-card: hsl(var(--card));
  --color-card-foreground: hsl(var(--card-foreground));
  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));
  --color-secondary: hsl(var(--secondary));
  --color-secondary-foreground: hsl(var(--secondary-foreground));
  --color-muted: hsl(var(--muted));
  --color-muted-foreground: hsl(var(--muted-foreground));
  --color-accent: hsl(var(--accent));
  --color-accent-foreground: hsl(var(--accent-foreground));
  --color-destructive: hsl(var(--destructive));
  --color-destructive-foreground: hsl(var(--destructive-foreground));
  --color-border: hsl(var(--border));
  --color-input: hsl(var(--input));
  --color-ring: hsl(var(--ring));
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}
```

---

## 3. Component Variants Pattern (CVA)

### Decision
Todos componentes base usam CVA para variantes tipadas.

### Rationale
- TypeScript infere variantes automaticamente via `VariantProps`
- Padrão consistente facilita manutenção
- `tailwind-merge` resolve conflitos de classes
- Mesmo padrão usado por shadcn/ui, Vercel, e Next.js templates

### Example Pattern
```tsx
// components/ui/button.tsx
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 rounded-md",
        lg: "h-11 px-8 rounded-md",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

---

## 4. cn() Utility Implementation

### Decision
Usar `clsx` + `tailwind-merge` no utilitário `cn()`.

### Rationale
- `clsx` para composição condicional de classes
- `tailwind-merge` resolve conflitos (ex: `p-2 p-4` → `p-4`)
- Padrão shadcn/ui testado em produção

### Implementation
```typescript
// lib/utils.ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

## 5. Migration Strategy

### Decision
Migração gradual por feature, começando por bots/ (mais afetado).

### Rationale
- Evita big-bang que pode quebrar toda aplicação
- Permite validar design system em produção incrementalmente
- Cada feature pode ser testada isoladamente

### Migration Order (by impact)
1. **bots/** - 50+ ocorrências de `bg-zinc-*` em 3 arquivos
2. **campaigns/** - CampaignListView com muitos estilos inline
3. **conversations/** - Componentes de chat
4. **dashboard/** - Cards e gráficos
5. **templates/** - Preview de templates
6. **contacts/** - Listas e formulários
7. **settings/** - Formulários de configuração
8. **flow-editor/** - Complexo, pode precisar wrapper para XYFlow

### Migration Checklist per Component
- [ ] Substituir `bg-zinc-*` por `bg-card`, `bg-muted`, `bg-background`
- [ ] Substituir `text-zinc-*` por `text-foreground`, `text-muted-foreground`
- [ ] Substituir `border-zinc-*` por `border-border`, `border-input`
- [ ] Usar componentes UI ao invés de elementos nativos styled
- [ ] Verificar estados (hover, focus, disabled)
- [ ] Testar dark mode (quando implementado)

---

## 6. Dependencies to Install

```json
{
  "dependencies": {
    "class-variance-authority": "^0.7.0",
    "tailwind-merge": "^2.0.0"
  },
  "devDependencies": {
    "tw-animate-css": "^1.0.0"
  }
}
```

**Note**: `clsx` já está instalado no projeto.

---

## Open Questions (Resolved)

| Question | Resolution |
|----------|------------|
| OKLCH vs HSL? | HSL - projeto já usa HSL, OKLCH requer refatoração adicional |
| Dark mode agora? | Não - foco é consistência; dark mode já funciona via tema escuro |
| Storybook? | Não - YAGNI, documentação em MD é suficiente por agora |
| Testes visuais? | Opcional - pode ser adicionado depois com Playwright screenshots |
