# Quickstart: Design System SmartZap

**Feature**: 002-design-system  
**Date**: 2025-12-03

## Instalação Rápida

```bash
# 1. Instalar dependências
npm install class-variance-authority tailwind-merge tw-animate-css

# 2. Adicionar componentes via shadcn CLI
npx shadcn@latest init
npx shadcn@latest add button input label card badge dialog dropdown-menu select tabs table skeleton toast
```

---

## Uso Básico

### Button
```tsx
import { Button } from "@/components/ui/button"

// Variantes
<Button>Default</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Deletar</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Tamanhos
<Button size="sm">Pequeno</Button>
<Button size="default">Padrão</Button>
<Button size="lg">Grande</Button>
<Button size="icon"><Plus /></Button>

// Com ícone
<Button>
  <Plus className="mr-2 h-4 w-4" />
  Adicionar
</Button>

// Estados
<Button disabled>Desabilitado</Button>
<Button className="w-full">Full Width</Button>
```

### Input
```tsx
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="seu@email.com" />
</div>

// Com erro (adicionar classe)
<Input className="border-destructive" />
```

### Card
```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Título do Card</CardTitle>
    <CardDescription>Descrição opcional</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Conteúdo principal aqui</p>
  </CardContent>
  <CardFooter>
    <Button>Ação</Button>
  </CardFooter>
</Card>
```

### Badge
```tsx
import { Badge } from "@/components/ui/badge"

<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Erro</Badge>
<Badge variant="outline">Outline</Badge>
```

### Dialog (Modal)
```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"

<Dialog>
  <DialogTrigger asChild>
    <Button>Abrir Modal</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Título do Modal</DialogTitle>
      <DialogDescription>
        Descrição do que este modal faz.
      </DialogDescription>
    </DialogHeader>
    <div className="py-4">
      {/* Conteúdo */}
    </div>
    <DialogFooter>
      <Button variant="outline">Cancelar</Button>
      <Button>Confirmar</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## Cores Semânticas

### Backgrounds
```tsx
// ❌ Antes (hardcoded)
<div className="bg-zinc-900">

// ✅ Depois (semântico)
<div className="bg-card">

// Mapeamento:
// bg-zinc-950 → bg-background
// bg-zinc-900 → bg-card
// bg-zinc-800 → bg-secondary ou bg-muted
// bg-zinc-700 → bg-accent (hover states)
```

### Text
```tsx
// ❌ Antes
<p className="text-zinc-400">

// ✅ Depois
<p className="text-muted-foreground">

// Mapeamento:
// text-white → text-foreground
// text-zinc-200 → text-foreground
// text-zinc-400 → text-muted-foreground
// text-zinc-500 → text-muted-foreground
```

### Borders
```tsx
// ❌ Antes
<div className="border-zinc-800">

// ✅ Depois
<div className="border-border">

// Mapeamento:
// border-zinc-800 → border-border
// border-zinc-700 → border-input
```

---

## Utility `cn()`

```tsx
import { cn } from "@/lib/utils"

// Combinar classes condicionalmente
<div className={cn(
  "base-classes",
  isActive && "active-classes",
  isDisabled && "opacity-50 cursor-not-allowed"
)}>

// Override de classes (tailwind-merge resolve conflitos)
<Button className={cn(buttonVariants(), "w-full")}>
  // O w-full vai sobrescrever qualquer width anterior
</Button>
```

---

## Padrão de Componente

Ao criar novos componentes, siga este padrão:

```tsx
// components/ui/meu-componente.tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const meuComponenteVariants = cva(
  "classes-base-sempre-aplicadas",
  {
    variants: {
      variant: {
        default: "classes-variante-default",
        secondary: "classes-variante-secondary",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 px-3 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface MeuComponenteProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof meuComponenteVariants> {}

const MeuComponente = React.forwardRef<HTMLDivElement, MeuComponenteProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(meuComponenteVariants({ variant, size, className }))}
        {...props}
      />
    )
  }
)
MeuComponente.displayName = "MeuComponente"

export { MeuComponente, meuComponenteVariants }
```

---

## Checklist de Migração

Ao migrar um componente existente:

- [ ] Substituir cores hardcoded por tokens semânticos
- [ ] Usar componentes UI ao invés de elementos nativos
- [ ] Garantir que `forwardRef` está implementado
- [ ] Adicionar tipos TypeScript explícitos
- [ ] Testar estados: hover, focus, disabled
- [ ] Verificar acessibilidade (keyboard, screen reader)
