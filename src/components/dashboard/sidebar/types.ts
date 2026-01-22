export interface SidebarNavItem {
  value: string
  label: string
  icon: string
  category: "action" | "management"
}

export interface SidebarSection {
  title: string
  items: SidebarNavItem[]
}
