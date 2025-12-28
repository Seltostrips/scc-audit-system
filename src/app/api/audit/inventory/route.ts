import { NextRequest, NextResponse } from 'next/server'
import { Inventory } from '@/lib/models'
import connectToMongoDB from '@/lib/mongodb'

// GET - Search SKU
export async function GET(request: NextRequest) {
  await connectToMongoDB()

  try {
   const searchParams = new URL(request.url).searchParams
    const skuId = searchParams.get('skuId')

    if (!skuId) {
      return NextResponse.json({ error: 'Missing SKU ID' }, { status: 400 })
    }

    const inventory = await Inventory.findOne({ skuId })
    if (!inventory) {
      return NextResponse.json({ error: 'Inventory not found' }, { status: 404 })
    }

    return NextResponse.json(inventory)
  } catch (error: any) {
    console.error('Search inventory error:', error)
    return NextResponse.json({ error: 'Failed to search inventory' }, { status: 500 })
  }
}

// POST - Create inventory
export async function POST(request: NextRequest) {
  await connectToMongoDB()

  try {
    const body = await request.json()
    const inventory = await Inventory.create(body)

    return NextResponse.json(inventory, { status: 201 })
  } catch (error: any) {
    console.error('Create inventory error:', error)
    return NextResponse.json({ error: 'Failed to create inventory' }, { status: 500 })
  }
}
