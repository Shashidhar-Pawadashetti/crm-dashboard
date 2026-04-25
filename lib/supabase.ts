import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  console.error(
    '[NexCRM] Missing NEXT_PUBLIC_SUPABASE_URL — add it to your .env.local file. ' +
    'Get it from https://supabase.com/dashboard → Settings → API.'
  )
}

if (!supabaseAnonKey) {
  console.error(
    '[NexCRM] Missing NEXT_PUBLIC_SUPABASE_ANON_KEY — add it to your .env.local file. ' +
    'Get it from https://supabase.com/dashboard → Settings → API → anon/public key.'
  )
}

export const supabase = createClient(
  supabaseUrl ?? '',
  supabaseAnonKey ?? ''
)
