import * as React from "react"
import { cn } from "@/lib/utils"

function Card({
  className,
  variant = "default",
  ...props
}) {
  const variantStyles = {
    default: "bg-card text-card-foreground border border-border/70 shadow-xs",
    elevated: "bg-card text-card-foreground border border-border/80 shadow-xl shadow-black/5 dark:shadow-black/40",
    glass: "bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/40 dark:border-zinc-800/80 shadow-2xl shadow-zinc-950/5",
    subtle: "bg-muted/40 text-card-foreground border border-border/40",
  }

  return (
    <div
      data-slot="card"
      className={cn(
        "group/card flex flex-col rounded-[5px] transition-all duration-200",
        variantStyles[variant] || variantStyles.default,
        className
      )}
      {...props}
    />
  )
}

function CardHeader({
  className,
  ...props
}) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex flex-col gap-1.5 p-6", className)}
      {...props}
    />
  )
}

function CardTitle({
  className,
  ...props
}) {
  return (
    <h3
      data-slot="card-title"
      className={cn(
        "font-heading text-xl font-bold tracking-tight text-foreground",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({
  className,
  ...props
}) {
  return (
    <p
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground leading-relaxed", className)}
      {...props}
    />
  )
}

function CardContent({
  className,
  ...props
}) {
  return (
    <div
      data-slot="card-content"
      className={cn("p-6 pt-0", className)}
      {...props}
    />
  )
}

function CardFooter({
  className,
  ...props
}) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center p-6 pt-0 border-t border-border/40 mt-4",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
}
