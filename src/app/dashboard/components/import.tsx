"use client"

import type React from "react"
import { ImportDataDB, type ScheduleData } from "@/server/database"
import { useState, useCallback } from "react"
import * as XLSX from "xlsx"
import MatchDataUploader from "./matchUploader"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileSpreadsheet, CheckCircle2, Loader2, Calendar, Users, MessageSquare } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type EventImportRow = {
  event: string
  stage: string
  group: string
  slot: number
  team: string
  players: { name: string; uid: string; email?: string }[]
}

type DiscordData = {
  event: string
  stage: string
  discordTag: string
  teamName: string
  emailId: string
  guildId: string
  guildName: string
  teamTag: string
  rolePlayer: string
  roleOwner: string
  roleExtra?: string
}

type DataType = "event" | "schedule" | "discordRoleData"

export default function ImportData() {
  const [data, setData] = useState<EventImportRow[] | ScheduleData[] | DiscordData[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [detectedType, setDetectedType] = useState<DataType | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState<string>("")

  const detectDataType = (headers: string[]): DataType | null => {
    const headerSet = new Set(headers.map((h) => h.toLowerCase().trim()))

    // Check for Discord data indicators
    const hasDiscordFields = ["discordtag", "guildid", "guildname", "roleplayer", "roleowner"].every((col) =>
      headerSet.has(col),
    )

    // Check for event data indicators (player columns)
    const hasPlayerColumns = ["name1", "uid1", "name2", "uid2"].some((col) => headerSet.has(col))
    const hasEventFields = ["slot", "team"].every((col) => headerSet.has(col))

    // Check for schedule data indicators
    const hasScheduleFields = ["matchno", "map", "starttime", "date"].every((col) => headerSet.has(col))

    if (hasDiscordFields) {
      return "discordRoleData"
    } else if (hasPlayerColumns && hasEventFields) {
      return "event"
    } else if (hasScheduleFields) {
      return "schedule"
    }

    return null
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const processFile = (file: File) => {
    const toastLoadingId = toast.loading("Analyzing file...")
    setFileName(file.name)

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result
      if (typeof content === "string") {
        if (file.name.endsWith(".csv")) {
          parseCSV(content, toastLoadingId)
        } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
          parseExcel(content, toastLoadingId)
        }
      }
    }
    reader.readAsBinaryString(file)
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      processFile(file)
    }
  }, [])

  const validateData = (parsedData: any[], type: DataType): boolean => {
    if (type === "event") {
      return parsedData.every((item) => {
        const hasBaseFields =
          "event" in item && "stage" in item && "group" in item && "slot" in item && "team" in item && "email" in item

        const players = extractPlayers(item)
        const hasValidPlayers =
          players.length >= 3 &&
          players.length <= 6 &&
          players.every((player) => "name" in player && "uid" in player && "email" in player)

        return hasBaseFields && hasValidPlayers
      })
    } else if (type === "schedule") {
      return parsedData.every(
        (item) =>
          "event" in item &&
          "stage" in item &&
          "group" in item &&
          "matchNo" in item &&
          "map" in item &&
          "startTime" in item &&
          "date" in item,
      )
    } else if (type === "discordRoleData") {
      return parsedData.every(
        (item) =>
          "event" in item &&
          "stage" in item &&
          "discordTag" in item &&
          "teamName" in item &&
          "emailId" in item &&
          "guildId" in item &&
          "guildName" in item &&
          "teamTag" in item &&
          "rolePlayer" in item &&
          "roleOwner" in item,
      )
    }
    return false
  }

  const extractPlayers = (row: Record<string, any>) => {
    const players = []
    for (let i = 1; i <= 6; i++) {
      const name = row[`name${i}`]
      const uid = row[`uid${i}`]
      const email = row[`email${i}`]
      if (name && uid) {
        players.push({ name, uid, email })
      }
    }
    return players
  }

  const parseCSV = (content: string, toastLoadingId: string | number): void => {
    try {
      const lines = content.split("\n").filter((l) => l.trim().length > 0)
      const headers = (lines[0]?.split(",") || []).map((h) => h.trim())

      const type = detectDataType(headers)
      if (!type) {
        toast.error("Could not detect data type. Please check your file format.")
        toast.dismiss(toastLoadingId)
        return
      }

      setDetectedType(type)

      const rows = lines.slice(1).map((line) => {
        const values = line.split(",")
        return headers.reduce<Record<string, string>>((obj, header, index) => {
          obj[header] = (values[index] ?? "").trim()
          return obj
        }, {})
      })

      if (rows.length > 0 && validateData(rows, type)) {
        if (type === "event") {
          const normalized: EventImportRow[] = rows.map((row) => ({
            event: String(row.event || ""),
            stage: String(row.stage || ""),
            group: String(row.group || ""),
            slot: Number(row.slot || "0"),
            team: String(row.team || ""),
            tag: String(row.tag || ""),
            email: String(row.email || ""),
            players: extractPlayers(row),
          }))
          setData(normalized)
          toast.success(`Detected Event Data: ${normalized.length} records parsed`)
        } else if (type === "schedule") {
          const normalized: ScheduleData[] = rows.map((row) => ({
            event: String(row.event || ""),
            stage: String(row.stage || ""),
            group: String(row.group || ""),
            matchNo: Number(row.matchNo || "0"),
            map: String(row.map || ""),
            startTime: String(row.startTime || ""),
            date: String(row.date || ""),
            overallMatchNo: Number(row.omNo || "0"),
          }))
          setData(normalized)
          toast.success(`Detected Schedule Data: ${normalized.length} records parsed`)
        } else if (type === "discordRoleData") {
          const normalized: DiscordData[] = rows.map((row) => ({
            event: String(row.event || ""),
            stage: String(row.stage || ""),
            discordTag: String(row.discordTag || ""),
            teamName: String(row.teamName || ""),
            emailId: String(row.emailId || ""),
            guildId: String(row.guildId || ""),
            guildName: String(row.guildName || ""),
            teamTag: String(row.teamTag || ""),
            rolePlayer: String(row.rolePlayer || ""),
            roleOwner: String(row.roleOwner || ""),
            roleExtra: String(row.roleExtra || ""),
          }))
          setData(normalized)
          toast.success(`Detected Discord Data: ${normalized.length} records parsed`)
        }
      } else {
        toast.error(`Invalid ${type} data format`)
      }
    } catch (err: any) {
      console.log(err)
      toast.error("Failed to parse CSV file")
    } finally {
      toast.dismiss(toastLoadingId)
    }
  }

  const parseExcel = (content: string, toastLoadingId: string | number): void => {
    try {
      const workbook = XLSX.read(content, { type: "binary" })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet)

      if (rows.length === 0) {
        toast.error("File is empty")
        toast.dismiss(toastLoadingId)
        return
      }

      const headers = Object.keys(rows[0])
      const type = detectDataType(headers)

      if (!type) {
        toast.error("Could not detect data type. Please check your file format.")
        toast.dismiss(toastLoadingId)
        return
      }

      setDetectedType(type)

      if (rows.length > 0 && validateData(rows, type)) {
        if (type === "event") {
          const normalized: EventImportRow[] = rows.map((row) => ({
            event: String(row.event || ""),
            stage: String(row.stage || ""),
            group: String(row.group || ""),
            slot: Number(row.slot || 0),
            team: String(row.team || ""),
            tag: String(row.tag || ""),
            email: String(row.email || ""),
            players: extractPlayers(row),
          }))
          setData(normalized)
          toast.success(`Detected Event Data: ${normalized.length} records parsed`)
        } else if (type === "schedule") {
          const normalized: ScheduleData[] = rows.map((row) => ({
            event: String(row.event || ""),
            stage: String(row.stage || ""),
            group: String(row.group || ""),
            matchNo: Number(row.matchNo || 0),
            map: String(row.map || ""),
            startTime: String(row.startTime || ""),
            date: String(row.date || ""),
            overallMatchNo: Number(row.omNo || "0"),
          }))
          setData(normalized)
          toast.success(`Detected Schedule Data: ${normalized.length} records parsed`)
        } else if (type === "discordRoleData") {
          const normalized: DiscordData[] = rows.map((row) => ({
            event: String(row.event || ""),
            stage: String(row.stage || ""),
            discordTag: String(row.discordTag || ""),
            teamName: String(row.teamName || ""),
            emailId: String(row.emailId || ""),
            guildId: String(row.guildId || ""),
            guildName: String(row.guildName || ""),
            teamTag: String(row.teamTag || ""),
            rolePlayer: String(row.rolePlayer || ""),
            roleOwner: String(row.roleOwner || ""),
            roleExtra: String(row.roleExtra || ""),
          }))
          setData(normalized)
          toast.success(`Detected Discord Data: ${normalized.length} records parsed`)
        }
      } else {
        toast.error(`Invalid ${type} data format`)
      }
    } catch (err: any) {
      console.log(err)
      toast.error("Failed to parse Excel file")
    } finally {
      toast.dismiss(toastLoadingId)
    }
  }

  const handleImportToDB = async (): Promise<void> => {
    if (!detectedType) return

    const toastLoadingId = toast.loading("Importing data...")
    setIsImporting(true)

    await ImportDataDB(data, detectedType)
      .then((res) => {
        if (!res) {
          toast.error("Failed to import data")
        } else if (res.status === "error") {
          toast.error(res.message)
        } else if (res.status === "success") {
          setData([])
          setFileName("")
          setDetectedType(null)
          toast.success(res.message)
        }
      })
      .catch((err) => {
        toast.error(err.message)
      })
      .finally(() => {
        toast.dismiss(toastLoadingId)
        setIsImporting(false)
      })
  }

