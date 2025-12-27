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
import { ArrowLeft, Check, X, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

type Query = {
  _id: string
  createdAt: string
  updatedAt: string
  location: string
  skuId: string
  skuName: string
  totalQuantityIdentified: number
  maxQtyOdin: number
  objectionRaised: boolean
  objectionType: string | null
  assignedClientStaffId: string
  assignedClientStaffName: string
  objectionRemarks: string
  status: string
  clientAction?: string
  clientActionDate?: string
}

export default function ClientDashboard() {
  const router = useRouter()

  const [clientStaffId, setClientStaffId] = useState('')
  const [clientStaffName, setClientStaffName] = useState('')
  const [location, setLocation] = useState('')

  const [assignedQueries, setAssignedQueries] = useState<Query[]>([])
  const [completedEntries, setCompletedEntries] = useState<Query[]>([])
  const [allQueries, setAllQueries] = useState<Query[]>([])

  const [selectedLocation, setSelectedLocation] = useState<'all' | string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'Submitted' | 'Approved' | 'Rejected' | 'Resubmitted' | 'Completed'>('all')

  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [selectedQuery, setSelectedQuery] = useState<Query | null>(null)
  const [action, setAction] = useState<'Approved' | 'Rejected'>('Approved')
  const [comments, setComments] = useState('')

  // Sync sessionStorage to state when window becomes available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setClientStaffId(sessionStorage.getItem('clientStaffId') || '')
      setClientStaffName(sessionStorage.getItem('clientStaffName') || '')
      setLocation(sessionStorage.getItem('clientLocation') || '')
    }
  }, [])

  useEffect(() => {
    if (!clientStaffId || clientStaffId === '') {
      toast.error('Please login first')
      router.push('/')
      return
    }
    loadQueries()
  }, [clientStaffId, location, statusFilter])

  const loadQueries = async () => {
    console.log('=== Load Queries ===')
    console.log('clientStaffId:', clientStaffId)
    console.log('location:', location)
    console.log('statusFilter:', statusFilter)
    
    try {
      const response = await fetch('/api/client/queries')
      console.log('📤 Response status:', response.status, response.statusText)
      
      if (!response.ok) {
        console.error('❌ Failed to fetch queries:', response.status)
        toast.error('Failed to load queries. Please refresh page.')
        setAssignedQueries([])
        setCompletedEntries([])
        setAllQueries([])
        return
      }

      const data = await response.json()
      console.log('📊 Queries data:', data)
      const queries = Array.isArray(data) ? data : []

      // Filter queries based on selected location
      let filteredQueries = queries
      if (selectedLocation !== 'all') {
        filteredQueries = queries.filter((q: Query) => q.location === selectedLocation)
      }

      // Filter by status
      if (statusFilter !== 'all') {
        filteredQueries = filteredQueries.filter((q: Query) => q.status === statusFilter)
      }

      console.log('✅ Filtered queries count:', filteredQueries.length)

      setAssignedQueries(filteredQueries)
      setAllQueries(queries)

      // Separate completed entries
      const completed = filteredQueries.filter((q: Query) => q.status === 'Completed')
      setCompletedEntries(completed)
    } catch (error) {
      console.error('❌ Error loading queries:', error)
      toast.error('Failed to load queries')
      setAssignedQueries([])
      setCompletedEntries([])
      setAllQueries([])
    }
  }

  const handleQueryAction = async () => {
    if (!selectedQuery || !action) return

    try {
      const response = await fetch('/api/client/queries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedQuery._id,
          action,
          comments
        })
      })

      if (response.ok) {
        const successMsg = action === 'Approved' ? 'Query approved successfully' : 'Query rejected successfully'
        toast.success(successMsg)
        setActionDialogOpen(false)
        setSelectedQuery(null)
        setComments('')
        await loadQueries()
      } else {
        toast.error('Failed to update query')
      }
    } catch (error) {
      console.error('Error updating query:', error)
      toast.error('Failed to update query')
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

  const calculateQtyDiff = (query: Query) => {
    const diff = query.totalQuantityIdentified - query.maxQtyOdin
    const diffType = diff > 0 ? '+' : ''
    return diffType + Math.abs(diff).toFixed(2)
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
                <h1 className="text-2xl font-bold">Client Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  {clientStaffName} ({clientStaffId}) - {location}
                </p>
              </div>
            </div>
            <Button onClick={loadQueries} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 flex-1">
        <div className="grid gap-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Assigned Queries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{assignedQueries.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Pending Review</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {assignedQueries.filter((q: Query) => q.status === 'Submitted').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Approved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {allQueries.filter((q: Query) => q.status === 'Approved').length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Location Filter</Label>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      <SelectItem value="Noida WH">Noida WH</SelectItem>
                      <SelectItem value="Mumbai WH">Mumbai WH</SelectItem>
                      <SelectItem value="Hyderabad WH">Hyderabad WH</SelectItem>
                      <SelectItem value="Bengaluru WH">Bengaluru WH</SelectItem>
                      <SelectItem value="Gurugram WH">Gurugram WH</SelectItem>
                      <SelectItem value="Delhi Retail">Delhi Retail</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status Filter</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="Submitted">Pending</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                      <SelectItem value="Resubmitted">Resubmitted</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assigned Queries Table */}
          <Card>
            <CardHeader>
              <CardTitle>Assigned Queries ({assignedQueries.length})</CardTitle>
              <CardDescription>Queries assigned to you for review</CardDescription>
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
                      <TableHead>SKU Name</TableHead>
                      <TableHead>Total Qty</TableHead>
                      <TableHead>Max ODIN</TableHead>
                      <TableHead>Difference</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignedQueries.length > 0 ? assignedQueries.map((query) => (
                      <TableRow key={query._id}>
                        <TableCell>{new Date(query.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{query.location}</TableCell>
                        <TableCell>{query.auditStaffName}</TableCell>
                        <TableCell>{query.skuId}</TableCell>
                        <TableCell className="max-w-xs truncate">{query.skuName}</TableCell>
                        <TableCell>{query.totalQuantityIdentified}</TableCell>
                        <TableCell>{query.maxQtyOdin}</TableCell>
                        <TableCell className={query.objectionRaised ? 'text-orange-600 font-semibold' : ''}>
                          {calculateQtyDiff(query)}
                        </TableCell>
                        <TableCell>{getStatusBadge(query.status)}</TableCell>
                        <TableCell>
                          {query.status === 'Submitted' && (
                            <Button
                              onClick={() => {
                                setSelectedQuery(query)
                                setActionDialogOpen(true)
                              }}
                              variant="outline"
                              size="sm"
                            >
                              Review
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                          No assigned queries yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Completed Entries Table */}
          <Card>
            <CardHeader>
              <CardTitle>Completed Entries ({completedEntries.length})</CardTitle>
              <CardDescription>Audit entries where you approved or quantities matched (no objection)</CardDescription>
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
                    {completedEntries.length > 0 ? completedEntries.map((entry) => (
                      <TableRow key={entry._id}>
                        <TableCell>{new Date(entry.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{entry.location}</TableCell>
                        <TableCell>{entry.auditStaffName}</TableCell>
                        <TableCell>{entry.skuId}</TableCell>
                        <TableCell>{entry.skuName}</TableCell>
                        <TableCell>{entry.totalQuantityIdentified}</TableCell>
                        <TableCell>{getStatusBadge(entry.status)}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No completed entries yet.
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

      {/* Action Dialog */}
      {actionDialogOpen && selectedQuery && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>
                {action === 'Approved' ? 'Approve Query' : 'Reject Query'}
              </CardTitle>
              <CardDescription>
                Review and provide feedback for audit query
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>SKU: {selectedQuery.skuId}</Label>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded border">
                  <div className="font-semibold">{selectedQuery.skuName}</div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Query Type: {getObjectionTypeBadge(selectedQuery.objectionType)}</Label>
                <div className="text-sm text-muted-foreground">
                  {selectedQuery.totalQuantityIdentified} vs {selectedQuery.maxQtyOdin}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="action">Action</Label>
                <div className="flex gap-4">
                  <Button
                    onClick={() => setAction('Approved')}
                    variant={action === 'Approved' ? 'default' : 'outline'}
                    className="flex-1"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => setAction('Rejected')}
                    variant={action === 'Rejected' ? 'destructive' : 'outline'}
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="comments">
                  {action === 'Approved' ? 'Approval Comments (Optional)' : 'Rejection Comments (Required)'}
                </Label>
                <Textarea
                  id="comments"
                  placeholder={action === 'Approved' ? 'Add optional approval comments...' : 'Explain why this query is rejected...'}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={3}
                  required={action === 'Rejected'}
                />
              </div>
            </CardContent>
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setActionDialogOpen(false)
                  setSelectedQuery(null)
                  setComments('')
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleQueryAction}
                disabled={action === 'Rejected' && !comments.trim()}
              >
                {action === 'Approved' ? 'Approve Query' : 'Reject Query'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      <footer className="border-t bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm mt-auto">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
          SCC Audit Management System - Client Dashboard
        </div>
      </footer>
    </div>
  )
}
