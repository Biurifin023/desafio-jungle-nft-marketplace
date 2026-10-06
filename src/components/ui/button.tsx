import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

/*
 * Variantes do Figma: botão cobre (#d28a4c) com texto ink (#140d0a), raio 5–6px e Roboto Mono 500/700.
 * Alturas: 35px (header), 40px (CTA/inputs), 45px (login/checkout).
 */
const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md text-sm font-bold whitespace-nowrap transition-[background-color,color,box-shadow,opacity] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/60 disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-invalid:ring-destructive/30 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-amber",
        destructive:
          "bg-destructive text-ink hover:bg-destructive/90 focus-visible:ring-destructive/30",
        outline:
          "border border-copper bg-transparent text-cream hover:bg-surface-2 hover:text-amber",
        secondary: "bg-secondary text-secondary-foreground hover:bg-surface-2",
        ghost: "text-cream hover:bg-surface-2 hover:text-amber",
        link: "text-amber underline-offset-4 hover:underline",
        gradient:
          "bg-[linear-gradient(90deg,#d28a4c_0%,#d28a4ccc_100%)] text-ink hover:brightness-110",
      },
      size: {
        default: "h-10 px-6 text-base",
        xs: "h-6 gap-1 rounded-xs px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-[35px] gap-1.5 px-3 text-sm",
        lg: "h-[45px] rounded-sm px-6 text-base",
        xl: "h-[60px] rounded-[30px] px-8 text-lg",
        icon: "size-10",
        "icon-xs": "size-6 rounded-full [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-[35px] rounded-full",
        "icon-lg": "size-[60px] rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
