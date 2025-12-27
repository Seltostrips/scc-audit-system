import { NextRequest, NextResponse } from 'next/server'
import { ClientStaff } from '@/lib/models'
import { connectToMongoDB } from '@/lib/mongodb'

export async function GET(request: NextRequest) {
  await connectToMongoDB()

  try {
    const  searchParams  = new URL(request.url).searchParams
    const staffId = searchParams.get('staffId')
    const location = searchParams.get('location')

    // Fetch all client staff
    const staff = await ClientStaff.find().sort({ name: 1 })

    return NextResponse.json(staff)
  } catch (error: any) {
    console.error('Fetch client staff error:', error)
    return NextResponse.json({ error: 'Failed to fetch client staff' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  await connectToMongoDB()

  try {
    const body = await request.json()
    const { staffId, pin } = body

    if (!staffId || !pin) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
    }

    const staff = await ClientStaff.findOne({ staffId })
    if (!staff) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const bcrypt = require('bcryptjs')
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
