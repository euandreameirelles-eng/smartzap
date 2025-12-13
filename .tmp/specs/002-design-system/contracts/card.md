# Contract: Card Component

## Overview
Container de conteúdo com seções padronizadas (header, content, footer).

## API

```typescript
// Card (container principal)
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm",
        className
      )}
      {...props}
    />
  )
)

// CardHeader
const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    />
  )
)

// CardTitle
const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("text-2xl font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  )
)

// CardDescription
const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
)

// CardContent
const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
)

// CardFooter
const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center p-6 pt-0", className)}
      {...props}
    />
  )
)
```

## Usage Examples

### Complete Card
```tsx
<Card>
  <CardHeader>
    <CardTitle>Título do Card</CardTitle>
    <CardDescription>Uma descrição breve do conteúdo.</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Conteúdo principal do card vai aqui.</p>
  </CardContent>
  <CardFooter>
    <Button>Ação Principal</Button>
  </CardFooter>
</Card>
```

### Simple Card (content only)
```tsx
<Card className="p-6">
  <p>Conteúdo simples sem seções.</p>
</Card>
```

### Card with custom styling
```tsx
<Card className="border-primary/50 bg-primary/5">
  <CardContent className="pt-6">
    <p>Card com destaque</p>
  </CardContent>
</Card>
```

### Interactive Card
```tsx
<Card className="cursor-pointer hover:border-primary transition-colors">
  <CardContent className="pt-6">
    <p>Card clicável</p>
  </CardContent>
</Card>
```

## Parts

| Part | Purpose | Default Classes |
|------|---------|-----------------|
| `Card` | Container | `rounded-lg border bg-card shadow-sm` |
| `CardHeader` | Title area | `p-6 flex flex-col space-y-1.5` |
| `CardTitle` | Main heading | `text-2xl font-semibold` |
| `CardDescription` | Subtitle | `text-sm text-muted-foreground` |
| `CardContent` | Main content | `p-6 pt-0` |
| `CardFooter` | Actions area | `p-6 pt-0 flex items-center` |

## Dependencies
- `@/lib/utils` (cn function)
