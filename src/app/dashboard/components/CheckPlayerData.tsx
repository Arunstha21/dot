"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { MatchData } from "@/server/game/game-type"
import { useState } from "react"
import { toast } from "sonner"

interface CheckPlayerDataDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  matchData: MatchData | null
  unMatchedGameData: { playerName: string; uId: string }[]
  unMatchedDbData: { playerName: string; uId: string }[]
  onUpdatePlayerData: (updatedMatchData: MatchData) => void
  checking?: boolean
}

export default function CheckPlayerDataDialog({
  isOpen,
  onOpenChange,
  matchData,
  unMatchedGameData,
  unMatchedDbData,
  onUpdatePlayerData,
  checking = false,
}: CheckPlayerDataDialogProps) {
  const [updatePlayerData, setUpdatePlayerData] = useState<Record<string, string>>({})

  const handlePlayerSelect = (gamePlayerId: string, dbPlayerId: string) => {
    setUpdatePlayerData((prev) => ({
      ...prev,
      [gamePlayerId]: dbPlayerId,
    }))
  }

  const updatePlayerDataHandler = () => {
    if (!matchData) {
      toast.error("No match data found")
      return
    }

    const updatePlayersData = matchData.allinfo.TotalPlayerList.map((player) => {
      if (updatePlayerData[player.uId]) {
        return {
          ...player,
          uId: Number(updatePlayerData[player.uId]),
        }
      }
      return player
    })

    if (updatePlayersData) {
      const updatedMatchData = {
        allinfo: {
          ...matchData.allinfo,
          TotalPlayerList: updatePlayersData,
        },
      }
      onUpdatePlayerData(updatedMatchData)
      toast.success("Player data updated successfully")
      onOpenChange(false)
      setUpdatePlayerData({})
    } else {
      toast.error("No players selected for update")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Unmatched Player Data</DialogTitle>
          <div className="text-sm text-muted-foreground">
            {unMatchedGameData.length} unmatched players found in game data.
            <br />
            Total players in game data: {matchData?.allinfo.TotalPlayerList.length || 0}
          </div>
        </DialogHeader>

        {unMatchedGameData.length > 0 ? (
          <div className="space-y-2">
            {unMatchedGameData.map((player) => (
              <div key={player.uId} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="flex-1 min-w-0">
                  {checking ? (
                    <span className="font-medium block truncate">
                      {player.playerName} <span className="text-sm text-muted-foreground">UID: {player.uId}</span>
                    </span>
                  ) : (
                    <>
                      <span className="font-medium block truncate">{player.playerName}</span>
                      <span className="text-sm text-muted-foreground">UID: {player.uId}</span>
                    </>
                  )}
                </div>
                {!checking && (
                  <div className="w-48">
                    <Select
                      value={updatePlayerData[player.uId] || ""}
                      onValueChange={(value) => handlePlayerSelect(player.uId, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Player" />
                      </SelectTrigger>
                      <SelectContent>
                        {unMatchedDbData.map((dbPlayer) => (
                          <SelectItem
                            key={dbPlayer.uId}
                            value={dbPlayer.uId}
                            disabled={Object.values(updatePlayerData).includes(dbPlayer.uId)}
                          >
                            {dbPlayer.playerName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            ))}
            {!checking && (
              <Button className="mt-4" onClick={updatePlayerDataHandler}>
                Update Player Data
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">No unmatched players found.</div>
        )}
      </DialogContent>
    </Dialog>
  )
}
