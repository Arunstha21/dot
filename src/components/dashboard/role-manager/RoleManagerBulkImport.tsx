"use client"

import React, { useState, useCallback } from "react"
import { Upload, FileSpreadsheet, CheckCircle2, Loader2, X, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { bulkImportRoleManager } from "@/server/actions/roleManager"

interface RoleManagerBulkImportProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stageId: string
  onImportComplete: () => void
}

type DiscordDataRow = {
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

export function RoleManagerBulkImport({
  open,
  onOpenChange,
  stageId,
  onImportComplete,
}: RoleManagerBulkImportProps) {
  const [data, setData] = useState<DiscordDataRow[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState<string>("")

  const validateData = (parsedData: any[]): boolean => {
    return parsedData.every(
      (item) =>
        item.event &&
        item.stage &&
        item.discordTag &&
        item.teamName &&
        item.emailId &&
        item.guildId &&
        item.guildName &&
        item.teamTag &&
        item.rolePlayer &&
        item.roleOwner
    )
  }

  const extractRoles = (row: Record<string, any>) => {
    const roles: string[] = []
    if (row.rolePlayer) roles.push(row.rolePlayer)
    if (row.roleOwner) roles.push(row.roleOwner)
    if (row.roleExtra) roles.push(row.roleExtra)
    return roles
  }

  const processFile = (file: File) => {
    const toastLoadingId = toast.loading("Analyzing file...")
    setFileName(file.name)

    const reader = new FileReader()
    reader.onload = async (e) => {
      const content = e.target?.result
      if (typeof content === "string") {
        if (file.name.endsWith(".csv")) {
          parseCSV(content, toastLoadingId)
        } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
          await parseExcel(content, toastLoadingId)
        }
      }
    }
    reader.readAsBinaryString(file)
  }

  const parseCSV = (content: string, toastLoadingId: string | number): void => {
    try {
      const lines = content.split("\n").filter((l) => l.trim().length > 0)
      const headers = (lines[0]?.split(",") || []).map((h) => h.trim())

      const requiredHeaders = ["discordTag", "guildId", "guildName", "rolePlayer", "roleOwner"]
      const headerSet = new Set(headers.map((h) => h.toLowerCase().trim()))

      const hasRequiredFields = requiredHeaders.every((col) => headerSet.has(col.toLowerCase()))

      if (!hasRequiredFields) {
        toast.error("Invalid Discord Role Data format")
        toast.dismiss(toastLoadingId)
        return
      }

      const rows = lines.slice(1).map((line) => {
        const values = line.split(",")
        return headers.reduce<Record<string, string>>((obj, header, index) => {
          obj[header] = (values[index] ?? "").trim()
          return obj
        }, {})
      })

      if (rows.length > 0 && validateData(rows)) {
        const normalized: DiscordDataRow[] = rows.map((row) => ({
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
          roleExtra: row.roleExtra ? String(row.roleExtra) : undefined,
        }))
        setData(normalized)
        toast.success(`Detected Discord Data: ${normalized.length} records parsed`)
      } else {
        toast.error("Invalid Discord Role Data format")
      }
    } catch (err: any) {
      console.error(err)
      toast.error("Failed to parse CSV file")
    } finally {
      toast.dismiss(toastLoadingId)
    }
  }

  const parseExcel = async (content: string, toastLoadingId: string | number): Promise<void> => {
    try {
      const XLSX = await import('xlsx').then(mod => mod.default)
      const workbook = XLSX.read(content, { type: "binary" })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet)

      if (rows.length === 0) {
        toast.error("File is empty")
        toast.dismiss(toastLoadingId)
        return
      }

      if (rows.length > 0 && validateData(rows)) {
        const normalized: DiscordDataRow[] = rows.map((row) => ({
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
          roleExtra: row.roleExtra ? String(row.roleExtra) : undefined,
        }))
        setData(normalized)
        toast.success(`Detected Discord Data: ${normalized.length} records parsed`)
      } else {
        toast.error("Invalid Discord Role Data format")
      }
    } catch (err: any) {
      console.error(err)
      toast.error("Failed to parse Excel file")
    } finally {
      toast.dismiss(toastLoadingId)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0]
    if (file) {
      processFile(file)
    }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleImport = async (): Promise<void> => {
    if (data.length === 0) return

    const toastLoadingId = toast.loading("Importing data...")
    setIsImporting(true)

    try {
      const result = await bulkImportRoleManager(stageId, data)

      if (result.status === "success") {
        toast.success(result.message || "Data imported successfully")
        setData([])
        setFileName("")
        onOpenChange(false)
        onImportComplete()
      } else {
        toast.error(result.message || "Failed to import data")
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to import data")
    } finally {
      toast.dismiss(toastLoadingId)
      setIsImporting(false)
    }
  }

  const handleReset = () => {
    setData([])
    setFileName("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Bulk Import Role Manager Data</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file with Discord role data. The file should include columns for:
            discordTag, guildId, guildName, teamName, teamTag, emailId, rolePlayer, roleOwner, and
            optionally roleExtra.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-6">
          {data.length === 0 ? (
            <>
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
                  Supports Discord Role Data (CSV or Excel)
                </p>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  disabled={isImporting}
                  className="hidden"
                  id="role-manager-file-upload"
                />
                <label htmlFor="role-manager-file-upload">
                  <Button variant="outline" disabled={isImporting} asChild>
                    <span className="cursor-pointer">
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Choose File
                    </span>
                  </Button>
                </label>
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
            </>
          ) : (
            <div className="space-y-4">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{fileName}</span>
                    <Badge variant="outline" className="gap-1">
                      <MessageSquare className="h-3 w-3" />
                      Discord Data
                    </Badge>
                  </div>
                  <Badge variant="secondary">{data.length} records</Badge>
                </AlertDescription>
              </Alert>

              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-[300px] overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">Discord Tag</th>
                        <th className="px-4 py-2 text-left font-medium">Email</th>
                        <th className="px-4 py-2 text-left font-medium">Team</th>
                        <th className="px-4 py-2 text-left font-medium">Roles</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.slice(0, 10).map((row, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-4 py-2">{row.discordTag}</td>
                          <td className="px-4 py-2">{row.emailId}</td>
                          <td className="px-4 py-2">{row.teamName}</td>
                          <td className="px-4 py-2">
                            <div className="flex flex-wrap gap-1">
                              <Badge variant="outline" className="text-xs">{row.rolePlayer}</Badge>
                              <Badge variant="outline" className="text-xs">{row.roleOwner}</Badge>
                              {row.roleExtra && (
                                <Badge variant="outline" className="text-xs">{row.roleExtra}</Badge>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {data.length > 10 && (
                        <tr className="border-t">
                          <td colSpan={4} className="px-4 py-2 text-center text-muted-foreground">
                            ... and {data.length - 10} more records
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                disabled={isImporting}
                className="w-full"
              >
                <X className="h-4 w-4 mr-2" />
                Clear & Upload Different File
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          {data.length > 0 && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isImporting}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={isImporting}>
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Import {data.length} Records
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
