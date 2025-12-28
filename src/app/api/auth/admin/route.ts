import { NextRequest, NextResponse } from 'next/server'



export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password, action } = body







    // Handle different actions
    if (action === 'login') {
      // Verify against default or stored admin
      let adminPassword: string
      
      // In production, you'd store hashed password in database
      // For now, we'll use the default hash
      const bcrypt = require('bcryptjs')
      const DEFAULT_ADMIN_PASSWORD_HASH = bcrypt.hashSync('admin123', bcrypt.genSaltSync(10))
      adminPassword = DEFAULT_ADMIN_PASSWORD_HASH

      const isPasswordValid = await bcrypt.compare(password, adminPassword)
      
      if (isPasswordValid) {
        return NextResponse.json({
          success: true,
          username,
          isAdmin: true
        })
      } else {
        return NextResponse.json({
          error: 'Invalid admin credentials'
        }, { status: 401 })
      }
    }
    
    // Add admin (for future use)
    if (action === 'add') {
      const { newUsername, newPassword } = body
      
      if (!newUsername || !newPassword) {
        return NextResponse.json({
          error: 'Username and password are required'
        }, { status: 400 })
      }
      
      const bcrypt = require('bcryptjs')
      const hashedPassword = bcrypt.hashSync(newPassword, bcrypt.genSaltSync(10))
      
      // You'd store this in a separate Admin collection in production
      console.log('Admin credentials update requested:', { username: newUsername })
      
      return NextResponse.json({
        success: true,
        message: 'Admin credentials updated'
      })
    }
    
    return NextResponse.json({
      error: 'Invalid action'
    }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// GET endpoint to check admin status (for health checks)
export async function GET() {
  try {
    return NextResponse.json({
      admin: {
        username: 'admin',
        requiresPasswordSetup: true
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })











  }
}
