"use client"

import React, { useState, useRef } from "react"
import { Loader2, Upload, FileSpreadsheet, Download } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  bulkImportGAC,
} from "@/server/actions/gac"

interface GACBulkImportProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stageId: string
  onImportComplete: () => void
}

// Sample CSV data for download
const SAMPLE_CSV = `Player Name,UID,GAC Username,GAC Password,In-Game Name
Player One,123456,player1,password123,PlayerOne
Player Two,234567,player2,password456,PlayerTwo
Player Three,345678,player3,password789,PlayerThree`

export function GACBulkImport({
  open,
  onOpenChange,
  stageId,
  onImportComplete,
}: GACBulkImportProps) {
  const [loading, setLoading] = useState(false)
  const [csvData, setCsvData] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setCsvData(event.target?.result as string)
    }
    reader.readAsText(file)
  }

  const parseCSV = (csv: string) => {
    const lines = csv.trim().split("\n")
    if (lines.length < 2) return []

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())
    const nameIndex = headers.indexOf("player name")
    const uidIndex = headers.indexOf("uid")
    const usernameIndex = headers.indexOf("gac username")
    const passwordIndex = headers.indexOf("gac password")
    const ingameIndex = headers.indexOf("in-game name")

    if (nameIndex === -1 || uidIndex === -1) {
      toast.error("CSV must have 'Player Name' and 'UID' columns")
      return null
    }

    const data = []
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",")
      if (values.length < headers.length) continue

      data.push({
        playerName: values[nameIndex]?.trim(),
        playerUid: values[uidIndex]?.trim(),
        gacUsername: values[usernameIndex]?.trim(),
        gacPassword: values[passwordIndex]?.trim(),
        gacIngameName: values[ingameIndex]?.trim(),
      })
    }

    return data
  }

  const handleImport = async () => {
    if (!csvData.trim()) {
      toast.error("Please upload a CSV file or paste CSV data")
      return
    }

    const parsedData = parseCSV(csvData)
    if (!parsedData || parsedData.length === 0) {
      toast.error("No valid data found in CSV")
      return
    }

    setLoading(true)
    const result = await bulkImportGAC(stageId, parsedData)
    setLoading(false)

    if (result.status === "success") {
      toast.success(result.message || "Success")
      setCsvData("")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      onOpenChange(false)
      onImportComplete()
    } else {
      toast.error(result.message || "Error")
    }
  }

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "gac-import-sample.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Bulk Import GAC Data</DialogTitle>
          <DialogDescription>
            Import GAC credentials from a CSV file. Download the sample template to see the required format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadSample}>
              <Download className="h-4 w-4 mr-2" />
              Download Sample CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload CSV File
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="csvData">CSV Data</Label>
            <textarea
              id="csvData"
              className="w-full min-h-[200px] p-3 text-sm font-mono border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Paste CSV data here or upload a file..."
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="text-xs text-muted-foreground">
            <p>Required columns: Player Name, UID</p>
            <p>Optional columns: GAC Username, GAC Password, In-Game Name</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={loading || !csvData.trim()}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4 mr-2" />
            )}
            Import Data
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
