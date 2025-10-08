"use client"
import type { Schedule } from "@/server/database"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
const mapList = ["Erangel", "Miramar", "Sanhok"]

export default function ScheduleData({
  matches,
  setMatches,
  disabled,
  isEditing,
}: { matches: Schedule[]; setMatches: (matches: Schedule[]) => void; disabled?: boolean; isEditing: boolean }) {
  return (
    <div className="mt-4">
      {matches.length > 0 && (
        <>
          <Label>Matches</Label>
          {matches.map((match, index) => (
            <div key={index} className="flex gap-2 mt-2">
              <Select
                value={match.map}
                disabled={disabled}
                onValueChange={(newMap) => {
                  const newMatches = [...matches]
                  newMatches[index].map = newMap
                  setMatches(newMatches)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Map" />
                </SelectTrigger>
                <SelectContent>
                  {mapList.map((map) => (
                    <SelectItem key={map} value={map}>
                      {map}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                value={match.date}
                disabled={disabled}
                onChange={(e) => {
                  const newMatches = [...matches]
                  newMatches[index].date = e.target.value
                  setMatches(newMatches)
                }}
                placeholder="Date"
              />
              <Input
                value={match.startTime}
                disabled={disabled}
                onChange={(e) => {
                  const newMatches = [...matches]
                  newMatches[index].startTime = e.target.value
                  setMatches(newMatches)
                }}
                placeholder="Start Time"
              />
              {isEditing === true && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setMatches(matches.filter((_, i) => i !== index))}
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
          {isEditing === true && (
            <Button
              type="button"
              onClick={() =>
                setMatches([...matches, { id: "", matchNo: matches.length + 1, map: "", date: "", startTime: "" }])
              }
              className="mt-2 ml-2"
            >
              Add Match
            </Button>
          )}
        </>
      )}
    </div>
  )
}
