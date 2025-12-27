import { NextRequest, NextResponse } from 'next/server'
import { ClientStaff } from '@/lib/models'
import { connectToMongoDB } from '@/lib/mongodb'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  await connectToMongoDB()

  try {
    const body = await request.json()
    const { staffId, pin } = body

    if (!staffId || !pin) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
    }

    // Find client staff
    const staff = await ClientStaff.findOne({ staffId })
    if (!staff) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Verify PIN
    const isPasswordValid = await bcrypt.compare(pin, staff.pin)
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 })
    }

    if (!staff.isActive) {
      return NextResponse.json({ error: 'Account is inactive' }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      id: staff.id,
      staffId: staff.staffId,
      name: staff.name
    })
  } catch (error: any) {
    console.error('Client staff login error:', error)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
