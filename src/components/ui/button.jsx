import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-transparent font-medium whitespace-nowrap transition-all duration-200 outline-none select-none cursor-pointer focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 active:bg-primary",
        brand:
          "bg-gradient-to-r from-red-700 via-red-600 to-red-800 text-white shadow-md shadow-red-900/20 hover:from-red-800 hover:via-red-700 hover:to-red-900 hover:shadow-lg hover:shadow-red-900/30 border-t border-white/20",
        "brand-outline":
          "border border-red-700/30 text-red-700 bg-red-50/50 hover:bg-red-100/70 hover:border-red-700/60 dark:border-red-500/30 dark:text-red-400 dark:bg-red-950/20 dark:hover:bg-red-900/40",
        outline:
          "border border-border/80 bg-background/90 text-foreground shadow-xs hover:bg-muted hover:border-border dark:bg-zinc-900/80 dark:border-zinc-800 dark:hover:bg-zinc-800",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-muted/80 hover:text-foreground dark:hover:bg-zinc-800/80",
        destructive:
          "bg-destructive text-white shadow-sm hover:bg-destructive/90",
        link:
          "text-primary underline-offset-4 hover:underline p-0 h-auto font-normal",
      },
      size: {
        xs: "h-7 px-2.5 text-xs rounded-[5px]",
        sm: "h-8 px-3 text-xs rounded-[5px]",
        default: "h-9.5 px-4 text-sm rounded-[5px]",
        lg: "h-11 px-5 text-sm font-semibold rounded-[5px]",
        xl: "h-12 px-6 text-base font-semibold rounded-[5px]",
        icon: "size-9.5 p-0 rounded-[5px]",
        "icon-sm": "size-8 p-0 rounded-[5px]",
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
  isLoading = false,
  disabled,
  children,
  ...props
}) {
  return (
    <ButtonPrimitive
      data-slot="button"
      disabled={disabled || isLoading}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="animate-spin text-current" />
          <span>{children}</span>
        </>
      ) : (
        children
      )}
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants }
