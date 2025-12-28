import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const auditStaff = await db.auditStaff.findMany({
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({ auditStaff })
  } catch (error) {
    console.error('Audit staff fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit staff' },
      { status: 500 }
    )
  }
}
