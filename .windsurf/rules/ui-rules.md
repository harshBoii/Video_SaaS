---
trigger: always_on
---

# Windsurf Rules - Next.js + shadcn/ui + Tailwind Premium SaaS

## Project Overview
Building a premium SaaS application with glassmorphism design, inspired by air.inc's sophisticated UI patterns.

## Design System Foundation

### Colors & Theme
- **Primary Color**: #D7765A (coral/salmon - from logo)
- **All colors MUST be defined in `globals.css` using CSS variables**
- Never hardcode color values in components
- Use semantic color naming: `--primary`, `--primary-foreground`, `--secondary`, etc.
- Support both light and dark modes through CSS variables
- Use `hsl()` format for better manipulation and consistency

Example structure in globals.css:
```css
:root {
  --primary: 15 70 60; /* #D7765A in HSL */
  --primary-foreground: 0 0 100;
  --background: 0 0 100;
  --foreground: 0 0 3.9;
  /* ... all other colors */
}

.dark {
  --primary: 15 70 60;
  --primary-foreground: 0 0 100;
  --background: 0 0 3.9;
  --foreground: 0 0 98;
  /* ... all other colors */
}
```

### Typography
- **All font families MUST be defined in `globals.css`**
- Use CSS variables for fonts: `--font-sans`, `--font-heading`, `--font-mono`
- Never import fonts directly in components
- Maintain consistent font hierarchy
- Font sizes should use Tailwind's scale (text-sm, text-base, text-lg, etc.)

Example:
```css
:root {
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-heading: 'Cal Sans', 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

## Glassmorphism Design Pattern

### Standard Glass Card
```tsx
<div className="backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 rounded-2xl shadow-2xl">
  {/* Content */}
</div>
```

### Glass Button (Primary)
```tsx
<button className="bg-primary/90 hover:bg-primary text-primary-foreground backdrop-blur-sm border border-white/20 rounded-lg px-6 py-3 transition-all duration-200 hover:shadow-lg hover:scale-105">
  Button Text
</button>
```

### Glass Input
```tsx
<input className="backdrop-blur-xl bg-white/5 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all" />
```

### Frosted Navigation
```tsx
<nav className="fixed top-0 w-full backdrop-blur-md bg-white/80 dark:bg-black/50 border-b border-white/20 dark:border-white/10 z-50">
  {/* Nav content */}
</nav>
```

## UI Component Standards

### Premium SaaS Feel Requirements
1. **Smooth Animations**: Use `transition-all duration-200` or `duration-300` for interactions
2. **Hover States**: Every interactive element needs hover effects with `hover:scale-105` or subtle color changes
3. **Shadows**: Use layered shadows - `shadow-xl`, `shadow-2xl` for depth
4. **Rounded Corners**: Use `rounded-lg` (8px) for buttons/inputs, `rounded-2xl` (16px) for cards
5. **Spacing**: Generous padding - minimum `p-6` for cards, `p-8` for sections
6. **Micro-interactions**: Add subtle scale transforms on hover (scale-105)

### Mobile-First Responsive Design
- **ALWAYS start with mobile layout first**
- Use Tailwind's responsive prefixes: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
- Mobile breakpoints:
  - Default: 0-640px (mobile)
  - sm: 640px+ (large mobile)
  - md: 768px+ (tablet)
  - lg: 1024px+ (desktop)
  - xl: 1280px+ (large desktop)

### Mobile-Specific Rules
- Touch targets minimum 44px (py-3 px-4 for buttons)
- Font sizes: Never below `text-sm` (14px) on mobile
- Navigation: Use hamburger menu below `md:` breakpoint
- Spacing: Reduce padding on mobile (p-4 mobile, p-6 tablet, p-8 desktop)
- Cards: Full width on mobile with `mx-4`, grid layout on desktop
- Modals: Full screen on mobile (`h-screen w-screen`), centered on desktop

Example responsive pattern:
```tsx
<div className="p-4 md:p-6 lg:p-8">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
    {/* Cards */}
  </div>
</div>
```

## Component Architecture

### shadcn/ui Integration
- Use shadcn/ui components as base
- ALWAYS customize with glassmorphism overlay
- Extend component variants in the component file, not inline
- Keep shadcn components in `components/ui/`
- Custom components in `components/` root or feature folders

### Component Customization Template
```tsx
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function GlassButton({ className, ...props }: ButtonProps) {
  return (
    <Button
      className={cn(
        "backdrop-blur-xl bg-primary/90 hover:bg-primary",
        "border border-white/20 shadow-lg",
        "hover:scale-105 transition-all duration-200",
        className
      )}
      {...props}
    />
  )
}
```

## Layout Patterns

### Page Layout Structure
```tsx
<div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
  <nav>{/* Frosted nav */}</nav>
  <main className="container mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12 lg:py-16">
    {/* Content */}
  </main>
</div>
```

### Section Pattern
```tsx
<section className="py-12 md:py-16 lg:py-24">
  <div className="container mx-auto px-4 md:px-6 lg:px-8">
    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8 md:mb-12">
      Section Title
    </h2>
    {/* Content */}
  </div>
