import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    const requiredFields = [
      'auditStaffId', 'auditStaffName', 'location', 'skuId', 'skuName',
      'totalQuantityIdentified', 'status'
    ]

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Create audit entry
    const auditEntry = await db.auditEntry.create({
      data: {
        auditStaffId: body.auditStaffId,
        auditStaffName: body.auditStaffName,
        location: body.location,
        skuId: body.skuId.toUpperCase(),
        skuName: body.skuName,
        pickingLocation: body.pickingLocation || null,
        pickingQty: body.pickingQty || 0,
        bulkLocation: body.bulkLocation || null,
        bulkQty: body.bulkQty || 0,
        nearExpiryLocation: body.nearExpiryLocation || 'NA',
        nearExpiryQty: body.nearExpiryQty || 0,
        jitLocation: body.jitLocation || 'NA',
        jitQty: body.jitQty || 0,
        damagedLocation: body.damagedLocation || 'NA',
        damagedQty: body.damagedQty || 0,
        minQtyOdin: body.minQtyOdin || 0,
        blockedQtyOdin: body.blockedQtyOdin || 0,
        maxQtyOdin: body.maxQtyOdin || 0,
        qtyTested: body.qtyTested || 0,
        totalQuantityIdentified: body.totalQuantityIdentified,
        status: body.status,
        objectionRaised: body.objectionRaised || false,
        objectionType: body.objectionType || null,
        assignedClientStaffId: body.assignedClientStaffId || null,
        assignedClientStaffName: body.assignedClientStaffName || null,
        objectionRemarks: body.objectionRemarks || null
      }
    })

    return NextResponse.json({
      success: true,
      entry: auditEntry
    })
  } catch (error) {
    console.error('Audit entry creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create audit entry: ' + (error as Error).message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const auditStaffId = searchParams.get('auditStaffId')

    if (!auditStaffId) {
      return NextResponse.json(
        { error: 'Audit staff ID is required' },
        { status: 400 }
      )
    }

    const entries = await db.auditEntry.findMany({
      where: { auditStaffId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(entries)
  } catch (error) {
    console.error('Audit entries fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit entries' },
      { status: 500 }
    )
  }
}
