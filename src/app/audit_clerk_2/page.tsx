'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Search, AlertTriangle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function AuditClerk2Page() {
  const router = useRouter()

  // Session loading state
 const [isLoading, setIsLoading] = useState(true)
const [isAuthenticated, setIsAuthenticated] = useState(false)

  const [auditStaffId, setAuditStaffId] = useState('')
  const [auditStaffName, setAuditStaffName] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')

  const [skuId, setSkuId] = useState('')
  const [inventoryData, setInventoryData] = useState<any | null>(null)

  const [formData, setFormData] = useState({
    pickingQty: '',
    pickingLocation: '',
    bulkQty: '',
    bulkLocation: '',
    nearExpiryQty: '',
    nearExpiryLocation: 'NA',
    jitQty: '',
    jitLocation: 'NA',
    damagedQty: '',
    damagedLocation: 'NA',
    minQtyOdin: '',
    blockedQtyOdin: '',
    maxQtyOdin: '',
    qtyTested: ''
  })

  const [showObjection, setShowObjection] = useState(false)
  const [objectionData, setObjectionData] = useState({
    assignedClientStaffId: '',
    assignedClientStaffName: '',
    objectionRemarks: ''
  })
  const [clientStaffOptions, setClientStaffOptions] = useState<any[]>([])

  const [myEntries, setMyEntries] = useState<any[]>([])
  const [completedEntries, setCompletedEntries] = useState<any[]>([])
  const [raisedObjections, setRaisedObjections] = useState<any[]>([])

  // Sync sessionStorage to state when window becomes available
 useEffect(() => {
  const checkAuth = () => {
    if (typeof window !== 'undefined') {
      const staffId = sessionStorage.getItem('auditStaffId')
      const staffName = sessionStorage.getItem('auditStaffName')
      
      if (staffId && staffName) {
        setAuditStaffId(staffId)
        setAuditStaffName(staffName)
        setIsAuthenticated(true)
      } else {
        toast.error('Please login first')
        router.push('/')
      }
    }
    setIsLoading(false)
  }

  checkAuth()
}, [])

  // Only check authentication AFTER session is loaded
  useEffect(() => {
  if (isAuthenticated) {
    loadMyEntries()
  }
}, [isAuthenticated])
 

  const handleSearchSKU = async () => {
    if (!skuId) {
      toast.error('Please enter SKU ID')
      return
    }

    try {
      const response = await fetch('/api/audit/inventory?skuId=' + skuId.toUpperCase())
      if (response.ok) {
        const data = await response.json()
        setInventoryData(data)

        setFormData({
          pickingQty: '',
          pickingLocation: data.pickingLocation || '',
          bulkQty: '',
          bulkLocation: data.bulkLocation || '',
          nearExpiryQty: '',
          nearExpiryLocation: 'NA',
          jitQty: '',
          jitLocation: 'NA',
          damagedQty: '',
          damagedLocation: 'NA',
          minQtyOdin: '',
          blockedQtyOdin: '',
          maxQtyOdin: '',
          qtyTested: ''
        })

        setShowObjection(false)
      } else {
        toast.error('SKU not found')
        setInventoryData(null)
      }
    } catch (error) {
      console.error('Error searching SKU:', error)
      toast.error('Failed to search SKU')
    }
  }

  const handleLoadClientStaff = async () => {
    if (!selectedLocation) {
      toast.error('Please select a location first')
      return
    }

    try {
      const response = await fetch('/api/client/staff?location=' + encodeURIComponent(selectedLocation))
      const data = await response.json()
      setClientStaffOptions(data)
    } catch (error) {
      console.error('Error loading client staff:', error)
      toast.error('Failed to load client staff')
    }
  }

  // Load client staff options when location changes
  useEffect(() => {
    if (selectedLocation) {
      handleLoadClientStaff()
    }
  }, [selectedLocation])

  const calculateTotal = () => {
    return (
      parseFloat(formData.pickingQty) || 0 +
      parseFloat(formData.bulkQty) || 0 +
      parseFloat(formData.nearExpiryQty) || 0 +
      parseFloat(formData.jitQty) || 0 +
      parseFloat(formData.damagedQty) || 0
    )
  }

  const totalQuantity = calculateTotal()
  const maxQtyOdin = parseFloat(formData.maxQtyOdin) || 0

  const needsObjection = Math.abs(totalQuantity - maxQtyOdin) > 0.01 && maxQtyOdin > 0 && totalQuantity !== maxQtyOdin
  const objectionType = totalQuantity < maxQtyOdin ? 'Short' : (totalQuantity > maxQtyOdin ? 'Excess' : null)

  // Show objection form only when needed
  useEffect(() => {
    if (needsObjection && !showObjection) {
      setShowObjection(true)
    }
  }, [totalQuantity, maxQtyOdin])

  const handleSubmit = async () => {
    console.log('=== Submit Audit Entry ===')
    console.log('inventoryData:', inventoryData)
    console.log('selectedLocation:', selectedLocation)
    console.log('formData:', formData)
    console.log('needsObjection:', needsObjection)
    console.log('objectionData:', objectionData)
    console.log('auditStaffId:', auditStaffId)

    if (!inventoryData) {
      toast.error('Please search for a SKU first')
      console.error('❌ No inventory data')
      return
    }

    if (!selectedLocation) {
      toast.error('Please select a location')
      console.error('❌ No location selected')
      return
    }

    if (needsObjection && !objectionData.assignedClientStaffId) {
      toast.error('Please select a client staff to raise objection')
      console.error('❌ No client staff selected for objection')
      return
    }

    try {
      console.log('📤 Getting audit staff ID for:', auditStaffId)
      const staffResponse = await fetch('/api/audit/locations?staffId=' + auditStaffId)
      if (!staffResponse.ok) {
        console.error('❌ Failed to get audit staff ID:', staffResponse.status, staffResponse.statusText)
        toast.error('Failed to get audit staff ID. Please try again.')
        return
      }
      const staffData = await staffResponse.json()
      console.log('✅ Got audit staff ID:', staffData.id)

      const entryStatus = needsObjection ? 'Submitted' : 'Completed'
      console.log('📝 Entry status:', entryStatus)

      const entryData = {
    auditStaffId: staffData.id,
  auditStaffName: auditStaffName,
  location: selectedLocation,
  skuId: inventoryData.skuId,
  skuName: inventoryData.name,
  pickingQty: parseFloat(formData.pickingQty) || 0,
  pickingLocation: formData.pickingLocation || null,
  bulkQty: parseFloat(formData.bulkQty) || 0,
  bulkLocation: formData.bulkLocation || null,
  nearExpiryQty: parseFloat(formData.nearExpiryQty) || 0,
  nearExpiryLocation: formData.nearExpiryLocation || 'NA',
  jitQty: parseFloat(formData.jitQty) || 0,
  jitLocation: formData.jitLocation || 'NA',
  damagedQty: parseFloat(formData.damagedQty) || 0,
  damagedLocation: formData.damagedLocation || 'NA',
  minQtyOdin: parseFloat(formData.minQtyOdin) || 0,
  blockedQtyOdin: parseFloat(formData.blockedQtyOdin) || 0,
  maxQtyOdin: parseFloat(formData.maxQtyOdin) || 0,
  totalQuantityIdentified: totalQuantity,
  qtyTested: parseFloat(formData.qtyTested) || 0,
  status: entryStatus,
  objectionRaised: false,
  objectionType: null as string | null, // 👈 This is the key fix!
  assignedClientStaffId: null as string | null,
  assignedClientStaffName: null as string | null,
  objectionRemarks: null as string | null
      }

      if (needsObjection) {
        entryData.objectionRaised = true
        entryData.objectionType = objectionType
        entryData.assignedClientStaffId = objectionData.assignedClientStaffId
        entryData.assignedClientStaffName = objectionData.assignedClientStaffName
        entryData.objectionRemarks = objectionData.objectionRemarks
      } else {
        entryData.objectionRaised = false
        entryData.objectionType = null
        entryData.assignedClientStaffId = null
        entryData.assignedClientStaffName = null
        entryData.objectionRemarks = null
      }

      console.log('📤 Posting audit entry:', entryData)

      const response = await fetch('/api/audit/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryData)
      })

      console.log('📥 Response status:', response.status, response.statusText)

      if (response.ok) {
        console.log('✅ Entry submitted successfully')
        const createdEntry = await response.json()
        console.log('📊 Created entry:', createdEntry)
        toast.success(needsObjection ? 'Audit entry with objection submitted successfully' : 'Audit entry (matching quantities) submitted successfully')

        setSkuId('')
        setInventoryData(null)
        setFormData({
          pickingQty: '',
          pickingLocation: '',
          bulkQty: '',
          bulkLocation: '',
          nearExpiryQty: '',
          nearExpiryLocation: 'NA',
          jitQty: '',
          jitLocation: 'NA',
          damagedQty: '',
          damagedLocation: 'NA',
          minQtyOdin: '',
          blockedQtyOdin: '',
          maxQtyOdin: '',
          qtyTested: ''
        })
        setObjectionData({
          assignedClientStaffId: '',
          assignedClientStaffName: '',
          objectionRemarks: ''
        })
        setShowObjection(false)

        loadMyEntries()
      } else {
        const errorText = await response.text()
        console.error('❌ Submit failed:', response.status, errorText)
        toast.error('Failed to submit audit entry: ' + errorText)
      }
    } catch (error) {
  console.error('❌ Exception during submission:', error)
  if (error instanceof Error) {
    toast.error('Failed to submit audit entry: ' + error.message)
  } else {
    toast.error('Failed to submit audit entry: Unknown error occurred')
  }
}}

  const handleObjectionStaffChange = (value: string) => {
    const selectedStaff = clientStaffOptions.find((staff: any) => staff.id === value)
    setObjectionData({
      ...objectionData,
      assignedClientStaffId: value,
      assignedClientStaffName: selectedStaff?.name || ''
    })
  }

  const handleClear = () => {
    setSkuId('')
    setInventoryData(null)
    setFormData({
      pickingQty: '',
      pickingLocation: '',
      bulkQty: '',
      bulkLocation: '',
      nearExpiryQty: '',
      nearExpiryLocation: 'NA',
      jitQty: '',
      jitLocation: 'NA',
      damagedQty: '',
      damagedLocation: 'NA',
      minQtyOdin: '',
      blockedQtyOdin: '',
      maxQtyOdin: '',
      qtyTested: ''
    })
    setShowObjection(false)
  }

  const loadMyEntries = async () => {
    console.log('=== Load My Entries ===')
    console.log('auditStaffId:', auditStaffId)
    
    try {
      const response = await fetch('/api/audit/entries?auditStaffId=' + auditStaffId)
      console.log('📤 Response status:', response.status, response.statusText)
      
      if (!response.ok) {
        console.error('❌ Failed to fetch entries:', response.status)
        toast.error('Failed to load entries. Please refresh page.')
        setMyEntries([])
        setCompletedEntries([])
        setRaisedObjections([])
        return
      }
      
      const data = await response.json()
      console.log('📊 Entries data:', data)
      console.log('Is array?', Array.isArray(data))
      console.log('Data length:', data?.length)

      const allEntries = Array.isArray(data) ? data : []
      const completed = allEntries.filter((e: any) => e.status === 'Completed')
      const withObjection = allEntries.filter((e: any) => ['Submitted', 'Rejected', 'Resubmitted'].includes(e.status))

      console.log('✅ Completed entries:', completed.length)
      console.log('✅ Entries with objection:', withObjection.length)

      setMyEntries(withObjection)
      setCompletedEntries(completed)
      setRaisedObjections(withObjection)
    } catch (error) {
      console.error('❌ Error loading entries:', error)
      toast.error('Failed to load entries')
      setMyEntries([])
      setCompletedEntries([])
      setRaisedObjections([])
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

  const getObjectionTypeBadge = (type: string) => {
    if (!type) return <Badge variant="outline">-</Badge>
    const color = type === 'Short' ? 'bg-red-500' : 'bg-orange-500'
    return <Badge className={color}>{type}</Badge>
  }

 

  return (
      if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }
  
     <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex flex-col">
      <div className="border-b bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.push('/')} size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Audit Clerk Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  {auditStaffName} ({auditStaffId})
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Select Location</Label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="w-48">
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
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 flex-1">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Search SKU</CardTitle>
              <CardDescription>Enter SKU ID to start audit</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <Label>SKU ID</Label>
                  <Input
                    placeholder="e.g., 657611"
                    value={skuId}
                    onChange={(e) => setSkuId(e.target.value.toUpperCase())}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearchSKU()}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleSearchSKU}>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {inventoryData && (
            <Card>
              <CardHeader>
                <CardTitle>Audit Form: {inventoryData.name}</CardTitle>
                <CardDescription>SKU ID: {inventoryData.skuId}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Quantity Entry (Yellow Cells)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <Label>Picking Quantity</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.pickingQty}
                        onChange={(e) => setFormData({ ...formData, pickingQty: e.target.value })}
                        placeholder="Enter quantity"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Picking Location</Label>
                      <Input
                        value={formData.pickingLocation}
                        onChange={(e) => setFormData({ ...formData, pickingLocation: e.target.value })}
                        placeholder={inventoryData.pickingLocation || 'Enter location'}
                      />
                    </div>
                    <div className="space-y-2 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <Label>Bulk Quantity</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.bulkQty}
                        onChange={(e) => setFormData({ ...formData, bulkQty: e.target.value })}
                        placeholder="Enter quantity"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Bulk Location</Label>
                      <Input
                        value={formData.bulkLocation}
                        onChange={(e) => setFormData({ ...formData, bulkLocation: e.target.value })}
                        placeholder={inventoryData.bulkLocation || 'Enter location'}
                      />
                    </div>
                    <div className="space-y-2 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <Label>Near Expiry Quantity</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.nearExpiryQty}
                        onChange={(e) => setFormData({ ...formData, nearExpiryQty: e.target.value })}
                        placeholder="Enter quantity"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Near Expiry Location</Label>
                      <Input
                        value={formData.nearExpiryLocation}
                        onChange={(e) => setFormData({ ...formData, nearExpiryLocation: e.target.value })}
                        placeholder="Enter location"
                      />
                    </div>
                    <div className="space-y-2 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <Label>JIT Quantity</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.jitQty}
                        onChange={(e) => setFormData({ ...formData, jitQty: e.target.value })}
                        placeholder="Enter quantity"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>JIT Location</Label>
                      <Input
                        value={formData.jitLocation}
                        onChange={(e) => setFormData({ ...formData, jitLocation: e.target.value })}
                        placeholder="Enter location"
                      />
                    </div>
                    <div className="space-y-2 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <Label>Damaged Quantity</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.damagedQty}
                        onChange={(e) => setFormData({ ...formData, damagedQty: e.target.value })}
                        placeholder="Enter quantity"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Damaged Location</Label>
                      <Input
                        value={formData.damagedLocation}
                        onChange={(e) => setFormData({ ...formData, damagedLocation: e.target.value })}
                        placeholder="Enter location"
                      />
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border">
                    <div className="flex justify-between items-center">
                      <Label className="text-lg font-semibold">Total Quantity Identified</Label>
                      <span className="text-2xl font-bold">{totalQuantity.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold">ODIN Quantity Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Minimum Quantity (ODIN)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.minQtyOdin}
                          onChange={(e) => setFormData({ ...formData, minQtyOdin: e.target.value })}
                          placeholder="Enter minimum quantity"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Blocked Quantity (ODIN)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.blockedQtyOdin}
                          onChange={(e) => setFormData({ ...formData, blockedQtyOdin: e.target.value })}
                          placeholder="Enter blocked quantity"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Maximum Quantity (ODIN)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.maxQtyOdin}
                          onChange={(e) => setFormData({ ...formData, maxQtyOdin: e.target.value })}
                          placeholder="Enter maximum quantity"
                        />
                      </div>
                    </div>
                  </div>
                  {showObjection && needsObjection && (
                    <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-orange-900 dark:text-orange-100">
                          <AlertTriangle className="h-5 w-5" />
                          Audit Query Generated: {objectionType}
                        </CardTitle>
                        <CardDescription className="text-orange-800 dark:text-orange-200">
                          Total Quantity ({totalQuantity.toFixed(2)}) differs from Maximum Quantity as per ODIN ({maxQtyOdin.toFixed(2)})
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Qty Tested</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={formData.qtyTested}
                              onChange={(e) => setFormData({ ...formData, qtyTested: e.target.value })}
                              placeholder="Enter tested quantity"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Assign to Client Staff</Label>
                            <Select
                              value={objectionData.assignedClientStaffId}
                              onValueChange={handleObjectionStaffChange}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select client staff" />
                              </SelectTrigger>
                              <SelectContent>
                                {clientStaffOptions.map((staff: any) => (
                                  <SelectItem key={staff.id} value={staff.id}>
                                    {staff.name} ({staff.staffId})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Objection Remarks</Label>
                          <Textarea
                            value={objectionData.objectionRemarks}
                            onChange={(e) => setObjectionData({ ...objectionData, objectionRemarks: e.target.value })}
                            placeholder="Enter objection details..."
                            rows={3}
                            required
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  <div className="flex gap-4">
                    {!needsObjection && (
                      <Button onClick={handleSubmit} className="flex-1" size="lg">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Submit Audit Entry (Matching)
                      </Button>
                    )}
                    {needsObjection && (
                      <Button onClick={handleSubmit} className="flex-1" size="lg" variant="default">
                        <AlertTriangle className="h-5 w-5 mr-2" />
                        Submit with Objection
                      </Button>
                    )}
                    <Button onClick={handleClear} variant="outline">
                      Clear
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Completed Entries ({completedEntries.length})</CardTitle>
              <CardDescription>Audit entries where quantities matched (no objection)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>SKU ID</TableHead>
                      <TableHead>Total Qty</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedEntries.length > 0 && completedEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{new Date(entry.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{entry.location}</TableCell>
                        <TableCell>{entry.skuId}</TableCell>
                        <TableCell className="max-w-xs truncate">{entry.skuName}</TableCell>
                        <TableCell>{entry.totalQuantityIdentified}</TableCell>
                        <TableCell>{getStatusBadge(entry.status)}</TableCell>
                      </TableRow>
                    ))}
                    {completedEntries.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No completed entries yet. Start by searching for a SKU above.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Raised Objections ({raisedObjections.length})</CardTitle>
              <CardDescription>Audit entries with objections that are pending review</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>SKU ID</TableHead>
                      <TableHead>SKU Name</TableHead>
                      <TableHead>Total Qty</TableHead>
                      <TableHead>Max ODIN</TableHead>
                      <TableHead>Obj Type</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Remarks</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                  {raisedObjections.length > 0 && raisedObjections.map((query) => (
  <TableRow key={query.id}>
    <TableCell>{new Date(query.createdAt).toLocaleDateString()}</TableCell>
    <TableCell>{query.location}</TableCell>
    <TableCell>{query.auditStaffName}</TableCell>
    <TableCell>{query.skuId}</TableCell>
    <TableCell className="max-w-xs truncate">{query.skuName}</TableCell>
    <TableCell>{query.totalQuantityIdentified}</TableCell>
    <TableCell>{query.maxQtyOdin}</TableCell>
    <TableCell>{getObjectionTypeBadge(query.objectionType)}</TableCell>
    <TableCell>{query.assignedClientStaffName || '-'}</TableCell>
    <TableCell className="max-w-xs truncate">{query.objectionRemarks || '-'}</TableCell>
    <TableCell>{getStatusBadge(query.status)}</TableCell>
  </TableRow>
))}                
                    {raisedObjections.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                          No raised objections yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <footer className="border-t bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm mt-auto">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
          SCC Audit Management System - Audit Clerk Dashboard
        </div>
      </footer>
    </div>
  )
}
