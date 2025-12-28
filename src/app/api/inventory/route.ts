import { NextRequest, NextResponse } from 'next/server'
import { Inventory } from '@/lib/models'
import connectToMongoDB from '@/lib/mongodb'

export async function GET(request: NextRequest) {
  await connectToMongoDB()

  try {
    const inventory = await Inventory.find().sort({ skuId: 1 })

    return NextResponse.json({
      inventory
    })
  } catch (error: any) {
    console.error('Inventory fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  await connectToMongoDB()

  try {
    const body = await request.json()
    const inventory = await Inventory.create(body)

    return NextResponse.json(inventory, { status: 201 })
  } catch (error: any) {
    console.error('Inventory create error:', error)
    return NextResponse.json({ error: 'Failed to create inventory' }, { status: 500 })
  }
}
