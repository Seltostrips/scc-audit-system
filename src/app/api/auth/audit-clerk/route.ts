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

    const auditStaff = await db.auditStaff.findUnique({
      where: { staffId: staffId.toUpperCase() }
    })

    if (!auditStaff) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    if (!auditStaff.isActive) {
      return NextResponse.json(
        { success: false, error: 'Account is inactive' },
        { status: 401 }
      )
    }

    const isValidPin = await bcrypt.compare(pin, auditStaff.pin)

    if (!isValidPin) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      name: auditStaff.name,
      id: auditStaff.id
    })
  } catch (error) {
    console.error('Audit clerk login error:', error)
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    )
  }
}
