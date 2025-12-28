'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowRight, Lock } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()

  const [role, setRole] = useState<'audit' | 'client' | 'admin'>('audit')
  const [credentials, setCredentials] = useState({
    auditStaffId: '',
    pin: '',
    clientStaffId: '',
    clientPin: '',
    adminUsername: '',
    adminPassword: ''
  })

  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    setIsLoading(true)

    try {
      let endpoint = ''
      let body = {}

      if (role === 'audit') {
        endpoint = '/api/auth/audit-clerk'
        // ✅ Send FLAT payload — no nesting!
        body = {
          staffId: credentials.auditStaffId,
          pin: credentials.pin
        }
      } else if (role === 'client') {
        endpoint = '/api/auth/client-staff'
        // ✅ Send FLAT payload
        body = {
          staffId: credentials.clientStaffId,
          pin: credentials.clientPin
        }
      } else if (role === 'admin') {
        endpoint = '/api/auth/admin'
        // Admin already flat — OK
        body = {
          username: credentials.adminUsername,
          password: credentials.adminPassword,
          action: 'login'
        }
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Store session in sessionStorage
        if (role === 'audit') {
          sessionStorage.setItem('auditStaffId', credentials.auditStaffId)
          sessionStorage.setItem('auditStaffName', data.name)
        } else if (role === 'client') {
          sessionStorage.setItem('clientStaffId', credentials.clientStaffId)
          sessionStorage.setItem('clientStaffName', data.name)
          sessionStorage.setItem('clientLocation', data.location || 'Noida WH')
        } else if (role === 'admin') {
          sessionStorage.setItem('isAdmin', 'true')
        }

        toast.success(`Login successful as ${role.charAt(0).toUpperCase() + role.slice(1)}`)

        // Redirect based on role
        if (role === 'audit') {
          router.push('/audit_clerk_2')
        } else if (role === 'client') {
          router.push('/client')
        } else if (role === 'admin') {
          router.push('/admin')
        }
      } else {
        const errorMessage = data.error || 'Login failed'
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">SCC Audit Management System</CardTitle>
          <CardDescription>Login to access your dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="role">Select Role</Label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as 'audit' | 'client' | 'admin')}
                className="w-full p-2 border rounded-md bg-background"
              >
                <option value="audit">Audit Clerk</option>
                <option value="client">Client Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {role === 'audit' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="auditStaffId">SCC ID</Label>
                  <Input
                    id="auditStaffId"
                    placeholder="e.g., 26C"
                    value={credentials.auditStaffId}
                    onChange={(e) => setCredentials({ ...credentials, auditStaffId: e.target.value.toUpperCase() })}
                    className="uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pin">PIN</Label>
                  <Input
                    id="pin"
                    type="password"
                    placeholder="Enter 4-digit PIN"
                    value={credentials.pin}
                    onChange={(e) => setCredentials({ ...credentials, pin: e.target.value })}
                    maxLength={4}
                  />
                </div>
              </>
            )}

            {role === 'client' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="clientStaffId">SCC ID</Label>
                  <Input
                    id="clientStaffId"
                    placeholder="e.g., 27A"
                    value={credentials.clientStaffId}
                    onChange={(e) => setCredentials({ ...credentials, clientStaffId: e.target.value.toUpperCase() })}
                    className="uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientPin">PIN</Label>
                  <Input
                    id="clientPin"
                    type="password"
                    placeholder="Enter 4-digit PIN"
                    value={credentials.clientPin}
                    onChange={(e) => setCredentials({ ...credentials, clientPin: e.target.value })}
                    maxLength={4}
                  />
                </div>
              </>
            )}

            {role === 'admin' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="adminUsername">Username</Label>
                  <Input
                    id="adminUsername"
                    placeholder="Enter username"
                    value={credentials.adminUsername}
                    onChange={(e) => setCredentials({ ...credentials, adminUsername: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminPassword">Password</Label>
                  <Input
                    id="adminPassword"
                    type="password"
                    placeholder="Enter password"
                    value={credentials.adminPassword}
                    onChange={(e) => setCredentials({ ...credentials, adminPassword: e.target.value })}
                  />
                </div>
              </>
            )}

            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Lock className="h-4 w-4 mr-2 animate-pulse" />
                  Logging in...
                </>
              ) : (
                <>
                  Login
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
