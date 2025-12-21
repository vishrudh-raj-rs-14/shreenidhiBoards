#!/usr/bin/env node

/**
 * Supabase Database Backup Script
 * 
 * This script backs up all data from your Supabase database to JSON files
 * organized by date in the backup folder.
 * 
 * Usage: node scripts/backup.js
 * 
 * Environment variables required:
 * - VITE_SUPABASE_URL (or SUPABASE_URL)
 * - VITE_SUPABASE_ANON_KEY (or SUPABASE_ANON_KEY)
 * 
 * Optional (for better permissions):
 * - SUPABASE_SERVICE_ROLE_KEY
 * 
 * Or use .env file with these variables
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
import dotenv from 'dotenv'
dotenv.config()

// Get Supabase credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
// Use service role key if available (better permissions), fallback to anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials!')
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY) in your .env file')
  process.exit(1)
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey)

// All tables to backup (in order to respect foreign key constraints)
// Order matters: parent tables before child tables
const TABLES = [
  'app_config',                    // No dependencies
  'parties',                       // No dependencies
  'products',                      // No dependencies
  'purchase_prices',              // Depends on: parties, products
  'purchase_price_history',       // Depends on: purchase_prices, parties, products
  'supply_prices',                // Depends on: parties, products
  'supply_price_history',         // Depends on: supply_prices, parties, products
  'purchase_transactions',        // Depends on: parties
  'purchase_transaction_items',   // Depends on: purchase_transactions, products
  'supply_transactions',          // Depends on: parties, purchase_transactions
  'supply_transaction_items',     // Depends on: supply_transactions, products
  'receipts',                     // Depends on: parties
  'payments',                     // Depends on: parties
  'expenses'                      // No dependencies
]

// Create backup directory structure
const backupRoot = path.join(__dirname, '..', 'backup')
const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
const backupDir = path.join(backupRoot, today)

// Ensure backup directory exists
if (!fs.existsSync(backupRoot)) {
  fs.mkdirSync(backupRoot, { recursive: true })
}
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true })
}

console.log('🔄 Starting database backup...')
console.log(`📁 Backup directory: ${backupDir}`)
console.log(`📅 Date: ${today}\n`)

// Backup metadata
const backupMetadata = {
  date: today,
  timestamp: new Date().toISOString(),
  tables: [],
  totalRecords: 0
}

// Backup each table (with pagination support for large datasets)
async function backupTable(tableName) {
  try {
    console.log(`📦 Backing up ${tableName}...`)
    
    let allRecords = []
    let from = 0
    const pageSize = 1000 // Supabase default limit
    let hasMore = true

    // Determine order column based on table
    // Some tables use 'changed_at' instead of 'created_at'
    let orderColumn = 'created_at'
    if (tableName === 'purchase_price_history' || tableName === 'supply_price_history') {
      orderColumn = 'changed_at'
    }

    // Fetch all records with pagination
    while (hasMore) {
      let query = supabase
        .from(tableName)
        .select('*')
        .range(from, from + pageSize - 1)
        .order(orderColumn, { ascending: true })

      const { data, error } = await query

      if (error) {
        // If ordering failed due to missing column, try without order
        if (error.message && (error.message.includes('column') || error.message.includes('does not exist'))) {
          console.log(`   ⚠️  Ordering by ${orderColumn} failed, trying without order...`)
          const { data: dataNoOrder, error: errorNoOrder } = await supabase
            .from(tableName)
            .select('*')
            .range(from, from + pageSize - 1)

          if (errorNoOrder) {
            console.error(`❌ Error backing up ${tableName}:`, errorNoOrder.message)
            return { success: false, error: errorNoOrder.message, count: 0 }
          }

          if (dataNoOrder && dataNoOrder.length > 0) {
            allRecords = allRecords.concat(dataNoOrder)
            from += pageSize
            
            if (dataNoOrder.length < pageSize) {
              hasMore = false
            }
          } else {
            hasMore = false
          }
          continue
        }
        
        console.error(`❌ Error backing up ${tableName}:`, error.message)
        return { success: false, error: error.message, count: 0 }
      }

      if (data && data.length > 0) {
        allRecords = allRecords.concat(data)
        from += pageSize
        
        // If we got less than pageSize, we've reached the end
        if (data.length < pageSize) {
          hasMore = false
        }
      } else {
        hasMore = false
      }
    }

    const filePath = path.join(backupDir, `${tableName}.json`)
    
    // Write data to JSON file
    fs.writeFileSync(filePath, JSON.stringify(allRecords, null, 2), 'utf8')
    
    console.log(`✅ ${tableName}: ${allRecords.length} records backed up`)
    
    return { success: true, count: allRecords.length }
  } catch (err) {
    console.error(`❌ Error backing up ${tableName}:`, err.message)
    return { success: false, error: err.message, count: 0 }
  }
}

// Main backup function
async function runBackup() {
  const startTime = Date.now()
  const results = []

  for (const table of TABLES) {
    const result = await backupTable(table)
    results.push({ table, ...result })
    
    if (result.success) {
      backupMetadata.tables.push(table)
      backupMetadata.totalRecords += result.count
    }
  }

  // Save backup metadata
  const metadataPath = path.join(backupDir, '_metadata.json')
  fs.writeFileSync(metadataPath, JSON.stringify(backupMetadata, null, 2), 'utf8')

  const duration = ((Date.now() - startTime) / 1000).toFixed(2)

  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('📊 Backup Summary')
  console.log('='.repeat(50))
  console.log(`✅ Successful: ${results.filter(r => r.success).length}/${TABLES.length} tables`)
  console.log(`📝 Total records: ${backupMetadata.totalRecords}`)
  console.log(`⏱️  Duration: ${duration}s`)
  console.log(`📁 Location: ${backupDir}`)
  
  const failed = results.filter(r => !r.success)
  if (failed.length > 0) {
    console.log('\n❌ Failed tables:')
    failed.forEach(r => {
      console.log(`   - ${r.table}: ${r.error}`)
    })
  }
  
  console.log('\n✅ Backup completed!')
}

// Run backup
runBackup().catch(err => {
  console.error('❌ Fatal error during backup:', err)
  process.exit(1)
})
