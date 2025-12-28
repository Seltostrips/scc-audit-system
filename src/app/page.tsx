'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowRight, Lock, User, Building, Shield } from 'lucide-react'
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
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleSubmit = async () => {
    if (!isClient) return
    
    setIsLoading(true)

    try {
      let endpoint = ''
      let body = {}

      if (role === 'audit') {
        if (!credentials.auditStaffId || !credentials.pin) {
          toast.error('Please fill in all fields')
          setIsLoading(false)
          return
        }
        endpoint = '/api/auth/audit-clerk'
        body = {
          staffId: credentials.auditStaffId,
          pin: credentials.pin
        }
      } else if (role === 'client') {
        if (!credentials.clientStaffId || !credentials.clientPin) {
          toast.error('Please fill in all fields')
          setIsLoading(false)
          return
        }
        endpoint = '/api/auth/client-staff'
        body = {
          staffId: credentials.clientStaffId,
          pin: credentials.clientPin
        }
      } else if (role === 'admin') {
        if (!credentials.adminUsername || !credentials.adminPassword) {
          toast.error('Please fill in all fields')
          setIsLoading(false)
          return
        }
        endpoint = '/api/auth/admin'
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border border-gray-200 dark:border-gray-700 shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
              <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">SCC Audit System</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Secure login to your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="role" className="text-gray-700 dark:text-gray-300">Select Role</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={role === 'audit' ? 'default' : 'outline'}
                onClick={() => setRole('audit')}
                className="h-12 flex flex-col items-center justify-center gap-1 text-xs py-2"
              >
                <User className="h-4 w-4" />
                Audit Clerk
              </Button>
              <Button
                variant={role === 'client' ? 'default' : 'outline'}
                onClick={() => setRole('client')}
                className="h-12 flex flex-col items-center justify-center gap-1 text-xs py-2"
              >
                <Building className="h-4 w-4" />
                Client Staff
              </Button>
              <Button
                variant={role === 'admin' ? 'default' : 'outline'}
                onClick={() => setRole('admin')}
                className="h-12 flex flex-col items-center justify-center gap-1 text-xs py-2"
              >
                <Shield className="h-4 w-4" />
                Admin
              </Button>
            </div>
          </div>

          {role === 'audit' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="auditStaffId" className="text-gray-700 dark:text-gray-300">SCC ID</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="auditStaffId"
                    placeholder="e.g., 26A"
                    value={credentials.auditStaffId}
                    onChange={(e) => setCredentials({ ...credentials, auditStaffId: e.target.value.toUpperCase() })}
                    className="pl-10 uppercase"
                    onKeyDown={handleKeyDown}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pin" className="text-gray-700 dark:text-gray-300">PIN</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="pin"
                    type="password"
                    placeholder="••••"
                    value={credentials.pin}
                    onChange={(e) => setCredentials({ ...credentials, pin: e.target.value })}
                    maxLength={4}
                    className="pl-10"
                    onKeyDown={handleKeyDown}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">4-digit PIN</p>
              </div>
            </div>
          )}

          {role === 'client' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clientStaffId" className="text-gray-700 dark:text-gray-300">SCC ID</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="clientStaffId"
                    placeholder="e.g., 27A"
                    value={credentials.clientStaffId}
                    onChange={(e) => setCredentials({ ...credentials, clientStaffId: e.target.value.toUpperCase() })}
                    className="pl-10 uppercase"
                    onKeyDown={handleKeyDown}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientPin" className="text-gray-700 dark:text-gray-300">PIN</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="clientPin"
                    type="password"
                    placeholder="••••"
                    value={credentials.clientPin}
                    onChange={(e) => setCredentials({ ...credentials, clientPin: e.target.value })}
                    maxLength={4}
                    className="pl-10"
                    onKeyDown={handleKeyDown}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">4-digit PIN</p>
              </div>
            </div>
          )}

          {role === 'admin' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="adminUsername" className="text-gray-700 dark:text-gray-300">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="adminUsername"
                    placeholder="Enter username"
                    value={credentials.adminUsername}
                    onChange={(e) => setCredentials({ ...credentials, adminUsername: e.target.value })}
                    className="pl-10"
                    onKeyDown={handleKeyDown}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminPassword" className="text-gray-700 dark:text-gray-300">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="adminPassword"
                    type="password"
                    placeholder="••••••••"
                    value={credentials.adminPassword}
                    onChange={(e) => setCredentials({ ...credentials, adminPassword: e.target.value })}
                    className="pl-10"
                    onKeyDown={handleKeyDown}
                  />
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg font-medium"
            size="lg"
          >
            {isLoading ? (
              <>
                <Lock className="h-5 w-5 mr-2 animate-pulse" />
                Logging in...
              </>
            ) : (
              <>
                Login
                <ArrowRight className="h-5 w-5 ml-2" />
              </>
            )}
          </Button>
          
          <p className="text-center text-xs text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} SCC Audit Management System
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
