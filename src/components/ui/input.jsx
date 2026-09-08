import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "@/lib/utils"

const Input = React.forwardRef(function Input(
  {
    className,
    type,
    startIcon: StartIcon,
    endIcon: EndIcon,
    error,
    wrapperClassName,
    ...props
  },
  ref
) {
  const hasIcons = Boolean(StartIcon || EndIcon)

  const inputElement = (
    <InputPrimitive
      ref={ref}
      type={type}
      data-slot="input"
      aria-invalid={Boolean(error)}
      className={cn(
        "h-10 w-full min-w-0 rounded-lg border border-input/90 bg-background/80 px-3.5 py-2 text-sm text-foreground transition-all duration-150 outline-none placeholder:text-muted-foreground/70 focus-visible:border-red-600 focus-visible:ring-3 focus-visible:ring-red-600/15 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted/50 disabled:opacity-50 dark:bg-zinc-900/60 dark:border-zinc-800 dark:focus-visible:border-red-500 dark:focus-visible:ring-red-500/20",
        StartIcon && "pl-10",
        EndIcon && "pr-10",
        error && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
        className
      )}
      {...props}
    />
  )

  if (!hasIcons && !error) {
    return inputElement
  }

  return (
    <div className={cn("relative flex w-full flex-col gap-1", wrapperClassName)}>
      <div className="relative flex w-full items-center">
        {StartIcon && (
          <div className="pointer-events-none absolute left-3.5 flex items-center justify-center text-muted-foreground/70 [&_svg]:size-4">
            {React.isValidElement(StartIcon) ? StartIcon : <StartIcon />}
          </div>
        )}
        {inputElement}
        {EndIcon && (
          <div className="absolute right-3 flex items-center justify-center text-muted-foreground/70 [&_svg]:size-4">
            {React.isValidElement(EndIcon) ? EndIcon : <EndIcon />}
          </div>
        )}
      </div>
      {typeof error === "string" && (
        <span className="text-xs font-medium text-destructive animate-in fade-in-50">
          {error}
        </span>
      )}
    </div>
  )
})

Input.displayName = "Input"

export { Input }
