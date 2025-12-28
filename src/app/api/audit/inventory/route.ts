import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const skuId = searchParams.get('skuId')

    if (!skuId) {
      return NextResponse.json(
        { error: 'SKU ID is required' },
        { status: 400 }
      )
    }

    const inventory = await db.inventory.findUnique({
      where: { skuId: skuId.toUpperCase() }
    })

    if (!inventory) {
      return NextResponse.json(
        { error: 'SKU not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(inventory)
  } catch (error) {
    console.error('Inventory lookup error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    )
  }
}
