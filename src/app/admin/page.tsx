'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, RefreshCw, Download, Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

type Staff = {
  _id: string
  staffId: string
  name: string
  pin: string
  locations: string[]
  isActive: boolean
}

export default function AdminDashboard() {
  const router = useRouter()

  const [auditStaff, setAuditStaff] = useState<Staff[]>([])
  const [clientStaff, setClientStaff] = useState<Staff[]>([])
  const [inventory, setInventory] = useState<any[]>([])
  const [queries, setQueries] = useState<any[]>([])

  const [activeTab, setActiveTab] = useState<'overview' | 'audit-staff' | 'client-staff' | 'inventory' | 'queries'>('overview')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)

  const [auditStaffForm, setAuditStaffForm] = useState({ staffId: '', name: '', pin: '', locations: [] })
  const [clientStaffForm, setClientStaffForm] = useState({ staffId: '', name: '', pin: '', location: '' })

  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [auditRes, clientRes, inventoryRes, queriesRes] = await Promise.all([
        fetch('/api/admin/staff'),
        fetch('/api/client/staff'),
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

  const handleDownloadCSV = async () => {
    try {
      const response = await fetch('/api/admin/staff?download=true')
      if (!response.ok) throw new Error('Failed to download CSV')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `scc_audit_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast.success('CSV downloaded successfully')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download CSV')
    }
  }

  const handleDeleteStaff = async (id: string, type: 'audit' | 'client') => {
    if (!confirm(`Are you sure you want to delete this ${type} staff?`)) return

    try {
      setIsUploading(true)
      const response = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type, action: 'delete' })
      })

      if (response.ok) {
 toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} staff deleted successfully`)
        await loadData()
      } else {
        toast.error('Failed to delete staff')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete staff')
    } finally {
      setIsUploading(false)
    }
  }

  const handleToggleStaff = async (id: string, type: 'audit' | 'client') => {
    try {
      setIsUploading(true)
      const response = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type, action: 'toggle' })
      })

      if (response.ok) {
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} staff toggled`)
        await loadData()
      } else {
        toast.error('Failed to toggle staff')
      }
    } catch (error) {
      console.error('Toggle error:', error)
      toast.error('Failed to toggle staff')
    } finally {
      setIsUploading(false)
    }
  }

  const openAddDialog = (type: 'audit' | 'client') => {
    setSelectedStaff(null)
    setAuditStaffForm({ staffId: '', name: '', pin: '', locations: [] })
    setClientStaffForm({ staffId: '', name: '', pin: '', location: '' })
    setIsAddDialogOpen(true)
  }

  const openEditDialog = (staff: Staff) => {
    setSelectedStaff(staff)
    if (staff.locations && staff.locations.length > 0) {
      setAuditStaffForm({ staffId: staff.staffId, name: staff.name, pin: staff.pin, locations: staff.locations })
    } else {
      setClientStaffForm({ staffId: staff.staffId, name: staff.name, pin: staff.pin, location: staff.location || '' })
    }
    setIsEditDialogOpen(true)
  }

  const handleSaveStaff = async (type: 'audit' | 'client') => {
    if (!selectedStaff) return

    try {
      setIsUploading(true)

      const endpoint = '/api/admin/staff'
      const formData = type === 'audit' ? auditStaffForm : clientStaffForm

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          type,
          ...formData
        })
      })

      if (response.ok) {
        toast.success(`${type.charAt(0).toUpperCase() + ${type.slice(1)} staff added successfully`)
        setIsAddDialogOpen(false)
        setIsEditDialogOpen(false)
        setSelectedStaff(null)
        await loadData()
      } else {
        toast.error('Failed to add staff')
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save staff')
    } finally {
      setIsUploading(false)
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
      'Closed': 'bg-purple-500'
    }
    return <Badge className={statusColors[status] || 'bg-gray-500'}>{status}</Badge>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex flex-col">
      <div className="border-b bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.push('/')} size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">SCC Audit Management System</p>
              </div>
            </div>
            <Button onClick={handleDownloadCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download CSV
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 flex-1">
        <div className="grid gap-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Total Audit Staff</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{auditStaff.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total Client Staff</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{clientStaff.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total SKUs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{inventory.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total Queries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{queries.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <div className="space-y-4">
            <div className="flex gap-2">
              {[
                { value: 'overview', label: 'Overview' },
                { value: 'audit-staff', label: 'Audit Staff' },
                { value: 'client-staff', label: 'Client Staff' },
                { value: 'inventory', label: 'Inventory' },
                { value: 'queries', label: 'All Queries' }
              ].map((tab) => (
                <Button
                  key={tab.value}
                  variant={activeTab === tab.value ? 'default' : 'outline'}
                  onClick={() => setActiveTab(tab.value as any)}
                  className="flex-1"
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Queries</CardTitle>
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
                          <TableHead>SKU</TableHead>
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
                    <p className="text-center py-8 text-muted-foreground">No queries yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Audit Staff Tab */}
          {activeTab === 'audit-staff' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Audit Staff Management</CardTitle>
                  <Button onClick={openAddDialog.bind(null, 'audit')} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Staff
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SCC ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Locations</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditStaff.map((staff) => (
                        <TableRow key={staff._id}>
                          <TableCell>{staff.staffId}</TableCell>
                          <TableCell>{staff.name}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {staff.locations.map((loc) => (
                                <Badge key={loc} variant="outline">{loc}</Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={staff.isActive ? 'bg-green-500' : 'bg-red-500'}>
                              {staff.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button onClick={openEditDialog.bind(null, staff)} variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button onClick={handleToggleStaff.bind(null, staff._id, 'audit')} variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button onClick={handleDeleteStaff.bind(null, staff._id, 'audit')} variant="destructive" size="sm" disabled={isUploading}>
                                {isUploading ? '...' : <Trash2 className="h-4 w-4" />}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Client Staff Tab */}
          {activeTab === 'client-staff' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Client Staff Management</CardTitle>
                  <Button onClick={openAddDialog.bind(null, 'client')} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Staff
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SCC ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clientStaff.map((staff) => (
                        <TableRow key={staff._id}>
                          <TableCell>{staff.staffId}</TableCell>
                          <TableCell>{staff.name}</TableCell>
                          <TableCell>{staff.location}</TableCell>
                          <TableCell>
                            <Badge className={staff.isActive ? 'bg-green-500' : 'bg-red-500'}>
                              {staff.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button onClick={openEditDialog.bind(null, staff)} variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button onClick={handleToggleStaff.bind(null, staff._id, 'client')} variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button onClick={handleDeleteStaff.bind(null, staff._id, 'client')} variant="destructive" size="sm" disabled={isUploading}>
                                {isUploading ? '...' : <Trash2 className="h-4 w-4" />}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Queries Tab */}
          {activeTab === 'queries' && (
            <Card>
              <CardHeader>
                <CardTitle>All Queries</CardTitle>
                <CardDescription>View and manage all audit queries</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Auditor</TableHead>
                        <TableHead>SKU ID</TableHead>
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
                          <TableCell className="max-w-xs truncate">{query.skuName}</TableCell>
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
        </div>
      </div>

      {/* Add/Edit Dialog */}
      {(isAddDialogOpen || isEditDialogOpen) && selectedStaff && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{isEditDialogOpen ? 'Edit Staff' : 'Add Staff'}</CardTitle>
              <CardDescription>
                {isEditDialogOpen ? 'Manage locations for ' + selectedStaff.name : 'Add new ' + (selectedStaff.locations ? 'audit' : 'client') + ' staff member'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="staffId">SCC ID</Label>
                <Input
                  id="staffId"
                  placeholder="e.g., 26C"
                  value={selectedStaff.staffId}
                  onChange={(e) => setSelectedStaff({ ...selectedStaff, staffId: e.target.value.toUpperCase() })}
                  className="uppercase"
                  disabled={isEditDialogOpen}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Enter full name"
                  value={selectedStaff.name}
                  onChange={(e) => setSelectedStaff({ ...selectedStaff, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pin">PIN</Label>
                <Input
                  id="pin"
                  type="password"
                  placeholder="Enter 4-digit PIN"
                  value={selectedStaff.pin}
                  onChange={(e) => setSelectedStaff({ ...selectedStaff, pin: e.target.value })}
                  maxLength={4}
                />
              </div>
              {selectedStaff.locations && selectedStaff.locations.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="locations">Locations</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {['Noida WH', 'Mumbai WH', 'Hyderabad WH', 'Bengaluru WH', 'Gurugram WH', 'Delhi Retail'].map((location) => (
                      <div key={location} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`location-${location}`}
                          checked={selectedStaff.locations.includes(location)}
                          onChange={(e) => {
                            const checked = e.target.checked
                            setSelectedStaff({
                              ...selectedStaff,
                              locations: checked
                                ? [...selectedStaff.locations, location]
                                : selectedStaff.locations.filter((l) => l !== location)
                            })
                          }}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor={`location-${location}`} className="cursor-pointer">
                          {location}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {!selectedStaff.locations && selectedStaff.location && (
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Select
                    value={selectedStaff.location}
                    onValueChange={(value) => setSelectedStaff({ ...selectedStaff, location: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Noida WH">Noida WH</SelectItem>
                      <SelectItem value="Mumbai WH">Mumbai WH</SelectItem>
                      <SelectItem value="Hyderabad WH">Hyderabad WH</SelectItem>
                      <SelectItem value="Bengaluru WH">Bengaluru WH</SelectItem>
                      <SelectItem value="Gurugram WH">Gurugram WH</SelectItem>
                      <SelectItem value="Delhi Retail">Delhi Retail</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); setIsEditDialogOpen(false); setSelectedStaff(null) }}>
                Cancel
              </Button>
              <Button onClick={handleSaveStaff} disabled={isUploading}>
                {isUploading ? '...' : 'Save'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      <footer className="border-t bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm mt-auto">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
          SCC Audit Management System - Admin Dashboard
        </div>
      </footer>
    </div>
  )
}
