import { Sidebar } from "@/components/dashboard/sidebar"
import ProfileDropDown from "@/components/profileDropDown"
import { EventSelectionProvider, EmailConfigurationProvider, EventDataProvider } from "@/contexts"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <EventSelectionProvider>
      <EmailConfigurationProvider>
        <EventDataProvider>
          <div className="flex h-screen overflow-hidden bg-background">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Header */}
              <header className="flex items-center justify-between px-4 py-3 border-b bg-background">
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-lg">Dashboard</span>
                </div>
                <ProfileDropDown page="dashboard" />
              </header>

              {/* Page Content */}
              <main className="flex-1 overflow-auto">
                {children}
              </main>
            </div>
          </div>
        </EventDataProvider>
      </EmailConfigurationProvider>
    </EventSelectionProvider>
  )
}
