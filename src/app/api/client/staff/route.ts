import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const location = searchParams.get('location')

    const clientStaff = await db.clientStaff.findMany({
      where: {
        isActive: true,
        ...(location && { location })
      },
      select: {
        id: true,
        name: true,
        staffId: true,
        location: true
      }
    })

    return NextResponse.json(clientStaff)
  } catch (error) {
    console.error('Client staff fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch client staff' },
      { status: 500 }
    )
  }
}
