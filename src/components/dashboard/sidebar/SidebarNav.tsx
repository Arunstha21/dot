"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Mail,
  MailPlus,
  FileSpreadsheet,
  BarChart3,
  Calendar,
  Users,
  Trophy,
  MessageSquare,
  Shield,
  Key
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { SidebarNavItem as SidebarNavItemType } from "./types"

interface SidebarNavProps {
  onClose?: () => void
}

const ICONS = {
  "mail": Mail,
  "mail-plus": MailPlus,
  "file-spreadsheet": FileSpreadsheet,
  "bar-chart": BarChart3,
  "calendar": Calendar,
  "users": Users,
  "trophy": Trophy,
  "message-square": MessageSquare,
  "shield": Shield,
  "key": Key,
}

const ACTION_ITEMS: SidebarNavItemType[] = [
  { value: "compose-new", label: "Compose New", icon: "mail-plus", category: "action" },
  { value: "compose-event", label: "Compose for Event", icon: "mail", category: "action" },
  { value: "import-data", label: "Import Data", icon: "file-spreadsheet", category: "action" },
  { value: "results", label: "Results", icon: "bar-chart", category: "action" },
]

const MANAGEMENT_ITEMS: SidebarNavItemType[] = [
  { value: "events", label: "Events", icon: "calendar", category: "management" },
  { value: "teams", label: "Teams & Players", icon: "users", category: "management" },
  { value: "matches", label: "Matches", icon: "trophy", category: "management" },
  { value: "discord", label: "Discord", icon: "message-square", category: "management" },
  { value: "role-manager", label: "Role Manager", icon: "shield", category: "management" },
  { value: "gac", label: "GAC", icon: "key", category: "management" },
]

function SidebarNavItem({ item, isActive, onClick }: {
  item: SidebarNavItemType
  isActive: boolean
  onClick?: () => void
}) {
  const Icon = ICONS[item.icon as keyof typeof ICONS]

  return (
    <Link
      href={`/dashboard/${item.value}`}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
        "hover:bg-accent",
        isActive
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {Icon && <Icon className="h-4 w-4" />}
      <span>{item.label}</span>
    </Link>
  )
}

export function SidebarNav({ onClose }: SidebarNavProps) {
  const pathname = usePathname()
  const currentView = pathname.split("/").pop() || "compose-new"

  return (
    <nav className="flex flex-col h-full gap-6 p-4">
      {/* Actions Section */}
      <div>
        <div className="flex items-center gap-2 mb-3 px-3">
          <Badge variant="secondary" className="text-xs font-semibold">
            ACTIONS
          </Badge>
        </div>
        <div className="space-y-1">
          {ACTION_ITEMS.map((item) => (
            <SidebarNavItem
              key={item.value}
              item={item}
              isActive={currentView === item.value}
              onClick={onClose}
            />
          ))}
        </div>
      </div>

      {/* Management Section */}
      <div>
        <div className="flex items-center gap-2 mb-3 px-3">
          <Badge variant="secondary" className="text-xs font-semibold">
            MANAGEMENT
          </Badge>
        </div>
        <div className="space-y-1">
          {MANAGEMENT_ITEMS.map((item) => (
            <SidebarNavItem
              key={item.value}
              item={item}
              isActive={currentView === item.value}
              onClick={onClose}
            />
          ))}
        </div>
      </div>
    </nav>
  )
}
