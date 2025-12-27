import { NextRequest, NextResponse } from 'next/server'
import { AuditEntry, AuditStaff, Inventory } from '@/lib/models'
import { connectToMongoDB } from '@/lib/mongodb'

// GET - Fetch entries by audit staff ID
export async function GET(request: NextRequest) {
  await connectToMongoDB()

  try {
    const searchParams = request.nextUrl.searchParams
const auditStaffId = searchParams.get('auditStaffId')

    if (!auditStaffId) {
      return NextResponse.json({ error: 'Missing audit staff ID' }, { status: 400 })
    }

    // Find audit staff to get database ID
    const staff = await AuditStaff.findOne({ staffId: auditStaffId })
    if (!staff) {
      return NextResponse.json({ error: 'Audit staff not found' }, { status: 404 })
    }

    // Fetch entries for this audit staff
    const entries = await AuditEntry.find({ auditStaffId: staff._id })
      .sort({ createdAt: -1 }) // Most recent first
      .lean()

    return NextResponse.json(entries)
  } catch (error: any) {
    console.error('Fetch entries error:', error)
    return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 })
  }
}

// POST - Create new audit entry
export async function POST(request: NextRequest) {
  await connectToMongoDB()

  try {
    const body = await request.json()

    if (!body.auditStaffId) {
      return NextResponse.json({ error: 'Missing audit staff ID' }, { status: 400 })
    }

    // Find audit staff
    const staff = await AuditStaff.findOne({ staffId: body.auditStaffId })
    if (!staff) {
      return NextResponse.json({ error: 'Audit staff not found' }, { status: 404 })
    }

    // Find inventory
    const inventory = await Inventory.findOne({ skuId: body.skuId })
    if (!inventory) {
      return NextResponse.json({ error: 'Inventory not found' }, { status: 404 })
    }

    // Calculate total quantity
    const totalQuantityIdentified = 
      parseFloat(body.pickingQty) || 0 +
      parseFloat(body.bulkQty) || 0 +
      parseFloat(body.nearExpiryQty) || 0 +
      parseFloat(body.jitQty) || 0 +
      parseFloat(body.damagedQty) || 0

    // Determine if objection is needed
    let maxQtyOdin = parseFloat(body.maxQtyOdin) || 0
let needsObjection = Math.abs(totalQuantityIdentified - maxQtyOdin) > 0.01 && maxQtyOdin > 0 && totalQuantityIdentified !== maxQtyOdin
let objectionType = totalQuantityIdentified < maxQtyOdin ? 'Short' : (totalQuantityIdentified > maxQtyOdin ? 'Excess' : null)

    // Determine status
    let entryStatus = 'Completed'
    let objectionRaised = false
    let assignedClientStaffId = null
    let assignedClientStaffName = null
    let objectionRemarks = null
    let clientAction = null
    let clientActionDate = null

    if (needsObjection) {
      entryStatus = 'Submitted'
      objectionRaised = true
      objectionType = objectionType
      assignedClientStaffId = body.assignedClientStaffId
      assignedClientStaffName = body.assignedClientStaffName
      objectionRemarks = body.objectionRemarks
    } else {
      objectionRaised = false
      objectionType = null
      assignedClientStaffId = null
      assignedClientStaffName = null
      objectionRemarks = null
    }

    // Create audit entry
    const entry = await AuditEntry.create({
      auditStaffId: staff._id,
      auditStaffName: staff.name,
      location: body.location,
      skuId: body.skuId,
      skuName: inventory.name,
      pickingQty: parseFloat(body.pickingQty) || 0,
      pickingLocation: body.pickingLocation || null,
      bulkQty: parseFloat(body.bulkQty) || 0,
      bulkLocation: body.bulkLocation || null,
      nearExpiryQty: parseFloat(body.nearExpiryQty) || 0,
      nearExpiryLocation: body.nearExpiryLocation || 'NA',
      jitQty: parseFloat(body.jitQty) || 0,
      jitLocation: body.jitLocation || 'NA',
      damagedQty: parseFloat(body.damagedQty) || 0,
      damagedLocation: body.damagedLocation || 'NA',
      minQtyOdin: parseFloat(body.minQtyOdin) || 0,
      blockedQtyOdin: parseFloat(body.blockedQtyOdin) || 0,
      maxQtyOdin: parseFloat(body.maxQtyOdin) || 0,
      totalQuantityIdentified,
      qtyTested: parseFloat(body.qtyTested) || 0,
      status: entryStatus,
      objectionRaised,
      objectionType,
      assignedClientStaffId,
      assignedClientStaffName,
      objectionRemarks,
      clientAction,
      clientActionDate
    })

    return NextResponse.json(entry, { status: 201 })
  } catch (error: any) {
    console.error('Create entry error:', error)
    return NextResponse.json({ error: 'Failed to create audit entry' }, { status: 500 })
  }
}
