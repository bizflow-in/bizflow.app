'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Link from 'next/link'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [otp, setOtp] = useState('')
  const supabase = createClient()

  const handleGoogleLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      toast.error(error.message)
      setLoading(false)
    }
  }

  const handleEmailOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      toast.error(error.message)
    } else {
      setStep('otp')
      toast.success('OTP sent to your email!')
    }
    setLoading(false)
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp) return
    setLoading(true)
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    })
    if (error) {
      toast.error('Invalid OTP. Please try again.')
    } else {
      toast.success('Login successful!')
      window.location.href = '/dashboard'
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-saffron-50 flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-brand-600 to-brand-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white/20 blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full bg-saffron-400/30 blur-3xl"></div>
          <div className="grid grid-cols-8 gap-4 absolute inset-0 opacity-5">
            {Array.from({ length: 64 }).map((_, i) => (
              <div key={i} className="w-full aspect-square rounded-full bg-white"></div>
            ))}
          </div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-2xl">🌿</div>
            <span className="text-white text-2xl font-bold" style={{fontFamily:'Sora,sans-serif'}}>BizFlow</span>
          </div>
          <p className="text-brand-200 text-sm">Smart Business OS for Indian MSMEs</p>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight mb-4" style={{fontFamily:'Sora,sans-serif'}}>
              WhatsApp se<br/>
              <span className="text-saffron-300">Order lena.</span><br/>
              Automatically.
            </h1>
            <p className="text-brand-200 text-lg">
              63 million Indian MSMEs deserve better than Excel sheets and WhatsApp chaos.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { emoji: '📱', text: 'WhatsApp orders auto-captured' },
              { emoji: '📊', text: 'GST invoices in 1 click' },
              { emoji: '💰', text: 'Payment reminders automated' },
              { emoji: '🏪', text: 'Inventory tracked in real-time' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-sm">
                  {item.emoji}
                </div>
                <span className="text-white text-base">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-brand-300 text-sm">Trusted by MSMEs in Textile, Pharma, Steel &amp; more</p>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-2xl">🌿</div>
            <span className="text-gray-900 text-2xl font-bold" style={{fontFamily:'Sora,sans-serif'}}>BizFlow</span>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-1" style={{fontFamily:'Sora,sans-serif'}}>
                {step === 'otp' ? 'Enter OTP' : 'Welcome back'}
              </h2>
              <p className="text-gray-500">
                {step === 'otp' 
                  ? `We sent a 6-digit code to ${email}` 
                  : 'Login to your BizFlow account'}
              </p>
            </div>

            {/* Google Login */}
            {step === 'email' && (
              <>
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all font-semibold text-gray-700 min-h-[52px] mb-6"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {loading ? 'Redirecting...' : 'Continue with Google'}
                </button>

                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-3 text-sm text-gray-500">or use email</span>
                  </div>
                </div>

                <form onSubmit={handleEmailOTP} className="space-y-4">
                  <div>
                    <label className="label">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="rajesh@example.com"
                      required
                      className="input-field"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !email}
                    className="btn-primary w-full"
                  >
                    {loading ? 'Sending...' : 'Send OTP →'}
                  </button>
                </form>
              </>
            )}

            {step === 'otp' && (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div>
                  <label className="label">6-digit OTP</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    maxLength={6}
                    className="input-field text-center text-2xl font-bold tracking-widest"
                    autoFocus
                  />
                </div>
                <button type="submit" disabled={loading || otp.length !== 6} className="btn-primary w-full">
                  {loading ? 'Verifying...' : 'Verify OTP →'}
                </button>
                <button type="button" onClick={() => setStep('email')} className="w-full text-sm text-gray-500 hover:text-gray-700 text-center">
                  ← Use different email
                </button>
              </form>
            )}

            <p className="mt-6 text-center text-sm text-gray-500">
              New to BizFlow?{' '}
              <Link href="/signup" className="text-brand-600 font-semibold hover:underline">
                Create account
              </Link>
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  )
}
