"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Check, Download, Copy } from "lucide-react"
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
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Match Data Uploader</CardTitle>
      </CardHeader>
      <CardContent>
        <MatchDataSelector handleMatchChange={handleMatchChange} setEvent={setEvent} event={event} />

        {showUploadSection && (
          <div className="space-y-4">
            <Label>Match Data</Label>

            <div className="space-y-4 p-4 border rounded-lg">
              <h3 className="font-medium">Upload from File</h3>
              <div className="flex items-center space-x-4">
                <Input
                  type="file"
                  accept=".json,.txt"
                  onChange={handleMatchDataUpload}
                  id="file-upload"
                  className="hidden"
                />
                <Label
                  htmlFor="file-upload"
                  className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Choose file
                </Label>
                <span className="text-sm text-muted-foreground">
                  {matchData ? `${matchData.allinfo.TotalPlayerList.length} players loaded` : "No file chosen"}
                </span>
              </div>
            </div>

            <div className="space-y-4 p-4 border rounded-lg">
              <h3 className="font-medium">Fetch from API</h3>
                <Button onClick={fetchMatchDataFromAPI} disabled={fetching}>
                <Download className="mr-2 h-4 w-4" />
                {fetching ? "Fetching..." : "Fetch Match Data"}
                </Button>
              </div>

              { matchData ? null : (<div className="space-y-4 p-4 border rounded-lg">
                <h3 className="font-medium">Send Match Data to API</h3>
                <div className="flex items-center gap-2">
                <Button variant="outline" disabled>
                  <Upload className="mr-2 h-4 w-4" />
                  POST {`/api/matchdata/${event || "<event>"}`}
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(`${window.location.origin}/api/matchdata/${event}`)
                    toast.success("API link copied!")
                  } catch {
                    toast.error("Failed to copy link")
                  }
                  }}
                  disabled={!event}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy API Link
                </Button>
                </div>
                <div className="text-xs text-muted-foreground break-all">
                {event ? `${window.location.origin}/api/matchdata/${event}` : "No event selected"}
                </div>
              </div>)}

            {matchData && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <h3 className="font-medium">Actions</h3>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={checkMatchData} disabled={checking}>
                    <Check className="mr-2 h-4 w-4" />
                    {checking ? "Checking..." : "Validate Players"}
                  </Button>

                  <Button onClick={copyTotalPlayerList} disabled={copied} variant="outline">
                    <Copy className="mr-2 h-4 w-4" />
                    {copied ? "Copied!" : "Copy Data"}
                  </Button>

                  {showMatchUpload && (
                    <Button onClick={uploadMatchData} disabled={uploading}>
                      <Upload className="mr-2 h-4 w-4" />
                      {uploading ? "Uploading..." : "Upload Match Data"}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {isMatchDataUploaded && resultData && (
          <>
            <MatchDataDialog data={resultData} loading={uploading} />
            <div className="mt-4 p-4 bg-green-100 text-green-800 rounded-md flex items-center">
              <Check className="mr-2 h-5 w-5" />
              <span>Match data successfully uploaded!</span>
            </div>
          </>
        )}

        <CheckPlayerDataDialog
          isOpen={showPlayerDialog}
          onOpenChange={setShowPlayerDialog}
          matchData={matchData}
          unMatchedGameData={unMatchedGameData}
          unMatchedDbData={unMatchedDbData}
          onUpdatePlayerData={setMatchData}
          checking={!isMatchEnded}
        />
      </CardContent>
    </Card>
  )
}
