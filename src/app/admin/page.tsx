'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, RefreshCw, Download, Upload, CheckCircle, XCircle, AlertCircle, Users, UserCheck, Package, FileText } from 'lucide-react'
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
    const statusConfig: Record<string, { color: string; icon?: React.ReactNode }> = {
      'Draft': { color: 'bg-slate-500' },
      'Submitted': { color: 'bg-blue-500' },
      'Approved': { color: 'bg-emerald-500' },
      'Rejected': { color: 'bg-red-500' },
      'Resubmitted': { color: 'bg-amber-500' },
      'Completed': { color: 'bg-slate-400' },
      'Closed': { color: 'bg-purple-500' },
    }
    const config = statusConfig[status] || statusConfig['Draft']
    return <Badge className={config.color}>{status}</Badge>
  }

  const statsCards = [
    {
      title: 'Total Audit Staff',
      value: auditStaff.length,
      icon: UserCheck,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20'
    },
    {
      title: 'Total Client Staff',
      value: clientStaff.length,
      icon: Users,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/20'
    },
    {
      title: 'Total SKUs',
      value: inventory.length,
      icon: Package,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20'
    },
    {
      title: 'Total Queries',
      value: queries.length,
      icon: FileText,
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-950/20'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/')}
                size="sm"
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Admin Dashboard</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">Manage staff and inventory</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={loadData}
              disabled={isUploading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isUploading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-4 md:p-6 max-w-7xl">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statsCards.map((card, index) => {
            const Icon = card.icon
            return (
              <Card key={index} className={`${card.bgColor} border-2 hover:shadow-lg transition-shadow duration-200`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {card.title}
                    </CardDescription>
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${card.color}`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                    {card.value}
                  </CardTitle>
                </CardHeader>
              </Card>
            )
          })}
        </div>

        {/* Tabs */}
        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-2 shadow-sm mb-6">
          <CardContent className="p-2">
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'overview', label: 'Overview', icon: FileText },
                { value: 'audit-staff', label: 'Audit Staff', icon: UserCheck },
                { value: 'client-staff', label: 'Client Staff', icon: Users },
                { value: 'inventory', label: 'Inventory', icon: Package },
                { value: 'queries', label: 'All Queries', icon: FileText },
              ].map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.value
                return (
                  <Button
                    key={tab.value}
                    variant={isActive ? 'default' : 'ghost'}
                    onClick={() => setActiveTab(tab.value as any)}
                    className={`flex-1 min-w-fit gap-2 ${isActive ? 'shadow-md' : ''}`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-2 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Recent Queries
              </CardTitle>
              <CardDescription>Latest 5 audit entries across all locations</CardDescription>
            </CardHeader>
            <CardContent>
              {queries.slice(0, 5).length > 0 ? (
                <div className="rounded-md border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 dark:bg-slate-800">
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="font-semibold">Location</TableHead>
                        <TableHead className="font-semibold">Auditor</TableHead>
                        <TableHead className="font-semibold">SKU ID</TableHead>
                        <TableHead className="font-semibold">SKU Name</TableHead>
                        <TableHead className="font-semibold">Total Qty</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {queries.slice(0, 5).map((query) => (
                        <TableRow key={query._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <TableCell className="text-sm">{new Date(query.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-sm">{query.location}</TableCell>
                          <TableCell className="text-sm">{query.auditStaffName}</TableCell>
                          <TableCell className="text-sm font-medium">{query.skuId}</TableCell>
                          <TableCell className="text-sm max-w-xs truncate">{query.skuName}</TableCell>
                          <TableCell className="text-sm font-medium">{query.totalQuantityIdentified}</TableCell>
                          <TableCell>{getStatusBadge(query.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No queries yet</p>
                  <p className="text-sm mt-1">Start by adding audit staff and inventory</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Audit Staff Tab */}
        {activeTab === 'audit-staff' && (
          <div className="space-y-6">
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-2 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  Manage Audit Staff
                </CardTitle>
                <CardDescription>Upload a CSV file to bulk import audit staff members</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* CSV Format Info */}
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Required CSV Format:
                  </h3>
                  <code className="text-sm text-slate-700 dark:text-slate-300 block mb-3 font-mono bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    staffId,name,pin,locations
                  </code>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
                    Example: <code className="bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">AUD-001,John Doe,1234,"Noida WH,Mumbai WH"</code>
                  </p>
                  <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span><strong className="text-slate-900 dark:text-slate-100">staffId:</strong> Unique ID (e.g., AUD-001)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span><strong className="text-slate-900 dark:text-slate-100">name:</strong> Full name of the staff</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span><strong className="text-slate-900 dark:text-slate-100">pin:</strong> 4-digit PIN (will be hashed)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span><strong className="text-slate-900 dark:text-slate-100">locations:</strong> Comma-separated list (optional)</span>
                    </li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleDownloadTemplate('audit-staff')}
                    variant="outline"
                    className="flex-1 gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download Template
                  </Button>
                  <Button
                    onClick={() => document.getElementById('audit-staff-upload')?.click()}
                    disabled={isUploading}
                    className="flex-1 gap-2"
                  >
                    <Upload className="h-4 w-4" />
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
                  <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Added: {uploadResults.results?.added || 0} records</span>
                    </div>
                    {uploadResults.results?.skipped > 0 && (
                      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
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
                {auditStaff.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
                      Existing Audit Staff ({auditStaff.length})
                    </h3>
                    <div className="rounded-md border border-slate-200 dark:border-slate-700 max-h-96 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50 dark:bg-slate-800">
                            <TableHead className="font-semibold">SCC ID</TableHead>
                            <TableHead className="font-semibold">Name</TableHead>
                            <TableHead className="font-semibold">Locations</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {auditStaff.map((staff) => (
                            <TableRow key={staff._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <TableCell className="font-medium">{staff.staffId}</TableCell>
                              <TableCell>{staff.name}</TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {staff.locations?.map((loc) => (
                                    <Badge key={loc} variant="outline" className="text-xs">
                                      {loc}
                                    </Badge>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={staff.isActive ? 'bg-emerald-500' : 'bg-red-500'}>
                                  {staff.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Client Staff Tab */}
        {activeTab === 'client-staff' && (
          <div className="space-y-6">
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-2 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  Manage Client Staff
                </CardTitle>
                <CardDescription>Upload a CSV file to bulk import client staff members</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* CSV Format Info */}
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Required CSV Format:
                  </h3>
                  <code className="text-sm text-slate-700 dark:text-slate-300 block mb-3 font-mono bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    staffId,name,pin,location
                  </code>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
                    Example: <code className="bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">CLI-001,Amit Kumar,4321,Noida WH</code>
                  </p>
                  <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5">•</span>
                      <span><strong className="text-slate-900 dark:text-slate-100">staffId:</strong> Unique ID (e.g., CLI-001)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5">•</span>
                      <span><strong className="text-slate-900 dark:text-slate-100">name:</strong> Full name of staff</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5">•</span>
                      <span><strong className="text-slate-900 dark:text-slate-100">pin:</strong> 4-digit PIN (will be hashed)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5">•</span>
                      <span><strong className="text-slate-900 dark:text-slate-100">location:</strong> Assigned location</span>
                    </li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleDownloadTemplate('client-staff')}
                    variant="outline"
                    className="flex-1 gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download Template
                  </Button>
                  <Button
                    onClick={() => document.getElementById('client-staff-upload')?.click()}
                    disabled={isUploading}
                    className="flex-1 gap-2"
                  >
                    <Upload className="h-4 w-4" />
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
                  <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Added: {uploadResults.results?.added || 0} records</span>
                    </div>
                    {uploadResults.results?.skipped > 0 && (
                      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
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
                {clientStaff.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
                      Existing Client Staff ({clientStaff.length})
                    </h3>
                    <div className="rounded-md border border-slate-200 dark:border-slate-700 max-h-96 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50 dark:bg-slate-800">
                            <TableHead className="font-semibold">SCC ID</TableHead>
                            <TableHead className="font-semibold">Name</TableHead>
                            <TableHead className="font-semibold">Location</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {clientStaff.map((staff) => (
                            <TableRow key={staff._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <TableCell className="font-medium">{staff.staffId}</TableCell>
                              <TableCell>{staff.name}</TableCell>
                              <TableCell>{staff.location}</TableCell>
                              <TableCell>
                                <Badge className={staff.isActive ? 'bg-emerald-500' : 'bg-red-500'}>
                                  {staff.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-2 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  Manage Inventory
                </CardTitle>
                <CardDescription>Upload a CSV file to bulk import inventory items</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* CSV Format Info */}
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    Required CSV Format:
                  </h3>
                  <code className="text-sm text-slate-700 dark:text-slate-300 block mb-3 font-mono bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    skuId,name,pickingLocation,bulkLocation,minQtyOdin,blockedQtyOdin,maxQtyOdin
                  </code>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
                    Example: <code className="bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">657611,Product A,A-1-1,B-1-1,50,5,200</code>
                  </p>
                  <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-500 mt-0.5">•</span>
                      <span><strong className="text-slate-900 dark:text-slate-100">skuId:</strong> Unique SKU ID (required)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-500 mt-0.5">•</span>
                      <span><strong className="text-slate-900 dark:text-slate-100">name:</strong> Product name (required)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-500 mt-0.5">•</span>
                      <span><strong className="text-slate-900 dark:text-slate-100">pickingLocation:</strong> Picking location (optional)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-500 mt-0.5">•</span>
                      <span><strong className="text-slate-900 dark:text-slate-100">bulkLocation:</strong> Bulk storage location (optional)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-500 mt-0.5">•</span>
                      <span><strong className="text-slate-900 dark:text-slate-100">min/maxQtyOdin:</strong> ODIN quantities (optional)</span>
                    </li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleDownloadTemplate('inventory')}
                    variant="outline"
                    className="flex-1 gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download Template
                  </Button>
                  <Button
                    onClick={() => document.getElementById('inventory-upload')?.click()}
                    disabled={isUploading}
                    className="flex-1 gap-2"
                  >
                    <Upload className="h-4 w-4" />
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
                  <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
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
                      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
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
                {inventory.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
                      Existing Inventory ({inventory.length})
                    </h3>
                    <div className="rounded-md border border-slate-200 dark:border-slate-700 max-h-96 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50 dark:bg-slate-800">
                            <TableHead className="font-semibold">SKU ID</TableHead>
                            <TableHead className="font-semibold">Name</TableHead>
                            <TableHead className="font-semibold">Picking</TableHead>
                            <TableHead className="font-semibold">Bulk</TableHead>
                            <TableHead className="font-semibold">Min</TableHead>
                            <TableHead className="font-semibold">Blocked</TableHead>
                            <TableHead className="font-semibold">Max</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {inventory.map((item) => (
                            <TableRow key={item._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <TableCell className="font-medium">{item.skuId}</TableCell>
                              <TableCell>{item.name}</TableCell>
                              <TableCell className="text-sm">{item.pickingLocation || '-'}</TableCell>
                              <TableCell className="text-sm">{item.bulkLocation || '-'}</TableCell>
                              <TableCell className="text-sm">{item.minQtyOdin || 0}</TableCell>
                              <TableCell className="text-sm">{item.blockedQtyOdin || 0}</TableCell>
                              <TableCell className="text-sm">{item.maxQtyOdin || 0}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Queries Tab */}
        {activeTab === 'queries' && (
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-2 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                All Queries
              </CardTitle>
              <CardDescription>View and manage all audit entries</CardDescription>
            </CardHeader>
            <CardContent>
              {queries.length > 0 ? (
                <div className="rounded-md border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 dark:bg-slate-800">
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="font-semibold">Location</TableHead>
                        <TableHead className="font-semibold">Auditor</TableHead>
                        <TableHead className="font-semibold">SKU ID</TableHead>
                        <TableHead className="font-semibold">SKU Name</TableHead>
                        <TableHead className="font-semibold">Total Qty</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {queries.map((query) => (
                        <TableRow key={query._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <TableCell className="text-sm">{new Date(query.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-sm">{query.location}</TableCell>
                          <TableCell className="text-sm">{query.auditStaffName}</TableCell>
                          <TableCell className="text-sm font-medium">{query.skuId}</TableCell>
                          <TableCell className="text-sm max-w-xs truncate">{query.skuName}</TableCell>
                          <TableCell className="text-sm font-medium">{query.totalQuantityIdentified}</TableCell>
                          <TableCell>{getStatusBadge(query.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No queries yet</p>
                  <p className="text-sm mt-1">Start by adding audit staff and inventory</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-slate-500 dark:text-slate-500 py-4">
          <p>SCC Audit Management System - Admin Dashboard</p>
        </footer>
      </div>
    </div>
  )
}
