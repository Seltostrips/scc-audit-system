import { NextRequest, NextResponse } from 'next/server'
import { ClientStaff, AuditEntry } from '@/lib/models'
import connectToMongoDB from '@/lib/mongodb'

// GET - Fetch all queries (for admin dashboard)
export async function GET(request: NextRequest) {
  await connectToMongoDB()

  try {
    const queries = await AuditEntry.find()
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json(queries)
  } catch (error: any) {
    console.error('Fetch queries error:', error)
    return NextResponse.json({ error: 'Failed to fetch queries' }, { status: 500 })



  }
}

// PUT - Approve or reject query
export async function PUT(request: NextRequest) {
  await connectToMongoDB()

  try {
    const body = await request.json()
    const { id, action, comments } = body

    if (!id || !action) {
      return NextResponse.json({ error: 'Missing query ID or action' }, { status: 400 })



    }

    if (action !== 'Approved' && action !== 'Rejected') {
      return NextResponse.json({ error: 'Invalid action. Must be "Approved" or "Rejected"' }, { status: 400 })
    }

    const query = await AuditEntry.findById(id)
    if (!query) {
      return NextResponse.json({ error: 'Query not found' }, { status: 404 })
    }

    const updateData: any = {
      clientAction: action,
      clientActionDate: new Date()


    }

    if (action === 'Approved') {
      updateData.status = 'Completed'
      updateData.objectionRaised = false
      updateData.updatedAt = new Date()
    } else if (action === 'Rejected') {
      updateData.status = 'Resubmitted'
      updateData.clientAction = action
      updateData.clientActionDate = new Date()
    }

    if (comments) {
      updateData.clientActionComments = comments
    }

    const updatedQuery = await AuditEntry.findByIdAndUpdate(id, updateData)

    return NextResponse.json(updatedQuery)
  } catch (error: any) {
    console.error('Update query error:', error)
    return NextResponse.json({ error: 'Failed to update query' }, { status: 500 })
  }
}
