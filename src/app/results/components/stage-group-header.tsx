import { Button } from "@/components/ui/button"
import { ChevronRight } from 'lucide-react'

export default function StageGroupHeader({eventName, stageName, groupName }: { eventName: string; stageName: string; groupName: string;}) {

  const displayText = () => {
    if (stageName) {
      return (
        <>
          <span>{eventName}</span>
          <ChevronRight className="h-4 w-4 mx-2" />
          <span>{stageName}</span>
          <ChevronRight className="h-4 w-4 mx-2" />
          <span>{groupName}</span>
        </>
      )
    } else {
      return <span>Select an event to view results</span>
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" className="text-base font-medium px-4 py-2 h-auto">
        {displayText()}
      </Button>
    </div>
  )
}
