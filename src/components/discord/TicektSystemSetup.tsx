"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { getTicketConfig, getTicketDocuments, setupTicketConfig, toggleTicketStatus } from "@/server/actions/discord-actions"
import { ITicketConfig, ITicketDocument } from "@/lib/database/ticket"


interface TicketSystemSetupProps {
  guildId: string
  guildName: string
  channels: Array<{ id: string; name: string; type: number }>
  onSetupComplete?: () => void
}

export function TicketSystemSetup({ guildId, guildName, channels, onSetupComplete }: TicketSystemSetupProps) {
  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState<ITicketConfig | null>(null)
  const [tickets, setTickets] = useState<ITicketDocument[]>([])
  const [setupMode, setSetupMode] = useState(false)

  const [ticketChannelId, setTicketChannelId] = useState("")
  const [transcriptChannelId, setTranscriptChannelId] = useState("")
  const [categories, setCategories] = useState("")

  useEffect(() => {
    loadTicketConfig()
  }, [guildId])

  const loadTicketConfig = async () => {
    setLoading(true)
    try {
      const result = await getTicketConfig(guildId)
      if (result.success && result.config) {
        setConfig(result.config)
        loadTickets()
      } else {
        setConfig(null)
      }
    } catch (error) {
      console.error("Error loading ticket config:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadTickets = async () => {
    try {
      const result = await getTicketDocuments(guildId)
      if (result.success) {
        setTickets(result.tickets || [])
      }
    } catch (error) {
      console.error("Error loading tickets:", error)
    }
  }

  const handleSetup = async () => {
    if (!ticketChannelId || !transcriptChannelId) {
      toast.error("Please select both ticket and transcript channels")
      return
    }

    setLoading(true)
    try {
      const categoryArray = categories
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean)
      const result = await setupTicketConfig(guildId, ticketChannelId, transcriptChannelId, categoryArray)

      if (result.success) {
        toast.success("Ticket system configured successfully")
        setConfig(result.config)
        setSetupMode(false)
        if (onSetupComplete) onSetupComplete()
      } else {
        toast.error(result.error || "Failed to setup ticket system")
      }
    } catch (error) {
      toast.error("Error setting up ticket system")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async () => {
    if (!config) return

    setLoading(true)
    try {
      const result = await toggleTicketStatus(config._id as string, config.status !== "active")
      if (result.success) {
        toast.success(`Ticket system ${config.status === "active" ? "disabled" : "enabled"}`)
        loadTicketConfig()
      } else {
        toast.error(result.error || "Failed to toggle status")
      }
    } catch (error) {
      toast.error("Error toggling ticket status")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading && !config) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!config || setupMode) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-4">
              <p className="font-semibold">Setup Ticket System</p>
              <p>
                Configure the ticket system for <strong>{guildName}</strong>:
              </p>

              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="ticket-channel">Ticket Channel</Label>
                  <Select value={ticketChannelId} onValueChange={setTicketChannelId}>
                    <SelectTrigger id="ticket-channel">
                      <SelectValue placeholder="Select ticket channel..." />
                    </SelectTrigger>
                    <SelectContent>
                      {channels
                        .filter((ch) => ch.type === 0)
                        .map((channel) => (
                          <SelectItem key={channel.id} value={channel.id}>
                            # {channel.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Channel where users can create tickets</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transcript-channel">Transcript Channel</Label>
                  <Select value={transcriptChannelId} onValueChange={setTranscriptChannelId}>
                    <SelectTrigger id="transcript-channel">
                      <SelectValue placeholder="Select transcript channel..." />
                    </SelectTrigger>
                    <SelectContent>
                      {channels
                        .filter((ch) => ch.type === 0)
                        .map((channel) => (
                          <SelectItem key={channel.id} value={channel.id}>
                            # {channel.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Channel where ticket transcripts will be saved</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categories">Ticket Categories (Optional)</Label>
                  <Input
                    id="categories"
                    placeholder="e.g., Support, Bug Report, Feature Request"
                    value={categories}
                    onChange={(e) => setCategories(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Comma-separated list of ticket categories</p>
                </div>

                <Button onClick={handleSetup} disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    "Complete Setup"
                  )}
                </Button>

                {config && (
                  <Button variant="ghost" onClick={() => setSetupMode(false)} className="w-full">
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Alert>
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Ticket System Configured</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Ticket Channel:{" "}
                  <strong>
                    #{channels.find((ch) => ch.id === config.ticketChannel)?.name || config.ticketChannel}
                  </strong>
                </p>
                <p className="text-xs text-muted-foreground">
                  Transcript Channel:{" "}
                  <strong>
                    #{channels.find((ch) => ch.id === config.transcriptChannel)?.name || config.transcriptChannel}
                  </strong>
                </p>
              </div>
              <Badge variant={config.status === "active" ? "default" : "secondary"}>{config.status}</Badge>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="space-y-1">
                <Label htmlFor="ticket-toggle">Enable Ticket System</Label>
                <p className="text-xs text-muted-foreground">Allow users to create support tickets</p>
              </div>
              <Switch
                id="ticket-toggle"
                checked={config.status === "active"}
                onCheckedChange={handleToggleStatus}
                disabled={loading}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setSetupMode(true)}>
                Reconfigure
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Ticket Statistics</CardTitle>
              <CardDescription className="text-xs">Overview of ticket activity</CardDescription>
            </div>
            <Badge variant="outline" className="text-lg font-semibold">
              {config.ticketCount}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Total Tickets</p>
              <p className="text-2xl font-bold">{config.ticketCount}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Categories</p>
              <p className="text-2xl font-bold">{config?.ticketCategories?.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {tickets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Tickets</CardTitle>
            <CardDescription className="text-xs">Latest ticket activity</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.slice(0, 5).map((ticket) => (
                  <TableRow key={ticket._id as string}>
                    <TableCell className="font-medium">{ticket.user}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{ticket.ticketType}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={ticket.status === "open" ? "default" : "secondary"}>{ticket.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
