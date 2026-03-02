'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { NICHES, INDIAN_STATES } from '@/lib/constants'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const steps = ['niche', 'business', 'done'] as const
type Step = typeof steps[number]

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>('niche')
  const [selectedNiche, setSelectedNiche] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    business_name: '',
    owner_name: '',
    phone: '',
    gstin: '',
    city: '',
    state: '',
    wa_number: '',
  })
  const router = useRouter()
  const supabase = createClient()

  const handleNicheSelect = (niche: string) => {
    setSelectedNiche(niche)
    setStep('business')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.business_name || !form.owner_name) {
      toast.error('Business name and owner name are required')
      return
    }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error } = await supabase.from('users').upsert({
      id: user.id,
      email: user.email,
      niche: selectedNiche,
      onboarding_complete: true,
      ...form,
    })

    if (error) {
      toast.error(error.message)
    } else {
      setStep('done')
      setTimeout(() => router.push('/dashboard'), 1500)
    }
    setLoading(false)
  }

  const nicheList = Object.values(NICHES)

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-saffron-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center gap-3 justify-center mb-4">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-2xl">🌿</div>
            <span className="text-2xl font-bold text-gray-900" style={{fontFamily:'Sora,sans-serif'}}>BizFlow</span>
          </div>
          
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-3">
            {['Select Niche', 'Business Info', 'Ready!'].map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  i < steps.indexOf(step) ? 'bg-brand-600 text-white' :
                  i === steps.indexOf(step) ? 'bg-brand-600 text-white ring-4 ring-brand-100' :
                  'bg-gray-200 text-gray-500'
                }`}>{i + 1}</div>
                <span className={`text-sm hidden sm:block ${i === steps.indexOf(step) ? 'text-brand-700 font-semibold' : 'text-gray-400'}`}>{label}</span>
                {i < 2 && <div className={`w-8 h-0.5 ${i < steps.indexOf(step) ? 'bg-brand-600' : 'bg-gray-200'}`}></div>}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Niche Selection */}
        {step === 'niche' && (
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 md:p-8 animate-fade-up">
            <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{fontFamily:'Sora,sans-serif'}}>
              What type of business do you run?
            </h2>
            <p className="text-gray-500 mb-6">We'll customize BizFlow specifically for your niche</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {nicheList.map((niche) => (
                <button
                  key={niche.key}
                  onClick={() => handleNicheSelect(niche.key)}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-gray-100 hover:border-brand-400 hover:bg-brand-50 transition-all group text-center"
                >
                  <span className="text-3xl">{niche.emoji}</span>
                  <span className="text-sm font-semibold text-gray-700 group-hover:text-brand-700 leading-tight">{niche.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Business Info */}
        {step === 'business' && (
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 md:p-8 animate-fade-up">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{NICHES[selectedNiche as keyof typeof NICHES]?.emoji}</span>
              <div>
                <h2 className="text-2xl font-bold text-gray-900" style={{fontFamily:'Sora,sans-serif'}}>Business Details</h2>
                <p className="text-sm text-gray-500">{NICHES[selectedNiche as keyof typeof NICHES]?.name}</p>
              </div>
            </div>
            <p className="text-gray-500 mb-6">Tell us about your business</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Business Name *</label>
                  <input
                    className="input-field"
                    placeholder="Rajesh Textiles"
                    required
                    value={form.business_name}
                    onChange={e => setForm({...form, business_name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="label">Owner Name *</label>
                  <input
                    className="input-field"
                    placeholder="Rajesh Kumar"
                    required
                    value={form.owner_name}
                    onChange={e => setForm({...form, owner_name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="label">Phone Number</label>
                  <input
                    className="input-field"
                    placeholder="+91 98765 43210"
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm({...form, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="label">WhatsApp Number (for orders)</label>
                  <input
                    className="input-field"
                    placeholder="+91 98765 43210"
                    type="tel"
                    value={form.wa_number}
                    onChange={e => setForm({...form, wa_number: e.target.value})}
                  />
                </div>
                <div>
                  <label className="label">GSTIN (optional)</label>
                  <input
                    className="input-field"
                    placeholder="27AAPFU0939F1ZV"
                    maxLength={15}
                    value={form.gstin}
                    onChange={e => setForm({...form, gstin: e.target.value.toUpperCase()})}
                  />
                </div>
                <div>
                  <label className="label">City</label>
                  <input
                    className="input-field"
                    placeholder="Surat"
                    value={form.city}
                    onChange={e => setForm({...form, city: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="label">State</label>
                  <select
                    className="input-field"
                    value={form.state}
                    onChange={e => setForm({...form, state: e.target.value})}
                  >
                    <option value="">Select State</option>
                    {INDIAN_STATES.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setStep('niche')} className="btn-secondary flex-1">
                  ← Back
                </button>
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                  {loading ? 'Saving...' : 'Complete Setup →'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Done */}
        {step === 'done' && (
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center animate-fade-up">
            <div className="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 animate-pulse-green">
              🎉
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{fontFamily:'Sora,sans-serif'}}>
              You're all set!
            </h2>
            <p className="text-gray-500">Taking you to your dashboard...</p>
            <div className="mt-4 w-full bg-gray-100 rounded-full h-1.5">
              <div className="bg-brand-600 h-1.5 rounded-full animate-pulse" style={{width:'80%'}}></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
