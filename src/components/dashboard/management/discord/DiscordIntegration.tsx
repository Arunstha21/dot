"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Loader2, MessageSquare, FileText, Activity, Users } from "lucide-react"
import { getAllGuilds, fetchDiscordChannels, GuildData } from "@/server/actions/discord-actions"
import { toast } from "sonner"
import { DiscordSetup } from "@/components/discord/ResultSetup"
import { MatchLoggerSetup } from "@/components/discord/MatchLoggerSetup"
import { TicketSystemSetup } from "@/components/discord/TicketSystemSetup"

interface DiscordIntegrationProps {
  eventName: string
  stageName: string
  stageId: string
}

type DiscordSubTab = "results" | "logger" | "tickets"

const DISCORD_SUB_TABS = [
  { value: "results" as const, label: "Results Setup", icon: MessageSquare },
  { value: "logger" as const, label: "Match Logger", icon: Activity },
  { value: "tickets" as const, label: "Ticket System", icon: FileText },
]

export default function DiscordIntegration({ eventName, stageName, stageId }: DiscordIntegrationProps) {
  const [activeSubTab, setActiveSubTab] = useState<DiscordSubTab>("results")
  const [guilds, setGuilds] = useState<GuildData | null>(null)
  const [loading, setLoading] = useState(true)
  const [channels, setChannels] = useState<Record<string, Array<{ id: string; name: string; type: number }>>>({})

  useEffect(() => {
    loadGuilds()
  }, [stageId])

  const loadGuilds = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAllGuilds(stageId)
      setGuilds(data)

      const result = await fetchDiscordChannels(data.guildId)

      if (result.success) {
        setChannels((prev) => ({ ...prev, [data.guildId]: result.channels }))
      }
    } catch (error) {
      toast.error("Failed to load Discord guilds")
      console.error("Error loading guilds:", error)
    } finally {
      setLoading(false)
    }
  }, [stageId])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Discord Management
          </CardTitle>
          <CardDescription>Manage Discord features across all connected servers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Discord Management
          </CardTitle>
          <CardDescription>
            Managing Discord features for {eventName} → {stageName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {guilds ? (
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-lg">{guilds.guildName}</div>
                <div className="text-xs text-muted-foreground mt-1">Guild ID: {guilds.guildId}</div>
              </div>
              <Badge variant="outline">Connected</Badge>
            </div>
          ) : (
            <div className="text-center py-8 space-y-2">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="font-semibold text-lg">No Discord Servers Connected</h3>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sub-tabs for Discord features */}
      {guilds && (
        <Tabs value={activeSubTab} onValueChange={(value) => setActiveSubTab(value as DiscordSubTab)} className="w-full">
          <TabsList className="grid w-full grid-cols-1 lg:grid-cols-3">
            {DISCORD_SUB_TABS.map((tab) => {
              const Icon = tab.icon
              return (
                <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
                </TabsTrigger>
              )
            })}
          </TabsList>

          {/* Results Setup Tab */}
          <TabsContent value="results" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Discord Results Setup
                </CardTitle>
                <CardDescription>
                  Configure the channel where match results will be posted for {guilds.guildName}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DiscordSetup
                  stageId={stageId}
                  onSetupComplete={() => loadGuilds()}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Match Logger Tab */}
          <TabsContent value="logger" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Match Logger
                </CardTitle>
                <CardDescription>
                  Track and log match events including starts, ends, and issues for {guilds.guildName}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MatchLoggerSetup
                  guildId={guilds.guildId}
                  guildName={guilds.guildName}
                  channels={channels[guilds.guildId] || []}
                  onSetupComplete={() => loadGuilds()}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ticket System Tab */}
          <TabsContent value="tickets" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Ticket System
                </CardTitle>
                <CardDescription>
                  Enable support ticket creation and management for your community on {guilds.guildName}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TicketSystemSetup
                  guildId={guilds.guildId}
                  guildName={guilds.guildName}
                  channels={channels[guilds.guildId] || []}
                  onSetupComplete={() => loadGuilds()}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Help Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Need Help?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>Discord Results Setup:</strong> Configure the channel where match results will be posted.
          </p>
          <p>
            <strong>Match Logger:</strong> Track and log match events including starts, ends, and issues.
          </p>
          <p>
            <strong>Ticket System:</strong> Enable support ticket creation and management for your community.
          </p>
          <p className="text-xs">
            <strong>Note:</strong> Role Manager features are now available on the dedicated Role Manager page.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
