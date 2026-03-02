'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Building2, MessageCircle, TrendingUp, Shield } from 'lucide-react'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [emailMode, setEmailMode] = useState(false)
  const [email, setEmail] = useState('')
  const [otpSent, setOtpSent] = useState(false)
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

  const handleSendOTP = async () => {
    if (!email) return toast.error('Enter your email')
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) {
      toast.error(error.message)
    } else {
      setOtpSent(true)
      toast.success('OTP sent to your email!')
    }
    setLoading(false)
  }

  const handleVerifyOTP = async () => {
    if (!otp) return toast.error('Enter OTP')
    setLoading(true)
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    })
    if (error) {
      toast.error(error.message)
      setLoading(false)
    } else if (data.user) {
      window.location.href = '/dashboard'
    }
  }

  const features = [
    { icon: MessageCircle, text: 'WhatsApp order capture' },
    { icon: TrendingUp, text: 'Live cash flow dashboard' },
    { icon: Building2, text: 'GST invoice generator' },
    { icon: Shield, text: 'DPDP compliant & secure' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }} />
      </div>

      <div className="relative w-full max-w-4xl grid lg:grid-cols-2 gap-0 bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Left — Brand panel */}
        <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-brand-600 to-brand-800 text-white">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="text-xl">⚡</span>
              </div>
              <span className="text-2xl font-bold">BizFlow</span>
            </div>
            <h1 className="text-3xl font-bold leading-tight mb-4">
              Your Business Brain,<br />
              <span className="text-brand-200">Always On</span>
            </h1>
            <p className="text-brand-100 text-base leading-relaxed">
              Replace WhatsApp chaos, Excel sheets & manual reminders with one intelligent platform built for Indian MSMEs.
            </p>
          </div>

          <div className="space-y-4">
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm text-brand-50">{text}</span>
              </div>
            ))}
          </div>

          <div className="text-brand-200 text-sm">
            Trusted by 10,000+ MSMEs across India 🇮🇳
          </div>
        </div>

        {/* Right — Login form */}
        <div className="flex flex-col justify-center p-8 lg:p-10">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <span className="text-2xl">⚡</span>
            <span className="text-xl font-bold text-gray-900">BizFlow</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
          <p className="text-gray-500 mb-8">Sign in to manage your business</p>

          <div className="space-y-4">
            {/* Google Sign In */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white border-2 border-gray-200 hover:border-brand-300 hover:bg-brand-50 rounded-xl font-medium text-gray-700 transition-all duration-200 active:scale-95 disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-gray-400">or</span>
              </div>
            </div>

            {/* Email OTP */}
            {!emailMode ? (
              <button
                onClick={() => setEmailMode(true)}
                className="w-full btn-secondary text-sm"
              >
                Sign in with Email OTP
              </button>
            ) : !otpSent ? (
              <div className="space-y-3">
                <div>
                  <label className="label">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input"
                    onKeyDown={e => e.key === 'Enter' && handleSendOTP()}
                  />
                </div>
                <button onClick={handleSendOTP} disabled={loading} className="btn-primary w-full">
                  {loading ? 'Sending...' : 'Send OTP'}
                </button>
                <button onClick={() => setEmailMode(false)} className="btn-ghost w-full text-sm">
                  ← Back
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="label">Enter 6-digit OTP</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    className="input text-center text-2xl tracking-[0.5em] font-mono"
                    maxLength={6}
                    onKeyDown={e => e.key === 'Enter' && handleVerifyOTP()}
                  />
                  <p className="text-xs text-gray-400 mt-1.5">Sent to {email}</p>
                </div>
                <button onClick={handleVerifyOTP} disabled={loading || otp.length < 6} className="btn-primary w-full">
                  {loading ? 'Verifying...' : 'Verify & Login'}
                </button>
                <button onClick={() => { setOtpSent(false); setOtp('') }} className="btn-ghost w-full text-sm">
                  ← Change email
                </button>
              </div>
            )}
          </div>

          <p className="text-xs text-gray-400 text-center mt-6">
            By continuing, you agree to BizFlow&apos;s{' '}
            <a href="#" className="text-brand-600 hover:underline">Terms</a> &{' '}
            <a href="#" className="text-brand-600 hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  )
}
