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
import { ArrowLeft, Check, RefreshCw, FileText, Clock, CheckCircle, Filter } from 'lucide-react'
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
  auditStaffName: string
}

export default function ClientDashboard() {
  const router = useRouter()

  const [clientStaffId, setClientStaffId] = useState('')
  const [clientStaffName, setClientStaffName] = useState('')
  const [location, setLocation] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

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
    const checkAuth = () => {
      if (typeof window !== 'undefined') {
        const staffId = sessionStorage.getItem('clientStaffId')
        const staffName = sessionStorage.getItem('clientStaffName')
        const clientLocation = sessionStorage.getItem('clientLocation')

        if (staffId && staffName && clientLocation) {
          setClientStaffId(staffId)
          setClientStaffName(staffName)
          setLocation(clientLocation)
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

  useEffect(() => {
    if (isAuthenticated) {
      loadQueries()
    }
  }, [isAuthenticated, selectedLocation, statusFilter])

  const loadQueries = async () => {
    try {
      const response = await fetch('/api/client/queries')

      if (!response.ok) {
        toast.error('Failed to load queries. Please refresh page.')
        setAssignedQueries([])
        setCompletedEntries([])
        setAllQueries([])
        return
      }

      const data = await response.json()
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

      setAssignedQueries(filteredQueries)
      setAllQueries(queries)

      // Separate completed entries
      const completed = filteredQueries.filter((q: Query) => q.status === 'Completed')
      setCompletedEntries(completed)
    } catch (error) {
      console.error('Error loading queries:', error)
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

  const getObjectionTypeBadge = (type: string | null) => {
    if (!type) return <Badge variant="outline">-</Badge>
    const color = type === 'Short' ? 'bg-red-500' : 'bg-orange-500'
    return <Badge className={color}>{type}</Badge>
  }

  const calculateQtyDiff = (query: Query) => {
    const diff = query.totalQuantityIdentified - query.maxQtyOdin
    const diffType = diff > 0 ? '+' : ''
    return diffType + Math.abs(diff).toFixed(2)
  }

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

  const statsCards = [
    {
      title: 'Assigned Queries',
      value: assignedQueries.length,
      icon: FileText,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20'
    },
    {
      title: 'Pending Review',
      value: assignedQueries.filter((q: Query) => q.status === 'Submitted').length,
      icon: Clock,
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-950/20'
    },
    {
      title: 'Approved',
      value: allQueries.filter((q: Query) => q.status === 'Approved').length,
      icon: CheckCircle,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/20'
    }
  ]

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
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Client Dashboard</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {clientStaffName} ({clientStaffId}) - {location}
                </p>
              </div>
            </div>
            <Button onClick={loadQueries} variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 flex-1">
        <div className="grid gap-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

          {/* Filters */}
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-2 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filter Queries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location-filter">Location</Label>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger id="location-filter" className="w-full">
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
                  <Label htmlFor="status-filter">Status</Label>
                  <Select
                    value={statusFilter}
                    onValueChange={(value) => setStatusFilter(value as any)}
                  >
                    <SelectTrigger id="status-filter" className="w-full">
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
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-2 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Assigned Queries ({assignedQueries.length})
              </CardTitle>
              <CardDescription>Queries assigned to you for review</CardDescription>
            </CardHeader>
            <CardContent>
              {assignedQueries.length > 0 ? (
                <div className="rounded-md border border-slate-200 dark:border-slate-700 overflow-hidden max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 dark:bg-slate-800">
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="font-semibold">Location</TableHead>
                        <TableHead className="font-semibold">Auditor</TableHead>
                        <TableHead className="font-semibold">SKU ID</TableHead>
                        <TableHead className="font-semibold">SKU Name</TableHead>
                        <TableHead className="font-semibold">Total</TableHead>
                        <TableHead className="font-semibold">Max</TableHead>
                        <TableHead className="font-semibold">Diff</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignedQueries.map((query) => (
                        <TableRow key={query._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <TableCell className="text-sm">{new Date(query.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-sm">{query.location}</TableCell>
                          <TableCell className="text-sm">{query.auditStaffName}</TableCell>
                          <TableCell className="text-sm font-medium">{query.skuId}</TableCell>
                          <TableCell className="text-sm max-w-xs truncate">{query.skuName}</TableCell>
                          <TableCell className="text-sm font-medium">{query.totalQuantityIdentified}</TableCell>
                          <TableCell className="text-sm">{query.maxQtyOdin}</TableCell>
                          <TableCell className={`text-sm font-medium ${query.objectionRaised ? 'text-orange-600 dark:text-orange-400' : ''}`}>
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
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No assigned queries yet</p>
                  <p className="text-sm mt-1">Queries will appear here when audit clerks submit entries</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Completed Entries Table */}
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-2 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Completed Entries ({completedEntries.length})
              </CardTitle>
              <CardDescription>Audit entries where you approved or quantities matched (no objection)</CardDescription>
            </CardHeader>
            <CardContent>
              {completedEntries.length > 0 ? (
                <div className="rounded-md border border-slate-200 dark:border-slate-700 overflow-hidden max-h-96 overflow-y-auto">
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
                      {completedEntries.map((entry) => (
                        <TableRow key={entry._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <TableCell className="text-sm">{new Date(entry.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-sm">{entry.location}</TableCell>
                          <TableCell className="text-sm">{entry.auditStaffName}</TableCell>
                          <TableCell className="text-sm font-medium">{entry.skuId}</TableCell>
                          <TableCell className="text-sm max-w-xs truncate">{entry.skuName}</TableCell>
                          <TableCell className="text-sm font-medium">{entry.totalQuantityIdentified}</TableCell>
                          <TableCell>{getStatusBadge(entry.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No completed entries yet</p>
                  <p className="text-sm mt-1">Completed entries will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Dialog */}
      {actionDialogOpen && selectedQuery && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-white dark:bg-slate-900 border-2 shadow-xl">
            <CardHeader>
              <CardTitle>Review Query</CardTitle>
              <CardDescription>
                Review the query for SKU: {selectedQuery.skuId} - {selectedQuery.skuName}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Query Details */}
              <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">SKU ID:</span>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{selectedQuery.skuId}</p>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Location:</span>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{selectedQuery.location}</p>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Auditor:</span>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{selectedQuery.auditStaffName}</p>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Type:</span>
                    <p>{getObjectionTypeBadge(selectedQuery.objectionType)}</p>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Identified:</span>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{selectedQuery.totalQuantityIdentified}</p>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Max ODIN:</span>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{selectedQuery.maxQtyOdin}</p>
                  </div>
                </div>
                {selectedQuery.objectionRemarks && (
                  <div className="mt-2">
                    <span className="text-slate-600 dark:text-slate-400">Remarks:</span>
                    <p className="text-sm mt-1 p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
                      {selectedQuery.objectionRemarks}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Selection */}
              <div className="space-y-3">
                <Label>Select Action</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={action === 'Approved' ? 'default' : 'outline'}
                    onClick={() => setAction('Approved')}
                    className="gap-2"
                  >
                    <Check className="h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    variant={action === 'Rejected' ? 'default' : 'outline'}
                    onClick={() => setAction('Rejected')}
                    className="gap-2"
                  >
                    <Check className="h-4 w-4 rotate-180" />
                    Reject
                  </Button>
                </div>
              </div>

              {/* Comments */}
              <div className="space-y-2">
                <Label htmlFor="comments">Comments (optional)</Label>
                <Textarea
                  id="comments"
                  placeholder="Add your comments here..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setActionDialogOpen(false)
                    setSelectedQuery(null)
                    setComments('')
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button onClick={handleQueryAction} className="flex-1">
                  Submit
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
