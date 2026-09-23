import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY)?.trim()

function publicKey(value: string): boolean {
  if (value.startsWith('sb_publishable_')) return true
  try {
    const payload = value.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(payload)).role === 'anon'
  } catch {
    return false
  }
}

function validUrl(value: string): boolean {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'https:' || (parsed.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsed.hostname))
  } catch { return false }
}

export const hasSupabaseConfiguration = Boolean(url || key)
export const supabase = url && key && validUrl(url) && publicKey(key)
  ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
  : null
