import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown } from 'lucide-react'

export default function TeamSelector({teams, setTeam, selectedTeam}: { teams: string[]; setTeam: (team: string) => void; selectedTeam: string }) {

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <span>{selectedTeam || "Team Name"}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem key={'All Teams'} onClick={() => setTeam("All Teams")}>
            {selectedTeam === "All Teams" ? <strong>All Teams</strong> : "All Teams"}
          </DropdownMenuItem>
        {teams.map((teamName) => (
          <DropdownMenuItem key={teamName} onClick={() => setTeam(teamName)}>
            {selectedTeam === teamName ? <strong>{teamName}</strong> : teamName}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
