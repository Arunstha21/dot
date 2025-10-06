"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Send } from "lucide-react"
import { TableConfig, TableData } from "@/discord/results/create"
import { IGuild } from "@/lib/database/guild"
import { sendDiscordResults } from "@/discord/results/send"
import { DiscordSetup } from "@/components/DiscordResultSetup"

interface SendToDiscordProps {
  stageId: string
  matchData: TableData
  matchTitle?: string
}

export function SendToDiscord({ stageId, matchData, matchTitle }: SendToDiscordProps) {
  const [open, setOpen] = useState(false)
  const [guild, setGuild] = useState<IGuild | null>(null)
  const [selectedChannel, setSelectedChannel] = useState<string>("")
  const [isReady, setIsReady] = useState(false)
  const [messageContent, setMessageContent] = useState("Match Results")
  const [sending, setSending] = useState(false)

  const [tableConfig, setTableConfig] = useState<TableConfig>({
    backgroundColor: "#FFFFFF",
    textColor: "#000000",
    headerColor: "#000000",
    borderColor: "#000000",
    fontSize: 24,
    headerFontSize: 24,
    titleFontSize: 32,
    fontFamily: "sans-serif",
    rowHeight: 50,
    padding: 20,
    borderWidth: 2,
  })

  const handleSetupComplete = (completedGuild: IGuild, channelId: string) => {
    setGuild(completedGuild)
    setSelectedChannel(channelId)
    setIsReady(true)
  }

  const handleSendResults = async () => {
    if (!guild || !selectedChannel) return

    setSending(true)
    try {
      const result = await sendDiscordResults(
        guild.guildId,
        selectedChannel,
        matchData,
        messageContent,
        matchTitle,
        tableConfig,
      )

      if (result.success) {
        alert("Results sent successfully!")
        setOpen(false)
      } else {
        alert(`Failed to send results: ${result.error}`)
      }
    } catch (error) {
      console.error("Error sending results:", error)
      alert("Failed to send results")
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 bg-transparent">
          <Send className="h-4 w-4" />
          Send to Discord
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Results to Discord</DialogTitle>
          <DialogDescription>Configure and send match results to your Discord server</DialogDescription>
        </DialogHeader>

        <DiscordSetup stageId={stageId} onSetupComplete={handleSetupComplete} onGuildChange={setGuild} />

        {isReady && guild && (
          <Tabs defaultValue="message" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="message">Message</TabsTrigger>
              <TabsTrigger value="customize">Customize Table</TabsTrigger>
            </TabsList>

            <TabsContent value="message" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="message-content">Message Content</Label>
                <Input
                  id="message-content"
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="Enter message to send with results..."
                />
              </div>

              <Button onClick={handleSendResults} disabled={sending} className="w-full gap-2">
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Results
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="customize" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bg-color">Background Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="bg-color"
                      type="color"
                      value={tableConfig.backgroundColor}
                      onChange={(e) => setTableConfig({ ...tableConfig, backgroundColor: e.target.value })}
                      className="w-16 h-10"
                    />
                    <Input
                      value={tableConfig.backgroundColor}
                      onChange={(e) => setTableConfig({ ...tableConfig, backgroundColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="text-color">Text Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="text-color"
                      type="color"
                      value={tableConfig.textColor}
                      onChange={(e) => setTableConfig({ ...tableConfig, textColor: e.target.value })}
                      className="w-16 h-10"
                    />
                    <Input
                      value={tableConfig.textColor}
                      onChange={(e) => setTableConfig({ ...tableConfig, textColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="header-color">Header Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="header-color"
                      type="color"
                      value={tableConfig.headerColor}
                      onChange={(e) => setTableConfig({ ...tableConfig, headerColor: e.target.value })}
                      className="w-16 h-10"
                    />
                    <Input
                      value={tableConfig.headerColor}
                      onChange={(e) => setTableConfig({ ...tableConfig, headerColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="border-color">Border Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="border-color"
                      type="color"
                      value={tableConfig.borderColor}
                      onChange={(e) => setTableConfig({ ...tableConfig, borderColor: e.target.value })}
                      className="w-16 h-10"
                    />
                    <Input
                      value={tableConfig.borderColor}
                      onChange={(e) => setTableConfig({ ...tableConfig, borderColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="font-size">Font Size</Label>
                  <Input
                    id="font-size"
                    type="number"
                    value={tableConfig.fontSize}
                    onChange={(e) => setTableConfig({ ...tableConfig, fontSize: Number(e.target.value) })}
                    min={12}
                    max={48}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="header-font-size">Header Font Size</Label>
                  <Input
                    id="header-font-size"
                    type="number"
                    value={tableConfig.headerFontSize}
                    onChange={(e) => setTableConfig({ ...tableConfig, headerFontSize: Number(e.target.value) })}
                    min={12}
                    max={48}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title-font-size">Title Font Size</Label>
                  <Input
                    id="title-font-size"
                    type="number"
                    value={tableConfig.titleFontSize}
                    onChange={(e) => setTableConfig({ ...tableConfig, titleFontSize: Number(e.target.value) })}
                    min={16}
                    max={64}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="row-height">Row Height</Label>
                  <Input
                    id="row-height"
                    type="number"
                    value={tableConfig.rowHeight}
                    onChange={(e) => setTableConfig({ ...tableConfig, rowHeight: Number(e.target.value) })}
                    min={30}
                    max={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="padding">Padding</Label>
                  <Input
                    id="padding"
                    type="number"
                    value={tableConfig.padding}
                    onChange={(e) => setTableConfig({ ...tableConfig, padding: Number(e.target.value) })}
                    min={5}
                    max={50}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="border-width">Border Width</Label>
                  <Input
                    id="border-width"
                    type="number"
                    value={tableConfig.borderWidth}
                    onChange={(e) => setTableConfig({ ...tableConfig, borderWidth: Number(e.target.value) })}
                    min={1}
                    max={10}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="font-family">Font Family</Label>
                  <Select
                    value={tableConfig.fontFamily}
                    onValueChange={(value) => setTableConfig({ ...tableConfig, fontFamily: value })}
                  >
                    <SelectTrigger id="font-family">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sans-serif">Sans Serif</SelectItem>
                      <SelectItem value="serif">Serif</SelectItem>
                      <SelectItem value="monospace">Monospace</SelectItem>
                      <SelectItem value="Arial">Arial</SelectItem>
                      <SelectItem value="Helvetica">Helvetica</SelectItem>
                      <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() =>
                  setTableConfig({
                    backgroundColor: "#FFFFFF",
                    textColor: "#000000",
                    headerColor: "#000000",
                    borderColor: "#000000",
                    fontSize: 24,
                    headerFontSize: 24,
                    titleFontSize: 32,
                    fontFamily: "sans-serif",
                    rowHeight: 50,
                    padding: 20,
                    borderWidth: 2,
                  })
                }
                className="w-full"
              >
                Reset to Defaults
              </Button>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}
