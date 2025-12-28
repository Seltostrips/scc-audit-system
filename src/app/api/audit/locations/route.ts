import { NextRequest, NextResponse } from 'next/server'
import { AuditStaff } from '@/lib/models'
import connectToMongoDB from '@/lib/mongodb'

export async function GET(request: NextRequest) {
  await connectToMongoDB()

  try {
   const searchParams = new URL(request.url).searchParams
    const staffId = searchParams.get('staffId')

    if (!staffId) {
      return NextResponse.json({ error: 'Missing staff ID' }, { status: 400 })
    }

    const staff = await AuditStaff.findOne({ staffId })
    if (!staff) {
      return NextResponse.json({ error: 'Audit staff not found' }, { status: 404 })
    }

    return NextResponse.json(staff)
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 })
  }
}
