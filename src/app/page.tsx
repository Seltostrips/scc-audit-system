'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowRight, Lock, Shield, Users, UserCheck, LayoutDashboard } from 'lucide-react'
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
        body = {
          staffId: credentials.auditStaffId,
          pin: credentials.pin
        }
      } else if (role === 'client') {
        endpoint = '/api/auth/client-staff'
        body = {
          staffId: credentials.clientStaffId,
          pin: credentials.clientPin
        }
      } else if (role === 'admin') {
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

  const roleConfig = {
    audit: {
      icon: UserCheck,
      title: 'Audit Clerk',
      description: 'Conduct warehouse audits',
      color: 'from-emerald-500 to-teal-600'
    },
    client: {
      icon: Users,
      title: 'Client Staff',
      description: 'Review and approve audit entries',
      color: 'from-blue-500 to-indigo-600'
    },
    admin: {
      icon: LayoutDashboard,
      title: 'Administrator',
      description: 'Manage staff and inventory',
      color: 'from-purple-500 to-pink-600'
    }
  }

  const currentConfig = roleConfig[role]
  const RoleIcon = currentConfig.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-primary/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/25 mb-4">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-2">
            SCC Audit System
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Secure warehouse inventory management
          </p>
        </div>

        <Card className="border-2 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-semibold text-center">
              Sign In
            </CardTitle>
            <CardDescription className="text-center">
              Select your role and enter credentials
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Role Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Select Role
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(roleConfig).map(([key, config]) => {
                  const Icon = config.icon
                  const isActive = role === key
                  return (
                    <button
                      key={key}
                      onClick={() => setRole(key as 'audit' | 'client' | 'admin')}
                      className={`relative p-3 rounded-xl border-2 transition-all duration-200 ${
                        isActive
                          ? 'border-primary bg-primary/5'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className={`flex flex-col items-center gap-1.5 ${
                        isActive ? 'text-primary' : 'text-slate-600 dark:text-slate-400'
                      }`}>
                        <Icon className="w-5 h-5" />
                        <span className="text-xs font-medium">{config.title}</span>
                      </div>
                      {isActive && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-white dark:border-slate-900" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Role-Specific Credentials */}
            {role === 'audit' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="space-y-2">
                  <Label htmlFor="auditStaffId">SCC ID</Label>
                  <Input
                    id="auditStaffId"
                    placeholder="e.g., 26C"
                    value={credentials.auditStaffId}
                    onChange={(e) => setCredentials({ ...credentials, auditStaffId: e.target.value.toUpperCase() })}
                    className="uppercase font-mono"
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
                    className="tracking-widest text-center font-mono"
                  />
                </div>
              </div>
            )}

            {role === 'client' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="space-y-2">
                  <Label htmlFor="clientStaffId">SCC ID</Label>
                  <Input
                    id="clientStaffId"
                    placeholder="e.g., 27A"
                    value={credentials.clientStaffId}
                    onChange={(e) => setCredentials({ ...credentials, clientStaffId: e.target.value.toUpperCase() })}
                    className="uppercase font-mono"
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
                    className="tracking-widest text-center font-mono"
                  />
                </div>
              </div>
            )}

            {role === 'admin' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
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
              </div>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full h-11 text-base font-medium shadow-lg shadow-primary/25"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Lock className="h-4 w-4 mr-2 animate-pulse" />
                  Logging in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 dark:text-slate-500 mt-6">
          Powered by SCC Audit Management System
        </p>
      </div>
    </div>
  )
}
