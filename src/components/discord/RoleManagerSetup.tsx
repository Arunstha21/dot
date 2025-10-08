"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertCircle, Download, Upload } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import Link from "next/link"
import { RoleManagerDialog } from "./RoleManagerDialogue"
import { getRoleManagerUsers } from "@/server/actions/discord-actions"
import { IRoleManagerUser } from "@/lib/database/schema"

interface RoleManagerSetupProps {
  guild: string
  guildName: string
}

export function RoleManagerSetup({ guild, guildName  }: RoleManagerSetupProps) {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<IRoleManagerUser[]>([])

  useEffect(() => {
    loadUsers()
  }, [guild])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const result = await getRoleManagerUsers(guild)
      if (result.success) {
        setUsers(result.users || [])
      }
    } catch (error) {
      console.error("Error loading role manager users:", error)
    } finally {
      setLoading(false)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <Card className="border-dashed bg-muted/50">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <CardTitle className="text-sm">Setup Required</CardTitle>
              <CardDescription className="text-xs mt-1">
                Complete the setup process to start managing user roles
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 text-sm">
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

          <div className="flex flex-col gap-2 pt-2">
            <Button onClick={downloadCSVTemplate} variant="outline" className="w-full bg-transparent">
              <Download className="h-4 w-4 mr-2" />
              Download CSV Template
            </Button>
            <Button asChild variant="default" className="w-full">
              <Link href="/dashboard/import">
                <Upload className="h-4 w-4 mr-2" />
                Go to Data Import
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const activeUsers = users.filter((u) => u.serverJoined).length
  const emailsSent = users.filter((u) => u.emailSent).length

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">User Statistics</CardTitle>
              <CardDescription className="text-xs">Overview of role manager users</CardDescription>
            </div>
            <Badge variant="outline" className="text-lg font-semibold">
              {users.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold">{users.length}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Active</p>
              <p className="text-2xl font-bold">{activeUsers}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Emails Sent</p>
              <p className="text-2xl font-bold">{emailsSent}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent Users</CardTitle>
              <CardDescription className="text-xs">Latest role manager users</CardDescription>
            </div>
            <RoleManagerDialog guild={guild} guildName={guildName} />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.slice(0, 5).map((user) => (
                <TableRow key={user._id as unknown as string}>
                  <TableCell className="font-medium">{user.userName}</TableCell>
                  <TableCell className="text-xs">{user.email}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {user.role.map((r, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {r}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.serverJoined ? "default" : "secondary"}>
                      {user.serverJoined ? "Active" : "Pending"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
