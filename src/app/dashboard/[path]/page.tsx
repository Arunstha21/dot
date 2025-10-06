"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import New from "../components/new"
import Event from "../components/event"
import ImportData from "../components/import"
import ResultTabs from "../components/resultView/resultsTab"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import ProfileDropDown from "@/components/profileDropDown"

export default function Task() {
  const pathname = usePathname()
  const currentPath = pathname.split("/").pop()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleTabChange = (value: string) => {
    router.push(`/dashboard/${value}`)
    setIsMobileMenuOpen(false)
  }

  const tabItems = [
    { value: "new", label: "Compose New", component: <New /> },
    { value: "event", label: "Compose for Event", component: <Event /> },
    { value: "import", label: "Import Data", component: <ImportData /> },
    { value: "results", label: "Results", component: <ResultTabs /> },
  ]

  return (
    <div className="container mx-auto px-4 py-4 sm:py-8">
      <div className="flex flex-col sm:flex-row justify-between mb-4 sm:mb-8">
        <div className="flex justify-between items-center mb-4 sm:mb-0">
          <Button variant="ghost" className="sm:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <Menu className="h-6 w-6" />
          </Button>
          <div className="flex justify-end sm:hidden">
            <ProfileDropDown page="dashboard" />
          </div>
        </div>
      </div>

      <Tabs defaultValue={currentPath} onValueChange={handleTabChange} className="w-full">
        <div className="flex justify-between items-center">
          <TabsList
            className={`grid w-full gap-2 ${isMobileMenuOpen ? "grid-cols-2" : "hidden"} sm:grid sm:grid-cols-4`}
          >
            {tabItems.map((item) => (
              <TabsTrigger
                key={item.value}
                value={item.value}
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full h-full text-sm font-medium"
              >
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="hidden sm:flex justify-end ml-4">
            <ProfileDropDown page="dashboard" />
          </div>
        </div>
        <div className="lg:px-16">
          {tabItems.map((item) => (
            <TabsContent key={item.value} value={item.value}>
              {item.component}
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  )
}
