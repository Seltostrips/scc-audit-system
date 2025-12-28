import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const entries = await db.auditEntry.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(entries)
  } catch (error) {
    console.error('Queries fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch queries' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, action, comments } = await request.json()

    if (!id || !action) {
      return NextResponse.json(
        { error: 'ID and action are required' },
        { status: 400 }
      )
    }

    const entry = await db.auditEntry.findUnique({
      where: { id }
    })

    if (!entry) {
      return NextResponse.json(
        { error: 'Query not found' },
        { status: 404 }
      )
    }

    const updatedEntry = await db.auditEntry.update({
      where: { id },
      data: {
        status: action,
        clientAction: action,
        clientActionDate: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      entry: updatedEntry
    })
  } catch (error) {
    console.error('Query update error:', error)
    return NextResponse.json(
      { error: 'Failed to update query' },
      { status: 500 }
    )
  }
}
