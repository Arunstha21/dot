/**
 * API route for fetching events
 * Used by useEventData hook for client-side data fetching
 */

import { NextResponse } from 'next/server'
import { getEventData } from '@/server/database'

export async function GET() {
  try {
    const events = await getEventData()
    return NextResponse.json(events)
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}
