"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { getMatchLogger, getMatchLogs, setupMatchLogger, toggleMatchLoggerStatus } from "@/server/actions/discord-actions"
import { IMatchLog, IMatchLogger } from "@/lib/database/matchLog"

interface MatchLoggerSetupProps {
  guildId: string
  guildName: string
  channels: Array<{ id: string; name: string; type: number }>
  onSetupComplete?: () => void
}

export function MatchLoggerSetup({ guildId, guildName, channels, onSetupComplete }: MatchLoggerSetupProps) {
  const [loading, setLoading] = useState(true)
  const [logger, setLogger] = useState<IMatchLogger | null>(null)
  const [logs, setLogs] = useState<IMatchLog[]>([])
  const [setupMode, setSetupMode] = useState(false)

  const [loggerChannelId, setLoggerChannelId] = useState("")

  useEffect(() => {
    loadMatchLogger()
  }, [guildId])

  const loadMatchLogger = async () => {
    setLoading(true)
    try {
      const result = await getMatchLogger(guildId)
      if (result.success && result.logger) {
        setLogger(result.logger)
        loadLogs()
      } else {
        setLogger(null)
      }
    } catch (error) {
      console.error("Error loading match logger:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadLogs = async () => {
    try {
      const result = await getMatchLogs(guildId)
      if (result.success) {
        setLogs(result.logs || [])
      }
    } catch (error) {
      console.error("Error loading match logs:", error)
    }
  }

  const handleSetup = async () => {
    if (!loggerChannelId) {
      toast.error("Please select a logger channel")
      return
    }

    setLoading(true)
    try {
      const result = await setupMatchLogger(guildId, loggerChannelId)

      if (result.success) {
        toast.success("Match logger configured successfully")
        setLogger(result.logger)
        setSetupMode(false)
        if (onSetupComplete) onSetupComplete()
      } else {
        toast.error(result.error || "Failed to setup match logger")
      }
    } catch (error) {
      toast.error("Error setting up match logger")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async () => {
    if (!logger) return

    setLoading(true)
    try {
      const result = await toggleMatchLoggerStatus(logger._id.toString(), !logger.active)
      if (result.success) {
        toast.success(`Match logger ${logger.active ? "disabled" : "enabled"}`)
        loadMatchLogger()
      } else {
        toast.error(result.error || "Failed to toggle status")
      }
    } catch (error) {
      toast.error("Error toggling match logger status")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading && !logger) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!logger || setupMode) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-4">
              <p className="font-semibold">Setup Match Logger</p>
              <p>
                Configure match logging for <strong>{guildName}</strong>:
              </p>

              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="logger-channel">Logger Channel</Label>
                  <Select value={loggerChannelId} onValueChange={setLoggerChannelId}>
                    <SelectTrigger id="logger-channel">
                      <SelectValue placeholder="Select logger channel..." />
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
                  <p className="text-xs text-muted-foreground">Channel where match events will be logged</p>
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

                {logger && (
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
                <p className="font-semibold">Match Logger Configured</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Logger Channel:{" "}
                  <strong>
                    #{channels.find((ch) => ch.id === logger.loggerChannelId)?.name || logger.loggerChannelId}
                  </strong>
                </p>
              </div>
              <Badge variant={logger.active ? "default" : "secondary"}>{logger.active ? "Active" : "Inactive"}</Badge>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="space-y-1">
                <Label htmlFor="logger-toggle">Enable Match Logger</Label>
                <p className="text-xs text-muted-foreground">Log match events to Discord channel</p>
              </div>
              <Switch
                id="logger-toggle"
                checked={logger.active}
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

      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Match Logs</CardTitle>
            <CardDescription className="text-xs">Latest match activity</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Match ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Players</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.slice(0, 5).map((log) => (
                  <TableRow key={log._id.toString()}>
                    <TableCell className="font-medium">{log.matchId}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          log.logType === "issue"
                            ? "destructive"
                            : log.logType === "match_start"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {log.logType.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">{log.region.replace("_", " ")}</TableCell>
                    <TableCell>{log.noOfPlayers}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(log.time).toLocaleString()}
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
