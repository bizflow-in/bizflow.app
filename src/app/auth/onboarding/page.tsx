'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { NICHES } from '@/lib/niche/config'
import toast from 'react-hot-toast'
import { ArrowRight, ArrowLeft, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

type Step = 'niche' | 'profile' | 'done'

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>('niche')
  const [selectedNiche, setSelectedNiche] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    business_name: '',
    owner_name: '',
    gstin: '',
    city: '',
    state: '',
    phone: '',
  })
  const supabase = createClient()

  const handleNicheSelect = (nicheKey: string) => {
    setSelectedNiche(nicheKey)
  }

  const handleProfileSubmit = async () => {
    if (!form.business_name || !form.owner_name) {
      return toast.error('Business name and owner name are required')
    }
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return toast.error('Not authenticated')

    const { error } = await supabase.from('users').upsert({
      id: user.id,
      email: user.email,
      niche: selectedNiche,
      business_name: form.business_name,
      owner_name: form.owner_name,
      gstin: form.gstin || null,
      city: form.city || null,
      state: form.state || null,
      phone: form.phone || null,
      onboarding_complete: true,
      bank_balance: 0,
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
    } else {
      setStep('done')
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 1500)
    }
  }

  const selectedNicheData = NICHES.find(n => n.key === selectedNiche)

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          {(['niche', 'profile'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                step === s ? 'bg-brand-600 text-white' :
                (step === 'profile' && s === 'niche') || step === 'done'
                  ? 'bg-brand-100 text-brand-700' : 'bg-gray-200 text-gray-500'
              )}>
                {(step === 'profile' && s === 'niche') || step === 'done' ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i === 0 && <div className={cn('w-12 h-1 rounded', step !== 'niche' ? 'bg-brand-300' : 'bg-gray-200')} />}
            </div>
          ))}
        </div>

        {/* Step: Niche */}
        {step === 'niche' && (
          <div className="animate-in">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">What&apos;s your business type?</h1>
              <p className="text-gray-500">We&apos;ll customize BizFlow for your specific industry</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {NICHES.map(niche => (
                <button
                  key={niche.key}
                  onClick={() => handleNicheSelect(niche.key)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 active:scale-95 text-center',
                    selectedNiche === niche.key
                      ? 'border-brand-500 bg-brand-50 shadow-md'
                      : 'border-gray-100 bg-white hover:border-brand-200 hover:bg-gray-50'
                  )}
                >
                  <span className="text-3xl">{niche.emoji}</span>
                  <span className="text-sm font-medium text-gray-800 leading-tight">{niche.label}</span>
                  <span className="text-xs text-gray-400 hidden sm:block">{niche.description}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => selectedNiche && setStep('profile')}
              disabled={!selectedNiche}
              className="btn-primary w-full"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step: Profile */}
        {step === 'profile' && (
          <div className="animate-in">
            <div className="mb-8">
              <button onClick={() => setStep('niche')} className="btn-ghost mb-4 -ml-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedNicheData?.emoji}</span>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Set up your profile</h1>
                  <p className="text-gray-500 text-sm">{selectedNicheData?.label} · Tell us about your business</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5 shadow-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Business Name *</label>
                  <input
                    className="input"
                    placeholder="e.g., Rajesh Textile Traders"
                    value={form.business_name}
                    onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))}
                  />
                </div>
                <div className="col-span-2">
                  <label className="label">Owner Name *</label>
                  <input
                    className="input"
                    placeholder="Your full name"
                    value={form.owner_name}
                    onChange={e => setForm(f => ({ ...f, owner_name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Mobile Number</label>
                  <input
                    className="input"
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">GSTIN (optional)</label>
                  <input
                    className="input"
                    placeholder="27AAPFU0939F1ZV"
                    value={form.gstin}
                    onChange={e => setForm(f => ({ ...f, gstin: e.target.value.toUpperCase() }))}
                    maxLength={15}
                  />
                </div>
                <div>
                  <label className="label">City</label>
                  <input
                    className="input"
                    placeholder="Surat"
                    value={form.city}
                    onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">State</label>
                  <input
                    className="input"
                    placeholder="Gujarat"
                    value={form.state}
                    onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                  />
                </div>
              </div>

              <button
                onClick={handleProfileSubmit}
                disabled={loading || !form.business_name || !form.owner_name}
                className="btn-primary w-full"
              >
                {loading ? 'Setting up...' : 'Launch BizFlow 🚀'}
              </button>
            </div>
          </div>
        )}

        {/* Done */}
        {step === 'done' && (
          <div className="animate-in text-center py-12">
            <div className="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-10 h-10 text-brand-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re all set!</h1>
            <p className="text-gray-500">Taking you to your dashboard...</p>
          </div>
        )}
      </div>
    </div>
  )
}
