"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Loader2, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react"
import type { IGuild } from "@/lib/database/guild"
import {
  checkDiscordSetup,
  fetchDiscordChannels,
  getDiscordClientId,
  selectDiscordChannel,
  setupGuildForStage,
} from "@/server/actions/discord-actions"

interface DiscordSetupProps {
  stageId: string
  onSetupComplete?: (guild: IGuild, channelId: string) => void
  onGuildChange?: (guild: IGuild | null) => void
}

type SetupStep = "no-guild" | "no-channel" | "no-bot" | "ready"

export function DiscordSetup({ stageId, onSetupComplete, onGuildChange }: DiscordSetupProps) {
  const [loading, setLoading] = useState(false)
  const [setupStep, setSetupStep] = useState<SetupStep>("no-guild")
  const [guild, setGuild] = useState<IGuild | null>(null)
  const [channels, setChannels] = useState<Array<{ id: string; name: string; type: number }>>([])
  const [selectedChannel, setSelectedChannel] = useState<string>("")

  const [guildId, setGuildId] = useState("")
  const [guildName, setGuildName] = useState("")
  const [setupError, setSetupError] = useState<string | null>(null)
  const [discordClientId, setDiscordClientId] = useState<string>("")

  const BOT_INVITE_URL = `https://discord.com/oauth2/authorize?client_id=${discordClientId}&permissions=1133584&scope=bot`

  useEffect(() => {
    const fetchClientId = async () => {
      const clientId = await getDiscordClientId()
      setDiscordClientId(clientId)
    }
    fetchClientId()
  }, [])

  useEffect(() => {
    checkSetup()
  }, [stageId])

  const prevGuildId = useRef<string | null>(null)

  useEffect(() => {
    if (guild && guild._id !== prevGuildId.current) {
      prevGuildId.current = String(guild._id)
      onGuildChange?.(guild)
    }
  }, [guild])

  const checkSetup = async () => {
    setLoading(true)
    try {
      const result = await checkDiscordSetup(stageId)

      if (!result.success) {
        console.error("Setup check failed:", result.error)
        setSetupStep("no-guild")
        setGuild(null)
        setLoading(false)
        return
      }

      setSetupStep(result.setupStep)
      setGuild(result.guild)
      setChannels(result.channels || [])

      if (result.setupStep === "ready" && result.guild && result.selectedChannel) {
        setSelectedChannel(result.selectedChannel)
      }
    } catch (error) {
      console.error("Error checking setup:", error)
      setSetupStep("no-guild")
      setGuild(null)
    } finally {
      setLoading(false)
    }
  }

  const handleGuildSetup = async () => {
    if (!guildId.trim() || !guildName.trim()) {
      setSetupError("Please enter both Guild ID and Guild Name")
      return
    }

    setLoading(true)
    setSetupError(null)

    try {
      const result = await setupGuildForStage(stageId, guildId.trim(), guildName.trim())

      if (!result.success) {
        setSetupError(result.error || "Failed to setup guild")
        setLoading(false)
        return
      }

      setGuild(result.guild)
      await checkSetup()
    } catch (error) {
      console.error("Error setting up guild:", error)
      setSetupError(error instanceof Error ? error.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const handleChannelSelect = async (channelId: string) => {
    if (!guild) return

    setSelectedChannel(channelId)
    setLoading(true)

    try {
      const result = await selectDiscordChannel(String(guild._id), channelId)

      if (!result.success) {
        console.error("Failed to select channel:", result.error)
        return
      }

      setSetupStep("ready")

      if (onSetupComplete) {
        onSetupComplete(guild, channelId)
      }
    } catch (error) {
      console.error("Error selecting channel:", error)
    } finally {
      setLoading(false)
    }
  }

  const refreshChannels = async () => {
    if (!guild) return

    setLoading(true)
    try {
      const result = await fetchDiscordChannels(guild.guildId)
      if (result.success) {
        setChannels(result.channels)
        setSetupStep("no-channel")
      }
    } catch (error) {
      console.error("Error refreshing channels:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {setupStep === "no-guild" && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-4">
              <p className="font-semibold">Connect Discord Server</p>
              <p>To send results to Discord, connect your server to this stage:</p>

              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="guild-id">Discord Server ID</Label>
                  <Input
                    id="guild-id"
                    placeholder="Enter your Discord server ID"
                    value={guildId}
                    onChange={(e) => setGuildId(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enable Developer Mode in Discord, right-click your server, and select &quot;Copy Server ID&quot;
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guild-name">Discord Server Name</Label>
                  <Input
                    id="guild-name"
                    placeholder="Enter your Discord server name"
                    value={guildName}
                    onChange={(e) => setGuildName(e.target.value)}
                  />
                </div>

                {setupError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{setupError}</AlertDescription>
                  </Alert>
                )}

                <Button onClick={handleGuildSetup} disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    "Connect Server"
                  )}
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {setupStep === "no-bot" && guild && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-4">
              <p className="font-semibold">Bot Not Found in Server</p>
              <p>
                The bot is not present in <strong>{guild.guildName}</strong>. Follow these steps:
              </p>
              <ol className="list-decimal list-inside space-y-3 ml-2">
                <li>
                  <strong>Invite the bot to your server</strong>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-2 gap-2 bg-transparent"
                    onClick={() => window.open(BOT_INVITE_URL, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Invite Bot
                  </Button>
                </li>
                <li>
                  <strong>Grant the bot permissions</strong>
                  <ul className="list-disc list-inside ml-4 mt-1 text-sm text-muted-foreground">
                    <li>Send Messages</li>
                    <li>Attach Files</li>
                    <li>View Channels</li>
                    <li>Read Message History</li>
                  </ul>
                </li>
                <li>
                  <strong>Refresh this dialog</strong>
                  <Button variant="outline" size="sm" className="ml-2 bg-transparent" onClick={checkSetup}>
                    Refresh
                  </Button>
                </li>
              </ol>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {setupStep === "no-channel" && guild && channels.length > 0 && (
        <div className="space-y-4">
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Bot is connected to <strong>{guild.guildName}</strong>! Now select a channel for results.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="channel-select">Select Results Channel</Label>
            <Select value={selectedChannel} onValueChange={handleChannelSelect}>
              <SelectTrigger id="channel-select">
                <SelectValue placeholder="Choose a channel..." />
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
          </div>
        </div>
      )}

      {setupStep === "ready" && guild && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p>
                Discord setup complete for <strong>{guild.guildName}</strong>
              </p>
              <p className="text-sm text-muted-foreground">
                Results will be sent to:{" "}
                <strong>#{channels.find((ch) => ch.id === selectedChannel)?.name || selectedChannel}</strong>
              </p>
              <Button variant="ghost" size="sm" onClick={refreshChannels}>
                Change Channel
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