return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Import Data</h1>
          <p className="text-muted-foreground text-lg">
            Upload and manage your event, schedule, Discord, and match data
          </p>
        </div>

        <Card className="border-2">
          <CardContent className="pt-6">
            <Tabs defaultValue="match" className="w-full">
              <TabsList className="grid grid-cols-2 gap-2 w-full items-center mb-8">
                <TabsTrigger
                  value="data"
                  >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Data Import
                </TabsTrigger>
                <TabsTrigger
                  value="match"
                  >
                  <Calendar className="h-4 w-4 mr-2" />
                  Match Data
                </TabsTrigger>
              </TabsList>

              <TabsContent value="data" className="space-y-8">
                <Card className="border-2 hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <CardTitle className="text-2xl">Upload Data File</CardTitle>
                    <CardDescription>
                      Upload your CSV or Excel file - we&apos;ll automatically detect the data type
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Drag & Drop Zone */}
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
                        isDragging
                          ? "border-primary bg-primary/5 scale-[1.02]"
                          : "border-border hover:border-primary/50 hover:bg-accent/50"
                      }`}
                    >
                      <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-base font-medium mb-2">Drag & drop your data file here</p>
                      <p className="text-sm text-muted-foreground mb-6">
                        Supports Event, Schedule, and Discord Data (CSV or Excel)
                      </p>
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileUpload}
                        disabled={isImporting}
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload">
                        <Button variant="outline" disabled={isImporting} asChild>
                          <span className="cursor-pointer">
                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                            Choose File
                          </span>
                        </Button>
                      </label>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-muted/50 rounded-lg p-4 text-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <Users className="h-4 w-4 text-primary" />
                          <p className="font-semibold">Event Data Format</p>
                        </div>
                        <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                          <li>
                            <span className="font-medium text-foreground">Basic:</span> event, stage, group, slot, team,
                            email
                          </li>
                          <li>
                            <span className="font-medium text-foreground">Players:</span> name1-6, uid1-6, email1-6
                          </li>
                        </ul>
                      </div>

                      <div className="bg-muted/50 rounded-lg p-4 text-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <Calendar className="h-4 w-4 text-primary" />
                          <p className="font-semibold">Schedule Data Format</p>
                        </div>
                        <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                          <li>
                            <span className="font-medium text-foreground">Match:</span> event, stage, group, matchNo
                          </li>
                          <li>
                            <span className="font-medium text-foreground">Timing:</span> map, startTime, date
                          </li>
                        </ul>
                      </div>

                      <div className="bg-muted/50 rounded-lg p-4 text-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <MessageSquare className="h-4 w-4 text-primary" />
                          <p className="font-semibold">Discord Data Format</p>
                        </div>
                        <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                          <li>
                            <span className="font-medium text-foreground">Team:</span> teamName, teamTag, emailId
                          </li>
                          <li>
                            <span className="font-medium text-foreground">Discord:</span> discordTag, guildId, guildName
                          </li>
                          <li>
                            <span className="font-medium text-foreground">Roles:</span> rolePlayer, roleOwner, roleExtra
                          </li>
                        </ul>
                      </div>
                    </div>

                    {fileName && data.length > 0 && detectedType && (
                      <Alert>
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertDescription className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium">{fileName}</span>
                            <Badge variant="outline" className="gap-1">
                              {detectedType === "event" ? (
                                <Users className="h-3 w-3" />
                              ) : detectedType === "schedule" ? (
                                <Calendar className="h-3 w-3" />
                              ) : (
                                <MessageSquare className="h-3 w-3" />
                              )}
                              {detectedType === "event"
                                ? "Event Data"
                                : detectedType === "schedule"
                                  ? "Schedule Data"
                                  : "Discord Data"}
                            </Badge>
                          </div>
                          <Badge variant="secondary">{data.length} records</Badge>
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                {/* Import Action */}
                {data.length > 0 && detectedType && (
                  <Card className="border-2 border-primary/20 bg-primary/5">
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-full bg-primary/10">
                            <CheckCircle2 className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-lg">Ready to Import</p>
                            <p className="text-sm text-muted-foreground">
                              {data.length} {detectedType} records parsed and validated
                            </p>
                          </div>
                        </div>
                        <Button onClick={handleImportToDB} disabled={isImporting} size="lg" className="min-w-[140px]">
                          {isImporting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Importing...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Import to DB
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="match">
                <MatchDataUploader />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
