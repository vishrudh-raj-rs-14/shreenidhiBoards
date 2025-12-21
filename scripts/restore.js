#!/usr/bin/env node

/**
 * Supabase Database Restore Script
 * 
 * This script restores data from a backup folder to your Supabase database.
 * 
 * Usage: node scripts/restore.js [backup-date]
 * Example: node scripts/restore.js 2024-01-15
 * 
 * If no date is provided, it will use the most recent backup.
 * 
 * Environment variables required:
 * - VITE_SUPABASE_URL (or SUPABASE_URL)
 * - VITE_SUPABASE_ANON_KEY (or SUPABASE_ANON_KEY)
 * 
 * WARNING: This will DELETE existing data and replace it with backup data!
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import readline from 'readline'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
import dotenv from 'dotenv'
dotenv.config()

// Get Supabase credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
// Use service role key for restore (has delete permissions), fallback to anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials!')
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY) in your .env file')
  process.exit(1)
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey)

// Tables in restore order (respecting foreign key constraints)
const TABLES = [
  'app_config',
  'parties',
  'products',
  'purchase_prices',
  'purchase_price_history',
  'supply_prices',
  'supply_price_history',
  'purchase_transactions',
  'purchase_transaction_items',
  'supply_transactions',
  'supply_transaction_items',
  'receipts',
  'payments',
  'expenses'
]

const backupRoot = path.join(__dirname, '..', 'backup')

// Get available backups
function getAvailableBackups() {
  if (!fs.existsSync(backupRoot)) {
    return []
  }
  
  return fs.readdirSync(backupRoot)
    .filter(item => {
      const itemPath = path.join(backupRoot, item)
      return fs.statSync(itemPath).isDirectory() && item.match(/^\d{4}-\d{2}-\d{2}$/)
    })
    .sort()
    .reverse() // Most recent first
}

// Find backup directory
function findBackupDir(requestedDate) {
  if (requestedDate) {
    const backupDir = path.join(backupRoot, requestedDate)
    if (fs.existsSync(backupDir)) {
      return backupDir
    }
    console.error(`❌ Backup folder not found: ${requestedDate}`)
    process.exit(1)
  }

  // Use most recent backup
  const backups = getAvailableBackups()
  if (backups.length === 0) {
    console.error('❌ No backups found!')
    process.exit(1)
  }

  const latestBackup = backups[0]
  console.log(`📅 Using most recent backup: ${latestBackup}`)
  return path.join(backupRoot, latestBackup)
}

// Confirm restore
function askConfirmation() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    rl.question('⚠️  WARNING: This will DELETE all existing data and replace it with backup data!\nAre you sure you want to continue? (yes/no): ', (answer) => {
      rl.close()
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y')
    })
  })
}

// Delete all data from a table (with pagination for large tables)
async function deleteTableData(tableName) {
  try {
    let deletedCount = 0
    let hasMore = true
    const batchSize = 100

    // Delete in batches until no more records
    while (hasMore) {
      // Get a batch of IDs
      const { data: records, error: selectError } = await supabase
        .from(tableName)
        .select('id')
        .limit(batchSize)

      if (selectError) {
        console.error(`❌ Error fetching ${tableName} for deletion:`, selectError.message)
        return false
      }

      if (!records || records.length === 0) {
        hasMore = false
        break
      }

      // Delete this batch
      const ids = records.map(r => r.id)
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .in('id', ids)

      if (deleteError) {
        console.error(`❌ Error deleting batch from ${tableName}:`, deleteError.message)
        return false
      }

      deletedCount += records.length
      
      // If we got less than batchSize, we've deleted everything
      if (records.length < batchSize) {
        hasMore = false
      }
    }

    if (deletedCount > 0) {
      console.log(`   Deleted ${deletedCount} records from ${tableName}`)
    }

    return true
  } catch (err) {
    console.error(`❌ Error deleting ${tableName}:`, err.message)
    return false
  }
}

// Restore table data
async function restoreTable(tableName, backupDir) {
  try {
    const filePath = path.join(backupDir, `${tableName}.json`)
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  No backup file for ${tableName}, skipping...`)
      return { success: true, count: 0, skipped: true }
    }

    const fileContent = fs.readFileSync(filePath, 'utf8')
    const records = JSON.parse(fileContent)

    if (!Array.isArray(records) || records.length === 0) {
      console.log(`✅ ${tableName}: No records to restore`)
      return { success: true, count: 0 }
    }

    // Delete existing data first
    console.log(`🗑️  Deleting existing data from ${tableName}...`)
    await deleteTableData(tableName)

    // Insert backup data in batches (Supabase has limits)
    const batchSize = 100
    let totalInserted = 0

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize)
      
      const { error } = await supabase
        .from(tableName)
        .insert(batch)

      if (error) {
        console.error(`❌ Error restoring ${tableName} (batch ${Math.floor(i / batchSize) + 1}):`, error.message)
        return { success: false, error: error.message, count: totalInserted }
      }

      totalInserted += batch.length
    }

    console.log(`✅ ${tableName}: ${totalInserted} records restored`)
    return { success: true, count: totalInserted }
  } catch (err) {
    console.error(`❌ Error restoring ${tableName}:`, err.message)
    return { success: false, error: err.message, count: 0 }
  }
}

// Main restore function
async function runRestore() {
  const requestedDate = process.argv[2]
  const backupDir = findBackupDir(requestedDate)

  // Load metadata
  const metadataPath = path.join(backupDir, '_metadata.json')
  let metadata = null
  if (fs.existsSync(metadataPath)) {
    metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'))
    console.log(`📊 Backup info: ${metadata.totalRecords} records from ${metadata.timestamp}\n`)
  }

  // Confirm
  const confirmed = await askConfirmation()
  if (!confirmed) {
    console.log('❌ Restore cancelled.')
    process.exit(0)
  }

  console.log('\n🔄 Starting database restore...')
  console.log(`📁 Backup directory: ${backupDir}\n`)

  const startTime = Date.now()
  const results = []

  for (const table of TABLES) {
    const result = await restoreTable(table, backupDir)
    results.push({ table, ...result })
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2)

  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('📊 Restore Summary')
  console.log('='.repeat(50))
  console.log(`✅ Successful: ${results.filter(r => r.success).length}/${TABLES.length} tables`)
  console.log(`📝 Total records restored: ${results.reduce((sum, r) => sum + r.count, 0)}`)
  console.log(`⏱️  Duration: ${duration}s`)
  
  const failed = results.filter(r => !r.success)
  if (failed.length > 0) {
    console.log('\n❌ Failed tables:')
    failed.forEach(r => {
      console.log(`   - ${r.table}: ${r.error}`)
    })
  }
  
  console.log('\n✅ Restore completed!')
}

// List available backups
function listBackups() {
  const backups = getAvailableBackups()
  if (backups.length === 0) {
    console.log('No backups found.')
    return
  }

  console.log('Available backups:')
  backups.forEach((backup, index) => {
    const backupDir = path.join(backupRoot, backup)
    const metadataPath = path.join(backupDir, '_metadata.json')
    let info = ''
    
    if (fs.existsSync(metadataPath)) {
      try {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'))
        info = ` (${metadata.totalRecords} records)`
      } catch (e) {
        // Ignore
      }
    }
    
    console.log(`  ${index + 1}. ${backup}${info}`)
  })
}

// Handle command line arguments
if (process.argv.includes('--list') || process.argv.includes('-l')) {
  listBackups()
  process.exit(0)
}

// Run restore
runRestore().catch(err => {
  console.error('❌ Fatal error during restore:', err)
  process.exit(1)
})
