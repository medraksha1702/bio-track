'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Activity, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (authError) {
      setError(authError.message)
      setIsLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="w-full max-w-sm"
    >
      <Card className="border-border/50 shadow-lg">
        <CardHeader className="pb-4 pt-7 text-center">
          {/* Logo */}
          <motion.div
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-md"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
          >
            <Activity className="h-6 w-6 text-primary-foreground" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
          >
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              BioTrack
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to your account
            </p>
          </motion.div>
        </CardHeader>

        <CardContent className="pb-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error banner */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="rounded-lg border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-10 border-border/60 bg-muted/30 text-sm transition-all focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/50"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-10 border-border/60 bg-muted/30 pr-10 text-sm transition-all focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !email || !password}
              className="mt-2 h-10 w-full text-sm font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          <p className="mt-5 text-center text-[11px] text-muted-foreground">
            BioTrack · Biomedical Finance Tracking
          </p>
        </CardContent>
      </Card>
    </motion.div>
  )
}