</section>
```

### Card Grid Pattern
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
  <div className="backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 rounded-2xl p-6 md:p-8 hover:scale-105 transition-all duration-200">
    {/* Card content */}
  </div>
</div>
```

## Air.inc Inspired Patterns

### Hero Section with Floating Elements
```tsx
<section className="relative overflow-hidden py-20 md:py-32">
  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
  <div className="container relative z-10">
    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6">
      <span className="italic">Seamlessly</span> manage operations
    </h1>
  </div>
</section>
```

### Interactive Preview Cards
```tsx
<div className="group relative backdrop-blur-xl bg-white/10 dark:bg-black/10 rounded-2xl overflow-hidden border border-white/20 hover:border-primary/50 transition-all duration-300">
  <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
  <div className="relative p-6 md:p-8">
    {/* Content */}
  </div>
</div>
```

### Smooth Scroll Animations
- Use Framer Motion for scroll-triggered animations
- Fade in + slide up pattern for cards
- Stagger children animations for lists
- Always add `initial={{ opacity: 0 }}` and `animate={{ opacity: 1 }}`

## Accessibility Requirements

- All interactive elements need focus states: `focus:ring-2 focus:ring-primary focus:ring-offset-2`
- Sufficient color contrast (4.5:1 for text, 3:1 for large text)
- Semantic HTML (header, nav, main, section, footer)
- ARIA labels for icon-only buttons
- Keyboard navigation support
- Screen reader friendly text for icons

## Performance Optimization

- Use Next.js Image component for all images
- Lazy load below-fold content
- Minimize use of `backdrop-blur` (expensive) - use sparingly for key elements
- Use CSS transforms for animations (translate, scale) instead of position changes
- Implement loading skeletons with glass effect

## File Organization

```
src/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Auth routes group
│   ├── (dashboard)/       # Dashboard routes group
│   └── globals.css        # Global styles with CSS variables
├── components/
│   ├── ui/                # shadcn components
│   ├── glass/             # Custom glass components
│   ├── layout/            # Layout components (nav, footer)
│   └── features/          # Feature-specific components
├── lib/
│   └── utils.ts          # Utility functions (cn, etc.)
└── styles/
    └── animations.css    # Reusable animation classes
```

## Code Quality Standards

### Component Creation Checklist
- [ ] Mobile-responsive (test all breakpoints)
- [ ] Uses CSS variables for colors
- [ ] Includes hover/focus states
- [ ] Has proper TypeScript types
- [ ] Includes loading/error states
- [ ] Accessible (keyboard + screen reader)
- [ ] Animated transitions (200-300ms)
- [ ] Glass effect applied correctly

### Do's ✅
- Use semantic color variables (`bg-primary`, not `bg-[#D7765A]`)
- Mobile-first responsive design
- Consistent spacing scale (4, 6, 8, 12, 16, 24)
- Reusable component variants
- TypeScript for all components
- Server components by default, client only when needed

### Don'ts ❌
- Never hardcode colors outside globals.css
- No inline styles (use Tailwind classes)
- Avoid `!important` unless absolutely necessary
- Don't use `absolute` positioning for responsive layouts
- No magic numbers (use Tailwind scale)
- Don't skip mobile testing

## Animation Library

```css
/* Add to animations.css */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes glow {
  0%, 100% { box-shadow: 0 0 20px rgba(215, 118, 90, 0.3); }
  50% { box-shadow: 0 0 40px rgba(215, 118, 90, 0.6); }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

.animate-glow {
  animation: glow 2s ease-in-out infinite;
}
```

## Testing Checklist

Before committing any UI component:
1. Test on mobile (375px, 414px widths)
2. Test on tablet (768px, 1024px)
3. Test on desktop (1280px, 1920px)
4. Test dark mode appearance
5. Test keyboard navigation
6. Test with screen reader
7. Verify color contrast
8. Check hover/focus states
9. Verify animations are smooth (60fps)
10. Test loading states

## Common Patterns Reference

### Form Pattern
```tsx
<form className="space-y-6 backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-white/20 rounded-2xl p-6 md:p-8">
  <div className="space-y-2">
    <label className="text-sm font-medium">Label</label>
    <input className="w-full backdrop-blur-xl bg-white/5 dark:bg-black/20 border border-white/20 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/50" />
  </div>
</form>
```

### Dashboard Card Pattern
```tsx
<div className="backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-white/20 rounded-2xl p-6">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-lg font-semibold">Card Title</h3>
    <button className="text-primary hover:text-primary/80">Action</button>
  </div>
  <div className="space-y-4">
    {/* Card content */}
  </div>
</div>
```

### Modal Pattern
```tsx
<div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
  <div className="w-full max-w-md backdrop-blur-xl bg-white/95 dark:bg-black/95 border border-white/20 rounded-2xl p-6 md:p-8 shadow-2xl">
    {/* Modal content */}
  </div>
</div>
```

---

**Remember**: Every component should feel premium, be fully responsive, and maintain the glassmorphism aesthetic while ensuring excellent mobile UX and performance.