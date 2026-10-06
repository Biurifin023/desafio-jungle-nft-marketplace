import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      containerAriaLabel="Notificações"
      icons={{
        success: <CircleCheckIcon className="size-4 text-success" />,
        info: <InfoIcon className="size-4 text-amber" />,
        warning: <TriangleAlertIcon className="size-4 text-amber" />,
        error: <OctagonXIcon className="size-4 text-coral" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--kurio-surface)",
          "--normal-text": "var(--kurio-text)",
          "--normal-border": "var(--kurio-border-strong)",
          "--border-radius": "6px",
          fontFamily: "var(--kurio-font-mono)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
