"use client"

import { useEffect } from "react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

/** Clicking a toast (anywhere but its own buttons, e.g. Undo) closes it, through its close button. */
function useClickToClose() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const toast = target.closest<HTMLElement>("[data-sonner-toast]")
      if (!toast || target.closest("button")) return
      toast.querySelector<HTMLButtonElement>("[data-close-button]")?.click()
    }
    document.addEventListener("click", onClick)
    return () => document.removeEventListener("click", onClick)
  }, [])
}

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()
  useClickToClose()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      // Each toast gets Sonner's close button (hidden); clicking the toast presses it (see useClickToClose)
      closeButton
      toastOptions={{
        classNames: {
          toast: "cn-toast cursor-pointer",
          closeButton: "!hidden",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
