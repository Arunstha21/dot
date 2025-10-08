"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Check, Download, Copy, FileJson, Badge, CheckCircle2, Loader2 } from "lucide-react"
import { checkPlayerData, getMatchData, updateGameData } from "@/server/game/match"
import { MatchDataDialog } from "./resultView/match-data-dialogue"
import { toast } from "sonner"
import type { MatchData, PlayerResult, TeamResult } from "@/server/game/game-type"
import MatchDataSelector from "./MatchDataSelector"
import CheckPlayerDataDialog from "./CheckPlayerData"

export default function MatchDataUploader() {
  const [matchNo, setMatchNo] = useState<string | undefined>(undefined)
  const [uploading, setUploading] = useState<boolean>(false)
  const [fetching, setFetching] = useState<boolean>(false)
  const [checking, setChecking] = useState<boolean>(false)
  const [copied, setCopied] = useState<boolean>(false)

  const [matchData, setMatchData] = useState<MatchData | null>(null)
  const [resultData, setResultData] = useState<{ teamResults: TeamResult[]; playerResults: PlayerResult[] } | null>(
    null,
  )
  const [isMatchDataUploaded, setIsMatchDataUploaded] = useState<boolean>(false)
  const [isMatchEnded, setIsMatchEnded] = useState<boolean>(false)
  const [event, setEvent] = useState<string>("")

  const [showPlayerDialog, setShowPlayerDialog] = useState<boolean>(false)
  const [unMatchedGameData, setUnMatchedGameData] = useState<{ playerName: string; uId: string }[]>([])
  const [unMatchedDbData, setUnMatchedDbData] = useState<{ playerName: string; uId: string }[]>([])

  const handleMatchDataUpload = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e: ProgressEvent<FileReader>) => {
        try {
          const result = e.target?.result
          if (typeof result === "string") {
            const jsonData: MatchData = JSON.parse(result)
            setMatchData(jsonData)
            // Check if match has ended
            const wwcd = jsonData.allinfo.TotalPlayerList.find((p) => p.rank === 1)
            setIsMatchEnded(!!wwcd)
            toast.success(`${jsonData.allinfo.TotalPlayerList.length} players loaded from file`)
          } else {
            toast.error("Error parsing JSON file")
            return
          }
        } catch (err) {
          console.log("Error parsing JSON file:", (err as Error).message)
          toast.error(`Error parsing JSON file: ${(err as Error).message}`)
          setIsMatchDataUploaded(false)
        }
      }
      reader.readAsText(file)
    }
  }

  const fetchMatchDataFromAPI = async () => {
    setFetching(true)
    setIsMatchEnded(false)
    try {
      const response = await fetch(`/api/matchdata/${event}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        if (response.status === 400) {
          toast.error("Match data is not set")
          return
        }
        toast.error("Failed to fetch match data")
        return
      }

      const data = (await response.json()) as MatchData
      console.log(data);
      
      const wwcd = data.allinfo.TotalPlayerList.find((p) => p.rank === 1)
      if (wwcd) {
        setIsMatchEnded(true)
      }
      setMatchData(data)
      toast.success(`${data.allinfo.TotalPlayerList.length} players loaded from API`)
    } catch (error) {
      console.error("Error fetching match data:", error)
      toast.error("Error fetching match data")
    } finally {
      setFetching(false)
    }
  }

  const checkMatchData = async (): Promise<void> => {
    if (!matchData || !matchNo) {
      toast.error("No match data or match number selected")
      return
    }

    setChecking(true)
    try {
      const res = await checkPlayerData(matchData, matchNo)
      if (res.status === "error") {
        toast.error(res.message)
      } else if (res.status === "success") {
        const unregisteredPlayersData = res.data?.unregisteredPlayersData
        if (unregisteredPlayersData) {
          setUnMatchedGameData(unregisteredPlayersData.gameData)
          setUnMatchedDbData(unregisteredPlayersData.dbData)
          setShowPlayerDialog(true)
        } else {
          toast.success("All players validated successfully!")
        }
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setChecking(false)
    }
  }

  const copyTotalPlayerList = () => {
    if (!matchData) {
      toast.error("No match data available to copy")
      return
    }

    if (!matchData.allinfo?.TotalPlayerList?.length) {
      toast.error("No player data available to copy")
      return
    }

    const players = matchData.allinfo.TotalPlayerList
    const allKeys = Object.keys(players[0])
    const keys = allKeys.filter((k) => k !== "location")

    const rows = players.map((player) =>
      keys
        .map((key) => {
          const value = player[key as keyof typeof player]
          return String(value).replace(/\t/g, " ").replace(/\n/g, " ")
        })
        .join("\t"),
    )

    const tsv = [keys.join("\t"), ...rows].join("\n")

    navigator.clipboard
      .writeText(tsv)
      .then(() => {
        setCopied(true)
        toast.success("Player data copied to clipboard!")
        setTimeout(() => setCopied(false), 3000)
      })
      .catch((err) => {
        console.error("Failed to copy:", err)
        toast.error("Failed to copy to clipboard")
      })
  }

  const uploadMatchData = (): void => {
    if (matchData) {
      sendMatchData(matchData)
    } else {
      toast.error("No match data found")
    }
  }

  const sendMatchData = async (data: MatchData): Promise<void> => {
    if (matchNo) {
      setUploading(true)
      await updateGameData(data, matchNo)
        .then((res) => {
          if (res.status === "error") {
            toast.error(res.message)
            setIsMatchDataUploaded(false)
          } else if (res.status === "success") {
            setIsMatchDataUploaded(true)
            toast.success("Match data uploaded successfully!")
          }
        })
        .catch((err) => {
          toast.error(err.message)
          setIsMatchDataUploaded(false)
        })
        .finally(() => {
          handleMatchChange(matchNo)
          setUploading(false)
        })
    }
  }

  const handleMatchChange = async (matchId: string) => {
    setResultData(null)
    setMatchNo(matchId)

    const resultsData = await getMatchData([matchId])
    if (!resultsData) {
      return
    }

    if (resultsData.matchExists) {
      setResultData(resultsData.data)
    }
  }

  useEffect(() => {
    if (matchNo && resultData) {
      setIsMatchDataUploaded(true)
    } else {
      setIsMatchDataUploaded(false)
    }
  }, [matchNo, resultData])

  useEffect(() => {
    setIsMatchEnded(false)
    setMatchData(null)
  }, [matchNo])

  const showUploadSection = matchNo && !isMatchDataUploaded
  const showMatchUpload = matchNo && matchData && isMatchEnded && !isMatchDataUploaded

  return (
<div className="space-y-6">
  {/* Match Data Uploader */}
  <Card className="w-full max-w-4xl mx-auto border-2 hover:border-primary/50 transition-colors">
    <CardHeader>
      <CardTitle>Match Data Uploader</CardTitle>
    </CardHeader>
    <CardContent>
      <MatchDataSelector
        handleMatchChange={handleMatchChange}
        setEvent={setEvent}
        event={event}
      />
    </CardContent>
  </Card>

  {/* Upload Section */}
  {showUploadSection && (
    <div className="space-y-4 w-full max-w-4xl mx-auto">
      <Card className="border-2 hover:border-primary/50 transition-colors">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <FileJson className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Data Source</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Choose how to load match data
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* File Upload */}
          <div className="space-y-3 rounded-lg border border-border/50 bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Upload from File</Label>
              {matchData && (
                <Badge className="status-badge">
                  <CheckCircle2 className="h-3 w-3" />
                  {matchData.allinfo.TotalPlayerList.length} players
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Input
                type="file"
                accept=".json,.txt"
                onChange={handleMatchDataUpload}
                id="file-upload"
                className="hidden"
              />
              <Label
                htmlFor="file-upload"
                className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <Upload className="mr-2 h-4 w-4" />
                Choose JSON File
              </Label>
              <span className="text-xs text-muted-foreground">
                {matchData ? "File loaded successfully" : "No file selected"}
              </span>
            </div>
          </div>

          <div className="section-divider" />

          {/* API Fetch */}
          <div className="space-y-3 rounded-lg border border-border/50 bg-muted/30 p-4">
            <Label className="text-sm font-medium">Fetch from API</Label>
            <Button
              onClick={fetchMatchDataFromAPI}
              disabled={fetching}
              className="w-full sm:w-auto transition-all duration-200 hover:scale-105 active:scale-95"
              variant="secondary"
            >
              {fetching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fetching...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Fetch Match Data
                </>
              )}
            </Button>
          </div>

          {/* API Info */}
          {!matchData && (
            <>
              <div className="section-divider" />
              <div className="space-y-3 rounded-lg border border-border/50 bg-muted/30 p-4">
                <Label className="text-sm font-medium">API Endpoint</Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    disabled
                    className="flex-1 justify-start font-mono text-xs bg-transparent"
                  >
                    <Upload className="mr-2 h-3.5 w-3.5" />
                    POST /api/matchdata/{event || "<event>"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(
                          `${window.location.origin}/api/matchdata/${event}`
                        )
                        toast.success("API link copied!")
                      } catch {
                        toast.error("Failed to copy link")
                      }
                    }}
                    disabled={!event}
                    className="transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Link
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground font-mono break-all">
                  {event
                    ? `${window.location.origin}/api/matchdata/${event}`
                    : "Select an event to view API endpoint"}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Data Actions */}
      {matchData && (
        <Card className="border-2 hover:border-primary/50 transition-colors border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Data Actions</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Validate and upload match data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={checkMatchData}
                disabled={checking}
                className="transition-all duration-200 hover:scale-105 active:scale-95"
                variant="secondary"
              >
                {checking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Validate Players
                  </>
                )}
              </Button>

              <Button
                onClick={copyTotalPlayerList}
                disabled={copied}
                variant="outline"
                className="bg-transparent transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <Copy className="mr-2 h-4 w-4" />
                {copied ? "Copied!" : "Copy Data"}
              </Button>

              {showMatchUpload && (
                <Button
                  onClick={uploadMatchData}
                  disabled={uploading}
                  className="transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Match Data
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )}

  {/* Success State */}
  {isMatchDataUploaded && resultData && (
    <div className="space-y-4 w-full max-w-4xl mx-auto">
      <Card className="border-2 hover:border-primary/50 transition-colors border-green-500/20 bg-green-500/5">
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10 border border-green-500/20">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="font-medium text-green-500">
                Match data uploaded successfully
              </p>
              <p className="text-xs text-muted-foreground">
                Data is now available in the system
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <MatchDataDialog data={resultData} loading={uploading} />
    </div>
  )}

  {/* Player Data Dialog */}
  <CheckPlayerDataDialog
    isOpen={showPlayerDialog}
    onOpenChange={setShowPlayerDialog}
    matchData={matchData}
    unMatchedGameData={unMatchedGameData}
    unMatchedDbData={unMatchedDbData}
    onUpdatePlayerData={setMatchData}
    checking={!isMatchEnded}
  />
</div>

    )
}
