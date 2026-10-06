import { cn } from "@/lib/utils"

/** Skeleton com shimmer (desativado com prefers-reduced-motion em styles/index.css). */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("shimmer rounded-md", className)}
      {...props}
    />
  )
}

export { Skeleton }
