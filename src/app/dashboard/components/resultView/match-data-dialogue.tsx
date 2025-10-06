"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TournamentResults } from "./columns"
import { PlayerResult, TeamResult } from "@/server/game/game-type"

interface MatchDataDialogProps {
  data: { teamResults: TeamResult[]; playerResults: PlayerResult[] },
  loading : boolean
}

export function MatchDataDialog({ data, loading }: MatchDataDialogProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Read Match Data</Button>
      </DialogTrigger>
      <DialogContent className="overflow-y-auto overflow-x-auto">
        <DialogHeader>
          <DialogTitle>Match Data</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="team-results" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="team-results">Team Results</TabsTrigger>
            <TabsTrigger value="player-results">Player Results</TabsTrigger>
          </TabsList>
          <TabsContent value="team-results">
            <TournamentResults data={{ teamResults: data.teamResults, playerResults: [] }} isLoading={loading}/>
          </TabsContent>
          <TabsContent value="player-results">
            <TournamentResults data={{ teamResults: [], playerResults: data.playerResults }} isLoading={loading}/>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
