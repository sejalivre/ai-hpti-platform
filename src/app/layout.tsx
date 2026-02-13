import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import { Navigation } from '@/components/Navigation'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "pk_test_placeholder"}>
      <html lang="pt-br">
        <body className="antialiased min-h-screen bg-zinc-50 dark:bg-zinc-950">
          <Navigation />
          <main className="pt-16">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  )
}