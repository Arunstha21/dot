import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown } from 'lucide-react'
import TeamSelector from "@/app/results/components/team-selector"

export default function ResultTypeSelector({teams, setResultType, setTeam, resultType, selectedTeam}: { teams: string[]; setResultType: (type: string) => void; setTeam: (team: string) => void; resultType: string; selectedTeam: string}) {

  return (
    <div className="flex items-center gap-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <span>{resultType}</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => setResultType("Team Stats")}>{resultType === "Team Stats" ? <strong>Team Stats</strong>: "Team Stats"}</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setResultType("Player Stats")}>{resultType === "Player Stats" ? <strong>Player Stats</strong>: "Player Stats"}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {resultType === "Player Stats" && <TeamSelector teams={teams} selectedTeam={selectedTeam} setTeam={setTeam}/>}
    </div>
  )
}
