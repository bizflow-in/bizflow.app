import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && user) {
      // Check if user profile exists
      const { data: profile } = await supabase
        .from('users')
        .select('id, onboarding_complete')
        .eq('id', user.id)
        .single()

      if (!profile) {
        // Create initial profile
        await supabase.from('users').insert({
          id: user.id,
          email: user.email,
          owner_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          business_name: '',
          niche: '',
          onboarding_complete: false,
        })
        return NextResponse.redirect(`${origin}/onboarding`)
      }

      if (!profile.onboarding_complete) {
        return NextResponse.redirect(`${origin}/onboarding`)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
