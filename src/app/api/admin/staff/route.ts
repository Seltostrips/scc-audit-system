import { NextRequest, NextResponse } from 'next/server'
import { AuditStaff, ClientStaff } from '@/lib/models'
import { connectToMongoDB } from '@/lib/mongodb'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  await connectToMongoDB()

  try {
    const auditStaff = await AuditStaff.find().sort({ name: 1 })
    const clientStaff = await ClientStaff.find().sort({ name: 1 })
    
    return NextResponse.json({
      auditStaff,
      clientStaff
    })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  await connectToMongoDB()

  try {
    const body = await request.json()
    const { action, type, id, ...data } = body

    if (action === 'add') {
      if (type === 'audit') {
        const lastStaff = await AuditStaff.findOne().sort({ _id: -1 })
        const staffId = (parseInt(lastStaff?.staffId) || 0) + 1

        const newStaff = await AuditStaff.create({
          staffId: staffId.toString(),
          name: data.name,
          pin: bcrypt.hashSync(data.pin, bcrypt.genSaltSync(10)),
          locations: data.locations || ['Hyderabad WH'],
          isActive: true
        })

        return NextResponse.json({ success: true, staff: newStaff })
      }

      if (type === 'client') {
        const newStaff = await ClientStaff.create({
          staffId: data.staffId,
          name: data.name,
          pin: bcrypt.hashSync(data.pin, bcrypt.genSaltSync(10)),
          location: data.location,
          isActive: true
        })

        return NextResponse.json({ success: true, staff: newStaff })
      }
    }

    if (action === 'edit') {
      if (type === 'audit') {
        const staff = await AuditStaff.findByIdAndUpdate(id, data)
        return NextResponse.json({ success: true, staff })
      }

      if (type === 'client') {
        const staff = await ClientStaff.findByIdAndUpdate(id, data)
        return NextResponse.json({ success: true, staff })
      }

      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    if (action === 'delete') {
      if (type === 'audit') {
        await AuditStaff.findByIdAndDelete(id)
        return NextResponse.json({ success: true })
      }

      if (type === 'client') {
        await ClientStaff.findByIdAndDelete(id)
        return NextResponse.json({ success: true })
      }

      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    if (action === 'toggle') {
      if (type === 'audit') {
        const staff = await AuditStaff.findById(id)
        if (staff) {
          staff.isActive = !staff.isActive
          await staff.save()
        }

        return NextResponse.json({ success: true })
      }

      if (type === 'client') {
        const staff = await ClientStaff.findById(id)
        if (staff) {
          staff.isActive = !staff.isActive
          await staff.save()
        }

        return NextResponse.json({ success: true })
      }

      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('Staff management error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
