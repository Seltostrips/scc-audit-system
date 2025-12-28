import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const staffId = searchParams.get('staffId')

    if (!staffId) {
      return NextResponse.json(
        { error: 'Staff ID is required' },
        { status: 400 }
      )
    }

    const auditStaff = await db.auditStaff.findUnique({
      where: { staffId: staffId.toUpperCase() }
    })

    if (!auditStaff) {
      return NextResponse.json(
        { error: 'Audit staff not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: auditStaff.id,
      name: auditStaff.name,
      staffId: auditStaff.staffId
    })
  } catch (error) {
    console.error('Audit staff lookup error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit staff' },
      { status: 500 }
    )
  }
}
