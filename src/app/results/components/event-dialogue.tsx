"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from 'lucide-react'
import { EventData, getGroupData, GroupAndSchedule } from "@/server/publicResult"

interface EventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: EventData | null
  setSelectedData: React.Dispatch<React.SetStateAction<{
    stage: EventData['stages'][number] | null
    group: EventData['stages'][number]['groups'][number] | null
    groupAndSchedule: GroupAndSchedule | null
  } | null>>
}

export default function EventDialog({ open, onOpenChange, event, setSelectedData }: EventDialogProps) {
  const [selectedStage, setSelectedStage] = useState<EventData['stages'][number] | null>(null)
  const [step, setStep] = useState(1)

  useEffect(() => {
    setSelectedStage(null)
    setStep(1)
  }, [event])

  const handleStageSelect = (stage: EventData['stages'][number]) => {
    setSelectedStage(stage)
    setStep(2)
  }

  const handleGroupSelect = async (group: EventData['stages'][number]['groups'][number]) => {
    try {
        const groupData = await getGroupData(group.id)
      setSelectedData({
        stage: selectedStage,
        group: group,
        groupAndSchedule: groupData.groups.find((g) => g.id === group.id) || null,
      })
      onOpenChange(false)
    } catch (err) {
      console.error("Failed to fetch group data", err)
    }
  }

  const handleBack = () => {
    if (step === 2) {
      setStep(1)
      setSelectedStage(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{event?.name}</DialogTitle>
          <DialogDescription asChild>
          {step === 1 ? (
          <p>Select a stage</p>
            ) : (
            <div className="flex items-center">
            <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4" />
                Back
            </Button>
            Select a group in {selectedStage?.name}
            </div>)}
          </DialogDescription>
        </DialogHeader>
        {step === 1 ? (
          <div className="grid gap-2 max-h-[300px] overflow-y-auto p-1">
            {event?.stages.map((stage) => (
              <Button
                key={stage.id}
                variant="outline"
                className="justify-start h-auto py-3"
                onClick={() => handleStageSelect(stage)}
              >
                {stage.name}
              </Button>
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-2 max-h-[300px] overflow-y-auto p-1">
              {selectedStage?.groups?.map((group) => (
                <Button
                  key={group.id}
                  variant="outline"
                  className="justify-start h-auto py-3"
                  onClick={() => handleGroupSelect(group)}
                >
                  {group.name}
                </Button>
              ))}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
