"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Loader2, MessageSquare, FileText, Activity, Users } from "lucide-react"
import { getAllGuilds, fetchDiscordChannels, GuildData } from "@/server/actions/discord-actions"
import { toast } from "sonner"
import { DiscordSetup } from "@/components/discord/ResultSetup"
import { MatchLoggerSetup } from "@/components/discord/MatchLoggerSetup"
import { TicketSystemSetup } from "@/components/discord/TicketSystemSetup"
import { RoleManagerSetup } from "@/components/discord/RoleManagerSetup"

export default function DiscordManagement({
  eventName,
  stageName,
  stageId,
}: {
  eventName: string
  stageName: string
  stageId: string
}) {
  const [guilds, setGuilds] = useState<GuildData | null>(null)
  const [loading, setLoading] = useState(true)
  const [channels, setChannels] = useState<Record<string, Array<{ id: string; name: string; type: number }>>>({})

  useEffect(() => {
    loadGuilds()
  }, [])

  const loadGuilds = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAllGuilds(stageId)
      setGuilds(data)

      const result = await fetchDiscordChannels(data.guildId)
      console.log("Fetched channels:", result);
      
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
            <div className="space-y-6">
                <Card key={guilds._id} className="border-2">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{guilds.guildName}</CardTitle>
                        <CardDescription className="text-xs mt-1">Guild ID: {guilds.guildId}</CardDescription>
                      </div>
                      <Badge variant="outline">Connected</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold">Discord Results Setup</h4>
                      </div>
                      <div className="pl-6">
                        <DiscordSetup
                          stageId={stageId}
                          onSetupComplete={() => loadGuilds()}
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold">Match Logger</h4>
                      </div>
                      <div className="pl-6">
                        <MatchLoggerSetup
                          guildId={guilds.guildId}
                          guildName={guilds.guildName}
                          channels={channels[guilds.guildId] || []}
                          onSetupComplete={() => loadGuilds()}
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold">Ticket System</h4>
                      </div>
                      <div className="pl-6">
                        <TicketSystemSetup
                          guildId={guilds.guildId}
                          guildName={guilds.guildName}
                          channels={channels[guilds.guildId] || []}
                          onSetupComplete={() => loadGuilds()}
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold">Role Manager</h4>
                      </div>
                      <div className="pl-6">
                        <RoleManagerSetup
                          guild={guilds._id}
                          guildName={guilds.guildName}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
            </div>
          ) : (
            <div className="text-center py-12 space-y-4">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="font-semibold text-lg">No Discord Servers Connected</h3>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
          <p>
            <strong>Role Manager:</strong> Automatically assign and manage Discord roles for your users.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
