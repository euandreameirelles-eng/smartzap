# Contract: Input Component

## Overview
Campo de entrada de texto com estados visuais para focus, disabled e error.

## API

```typescript
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
```

## Usage Examples

### Basic
```tsx
<Input type="text" placeholder="Digite algo..." />
```

### With Label
```tsx
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="seu@email.com" />
</div>
```

### With error state
```tsx
<Input 
  type="email" 
  className="border-destructive focus-visible:ring-destructive" 
/>
<p className="text-sm text-destructive">Email inválido</p>
```

### Disabled
```tsx
<Input disabled placeholder="Campo desabilitado" />
```

### File input
```tsx
<Input type="file" />
```

## States

| State | Classes Applied |
|-------|-----------------|
| Default | `border-input bg-background` |
| Focus | `focus-visible:ring-2 focus-visible:ring-ring` |
| Disabled | `disabled:cursor-not-allowed disabled:opacity-50` |
| Error | Manual: `border-destructive focus-visible:ring-destructive` |

## Accessibility
- Associar com `<Label>` via `htmlFor`/`id`
- Focus ring visível
- Placeholder com contraste adequado (`text-muted-foreground`)

## Dependencies
- `@/lib/utils` (cn function)
