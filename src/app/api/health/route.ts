import { NextResponse } from 'next/server'
import connectToMongoDB from '@/lib/mongodb'

export async function GET() {
  try {
    await connectToMongoDB()
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      environment: process.env.NODE_ENV || 'development'
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    })
  }
}
