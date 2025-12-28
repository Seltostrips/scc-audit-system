import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { role, staffId, pin, username, password } = body

    console.log('Login request:', { role, staffId: username: '****' })

    if (!role) {
      return NextResponse.json(
        { success: false, error: 'Role is required' },
        { status: 400 }
      )
    }

    // Handle each role
    if (role === 'audit') {
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

      // ✅ Removed: if (!auditStaff.isActive) check

      if (auditStaff.pin !== pin) {
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
    }

    if (role === 'client') {
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

      // ✅ Removed: if (!clientStaff.isActive) check

      if (clientStaff.pin !== pin) {
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
    }

    if (role === 'admin') {
      if (!username || !password) {
        return NextResponse.json(
          { success: false, error: 'Username and password are required' },
          { status: 400 }
        )
      }

      const admin = await db.admin.findUnique({
        where: { username }
      })

      if (!admin) {
        return NextResponse.json(
          { success: false, error: 'Invalid credentials' },
          { status: 401 }
        )
      }

      // ✅ Removed: if (!admin.isActive) check

      if (admin.password !== password) {
        return NextResponse.json(
          { success: false, error: 'Invalid credentials' },
          { status: 401 }
        )
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid role' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    )
  }
}
