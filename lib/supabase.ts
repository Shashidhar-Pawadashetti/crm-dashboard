import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  console.error(
    '[NexCRM] Missing NEXT_PUBLIC_SUPABASE_URL. Add it to .env.local from Supabase Dashboard > Settings > API.'
  )
}

if (!supabaseAnonKey) {
  console.error(
    '[NexCRM] Missing NEXT_PUBLIC_SUPABASE_ANON_KEY. Add it to .env.local from Supabase Dashboard > Settings > API > anon/public key.'
  )
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '')
