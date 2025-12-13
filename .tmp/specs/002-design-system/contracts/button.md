# Contract: Button Component

## Overview
Componente de botão com variantes e tamanhos, seguindo padrão shadcn/ui.

## API

```typescript
import { cva, type VariantProps } from "class-variance-authority"

export const buttonVariants = cva(
  // Base classes
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
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
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
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
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}
```

## Usage Examples

### Basic
```tsx
<Button>Clique aqui</Button>
```

### With variants
```tsx
<Button variant="secondary">Secundário</Button>
<Button variant="destructive">Deletar</Button>
<Button variant="outline">Contorno</Button>
<Button variant="ghost">Fantasma</Button>
<Button variant="link">Link</Button>
```

### With sizes
```tsx
<Button size="sm">Pequeno</Button>
<Button size="lg">Grande</Button>
<Button size="icon"><Plus /></Button>
```

### With icon
```tsx
<Button>
  <Mail className="mr-2 h-4 w-4" />
  Enviar Email
</Button>
```

### As child (for links)
```tsx
<Button asChild>
  <Link href="/dashboard">Dashboard</Link>
</Button>
```

## Accessibility
- Focus ring visível com `focus-visible:ring-2`
- Desabilitado com `disabled:opacity-50`
- Suporte a teclado nativo do `<button>`

## Dependencies
- `class-variance-authority`
- `@radix-ui/react-slot` (para `asChild`)
- `@/lib/utils` (cn function)
