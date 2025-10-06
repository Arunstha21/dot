// import.tsx
"use client"

import type React from "react"

import { ImportDataDB, type ScheduleData } from "@/server/database"
import { useState } from "react"
import * as XLSX from "xlsx"
import MatchDataUploader from "./matchUploader"
import { toast } from "sonner"

type EventImportRow = {
  event: string
  stage: string
  group: string
  slot: number
  team: string
  players: { name: string; uid: string; email?: string }[]
}

export default function ImportData() {
  const [data, setData] = useState<EventImportRow[] | ScheduleData[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [importType, setImportType] = useState<"event" | "schedule" | null>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: "event" | "schedule"): void => {
    const file = event.target.files?.[0]
    if (file) {
      const toastLoadingId = toast.loading("Parsing file...")
      setImportType(type)
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result
        if (typeof content === "string") {
          if (file.name.endsWith(".csv")) {
            parseCSV(content, type, toastLoadingId)
          } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
            parseExcel(content, type, toastLoadingId)
          }
        }
      }
      reader.readAsBinaryString(file)
    }
  }

  const validateData = (parsedData: any[], type: "event" | "schedule"): boolean => {
    if (type === "event") {
      return parsedData.every((item) => {
        const hasBaseFields = "event" in item && "stage" in item && "group" in item && "slot" in item && "team" in item && "email" in item

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

  const parseCSV = (content: string, type: "event" | "schedule", toastLoadingId: string | number): void => {
    try {
      const lines = content.split("\n").filter((l) => l.trim().length > 0)
      const headers = (lines[0]?.split(",") || []).map((h) => h.trim())
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
            email: String(row.email || ""),
            players: extractPlayers(row),
          }))
          setData(normalized)
        } else {
          // schedule
          const normalized: ScheduleData[] = rows.map((row) => ({
            event: String(row.event || ""),
            stage: String(row.stage || ""),
            group: String(row.group || ""),
            matchNo: Number(row.matchNo || "0"),
            map: String(row.map || ""),
            startTime: String(row.startTime || ""),
            date: String(row.date || ""),
          }))
          setData(normalized)
        }
      } else {
        toast.error(`Invalid ${type === "event" ? "Event Data" : "Schedule Data"} format`)
      }
    } catch (err: any) {
      console.log(err)
      toast.error("Failed to parse CSV file")
    } finally {
      toast.dismiss(toastLoadingId)
    }
  }

  const parseExcel = (content: string, type: "event" | "schedule", toastLoadingId: string | number): void => {
    try {
      const workbook = XLSX.read(content, { type: "binary" })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet)

      if (rows.length > 0 && validateData(rows, type)) {
        if (type === "event") {
          const normalized: EventImportRow[] = rows.map((row) => ({
            event: String(row.event || ""),
            stage: String(row.stage || ""),
            group: String(row.group || ""),
            slot: Number(row.slot || 0),
            team: String(row.team || ""),
            email: String(row.email || ""),
            players: extractPlayers(row),
          }))
          setData(normalized)
        } else {
          const normalized: ScheduleData[] = rows.map((row) => ({
            event: String(row.event || ""),
            stage: String(row.stage || ""),
            group: String(row.group || ""),
            matchNo: Number(row.matchNo || 0),
            map: String(row.map || ""),
            startTime: String(row.startTime || ""),
            date: String(row.date || ""),
          }))
          setData(normalized)
        }
      } else {
        toast.error(`Invalid ${type === "event" ? "Event Data" : "Schedule Data"} format`)
      }
    } catch (err: any) {
      console.log(err)
      toast.error("Failed to parse Excel file")
    } finally {
      toast.dismiss(toastLoadingId)
    }
  }

  const handleImportToDB = async (): Promise<void> => {
    const toastLoadingId = toast.loading("Importing data...")
    setIsImporting(true)

    await ImportDataDB(data, importType as "event" | "schedule")
      .then((res) => {
        if (!res) {
          toast.error("Failed to import data")
        } else if (res.status === "error") {
          toast.error(res.message)
        } else if (res.status === "success") {
          setData([])
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
    <div className="container mx-auto p-4 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Import Data</h1>
      </div>
      <div className="mb-8 flex flex-col gap-4">
        <div>
          <label className="block mb-2">Import Event Data:</label>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => handleFileUpload(e, "event")}
            disabled={isImporting}
            className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
          />
        </div>
        <div>
          <label className="block mb-2">Import Schedule Data:</label>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => handleFileUpload(e, "schedule")}
            disabled={isImporting}
            className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
          />
        </div>
      </div>
      <div>
        {data.length > 0 && (
          <button
            onClick={handleImportToDB}
            disabled={isImporting}
            className="py-2 px-4 bg-blue-500 text-white rounded disabled:bg-gray-300"
          >
            {isImporting ? "Importing..." : "Import to DB"}
          </button>
        )}
      </div>

      <MatchDataUploader />
    </div>
  )
}
