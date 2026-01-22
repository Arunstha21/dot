"use client"

import React, { useState, useEffect } from "react"
import { Loader2, Search, Shield, UserCheck, UserX, Mail, MoreHorizontal, Download, Upload, Plus, Pencil, Trash2, AlertCircle } from "lucide-react"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import Link from "next/link"
import {
  getRoleManagerPlayers,
  getRoleManagerStats,
  resendVerificationEmail,
  manualVerifyPlayer,
  removePlayerFromRoleManager,
  type RoleManagerPlayerData,
  type RoleManagerStats,
} from "@/server/actions/roleManager"
import { getAllGuilds, type GuildData } from "@/server/actions/discord-actions"
import { PlayerEditPanel } from "./PlayerEditPanel"
import { AddPlayerDialog } from "./AddPlayerDialog"
import { PlayerStatusBadge } from "./PlayerStatusBadge"
import { BulkActionsBar } from "./BulkActionsBar"
import { DiscordServerCard } from "@/components/shared/DiscordServerCard"
import { RoleManagerBulkImport } from "./RoleManagerBulkImport"

interface RoleManagerPageProps {
  stageId: string
  stageName: string
}

export function RoleManagerPage({ stageId, stageName }: RoleManagerPageProps) {
  const [players, setPlayers] = useState<RoleManagerPlayerData[]>([])
  const [stats, setStats] = useState<RoleManagerStats | null>(null)
  const [guild, setGuild] = useState<GuildData | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [verificationFilter, setVerificationFilter] = useState<"all" | "verified" | "unverified" | "pending">("all")
  const [serverFilter, setServerFilter] = useState<"all" | "joined" | "not-joined">("all")
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [editingPlayer, setEditingPlayer] = useState<RoleManagerPlayerData | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showBulkImportDialog, setShowBulkImportDialog] = useState(false)

  const loadPlayers = async () => {
    setLoading(true)
    try {
      const [playersResult, statsResult, guildResult] = await Promise.all([
        getRoleManagerPlayers(stageId, {
          search: search || undefined,
          verificationStatus: verificationFilter,
          serverStatus: serverFilter,
        }),
        getRoleManagerStats(stageId),
        getAllGuilds(stageId).catch(() => null),
      ])

      if (playersResult.success && playersResult.players) {
        setPlayers(playersResult.players)
      }

      if (statsResult.success && statsResult.stats) {
        setStats(statsResult.stats)
      }

      if (guildResult) {
        setGuild(guildResult)
      }
    } catch (error) {
      console.error("Error loading players:", error)
      toast.error("Failed to load players")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPlayers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageId, search, verificationFilter, serverFilter])

  const handleResendEmail = async (playerId: string) => {
    const result = await resendVerificationEmail(playerId)
    if (result.status === "success") {
      toast.success(result.message || "Email sent successfully")
      await loadPlayers()
    } else {
      toast.error(result.message || "Failed to send email")
    }
  }

  const handleManualVerify = async (playerId: string) => {
    const result = await manualVerifyPlayer(playerId)
    if (result.status === "success") {
      toast.success(result.message || "Player verified successfully")
      await loadPlayers()
    } else {
      toast.error(result.message || "Failed to verify player")
    }
  }

  const handleRemovePlayer = async (playerId: string) => {
    if (!confirm("Are you sure you want to remove this player?")) return

    const result = await removePlayerFromRoleManager(playerId)
    if (result.status === "success") {
      toast.success(result.message || "Player removed successfully")
      await loadPlayers()
      setSelectedPlayers(selectedPlayers.filter((id) => id !== playerId))
    } else {
      toast.error(result.message || "Failed to remove player")
    }
  }

  const togglePlayerSelection = (playerId: string) => {
    setSelectedPlayers((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    )
  }

  const toggleAllSelection = () => {
    if (selectedPlayers.length === players.length) {
      setSelectedPlayers([])
    } else {
      setSelectedPlayers(players.map((p) => p._id))
    }
  }

  const downloadCSVTemplate = () => {
    const headers = [
      "eventstageuid",
      "discordTag",
      "teamName",
      "emailId",
      "guildId",
      "guildName",
      "teamTag",
      "rolePlayer",
      "roleOwner",
      "roleExtra",
    ]
    const csvContent = headers.join(",")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "role-manager-template.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("CSV template downloaded successfully")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Role Manager - {stageName}
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage player verification and Discord roles
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadCSVTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
          <Button variant="outline" onClick={() => setShowBulkImportDialog(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Bulk Import
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <UserCheck className="h-4 w-4 mr-2" />
            Add Player
          </Button>
        </div>
      </div>

      {/* Setup Section - Show when no users */}
      {players.length === 0 && !loading && (
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
                <h3 className="text-lg font-semibold">Setup Required</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Complete the setup process to start managing user roles
                </p>
                <div className="mt-4 space-y-2 text-sm">
                  <p className="font-medium">Setup Steps:</p>
                  <ol className="list-decimal list-inside space-y-2 text-xs text-muted-foreground">
                    <li>Download the CSV template file</li>
                    <li>
                      Fill in the details with the following columns:
                      <ul className="list-disc list-inside ml-4 mt-1 space-y-0.5">
                        <li>eventstageuid, discordTag, teamName</li>
                        <li>emailId, guildId, guildName, teamTag</li>
                        <li>rolePlayer, roleOwner, roleExtra</li>
                      </ul>
                    </li>
                    <li>Save the file as CSV format</li>
                    <li>Upload the file in the Data Import section</li>
                  </ol>
                </div>
                <div className="flex flex-col gap-2 mt-4">
                  <Button onClick={downloadCSVTemplate} variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Download CSV Template
                  </Button>
                  <Button onClick={() => setShowBulkImportDialog(true)} variant="default" className="w-full">
                    <Upload className="h-4 w-4 mr-2" />
                    Bulk Import Players
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {stats && players.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-card rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Total Players</div>
            <div className="text-2xl font-bold">{stats.totalPlayers}</div>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Verified</div>
            <div className="text-2xl font-bold text-green-600">{stats.verifiedPlayers}</div>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Unverified</div>
            <div className="text-2xl font-bold text-red-600">{stats.unverifiedPlayers}</div>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Pending</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.emailSentPlayers}</div>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Joined Server</div>
            <div className="text-2xl font-bold text-blue-600">{stats.joinedServerPlayers}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      {players.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or team..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={verificationFilter} onValueChange={(v: any) => setVerificationFilter(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Verification Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="unverified">Unverified</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Select value={serverFilter} onValueChange={(v: any) => setServerFilter(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Server Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="joined">Joined</SelectItem>
              <SelectItem value="not-joined">Not Joined</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedPlayers.length > 0 && (
        <BulkActionsBar
          selectedCount={selectedPlayers.length}
          onClearSelection={() => setSelectedPlayers([])}
          onRefresh={loadPlayers}
          stageId={stageId}
          playerIds={selectedPlayers}
        />
      )}

      {/* Players Table */}
      {players.length > 0 && (
        <div className="bg-card rounded-lg border">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : players.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <UserX className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No players found</h3>
              <p className="text-muted-foreground">
                {search || verificationFilter !== "all" || serverFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Add players to get started"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <input
                      type="checkbox"
                      checked={selectedPlayers.length === players.length}
                      onChange={toggleAllSelection}
                      className="cursor-pointer"
                    />
                  </TableHead>
                  <TableHead>Discord Tag</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Server</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.map((player) => (
                  <TableRow
                    key={player._id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setEditingPlayer(player)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedPlayers.includes(player._id)}
                        onChange={() => togglePlayerSelection(player._id)}
                        className="cursor-pointer"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{player.userName}</TableCell>
                    <TableCell>{player.email}</TableCell>
                    <TableCell>{player.team?.name || "-"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {player.role.slice(0, 2).map((role) => (
                          <Badge key={role} variant="outline" className="text-xs">
                            {role}
                          </Badge>
                        ))}
                        {player.role.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{player.role.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <PlayerStatusBadge player={player} />
                    </TableCell>
                    <TableCell>
                      {player.serverJoined ? (
                        <Badge variant="default" className="bg-green-600">
                          Joined
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Not Joined</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingPlayer(player)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit Player
                          </DropdownMenuItem>
                          {!player.serverJoined && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleResendEmail(player._id)}
                              >
                                <Mail className="h-4 w-4 mr-2" />
                                Resend Email
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleManualVerify(player._id)}
                              >
                                <UserCheck className="h-4 w-4 mr-2" />
                                Manual Verify
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleRemovePlayer(player._id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove Player
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {/* Edit Panel */}
      {editingPlayer && (
        <PlayerEditPanel
          player={editingPlayer}
          open={!!editingPlayer}
          onOpenChange={(open) => !open && setEditingPlayer(null)}
          onUpdate={loadPlayers}
        />
      )}

      {/* Add Player Dialog */}
      <AddPlayerDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        stageId={stageId}
        onPlayerAdded={loadPlayers}
      />

      {/* Bulk Import Dialog */}
      <RoleManagerBulkImport
        open={showBulkImportDialog}
        onOpenChange={setShowBulkImportDialog}
        stageId={stageId}
        onImportComplete={loadPlayers}
      />
    </div>
  )
}

export default RoleManagerPage
