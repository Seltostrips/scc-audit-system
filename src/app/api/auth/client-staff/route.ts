import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { staffId, pin } = await request.json()

    if (!staffId || !pin) {
      return NextResponse.json(
        { success: false, error: 'Staff ID and PIN are required' },
        { status: 400 }
      )
    }

    const clientStaff = await db.clientStaff.findUnique({
      where: { staffId: staffId.toUpperCase() }
    })

    if (!clientStaff) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    if (!clientStaff.isActive) {
      return NextResponse.json(
        { success: false, error: 'Account is inactive' },
        { status: 401 }
      )
    }

    const isValidPin = await bcrypt.compare(pin, clientStaff.pin)

    if (!isValidPin) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      name: clientStaff.name,
      location: clientStaff.location
    })
  } catch (error) {
    console.error('Client staff login error:', error)
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    )
  }
}
