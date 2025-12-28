import { NextRequest, NextResponse } from 'next/server'

// GET - Download CSV templates
export async function GET(request: NextRequest) {
  try {
    const searchParams = new URL(request.url).searchParams
    const type = searchParams.get('type')

    let csvContent = ''
    let filename = ''

    switch (type) {
      case 'audit-staff':
        csvContent = 'staffId,name,pin,locations\nAUD-001,John Doe,1234,"Noida WH,Mumbai WH"\nAUD-002,Jane Smith,5678,"Noida WH"'
        filename = 'audit_staff_template.csv'
        break

      case 'client-staff':
        csvContent = 'staffId,name,pin,location\nCLI-001,Amit Kumar,4321,Noida WH\nCLI-002,Sneha Reddy,8765,Mumbai WH'
        filename = 'client_staff_template.csv'
        break

      case 'inventory':
        csvContent = 'skuId,name,pickingLocation,bulkLocation,minQtyOdin,blockedQtyOdin,maxQtyOdin\n657611,Product A - Electronics,A-1-1,B-1-1,50,5,200\n657612,Product B - Furniture,A-1-2,B-1-2,30,0,100\n657613,Product C - Clothing,A-2-1,B-2-1,100,10,500'
        filename = 'inventory_template.csv'
        break

      default:
        return NextResponse.json({ error: 'Invalid template type' }, { status: 400 })
    }

    // Create response with CSV content
    const response = new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })

    return response
  } catch (error: any) {
    console.error('Template download error:', error)
    return NextResponse.json({ error: 'Failed to download template' }, { status: 500 })
  }
}
