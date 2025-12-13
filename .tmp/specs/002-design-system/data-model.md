# Data Model: Design Tokens

**Feature**: 002-design-system  
**Date**: 2025-12-03

## Token Categories

### 1. Color Tokens

| Token | Light Mode (HSL) | Dark Mode (HSL) | Usage |
|-------|------------------|-----------------|-------|
| `--background` | 0 0% 100% | 0 0% 3.9% | Page background |
| `--foreground` | 0 0% 3.9% | 0 0% 98% | Default text |
| `--card` | 0 0% 100% | 0 0% 7% | Card backgrounds |
| `--card-foreground` | 0 0% 3.9% | 0 0% 98% | Card text |
| `--popover` | 0 0% 100% | 0 0% 7% | Popover/dropdown backgrounds |
| `--popover-foreground` | 0 0% 3.9% | 0 0% 98% | Popover text |
| `--primary` | 160 84% 39% | 160 84% 39% | Primary actions (emerald) |
| `--primary-foreground` | 0 0% 98% | 0 0% 98% | Text on primary |
| `--secondary` | 0 0% 96% | 0 0% 15% | Secondary backgrounds |
| `--secondary-foreground` | 0 0% 9% | 0 0% 98% | Secondary text |
| `--muted` | 0 0% 96% | 0 0% 15% | Muted backgrounds |
| `--muted-foreground` | 0 0% 45% | 0 0% 64% | Muted/placeholder text |
| `--accent` | 160 84% 39% | 160 84% 39% | Accent highlights |
| `--accent-foreground` | 0 0% 98% | 0 0% 98% | Text on accent |
| `--destructive` | 0 84% 60% | 0 62% 30% | Error/danger states |
| `--destructive-foreground` | 0 0% 98% | 0 0% 98% | Text on destructive |
| `--border` | 0 0% 90% | 0 0% 15% | Default borders |
| `--input` | 0 0% 90% | 0 0% 15% | Input borders |
| `--ring` | 160 84% 39% | 160 84% 39% | Focus ring color |

### 2. Radius Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--radius` | 0.5rem | Base radius |
| `--radius-sm` | calc(var(--radius) - 4px) | Small elements (badges) |
| `--radius-md` | calc(var(--radius) - 2px) | Medium elements |
| `--radius-lg` | var(--radius) | Large elements (cards) |
| `--radius-xl` | calc(var(--radius) + 4px) | Extra large (modals) |

### 3. Chart Tokens (for Recharts)

| Token | Value (HSL) | Usage |
|-------|-------------|-------|
| `--chart-1` | 160 84% 39% | Primary series (emerald) |
| `--chart-2` | 173 58% 39% | Secondary series (teal) |
| `--chart-3` | 197 37% 24% | Tertiary series |
| `--chart-4` | 43 74% 66% | Quaternary series (amber) |
| `--chart-5` | 27 87% 67% | Quinary series (orange) |

---

## Token Mapping: zinc-* → Semantic

| Hardcoded | Semantic Token | Notes |
|-----------|----------------|-------|
| `bg-zinc-950` | `bg-background` | Page background |
| `bg-zinc-900` | `bg-card` | Card/container backgrounds |
| `bg-zinc-800` | `bg-secondary` | Secondary backgrounds |
| `bg-zinc-800/50` | `bg-muted/50` | Muted with opacity |
| `bg-zinc-700` | `bg-accent` | Hover states |
| `text-zinc-400` | `text-muted-foreground` | Secondary text |
| `text-zinc-500` | `text-muted-foreground` | Placeholder text |
| `text-zinc-200` | `text-foreground` | Primary text |
| `text-white` | `text-foreground` | Primary text |
| `border-zinc-800` | `border-border` | Default borders |
| `border-zinc-700` | `border-input` | Input borders |
| `hover:bg-zinc-700` | `hover:bg-accent` | Hover backgrounds |
| `hover:bg-zinc-800` | `hover:bg-secondary` | Secondary hover |

---

## Component Entities

### Button
```typescript
interface ButtonVariants {
  variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size: 'default' | 'sm' | 'lg' | 'icon'
}
```

### Badge
```typescript
interface BadgeVariants {
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
}
```

### Input
```typescript
interface InputProps {
  type: 'text' | 'email' | 'password' | 'number' | 'search' | 'tel' | 'url'
  disabled?: boolean
  error?: boolean // Applies destructive styling
}
```

### Card
```typescript
interface CardParts {
  Card: React.FC           // Container
  CardHeader: React.FC     // Header section
  CardTitle: React.FC      // H3 styled
  CardDescription: React.FC // Muted text
  CardContent: React.FC    // Main content
  CardFooter: React.FC     // Actions area
}
```

### Dialog
```typescript
interface DialogParts {
  Dialog: React.FC              // Root (Radix)
  DialogTrigger: React.FC       // Open trigger
  DialogContent: React.FC       // Modal content
  DialogHeader: React.FC        // Title area
  DialogTitle: React.FC         // H2 styled
  DialogDescription: React.FC   // Description text
  DialogFooter: React.FC        // Actions area
  DialogClose: React.FC         // Close button
}
```

---

## File Structure

```
app/globals.css          # Token definitions (:root, .dark)
lib/utils.ts             # cn() utility
components/ui/
├── button.tsx           # Button + buttonVariants
├── input.tsx            # Input
├── label.tsx            # Label
├── card.tsx             # Card + parts
├── badge.tsx            # Badge + badgeVariants
├── dialog.tsx           # Dialog + parts
├── dropdown-menu.tsx    # DropdownMenu + parts
├── select.tsx           # Select + parts
├── tabs.tsx             # Tabs + parts
├── table.tsx            # Table + parts
├── skeleton.tsx         # Skeleton
└── toast.tsx            # Toast + Toaster
```
