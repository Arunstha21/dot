"use client"

import { useState, useEffect } from "react"
import { Loader2, Key, Download, Upload, Search, Copy, Eye, EyeOff, ChevronDown, ChevronUp, Send, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  getTeamsWithGAC,
  updatePlayerGAC,
  deletePlayerGAC,
  exportAllTeamsGAC,
  exportTeamGAC,
  copyPlayerGAC,
  copyTeamGAC,
  sendGACToDiscord,
  sendSingleTeamGACToDiscord,
  type TeamGACData,
  type PlayerGACData,
} from "@/server/actions/gac"
import { getAllGuilds, type GuildData } from "@/server/actions/discord-actions"
import { GACEditDialog } from "./GACEditDialog"
import { GACBulkImport } from "./GACBulkImport"
import { GACBulkEditDialog } from "./GACBulkEditDialog"
import { DiscordServerCard } from "@/components/shared/DiscordServerCard"

interface GACPageProps {
  stageId: string
  stageName: string
}

export function GACPage({ stageId, stageName }: GACPageProps) {
  const [teams, setTeams] = useState<TeamGACData[]>([])
  const [guild, setGuild] = useState<GuildData | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set())
  const [showPasswords, setShowPasswords] = useState<Set<string>>(new Set())
  const [editingPlayer, setEditingPlayer] = useState<{ teamId: string; player: PlayerGACData } | null>(null)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [exportData, setExportData] = useState("")
  const [showSendAllDialog, setShowSendAllDialog] = useState(false)
  const [sendingTeamId, setSendingTeamId] = useState<string | null>(null)
  const [showBulkEditDialog, setShowBulkEditDialog] = useState(false)
  const [bulkEditTeamId, setBulkEditTeamId] = useState<string | null>(null)


  const loadTeams = async () => {
    setLoading(true)
    try {
      const [result, guildResult] = await Promise.all([
        getTeamsWithGAC(stageId),
        getAllGuilds(stageId).catch(() => null),
      ])
      if (result.success && result.teams) {
        setTeams(result.teams)
        // Auto-expand all teams
        setExpandedTeams(new Set(result.teams.map((t) => t._id)))
      } else {
        toast.error(result.error || "Failed to load teams")
      }

      if (guildResult) {
        setGuild(guildResult)
      }
    } catch (error) {
      console.error("Error loading teams:", error)
      toast.error("Failed to load teams")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTeams()
  }, [stageId])

  const toggleTeamExpansion = (teamId: string) => {
    setExpandedTeams((prev) => {
      const next = new Set(prev)
      if (next.has(teamId)) {
        next.delete(teamId)
      } else {
        next.add(teamId)
      }
      return next
    })
  }

  const togglePasswordVisibility = (playerId: string) => {
    setShowPasswords((prev) => {
      const next = new Set(prev)
      if (next.has(playerId)) {
        next.delete(playerId)
      } else {
        next.add(playerId)
      }
      return next
    })
  }

  const handleCopyPlayerGAC = async (playerId: string, playerName: string) => {
    const result = await copyPlayerGAC(playerId)
    if (result.success && result.data) {
      await navigator.clipboard.writeText(result.data)
      toast.success(`Copied ${playerName}'s credentials`)
    } else {
      toast.error(result.error || "Failed to copy credentials")
    }
  }

  const handleCopyTeamGAC = async (teamId: string, teamName: string) => {
    const result = await copyTeamGAC(teamId)
    if (result.success && result.data) {
      await navigator.clipboard.writeText(result.data)
      toast.success(`Copied ${teamName} credentials`)
    } else {
      toast.error(result.error || "Failed to copy credentials")
    }
  }

  const handleExportAll = async () => {
    const result = await exportAllTeamsGAC(stageId)
    if (result.success && result.data) {
      setExportData(result.data)
      setShowExportDialog(true)
    } else {
      toast.error(result.error || "Failed to export data")
    }
  }

  const handleExportTeam = async (teamId: string, teamName: string) => {
    const result = await exportTeamGAC(teamId)
    if (result.success && result.data) {
      const blob = new Blob([result.data], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${teamName}-gac.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success(`Exported ${teamName} data`)
    } else {
      toast.error(result.error || "Failed to export data")
    }
  }

  const handleDownloadExport = () => {
    const blob = new Blob([exportData], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "all-teams-gac.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setShowExportDialog(false)
  }

  const handleSendAllToDiscord = async () => {
    const result = await sendGACToDiscord(stageId)
    if (result.success) {
      toast.success(result.message || "Sent GAC credentials to Discord")
      setShowSendAllDialog(false)
    } else {
      toast.error(result.error || "Failed to send to Discord")
    }
  }

  const handleSendTeamToDiscord = async (teamId: string, teamName: string) => {
    setSendingTeamId(teamId)
    const result = await sendSingleTeamGACToDiscord(teamId)
    if (result.success) {
      toast.success(result.message || `Sent ${teamName} credentials to Discord`)
    } else {
      toast.error(result.error || "Failed to send to Discord")
    }
    setSendingTeamId(null)
  }

  const handleOpenBulkEdit = (teamId: string) => {
    setBulkEditTeamId(teamId)
    setShowBulkEditDialog(true)
  }

  // Filter teams based on search
  const filteredTeams = teams.filter((team) => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      team.name.toLowerCase().includes(searchLower) ||
      team.players.some(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          (p.gacUsername && p.gacUsername.toLowerCase().includes(searchLower))
      )
    )
  })

  // Count total players and players with GAC data
  const totalPlayers = teams.reduce((sum, team) => sum + team.players.length, 0)
  const playersWithGAC = teams.reduce(
    (sum, team) => sum + team.players.filter((p) => p.gacUsername && p.gacPassword).length,
    0
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Key className="h-6 w-6" />
            GAC Management - {stageName}
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage Garena Account Credentials for all teams
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImportDialog(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Bulk Import
          </Button>
          <Button variant="outline" onClick={handleExportAll}>
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
          {playersWithGAC > 0 && (
            <Button variant="default" onClick={() => setShowSendAllDialog(true)}>
              <Send className="h-4 w-4 mr-2" />
              Send All to Discord
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Total Teams</div>
          <div className="text-2xl font-bold">{teams.length}</div>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Total Players</div>
          <div className="text-2xl font-bold">{totalPlayers}</div>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">GAC Credentials Set</div>
          <div className="text-2xl font-bold">{playersWithGAC}</div>
        </div>
        {playersWithGAC > 0 && (
          <DiscordServerCard
            guildName={guild?.guildName}
            guildId={guild?.guildId}
            connected={!!guild}
            className="p-4"
          />
        )}
      </div>

      {/* Setup Section - Show when no GAC credentials */}
      {playersWithGAC === 0 && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Discord Server Card */}
          <DiscordServerCard
            guildName={guild?.guildName}
            guildId={guild?.guildId}
            connected={!!guild}
          />

          {/* Setup Instructions */}
          <div className="bg-card rounded-lg border border-dashed p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-amber-500 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold">GAC Credentials Setup Required</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Add Garena Account credentials for players to access game accounts
                </p>
                <div className="mt-4 space-y-2 text-sm">
                  <p className="font-medium">What are GAC Credentials?</p>
                  <p className="text-xs text-muted-foreground">
                    GAC (Garena Account) credentials include username and password for game accounts.
                    These can be bulk imported or added individually for each player.
                  </p>
                  <p className="font-medium mt-3">Setup Steps:</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs text-muted-foreground">
                    <li>Download the CSV template or use Bulk Import</li>
                    <li>Fill in player UID, GAC username, and password</li>
                    <li>Import via Bulk Import dialog</li>
                  </ol>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={() => setShowImportDialog(true)} variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Bulk Import
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search teams, players, or usernames..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Teams List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Key className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No teams found</h3>
            <p className="text-muted-foreground">
              {search ? "Try adjusting your search" : "No teams available for this stage"}
            </p>
          </div>
        ) : (
          filteredTeams.map((team) => (
            <Collapsible key={team._id} open={expandedTeams.has(team._id)} onOpenChange={() => toggleTeamExpansion(team._id)}>
              <div className="bg-card rounded-lg border overflow-hidden">
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer w-full">
                    <div className="flex items-center gap-4">
                      {expandedTeams.has(team._id) ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div>
                        <h3 className="font-semibold text-lg">{team.name}</h3>
                        <p className="text-sm text-muted-foreground">Tag: {team.tag}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary">{team.players.length} players</Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCopyTeamGAC(team._id, team.name)
                        }}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy All
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleExportTeam(team._id, team.name)
                        }}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Export
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenBulkEdit(team._id)
                        }}
                      >
                        Bulk Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSendTeamToDiscord(team._id, team.name)
                        }}
                        disabled={sendingTeamId === team._id}
                      >
                        {sendingTeamId === team._id ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4 mr-1" />
                        )}
                        Send to Discord
                      </Button>
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="border-t">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="px-4 py-3">Player Name</TableHead>
                          <TableHead className="px-4 py-3">UID</TableHead>
                          <TableHead className="px-4 py-3">In-Game Name</TableHead>
                          <TableHead className="px-4 py-3">GAC Username</TableHead>
                          <TableHead className="px-4 py-3">GAC Password</TableHead>
                          <TableHead className="px-4 py-3">Email</TableHead>
                          <TableHead className="px-4 py-3 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {team.players.map((player) => (
                          <TableRow key={player._id}>
                            <TableCell className="px-4 py-3 font-medium">{player.name}</TableCell>
                            <TableCell className="px-4 py-3">
                              <code className="text-sm bg-muted px-2 py-1 rounded">{player.uid}</code>
                            </TableCell>
                            <TableCell className="px-4 py-3">{player.gacIngameName || "-"}</TableCell>
                            <TableCell className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <code className="text-sm bg-muted px-2 py-1 rounded">
                                  {player.gacUsername || "-"}
                                </code>
                                {player.gacUsername && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                    onClick={() => {
                                      navigator.clipboard.writeText(player.gacUsername!)
                                      toast.success("Copied username")
                                    }}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <code className="text-sm bg-muted px-2 py-1 rounded">
                                  {player.gacPassword && showPasswords.has(player._id)
                                    ? player.gacPassword
                                    : player.gacPassword
                                    ? "••••••••"
                                    : "-"}
                                </code>
                                {player.gacPassword && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                    onClick={() => togglePasswordVisibility(player._id)}
                                  >
                                    {showPasswords.has(player._id) ? (
                                      <EyeOff className="h-3 w-3" />
                                    ) : (
                                      <Eye className="h-3 w-3" />
                                    )}
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3">{player.email || "-"}</TableCell>
                            <TableCell className="px-4 py-3 text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingPlayer({ teamId: team._id, player })}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleCopyPlayerGAC(player._id, player.name)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      {editingPlayer && (
        <GACEditDialog
          player={editingPlayer.player}
          open={!!editingPlayer}
          onOpenChange={(open) => !open && setEditingPlayer(null)}
          onUpdate={loadTeams}
        />
      )}

      {/* Import Dialog */}
      <GACBulkImport
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        stageId={stageId}
        onImportComplete={loadTeams}
      />

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Export All GAC Data</DialogTitle>
            <DialogDescription>
              CSV data for all teams and players. Click download to save.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-auto">
            <pre className="text-xs bg-muted p-4 rounded-md">{exportData}</pre>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              Close
            </Button>
            <Button onClick={handleDownloadExport}>
              <Download className="h-4 w-4 mr-2" />
              Download CSV
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send All Confirmation Dialog */}
      <Dialog open={showSendAllDialog} onOpenChange={setShowSendAllDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send All GAC Credentials to Discord?</DialogTitle>
            <DialogDescription>
              This will send GAC credentials for all teams with credentials to Discord.
              The credentials will be visible to anyone with access to the channel.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              ⚠️ Security Warning
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
              GAC credentials contain sensitive information. Only send to private, secure channels.
              These credentials should not be shared publicly.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendAllDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendAllToDiscord}>
              <Send className="h-4 w-4 mr-2" />
              Send to Discord
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Edit Dialog */}
      {showBulkEditDialog && bulkEditTeamId && (
        <GACBulkEditDialog
          teamId={bulkEditTeamId}
          open={showBulkEditDialog}
          onOpenChange={(open) => {
            setShowBulkEditDialog(open)
            if (!open) setBulkEditTeamId(null)
          }}
          onUpdate={loadTeams}
        />
      )}
    </div>
  )
}

export default GACPage
