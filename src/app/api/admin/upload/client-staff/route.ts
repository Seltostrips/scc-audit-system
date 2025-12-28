import { NextRequest, NextResponse } from 'next/server'
import { ClientStaff } from '@/lib/models'
import { connectToMongoDB } from '@/lib/mongodb'
import bcrypt from 'bcryptjs'

// Helper function to parse CSV (handles quoted values)
function parseCSV(csvText: string) {
  const lines = csvText.trim().split('\n')
  if (lines.length === 0) return []

  const headers = parseCSVLine(lines[0])
  const data = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    // Skip empty lines
    if (!line) continue

    const values = parseCSVLine(line)
    const row: any = {}

    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() || ''
    })

    data.push(row)
  }

  return data
}

// Helper function to parse a single CSV line (handles quoted values)
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }

  result.push(current)
  return result
}

// POST - Upload Client Staff via CSV
export async function POST(request: NextRequest) {
  await connectToMongoDB()

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Check file type
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'File must be a CSV' }, { status: 400 })
    }

    // Read file content
    const text = await file.text()

    // Parse CSV
    const rows = parseCSV(text)

    // Validate CSV structure
    if (rows.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty' }, { status: 400 })
    }

    const requiredFields = ['staffId', 'name', 'pin', 'location']
    const firstRow = rows[0]
    const missingFields = requiredFields.filter(field => !(field in firstRow))

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Process and insert records
    const results = {
      success: [] as any[],
      errors: [] as any[],
      skipped: 0
    }

    for (const row of rows) {
      try {
        // Validate required fields
        if (!row.staffId || !row.name || !row.pin || !row.location) {
          results.errors.push({
            row: row.staffId || 'Unknown',
            error: 'Missing required fields (staffId, name, pin, or location)'
          })
          continue
        }

        // Check if staffId already exists
        const existing = await ClientStaff.findOne({ staffId: row.staffId })
        if (existing) {
          results.skipped++
          continue
        }

        // Validate PIN is 4 digits
        if (!/^\d{4}$/.test(row.pin)) {
          results.errors.push({
            row: row.staffId,
            error: 'PIN must be exactly 4 digits'
          })
          continue
        }

        // Hash the PIN
        const hashedPin = bcrypt.hashSync(row.pin, bcrypt.genSaltSync(10))

        // Create new client staff
        const newStaff = await ClientStaff.create({
          staffId: row.staffId.toUpperCase(),
          name: row.name.trim(),
          pin: hashedPin,
          location: row.location.trim(),
          isActive: true
        })

        results.success.push({
          staffId: newStaff.staffId,
          name: newStaff.name,
          location: newStaff.location
        })
      } catch (error: any) {
        results.errors.push({
          row: row.staffId,
          error: error.message || 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${rows.length} rows`,
      results: {
        added: results.success.length,
        skipped: results.skipped,
        errors: results.errors.length
      },
      details: results
    })
  } catch (error: any) {
    console.error('Client Staff CSV upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process CSV file' },
      { status: 500 }
    )
  }
}
