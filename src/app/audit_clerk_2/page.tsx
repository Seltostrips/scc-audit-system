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
import { ArrowLeft, Search, AlertTriangle, CheckCircle, Package, RefreshCw, PlusCircle, FileCheck, AlertCircle } from 'lucide-react'
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
  }, [router])

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
    if (!inventoryData) {
      toast.error('Please search for a SKU first')
      return
    }

    if (!selectedLocation) {
      toast.error('Please select a location')
      return
    }

    if (needsObjection && !objectionData.assignedClientStaffId) {
      toast.error('Please select a client staff to raise objection')
      return
    }

    try {
      const staffResponse = await fetch('/api/audit/locations?staffId=' + auditStaffId)
      if (!staffResponse.ok) {
        toast.error('Failed to get audit staff ID. Please try again.')
        return
      }
      const staffData = await staffResponse.json()

      const entryStatus = needsObjection ? 'Submitted' : 'Completed'

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
        objectionType: null as string | null,
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

      const response = await fetch('/api/audit/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryData)
      })

      if (response.ok) {
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
        toast.error('Failed to submit audit entry: ' + errorText)
      }
    } catch (error) {
      console.error('Exception during submission:', error)
      toast.error('Failed to submit audit entry')
    }
  }

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
    try {
      const response = await fetch('/api/audit/entries?auditStaffId=' + auditStaffId)

      if (!response.ok) {
        toast.error('Failed to load entries. Please refresh page.')
        setMyEntries([])
        setCompletedEntries([])
        setRaisedObjections([])
        return
      }

      const data = await response.json()
      const allEntries = Array.isArray(data) ? data : []
      const completed = allEntries.filter((e: any) => e.status === 'Completed')
      const withObjection = allEntries.filter((e: any) => ['Submitted', 'Rejected', 'Resubmitted'].includes(e.status))

      setMyEntries(withObjection)
      setCompletedEntries(completed)
      setRaisedObjections(withObjection)
    } catch (error) {
      console.error('Error loading entries:', error)
      toast.error('Failed to load entries')
      setMyEntries([])
      setCompletedEntries([])
      setRaisedObjections([])
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      'Draft': { color: 'bg-slate-500', label: 'Draft' },
      'Submitted': { color: 'bg-blue-500', label: 'Pending' },
      'Approved': { color: 'bg-emerald-500', label: 'Approved' },
      'Rejected': { color: 'bg-red-500', label: 'Rejected' },
      'Resubmitted': { color: 'bg-amber-500', label: 'Resubmitted' },
      'Completed': { color: 'bg-slate-400', label: 'Completed' },
      'Closed': { color: 'bg-purple-500', label: 'Closed' }
    }
    const config = statusConfig[status] || statusConfig['Draft']
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const getObjectionTypeBadge = (type: string) => {
    if (!type) return <Badge variant="outline">-</Badge>
    const color = type === 'Short' ? 'bg-red-500' : 'bg-orange-500'
    return <Badge className={color}>{type}</Badge>
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.push('/')} size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Audit Clerk Dashboard</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {auditStaffName} ({auditStaffId})
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="space-y-1">
                <Label htmlFor="location-select" className="text-sm">Location</Label>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger id="location-select" className="w-48">
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
      </header>

      <div className="container mx-auto px-4 py-6 flex-1">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column - Audit Form */}
          <div className="space-y-6">
            {/* SKU Search Card */}
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-2 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Search SKU
                </CardTitle>
                <CardDescription>Enter SKU ID to start audit</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter SKU ID (e.g., 657611)"
                    value={skuId}
                    onChange={(e) => setSkuId(e.target.value.toUpperCase())}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearchSKU()}
                    className="flex-1 font-mono uppercase"
                  />
                  <Button onClick={handleSearchSKU} disabled={!skuId} className="gap-2">
                    <Search className="h-4 w-4" />
                    Search
                  </Button>
                  <Button onClick={handleClear} variant="outline">
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Inventory Details Card */}
            {inventoryData && (
              <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-2 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Inventory Details
                  </CardTitle>
                  <CardDescription>
                    {inventoryData.skuId} - {inventoryData.name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Quantity Inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="picking-qty">Picking Quantity</Label>
                      <Input
                        id="picking-qty"
                        type="number"
                        placeholder="0"
                        value={formData.pickingQty}
                        onChange={(e) => setFormData({ ...formData, pickingQty: e.target.value })}
                        className="text-right font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bulk-qty">Bulk Quantity</Label>
                      <Input
                        id="bulk-qty"
                        type="number"
                        placeholder="0"
                        value={formData.bulkQty}
                        onChange={(e) => setFormData({ ...formData, bulkQty: e.target.value })}
                        className="text-right font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="near-expiry-qty">Near Expiry Qty</Label>
                      <Input
                        id="near-expiry-qty"
                        type="number"
                        placeholder="0"
                        value={formData.nearExpiryQty}
                        onChange={(e) => setFormData({ ...formData, nearExpiryQty: e.target.value })}
                        className="text-right font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="jit-qty">JIT Quantity</Label>
                      <Input
                        id="jit-qty"
                        type="number"
                        placeholder="0"
                        value={formData.jitQty}
                        onChange={(e) => setFormData({ ...formData, jitQty: e.target.value })}
                        className="text-right font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="damaged-qty">Damaged Quantity</Label>
                      <Input
                        id="damaged-qty"
                        type="number"
                        placeholder="0"
                        value={formData.damagedQty}
                        onChange={(e) => setFormData({ ...formData, damagedQty: e.target.value })}
                        className="text-right font-mono"
                      />
                    </div>
                  </div>

                  {/* ODIN Data */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h4 className="font-semibold text-sm mb-3 text-slate-700 dark:text-slate-300">ODIN Data</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="min-odin" className="text-xs">Min Qty</Label>
                        <Input
                          id="min-odin"
                          type="number"
                          placeholder="0"
                          value={formData.minQtyOdin}
                          onChange={(e) => setFormData({ ...formData, minQtyOdin: e.target.value })}
                          className="text-right font-mono text-sm h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="blocked-odin" className="text-xs">Blocked Qty</Label>
                        <Input
                          id="blocked-odin"
                          type="number"
                          placeholder="0"
                          value={formData.blockedQtyOdin}
                          onChange={(e) => setFormData({ ...formData, blockedQtyOdin: e.target.value })}
                          className="text-right font-mono text-sm h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="max-odin" className="text-xs">Max Qty</Label>
                        <Input
                          id="max-odin"
                          type="number"
                          placeholder="0"
                          value={formData.maxQtyOdin}
                          onChange={(e) => setFormData({ ...formData, maxQtyOdin: e.target.value })}
                          className="text-right font-mono text-sm h-9"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quantity Summary */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Total Identified</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalQuantity}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Max ODIN</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{maxQtyOdin}</p>
                      </div>
                    </div>
                    {maxQtyOdin > 0 && Math.abs(totalQuantity - maxQtyOdin) > 0.01 && (
                      <div className={`mt-3 p-2 rounded-lg ${totalQuantity < maxQtyOdin ? 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400' : 'bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400'}`}>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            {objectionType}: {Math.abs(totalQuantity - maxQtyOdin).toFixed(2)} {objectionType === 'Short' ? 'short' : 'excess'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quantity Tested */}
                  <div className="space-y-2">
                    <Label htmlFor="qty-tested">Quantity Tested</Label>
                    <Input
                      id="qty-tested"
                      type="number"
                      placeholder="0"
                      value={formData.qtyTested}
                      onChange={(e) => setFormData({ ...formData, qtyTested: e.target.value })}
                      className="text-right font-mono"
                    />
                  </div>

                  {/* Objection Form */}
                  {showObjection && needsObjection && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border-2 border-amber-200 dark:border-amber-800">
                      <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-4 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Objection Required
                      </h4>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="client-staff">Assign to Client Staff *</Label>
                          <Select value={objectionData.assignedClientStaffId} onValueChange={handleObjectionStaffChange}>
                            <SelectTrigger id="client-staff" className="w-full">
                              <SelectValue placeholder="Select client staff" />
                            </SelectTrigger>
                            <SelectContent>
                              {clientStaffOptions.map((staff) => (
                                <SelectItem key={staff.id} value={staff.id}>
                                  {staff.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="objection-remarks">Objection Remarks</Label>
                          <Textarea
                            id="objection-remarks"
                            placeholder="Describe the discrepancy..."
                            value={objectionData.objectionRemarks}
                            onChange={(e) => setObjectionData({ ...objectionData, objectionRemarks: e.target.value })}
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    onClick={handleSubmit}
                    disabled={!inventoryData || !selectedLocation || (needsObjection && !objectionData.assignedClientStaffId)}
                    className="w-full gap-2"
                    size="lg"
                  >
                    <PlusCircle className="h-5 w-5" />
                    {needsObjection ? 'Submit with Objection' : 'Submit Audit Entry'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - History */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-200 dark:border-emerald-800">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <FileCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <CardDescription className="text-xs font-medium">Completed</CardDescription>
                  </div>
                  <CardTitle className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{completedEntries.length}</CardTitle>
                </CardHeader>
              </Card>
              <Card className="bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-200 dark:border-amber-800">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    <CardDescription className="text-xs font-medium">Pending</CardDescription>
                  </div>
                  <CardTitle className="text-2xl font-bold text-amber-900 dark:text-amber-100">{raisedObjections.length}</CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* My Entries Table */}
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-2 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">My Audit Entries</CardTitle>
                <CardDescription>Recent audit entries with objections</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-slate-200 dark:border-slate-700 overflow-hidden max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 dark:bg-slate-800">
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="font-semibold">Location</TableHead>
                        <TableHead className="font-semibold">SKU</TableHead>
                        <TableHead className="font-semibold">Type</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {myEntries.length > 0 ? myEntries.map((entry) => (
                        <TableRow key={entry._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <TableCell className="text-sm">{new Date(entry.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-sm">{entry.location}</TableCell>
                          <TableCell className="text-sm font-medium">{entry.skuId}</TableCell>
                          <TableCell>{getObjectionTypeBadge(entry.objectionType)}</TableCell>
                          <TableCell>{getStatusBadge(entry.status)}</TableCell>
                        </TableRow>
                      )) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-slate-500 dark:text-slate-400">
                            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No entries yet</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Completed Entries Table */}
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-2 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Completed Entries</CardTitle>
                <CardDescription>Entries where quantities matched ODIN</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-slate-200 dark:border-slate-700 overflow-hidden max-h-64 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 dark:bg-slate-800">
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="font-semibold">Location</TableHead>
                        <TableHead className="font-semibold">SKU</TableHead>
                        <TableHead className="font-semibold">Qty</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {completedEntries.length > 0 ? completedEntries.map((entry) => (
                        <TableRow key={entry._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <TableCell className="text-sm">{new Date(entry.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-sm">{entry.location}</TableCell>
                          <TableCell className="text-sm font-medium">{entry.skuId}</TableCell>
                          <TableCell className="text-sm font-medium">{entry.totalQuantityIdentified}</TableCell>
                        </TableRow>
                      )) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-slate-500 dark:text-slate-400">
                            <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No completed entries yet</p>
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
      </div>
    </div>
  )
}
