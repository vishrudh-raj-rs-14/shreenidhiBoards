import { supabase } from '../config/supabase'

// Simple PIN hashing (using a basic approach, in production use bcrypt or similar)
async function hashPin(pin) {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function setInitialPin(pin) {
  const pinHash = await hashPin(pin)
  const { data, error } = await supabase
    .from('app_config')
    .select('id')
    .limit(1)
    .single()

  if (data) {
    // Update existing PIN
    const { error: updateError } = await supabase
      .from('app_config')
      .update({ pin_hash: pinHash })
      .eq('id', data.id)
    return { error: updateError }
  } else {
    // Create new PIN
    const { error: insertError } = await supabase
      .from('app_config')
      .insert({ pin_hash: pinHash })
    return { error: insertError }
  }
}

export async function verifyPin(pin) {
  const pinHash = await hashPin(pin)
  const { data, error } = await supabase
    .from('app_config')
    .select('pin_hash')
    .limit(1)
    .single()

  if (error || !data) {
    return false
  }

  return data.pin_hash === pinHash
}

export async function checkPinExists() {
  const { data, error } = await supabase
    .from('app_config')
    .select('id')
    .limit(1)
    .single()

  return !error && data !== null
}
