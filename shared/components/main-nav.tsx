"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home } from "lucide-react"

import { cn } from "@/lib/utils"

export function MainNav() {
  const pathname = usePathname()

  return (
    <div className="mr-4 flex">
      <Link
        href="/"
        className={cn(
          "flex items-center text-sm font-medium transition-colors hover:text-purple-500",
          pathname === "/" ? "text-purple-500" : "text-zinc-400",
        )}
      >
        <Home className="mr-2 h-4 w-4" />
        Home
      </Link>
    </div>
  )
}

