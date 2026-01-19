/**
 * API route for fetching group and schedule data for a stage
 * Used by useGroupScheduleData hook for client-side data fetching
 */

import { NextRequest, NextResponse } from 'next/server'
import { getGroupAndSchedule } from '@/server/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ stageId: string }> }
) {
  try {
    const { stageId } = await params
    const result = await getGroupAndSchedule(stageId)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching group and schedule:', error)
    return NextResponse.json(
      { error: 'Failed to fetch group and schedule' },
      { status: 500 }
    )
  }
}
