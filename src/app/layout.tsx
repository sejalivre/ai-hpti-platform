import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import { Navigation } from '@/components/Navigation'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="pt-br">
        <body className="antialiased min-h-screen bg-zinc-50 dark:bg-zinc-950">
          <Navigation />
          <main className="pt-16">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  )
}