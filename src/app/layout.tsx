import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SCC Audit Management System',
  description: 'Manage audit clerks, client staff, and inventory',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          {children}
   </div>     </body>
    </html>
  )
}
