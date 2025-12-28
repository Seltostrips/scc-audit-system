'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, RefreshCw, Download, Upload, FileSpreadsheet, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

type Staff = {
  _id: string
  staffId: string
  name: string
  pin: string
  locations?: string[]
  location?: string
  isActive: boolean
}

type InventoryItem = {
  _id: string
  skuId: string
  name: string
  pickingLocation?: string
  bulkLocation?: string
  minQtyOdin?: number
  blockedQtyOdin?: number
  maxQtyOdin?: number
}

type Query = {
  _id: string
  createdAt: string
  location: string
  auditStaffName: string
  skuId: string
  skuName: string
  totalQuantityIdentified: number
  status: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [auditStaff, setAuditStaff] = useState<Staff[]>([])
  const [clientStaff, setClientStaff] = useState<Staff[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [queries, setQueries] = useState<Query[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'audit-staff' | 'client-staff' | 'inventory' | 'queries'>('overview')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResults, setUploadResults] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [auditRes, clientRes, inventoryRes, queriesRes] = await Promise.all([
        fetch('/api/admin/staff'),
        fetch('/api/client/staff'),
        fetch('/api/inventory'),
        fetch('/api/client/queries'),
      ])

      const auditData = await auditRes.json()
      const clientData = await clientRes.json()
      const inventoryData = await inventoryRes.json()
      const queriesData = await queriesRes.json()

      setAuditStaff(auditData.auditStaff || [])
      setClientStaff(clientData.clientStaff || [])
      setInventory(inventoryData.inventory || [])
      setQueries(queriesData.queries || [])
    } catch (error) {
      console.error('Failed to load admin data:', error)
      toast.error('Failed to load dashboard data')
    }
  }

  const handleDownloadTemplate = (type: string) => {
    const url = `/api/admin/templates?type=${type}`
    const a = document.createElement('a')
    a.href = url
    a.download = `${type}_template.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    toast.success('Template downloaded successfully')
  }

  const handleCSVUpload = async (type: 'audit-staff' | 'client-staff' | 'inventory', file: File) => {
    setIsUploading(true)
    setUploadResults(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const endpoint = `/api/admin/upload/${type}`
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success(data.message)
        setUploadResults(data)
        await loadData()
      } else {
        toast.error(data.error || 'Upload failed')
        setUploadResults(data)
      }
    } catch (error) {
      console.error('CSV upload error:', error)
      toast.error('Failed to upload CSV')
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileSelect = (type: 'audit-staff' | 'client-staff' | 'inventory', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.name.endsWith('.csv')) {
        toast.error('Please select a CSV file')
        return
      }
      handleCSVUpload(type, file)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      'Draft': 'bg-gray-500',
      'Submitted': 'bg-blue-500',
      'Approved': 'bg-green-500',
      'Rejected': 'bg-red-500',
      'Resubmitted': 'bg-yellow-500',
      'Completed': 'bg-gray-400',
      'Closed': 'bg-purple-500',
    }
    return <Badge className={statusColors[status] || 'bg-gray-500'}>{status}</Badge>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/')}
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Admin Dashboard</h1>
              <p className="text-slate-600 dark:text-slate-400">Manage audit clerks, client staff, and inventory</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={loadData}
            disabled={isUploading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isUploading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white dark:bg-slate-800 shadow-sm">
            <CardHeader className="pb-3">
              <CardDescription className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Total Audit Staff
              </CardDescription>
              <CardTitle className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {auditStaff.length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-white dark:bg-slate-800 shadow-sm">
            <CardHeader className="pb-3">
              <CardDescription className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Total Client Staff
              </CardDescription>
              <CardTitle className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {clientStaff.length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-white dark:bg-slate-800 shadow-sm">
            <CardHeader className="pb-3">
              <CardDescription className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Total SKUs
              </CardDescription>
              <CardTitle className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {inventory.length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-white dark:bg-slate-800 shadow-sm">
            <CardHeader className="pb-3">
              <CardDescription className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Total Queries
              </CardDescription>
              <CardTitle className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {queries.length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Tabs */}
        <Card className="bg-white dark:bg-slate-800 shadow-sm mb-6">
          <CardContent className="p-4">
            <div className="flex gap-2">
              {[
                { value: 'overview', label: 'Overview' },
                { value: 'audit-staff', label: 'Audit Staff' },
                { value: 'client-staff', label: 'Client Staff' },
                { value: 'inventory', label: 'Inventory' },
                { value: 'queries', label: 'All Queries' },
              ].map((tab) => (
                <Button
                  key={tab.value}
                  variant={activeTab === tab.value ? 'default' : 'ghost'}
                  onClick={() => setActiveTab(tab.value as any)}
                  className="flex-1"
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <Card className="bg-white dark:bg-slate-800 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Recent Queries
              </CardTitle>
              <CardDescription>Latest 5 audit entries across all locations</CardDescription>
            </CardHeader>
            <CardContent>
              {queries.slice(0, 5).length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Auditor</TableHead>
                      <TableHead>SKU ID</TableHead>
                      <TableHead>SKU Name</TableHead>
                      <TableHead>Total Qty</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {queries.slice(0, 5).map((query) => (
                      <TableRow key={query._id}>
                        <TableCell>{new Date(query.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{query.location}</TableCell>
                        <TableCell>{query.auditStaffName}</TableCell>
                        <TableCell>{query.skuId}</TableCell>
                        <TableCell>{query.skuName}</TableCell>
                        <TableCell>{query.totalQuantityIdentified}</TableCell>
                        <TableCell>{getStatusBadge(query.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  No queries yet
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Audit Staff Tab */}
        {activeTab === 'audit-staff' && (
          <div className="space-y-6">
            <Card className="bg-white dark:bg-slate-800 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  CSV Upload - Audit Staff
                </CardTitle>
                <CardDescription>
                  Upload a CSV file to bulk import audit staff members
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* CSV Format Info */}
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Required CSV Format:</h3>
                  <code className="text-sm text-slate-600 dark:text-slate-400 block mb-2">
                    staffId,name,pin,locations
                  </code>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    Example: <code>AUD-001,John Doe,1234,"Noida WH,Mumbai WH"</code>
                  </p>
                  <ul className="text-sm text-slate-600 dark:text-slate-400 list-disc list-inside space-y-1">
                    <li><strong>staffId:</strong> Unique ID (e.g., AUD-001)</li>
                    <li><strong>name:</strong> Full name of the staff</li>
                    <li><strong>pin:</strong> 4-digit PIN (will be hashed)</li>
                    <li><strong>locations:</strong> Comma-separated list of locations (optional)</li>
                  </ul>
                </div>

                {/* Download Template Button */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleDownloadTemplate('audit-staff')}
                    variant="outline"
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                  <Button
                    onClick={() => document.getElementById('audit-staff-upload')?.click()}
                    disabled={isUploading}
                    className="flex-1"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isUploading ? 'Uploading...' : 'Upload CSV'}
                  </Button>
                </div>
                <input
                  id="audit-staff-upload"
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleFileSelect('audit-staff', e)}
                  className="hidden"
                />

                {/* Upload Results */}
                {uploadResults && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Added: {uploadResults.results?.added || 0} records</span>
                    </div>
                    {uploadResults.results?.skipped > 0 && (
                      <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                        <AlertCircle className="h-5 w-5" />
                        <span className="font-medium">Skipped: {uploadResults.results.skipped} duplicates</span>
                      </div>
                    )}
                    {uploadResults.results?.errors > 0 && (
                      <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <XCircle className="h-5 w-5" />
                        <span className="font-medium">Errors: {uploadResults.results.errors} records</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Existing Staff Table */}
                <div className="mt-6">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
                    Existing Audit Staff ({auditStaff.length})
                  </h3>
                  <div className="rounded-md border border-slate-200 dark:border-slate-700 max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>SCC ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Locations</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {auditStaff.map((staff) => (
                          <TableRow key={staff._id}>
                            <TableCell className="font-medium">{staff.staffId}</TableCell>
                            <TableCell>{staff.name}</TableCell>
                            <TableCell>
                              {staff.locations?.map((loc) => (
                                <Badge key={loc} variant="outline" className="mr-1 mb-1">
                                  {loc}
                                </Badge>
                              ))}
                            </TableCell>
                            <TableCell>
                              <Badge className={staff.isActive ? 'bg-green-500' : 'bg-red-500'}>
                                {staff.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Client Staff Tab */}
        {activeTab === 'client-staff' && (
          <div className="space-y-6">
            <Card className="bg-white dark:bg-slate-800 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  CSV Upload - Client Staff
                </CardTitle>
                <CardDescription>
                  Upload a CSV file to bulk import client staff members
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* CSV Format Info */}
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Required CSV Format:</h3>
                  <code className="text-sm text-slate-600 dark:text-slate-400 block mb-2">
                    staffId,name,pin,location
                  </code>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    Example: <code>CLI-001,Amit Kumar,4321,Noida WH</code>
                  </p>
                  <ul className="text-sm text-slate-600 dark:text-slate-400 list-disc list-inside space-y-1">
                    <li><strong>staffId:</strong> Unique ID (e.g., CLI-001)</li>
                    <li><strong>name:</strong> Full name of the staff</li>
                    <li><strong>pin:</strong> 4-digit PIN (will be hashed)</li>
                    <li><strong>location:</strong> Assigned location</li>
                  </ul>
                </div>

                {/* Download Template Button */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleDownloadTemplate('client-staff')}
                    variant="outline"
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                  <Button
                    onClick={() => document.getElementById('client-staff-upload')?.click()}
                    disabled={isUploading}
                    className="flex-1"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isUploading ? 'Uploading...' : 'Upload CSV'}
                  </Button>
                </div>
                <input
                  id="client-staff-upload"
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleFileSelect('client-staff', e)}
                  className="hidden"
                />

                {/* Upload Results */}
                {uploadResults && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Added: {uploadResults.results?.added || 0} records</span>
                    </div>
                    {uploadResults.results?.skipped > 0 && (
                      <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                        <AlertCircle className="h-5 w-5" />
                        <span className="font-medium">Skipped: {uploadResults.results.skipped} duplicates</span>
                      </div>
                    )}
                    {uploadResults.results?.errors > 0 && (
                      <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <XCircle className="h-5 w-5" />
                        <span className="font-medium">Errors: {uploadResults.results.errors} records</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Existing Staff Table */}
                <div className="mt-6">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
                    Existing Client Staff ({clientStaff.length})
                  </h3>
                  <div className="rounded-md border border-slate-200 dark:border-slate-700 max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>SCC ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clientStaff.map((staff) => (
                          <TableRow key={staff._id}>
                            <TableCell className="font-medium">{staff.staffId}</TableCell>
                            <TableCell>{staff.name}</TableCell>
                            <TableCell>{staff.location}</TableCell>
                            <TableCell>
                              <Badge className={staff.isActive ? 'bg-green-500' : 'bg-red-500'}>
                                {staff.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <Card className="bg-white dark:bg-slate-800 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  CSV Upload - Inventory
                </CardTitle>
                <CardDescription>
                  Upload a CSV file to bulk import inventory items
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* CSV Format Info */}
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Required CSV Format:</h3>
                  <code className="text-sm text-slate-600 dark:text-slate-400 block mb-2">
                    skuId,name,pickingLocation,bulkLocation,minQtyOdin,blockedQtyOdin,maxQtyOdin
                  </code>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    Example: <code>657611,Product A,A-1-1,B-1-1,50,5,200</code>
                  </p>
                  <ul className="text-sm text-slate-600 dark:text-slate-400 list-disc list-inside space-y-1">
                    <li><strong>skuId:</strong> Unique SKU ID (required)</li>
                    <li><strong>name:</strong> Product name (required)</li>
                    <li><strong>pickingLocation:</strong> Picking location (optional)</li>
                    <li><strong>bulkLocation:</strong> Bulk storage location (optional)</li>
                    <li><strong>minQtyOdin:</strong> Minimum quantity from ODIN (optional, default: 0)</li>
                    <li><strong>blockedQtyOdin:</strong> Blocked quantity from ODIN (optional, default: 0)</li>
                    <li><strong>maxQtyOdin:</strong> Maximum quantity from ODIN (optional, default: 0)</li>
                  </ul>
                </div>

                {/* Download Template Button */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleDownloadTemplate('inventory')}
                    variant="outline"
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                  <Button
                    onClick={() => document.getElementById('inventory-upload')?.click()}
                    disabled={isUploading}
                    className="flex-1"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isUploading ? 'Uploading...' : 'Upload CSV'}
                  </Button>
                </div>
                <input
                  id="inventory-upload"
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleFileSelect('inventory', e)}
                  className="hidden"
                />

                {/* Upload Results */}
                {uploadResults && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Added: {uploadResults.results?.added || 0} records</span>
                    </div>
                    {uploadResults.results?.updated > 0 && (
                      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">Updated: {uploadResults.results.updated} records</span>
                      </div>
                    )}
                    {uploadResults.results?.skipped > 0 && (
                      <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                        <AlertCircle className="h-5 w-5" />
                        <span className="font-medium">Skipped: {uploadResults.results.skipped} duplicates</span>
                      </div>
                    )}
                    {uploadResults.results?.errors > 0 && (
                      <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <XCircle className="h-5 w-5" />
                        <span className="font-medium">Errors: {uploadResults.results.errors} records</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Existing Inventory Table */}
                <div className="mt-6">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
                    Existing Inventory ({inventory.length})
                  </h3>
                  <div className="rounded-md border border-slate-200 dark:border-slate-700 max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>SKU ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Picking Location</TableHead>
                          <TableHead>Bulk Location</TableHead>
                          <TableHead>Min Qty</TableHead>
                          <TableHead>Blocked Qty</TableHead>
                          <TableHead>Max Qty</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inventory.map((item) => (
                          <TableRow key={item._id}>
                            <TableCell className="font-medium">{item.skuId}</TableCell>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>{item.pickingLocation || '-'}</TableCell>
                            <TableCell>{item.bulkLocation || '-'}</TableCell>
                            <TableCell>{item.minQtyOdin || 0}</TableCell>
                            <TableCell>{item.blockedQtyOdin || 0}</TableCell>
                            <TableCell>{item.maxQtyOdin || 0}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Queries Tab */}
        {activeTab === 'queries' && (
          <Card className="bg-white dark:bg-slate-800 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                All Queries
              </CardTitle>
              <CardDescription>View and manage all audit entries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-slate-200 dark:border-slate-700">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Auditor</TableHead>
                      <TableHead>SKU ID</TableHead>
                      <TableHead>SKU Name</TableHead>
                      <TableHead>Total Qty</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {queries.map((query) => (
                      <TableRow key={query._id}>
                        <TableCell>{new Date(query.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{query.location}</TableCell>
                        <TableCell>{query.auditStaffName}</TableCell>
                        <TableCell>{query.skuId}</TableCell>
                        <TableCell>{query.skuName}</TableCell>
                        <TableCell>{query.totalQuantityIdentified}</TableCell>
                        <TableCell>{getStatusBadge(query.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
          <p>SCC Audit Management System - Admin Dashboard</p>
        </footer>
      </div>
    </div>
  )
}
