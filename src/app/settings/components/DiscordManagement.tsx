"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2, MessageSquare, FileText, Activity, Users } from "lucide-react"
import { getAllGuilds, toggleTicketConfigAction, toggleMatchLoggerAction } from "@/server/actions/discord-actions"
import { toast } from "sonner"
import { IRoleManagerUser } from "@/lib/database/schema"


interface Guild {
  _id: string
  guildId: string
  guildName: string
  ticketConfig?: {
    _id: string
    status: "active" | "inactive"
    ticketChannel: string
    transcriptChannel: string
    ticketCount: number
  }
  matchLogger?: {
    _id: string
    active: boolean
    loggerChannelId: string
  }
  resultChannel?: string
  roleManager?: boolean
  users?: any[]
  admins?: any[]
}

export default function DiscordManagement({
  eventName,
  stageName,
}: {
  eventName: string
  stageName: string
}) {
  const [guilds, setGuilds] = useState<Guild[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    loadGuilds()
  }, [])

  const loadGuilds = async () => {
    setLoading(true)
    try {
      const data = await getAllGuilds()
      setGuilds(data)
    } catch (error) {
      toast.error("Failed to load Discord guilds")
      console.error("Error loading guilds:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleTicketConfig = async (guild: Guild) => {
    if (!guild.ticketConfig) {
      toast.error("Ticket system is not configured for this guild")
      return
    }

    setUpdating(`ticket-${guild._id}`)
    const formData = new FormData()
    formData.append("ticketConfigId", guild.ticketConfig._id)
    formData.append("active", String(guild.ticketConfig.status !== "active"))

    try {
      const result = await toggleTicketConfigAction({ status: "success" }, formData)
      if (result.status === "success") {
        toast.success(result.message)
        loadGuilds()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error("Failed to toggle ticket system")
      console.error("Error toggling ticket system:", error)
    } finally {
      setUpdating(null)
    }
  }

  const handleToggleRoleManager = async (guild: Guild) => {
    setUpdating(`role-${guild._id}`)
    try {
      // Simulate an API call to toggle role manager
      // In a real application, you would call an action similar to toggleTicketConfigAction
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success(`Role Manager ${guild.roleManager ? "disabled" : "enabled"}`)
      loadGuilds()
    } catch (error) {
      toast.error("Failed to toggle Role Manager")
      console.error("Error toggling Role Manager:", error)
    } finally {
      setUpdating(null)
    }
  }

  const handleToggleMatchLogger = async (guild: Guild) => {
    if (!guild.matchLogger) {
      toast.error("Match logger is not configured for this guild")
      return
    }

    setUpdating(`logger-${guild._id}`)
    const formData = new FormData()
    formData.append("matchLoggerId", guild.matchLogger._id)
    formData.append("active", String(!guild.matchLogger.active))

    try {
      const result = await toggleMatchLoggerAction({ status: "success" }, formData)
      if (result.status === "success") {
        toast.success(result.message)
        loadGuilds()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error("Failed to toggle match logger")
      console.error("Error toggling match logger:", error)
    } finally {
      setUpdating(null)
    }
  }

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
          {guilds.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="font-semibold text-lg">No Discord Servers Connected</h3>
                <p className="text-muted-foreground text-sm mt-2">
                  Connect a Discord server in Events Management to enable Discord features
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {guilds.map((guild) => (
                <Card key={guild._id} className="border-2">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{guild.guildName}</CardTitle>
                        <CardDescription className="text-xs mt-1">Guild ID: {guild.guildId}</CardDescription>
                      </div>
                      <Badge variant="outline">Connected</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Discord Results Setup */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold">Discord Results Setup</h4>
                      </div>
                      <div className="pl-6 space-y-2">
                        {guild.resultChannel ? (
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm">Results Channel Configured</p>
                              <p className="text-xs text-muted-foreground">Channel ID: {guild.resultChannel}</p>
                            </div>
                            <Badge variant="secondary">Active</Badge>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">Not configured</p>
                            <Badge variant="outline">Inactive</Badge>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Configure in Events Management → Select Stage → Discord Results Setup
                        </p>
                      </div>
                    </div>

                    <Separator />

                    {/* Match Logger */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold">Match Logger</h4>
                      </div>
                      <div className="pl-6 space-y-2">
                        {guild.matchLogger ? (
                          <>
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <Label htmlFor={`match-logger-${guild._id}`}>Enable Match Logger</Label>
                                <p className="text-xs text-muted-foreground">Log match events to Discord channel</p>
                              </div>
                              <Switch
                                id={`match-logger-${guild._id}`}
                                checked={guild.matchLogger.active}
                                onCheckedChange={() => handleToggleMatchLogger(guild)}
                                disabled={updating === `logger-${guild._id}`}
                              />
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1">
                              <p>Logger Channel: {guild.matchLogger.loggerChannelId}</p>
                              <p>
                                Status:{" "}
                                <Badge variant={guild.matchLogger.active ? "default" : "secondary"} className="text-xs">
                                  {guild.matchLogger.active ? "Active" : "Inactive"}
                                </Badge>
                              </p>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">Not configured</p>
                            <Badge variant="outline">Inactive</Badge>
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Ticket Config */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold">Ticket System</h4>
                      </div>
                      <div className="pl-6 space-y-2">
                        {guild.ticketConfig ? (
                          <>
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <Label htmlFor={`ticket-config-${guild._id}`}>Enable Ticket System</Label>
                                <p className="text-xs text-muted-foreground">Allow users to create support tickets</p>
                              </div>
                              <Switch
                                id={`ticket-config-${guild._id}`}
                                checked={guild.ticketConfig.status === "active"}
                                onCheckedChange={() => handleToggleTicketConfig(guild)}
                                disabled={updating === `ticket-${guild._id}`}
                              />
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1">
                              <p>Ticket Channel: {guild.ticketConfig.ticketChannel}</p>
                              <p>Transcript Channel: {guild.ticketConfig.transcriptChannel}</p>
                              <p>Total Tickets: {guild.ticketConfig.ticketCount}</p>
                              <p>
                                Status:{" "}
                                <Badge
                                  variant={guild.ticketConfig.status === "active" ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {guild.ticketConfig.status}
                                </Badge>
                              </p>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">Not configured</p>
                            <Badge variant="outline">Inactive</Badge>
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Role Manager Config */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold">Role Manager</h4>
                      </div>
                      <div className="pl-6 space-y-2">
                        {guild.roleManager ? (
                          <>
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <Label htmlFor={`role-manager-${guild._id}`}>Enable Role Manager</Label>
                                <p className="text-xs text-muted-foreground">Allow automatic role assignments & management</p>
                              </div>
                              <Switch
                                id={`role-manager-${guild._id}`}
                                checked={guild.roleManager}
                                onCheckedChange={() => handleToggleRoleManager(guild)}
                                disabled={updating === `role-${guild._id}`}
                              />
                            </div>

                            <div className="text-xs text-muted-foreground space-y-1">
                              <p>
                                Total Users:{" "}
                                <Badge variant="outline" className="text-xs">
                                  {guild.users?.length || 0}
                                </Badge>
                              </p>
                              <p>
                                Total Admins:{" "}
                                <Badge variant="outline" className="text-xs">
                                  {guild.admins?.length || 0}
                                </Badge>
                              </p>

                              <div className="space-y-1">
                                <p className="font-semibold">Recent Users:</p>
                                {guild.users && guild.users.length > 0 ? (
                                  guild.users.slice(0, 3).map((user: IRoleManagerUser) => (
                                    <div key={user._id.toString()} className="flex items-center justify-between">
                                      <span>{user.userName} ({user.email})</span>
                                      <Badge variant="secondary" className="text-xs">
                                        {user.role?.join(", ") || "No role"}
                                      </Badge>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-muted-foreground text-xs">No users found</p>
                                )}
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">Not configured</p>
                            <Badge variant="outline">Inactive</Badge>
                          </div>
                        )}
                      </div>
                    </div>

                  </CardContent>
                </Card>
              ))}
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
            <strong>Discord Results Setup:</strong> Configure in Events Management by selecting a stage and setting up
            the Discord integration.
          </p>
          <p>
            <strong>Match Logger & Ticket System:</strong> These features are automatically detected if configured in
            your Discord bot. Toggle them on/off here.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
