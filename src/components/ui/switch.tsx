"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-input/80 inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all duration-300 ease-out outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        "hover:shadow-md hover:scale-105",
        "data-[state=checked]:shadow-md data-[state=checked]:shadow-primary/25",
        "active:scale-95",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "bg-background dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary-foreground pointer-events-none block size-4 rounded-full ring-0 transition-all duration-300 ease-out data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0",
          "data-[state=checked]:scale-110 data-[state=unchecked]:scale-100",
          "data-[state=checked]:shadow-sm"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
