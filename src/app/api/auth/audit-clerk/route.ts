import { NextRequest, NextResponse } from 'next/server'
import { AuditStaff } from '@/lib/models'
import connectToMongoDB from '@/lib/mongodb'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  // Connect to MongoDB
  await connectToMongoDB()

  try {
    const body = await request.json()
    const { staffId, pin } = body

    if (!staffId || !pin) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
    }

    // Find audit staff
    const staff = await AuditStaff.findOne({ staffId })
    if (!staff) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Verify PIN
    const isPasswordValid = await bcrypt.compare(pin, staff.pin)
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 })
    }

    // Check if staff is active
    if (!staff.isActive) {
      return NextResponse.json({ error: 'Account is inactive' }, { status: 403 })
    }

  return NextResponse.json({
  success: true,
  id: staff.id, // ✅ Use explicit 'id' field
  staffId: staff.staffId,
  name: staff.name
})
  } catch (error: any) {
    console.error('Audit clerk login error:', error)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
