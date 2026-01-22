/**
 * API route for fetching a single team's GAC data
 * Used by GACBulkEditDialog for loading team data
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/server/auth'
import { dbConnect } from '@/lib/db'
import { Team } from '@/lib/database/schema'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    // Verify session
    const session = await getServerSession(authConfig)
    if (!session?.user?.superUser) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    await dbConnect()

    const { teamId } = await params

    const team = await Team.findById(teamId)
      .populate({
        path: 'players',
        options: { sort: { name: 1 } },
      })
      .lean()

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      )
    }

    const teamData = {
      _id: team._id.toString(),
      name: team.name,
      tag: team.tag,
      players: (team.players as any[])
        .filter((p) => p) // Filter out null players
        .map((player) => ({
          _id: player._id.toString(),
          name: player.name,
          uid: player.uid,
          email: player.email || undefined,
          gacUsername: player.gacUsername || undefined,
          gacPassword: player.gacPassword || undefined,
          gacIngameName: player.gacIngameName || undefined,
        })),
    }

    return NextResponse.json(teamData)
  } catch (error) {
    console.error('Error fetching team GAC data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team data' },
      { status: 500 }
    )
  }
}
