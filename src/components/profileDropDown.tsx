"use client"

import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { LayoutDashboard, LogOut, Settings, Shield, User } from "lucide-react"
import ThemeToggle from "./theme-toggle"

export default function ProfileDropDown({ page }: { page: "dashboard" | "settings" }) {
  const { data } = useSession()
  const user = data?.user as any

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 bg-transparent">
          <User className="h-4 w-4" />
          <span className="max-w-[120px] truncate">{user?.name || "Profile"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>{user?.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          {page === "dashboard" ? (<Link href="/settings">
            <Settings className="mr-2 h-4 w-4" /> Settings
          </Link>): (<Link href="/dashboard/new">
            <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
          </Link>)}
        </DropdownMenuItem>
        {user?.superUser && (
          <DropdownMenuItem asChild>
            <Link href="/admin/users">
              <Shield className="mr-2 h-4 w-4" /> Admin: Users
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5">
          <ThemeToggle />
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
