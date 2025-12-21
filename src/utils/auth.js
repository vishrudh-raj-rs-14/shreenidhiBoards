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
      .update({ pin_hash: pinHash, updated_at: new Date().toISOString() })
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

export async function setAdminPin(adminPin) {
  console.log('setAdminPin called with PIN length:', adminPin?.length)
  
  try {
    console.log('Setting admin PIN...')
    
    if (!adminPin) {
      console.error('No admin PIN provided')
      return { error: { message: 'Admin PIN is required' } }
    }
    
    console.log('Hashing PIN...')
    let adminPinHash
    try {
      adminPinHash = await hashPin(adminPin)
      console.log('PIN hashed successfully')
    } catch (hashError) {
      console.error('Error hashing PIN:', hashError)
      return { error: { message: 'Failed to hash PIN: ' + hashError.message } }
    }
    
    console.log('Querying database...')
    const { data, error: selectError } = await supabase
      .from('app_config')
      .select('id')
      .limit(1)
      .single()

    console.log('Query result:', { data, selectError, hasData: !!data })

    // If there's an error and it's not "not found", return it
    if (selectError) {
      if (selectError.code === 'PGRST116') {
        // Not found - user needs to set main PIN first
        console.log('No config found, user needs to set main PIN first')
        return { error: { message: 'Please set main PIN first' } }
      } else {
        console.error('Select error:', selectError)
        return { error: selectError }
      }
    }

    // If no data exists, user needs to set main PIN first
    if (!data) {
      console.log('No data found')
      return { error: { message: 'Please set main PIN first' } }
    }

    console.log('Updating admin PIN for config ID:', data.id)
    // Update the admin PIN
    const { error: updateError, data: updateData } = await supabase
      .from('app_config')
      .update({ 
        admin_pin_hash: adminPinHash, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', data.id)
      .select()
    
    console.log('Update result:', { updateError, updateData })
    
    if (updateError) {
      console.error('Update admin PIN error:', updateError)
      // Check if it's a column missing error
      const errorMsg = updateError.message || ''
      const errorCode = updateError.code || ''
      
      if (errorMsg.includes('column') || 
          errorMsg.includes('admin_pin_hash') ||
          errorCode === '42703' ||
          errorMsg.includes('does not exist')) {
        return { 
          error: { 
            message: 'Database column missing. Please run the migration: ALTER TABLE app_config ADD COLUMN admin_pin_hash TEXT;' 
          } 
        }
      }
      return { error: updateError }
    }
    
    // Success
    console.log('Admin PIN set successfully')
    return { error: null }
  } catch (err) {
    console.error('setAdminPin exception:', err)
    return { error: { message: err.message || 'Failed to set admin PIN. Check console for details.' } }
  }
}

export async function verifyAdminPin(adminPin) {
  const adminPinHash = await hashPin(adminPin)
  const { data, error } = await supabase
    .from('app_config')
    .select('admin_pin_hash')
    .limit(1)
    .single()

  if (error || !data || !data.admin_pin_hash) {
    return false
  }

  return data.admin_pin_hash === adminPinHash
}

export async function checkAdminPinExists() {
  const { data, error } = await supabase
    .from('app_config')
    .select('admin_pin_hash')
    .limit(1)
    .single()

  return !error && data && data.admin_pin_hash !== null
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

export async function setPricePin(pricePin) {
  console.log('setPricePin called with PIN length:', pricePin?.length)
  
  try {
    console.log('Setting price PIN...')
    
    if (!pricePin) {
      console.error('No price PIN provided')
      return { error: { message: 'Price PIN is required' } }
    }
    
    console.log('Hashing PIN...')
    let pricePinHash
    try {
      pricePinHash = await hashPin(pricePin)
      console.log('PIN hashed successfully')
    } catch (hashError) {
      console.error('Error hashing PIN:', hashError)
      return { error: { message: 'Failed to hash PIN: ' + hashError.message } }
    }
    
    console.log('Querying database...')
    const { data, error: selectError } = await supabase
      .from('app_config')
      .select('id')
      .limit(1)
      .single()

    console.log('Query result:', { data, selectError, hasData: !!data })

    // If there's an error and it's not "not found", return it
    if (selectError) {
      if (selectError.code === 'PGRST116') {
        // Not found - user needs to set main PIN first
        console.log('No config found, user needs to set main PIN first')
        return { error: { message: 'Please set main PIN first' } }
      } else {
        console.error('Select error:', selectError)
        return { error: selectError }
      }
    }

    // If no data exists, user needs to set main PIN first
    if (!data) {
      console.log('No data found')
      return { error: { message: 'Please set main PIN first' } }
    }

    console.log('Updating price PIN for config ID:', data.id)
    // Update the price PIN
    const { error: updateError, data: updateData } = await supabase
      .from('app_config')
      .update({ 
        price_pin_hash: pricePinHash, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', data.id)
      .select()
    
    console.log('Update result:', { updateError, updateData })
    
    if (updateError) {
      console.error('Update price PIN error:', updateError)
      // Check if it's a column missing error
      const errorMsg = updateError.message || ''
      const errorCode = updateError.code || ''
      
      if (errorMsg.includes('column') || 
          errorMsg.includes('price_pin_hash') ||
          errorCode === '42703' ||
          errorMsg.includes('does not exist')) {
        return { 
          error: { 
            message: 'Database column missing. Please run the migration: ALTER TABLE app_config ADD COLUMN price_pin_hash TEXT;' 
          } 
        }
      }
      return { error: updateError }
    }
    
    // Success
    console.log('Price PIN set successfully')
    return { error: null }
  } catch (err) {
    console.error('setPricePin exception:', err)
    return { error: { message: err.message || 'Failed to set price PIN. Check console for details.' } }
  }
}

export async function verifyPricePin(pricePin) {
  const pricePinHash = await hashPin(pricePin)
  const { data, error } = await supabase
    .from('app_config')
    .select('price_pin_hash')
    .limit(1)
    .single()

  if (error || !data || !data.price_pin_hash) {
    return false
  }

  return data.price_pin_hash === pricePinHash
}

export async function checkPricePinExists() {
  const { data, error } = await supabase
    .from('app_config')
    .select('price_pin_hash')
    .limit(1)
    .single()

  return !error && data && data.price_pin_hash !== null
}
