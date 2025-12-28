import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

// ✅ Use Prisma Client directly to avoid import type issues
const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { role, staffId, pin, username, password } = body

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

      // ✅ Use any to bypass Prisma type checking issues
      const auditStaff = await prisma.auditStaff.findUnique({
        where: { staffId: staffId.toUpperCase() }
      }) as any

      if (!auditStaff) {
        return NextResponse.json(
          { success: false, error: 'Invalid credentials' },
          { status: 401 }
        )
      }

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

      // ✅ Use any to bypass Prisma type checking issues
      const clientStaff = await prisma.clientStaff.findUnique({
        where: { staffId: staffId.toUpperCase() }
      }) as any

      if (!clientStaff) {
        return NextResponse.json(
          { success: false, error: 'Invalid credentials' },
          { status: 401 }
        )
      }

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

      // ✅ Use any to bypass Prisma type checking issues
      const admin = await prisma.admin.findUnique({
        where: { username }
      }) as any

      if (!admin) {
        return NextResponse.json(
          { success: false, error: 'Invalid credentials' },
          { status: 401 }
        )
      }

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
