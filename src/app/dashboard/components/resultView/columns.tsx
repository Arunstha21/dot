"use client"

import React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "./data-table"
import { SkeletonTable } from "./skelaton-table"
import { PlayerResult, TeamResult } from "@/server/game/game-type"
import { SendToDiscord } from "./sendToDiscord"

const teamColumns: ColumnDef<TeamResult>[] = [
  {
    accessorKey: "cRank",
    header: "Rank",
  },
  {
    accessorKey: "team",
    header: "Team",
  },
  {
    accessorKey: "kill",
    header: "Kills",
    sortingFn: "basic",
  },
  {
    accessorKey: "damage",
    header: "Damage",
    sortingFn: "basic",
  },
  {
    accessorKey: "placePoint",
    header: "Place Points",
    sortingFn: "basic",
  },
  {
    accessorKey: "totalPoint",
    header: "Total Points",
    sortingFn: "basic",
  },
  {
    accessorKey: "wwcd",
    header: "WWCD",
  },
  {
    accessorKey: "matchesPlayed",
    header: "Matches",
  },
]

const playerColumns: ColumnDef<PlayerResult>[] = [
  {
    accessorKey: "cRank",
    header: "Rank",
  },
  {
    accessorKey: "inGameName",
    header: "Player",
  },
  {
    accessorKey: "teamName",
    header: "Team",
  },
  {
    accessorKey: "kill",
    header: "Kills",
    sortingFn: "basic",
  },
  {
    accessorKey: "damage",
    header: "Damage",
    sortingFn: "basic",
  },
  {
    accessorKey: "avgSurvivalTime",
    header: "Avg. Survival",
    sortingFn: "basic",
    cell: ({ row }) => {
      const seconds = row.original.avgSurvivalTime || 0;
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    },
  },
  {
    accessorKey: "assists",
    header: "Assists",
  },
  {
    accessorKey: "heal",
    header: "Healing",
    sortingFn: "basic",
  },
  {
    accessorKey: "matchesPlayed",
    header: "Match Played",
    sortingFn: "basic",
  },
  {
    accessorKey: "mvp",
    header: "MVP",
    sortingFn: "auto",
  }
]

interface TournamentResultsProps {
  data: { teamResults: TeamResult[]; playerResults: PlayerResult[] }
  sendResultData?: { stageId: string; matchTitle: string;}
  isLoading: boolean
}

export function TournamentResults({ data, sendResultData, isLoading }: TournamentResultsProps) {
  
  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold mb-4">Loading Results...</h2>
          <SkeletonTable columns={8} rows={8} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {data.teamResults.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold mb-4">Team Results</h2>
          {sendResultData && ( 
            <SendToDiscord
            stageId={sendResultData.stageId}
            matchData={{ 
              headers: teamColumns.map(col => col.header as string), 
              rows: data.teamResults.map(row => 
                teamColumns.map(col => {
                  const accessorKey = (col as any).accessorKey;
                  return accessorKey ? (row as any)[accessorKey] ?? '' : '';
                })
              ) 
            }}
            matchTitle={sendResultData.matchTitle}
          />)}
          </div>
          <DataTable columns={teamColumns} data={data.teamResults} />
        </div>
      )}
      {data.playerResults.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Player Results</h2>
          <DataTable columns={playerColumns} data={data.playerResults} />
        </div>
      )}



    </div>
  )
}
