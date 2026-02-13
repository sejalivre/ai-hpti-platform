import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import { Navigation } from '@/components/Navigation'

// Formato válido de teste para evitar erro de validação do Clerk no build stático
const CLERK_BUILD_FALLBACK_KEY = "pk_test_ZGV2ZWxvcG1lbnQtY2xlcmsuYWNjb3VudHMuZGV2JA==";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || CLERK_BUILD_FALLBACK_KEY}>
      <html lang="pt-br">
        <body className="antialiased min-h-screen bg-zinc-50 dark:bg-zinc-950">
          <Navigation />
          <main className="pt-16">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  )
}