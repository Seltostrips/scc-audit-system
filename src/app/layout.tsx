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
        {children}
      </body>
    </html>
  )
}
