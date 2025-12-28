import { NextRequest, NextResponse } from 'next/server'
import { Inventory } from '@/lib/models'
import connectToMongoDB from '@/lib/mongodb'

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

// POST - Upload Inventory via CSV
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

    const requiredFields = ['skuId', 'name']
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
      skipped: 0,
      updated: 0
    }

    for (const row of rows) {
      try {
        // Validate required fields
        if (!row.skuId || !row.name) {
          results.errors.push({
            row: row.skuId || 'Unknown',
            error: 'Missing required fields (skuId or name)'
          })
          continue
        }

        // Check if skuId already exists
        const existing = await Inventory.findOne({ skuId: row.skuId })
        if (existing) {
          // Update existing inventory
          existing.name = row.name.trim()
          existing.pickingLocation = row.pickingLocation || existing.pickingLocation
          existing.bulkLocation = row.bulkLocation || existing.bulkLocation
          existing.minQtyOdin = row.minQtyOdin ? parseFloat(row.minQtyOdin) : existing.minQtyOdin
          existing.blockedQtyOdin = row.blockedQtyOdin ? parseFloat(row.blockedQtyOdin) : existing.blockedQtyOdin
          existing.maxQtyOdin = row.maxQtyOdin ? parseFloat(row.maxQtyOdin) : existing.maxQtyOdin
          await existing.save()

          results.updated++
          continue
        }

        // Create new inventory
        const newInventory = await Inventory.create({
          skuId: row.skuId.toUpperCase(),
          name: row.name.trim(),
          pickingLocation: row.pickingLocation || '',
          bulkLocation: row.bulkLocation || '',
          minQtyOdin: row.minQtyOdin ? parseFloat(row.minQtyOdin) : 0,
          blockedQtyOdin: row.blockedQtyOdin ? parseFloat(row.blockedQtyOdin) : 0,
          maxQtyOdin: row.maxQtyOdin ? parseFloat(row.maxQtyOdin) : 0
        })

        results.success.push({
          skuId: newInventory.skuId,
          name: newInventory.name
        })
      } catch (error: any) {
        results.errors.push({
          row: row.skuId,
          error: error.message || 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${rows.length} rows`,
      results: {
        added: results.success.length,
        updated: results.updated,
        skipped: results.skipped,
        errors: results.errors.length
      },
      details: results
    })
  } catch (error: any) {
    console.error('Inventory CSV upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process CSV file' },
      { status: 500 }
    )
  }
}
