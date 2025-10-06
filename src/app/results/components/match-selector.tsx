import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown } from 'lucide-react'

export default function MatchSelector({listOfMatches, setSelectedMatch, match, isAfterMatch}: { listOfMatches: { id: string; matchNo: number }[]; setSelectedMatch: (matchId: string | null) => void; match: string | null; isAfterMatch: boolean }) {

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2" data-match-no>
          <span>{match ? isAfterMatch ? `After Match ${listOfMatches.find((m) => m.id === match)?.matchNo}` : `Match ${listOfMatches.find((m) => m.id === match)?.matchNo}` || "Match" : "Match"}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {listOfMatches.map((matchItem) => (
          <DropdownMenuItem key={matchItem.id} onClick={() => setSelectedMatch(matchItem.id)}>
            {match === matchItem.id ? <strong>{isAfterMatch ? `After Match ${matchItem.matchNo}`: `Match ${matchItem.matchNo}`}</strong> : isAfterMatch ? `After Match ${matchItem.matchNo}`: `Match ${matchItem.matchNo}`}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
