/**
 * API route for fetching match data
 * Used by useMatchData hook for client-side data fetching
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMatchData } from '@/server/game/match'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const ids = searchParams.get('ids')

    if (!ids) {
      return NextResponse.json(
        { error: 'Missing schedule IDs' },
        { status: 400 }
      )
    }

    const scheduleIds = ids.split(',')
    const result = await getMatchData(scheduleIds)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching match data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch match data' },
      { status: 500 }
    )
  }
}
