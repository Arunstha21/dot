import { Card, CardContent } from "@/components/ui/card"
import { Trophy } from "lucide-react"

export function NoResultsSelected() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16">
        <Trophy className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">Select a Match</h3>
        <p className="text-muted-foreground text-center max-w-md">
          Choose an event, stage, and group from the sidebar to view match results and player statistics.
        </p>
      </CardContent>
    </Card>
  )
}
