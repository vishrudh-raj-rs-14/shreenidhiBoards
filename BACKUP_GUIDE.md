# Database Backup & Restore Guide

## Quick Start

### Create a Backup
```bash
npm run backup
```

### List Available Backups
```bash
npm run backup:list
```

### Restore from Backup
```bash
# Restore from most recent backup
npm run restore

# Restore from specific date
npm run restore 2024-01-15
```

## Setup

1. **Ensure environment variables are set** in your `.env` file:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   
   # Recommended for better permissions:
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. **Install dependencies** (if not already installed):
   ```bash
   npm install
   ```

## How It Works

### Backup Process
1. Creates a folder in `backup/` with today's date (YYYY-MM-DD)
2. Backs up all 14 tables from your database
3. Saves each table as a JSON file
4. Creates a `_metadata.json` file with backup information

### Restore Process
1. Prompts for confirmation (destructive operation!)
2. Deletes all existing data from tables
3. Restores data from backup files in the correct order
4. Handles foreign key constraints automatically

## Tables Backed Up

All tables are backed up:
- ✅ app_config
- ✅ parties
- ✅ products
- ✅ purchase_prices
- ✅ purchase_price_history
- ✅ supply_prices
- ✅ supply_price_history
- ✅ purchase_transactions
- ✅ purchase_transaction_items
- ✅ supply_transactions
- ✅ supply_transaction_items
- ✅ receipts
- ✅ payments
- ✅ expenses

## Important Notes

⚠️ **Backups are stored locally** - Make sure to:
- Keep copies in a safe location (cloud storage, external drive)
- Run backups regularly, especially before deployments
- Test restores periodically to ensure backups work

⚠️ **Restore is destructive** - It will:
- DELETE all existing data
- Replace it with backup data
- Always asks for confirmation before proceeding

## Automated Backups

For production, set up automated daily backups:

### Using Cron (Linux/Mac)
```bash
# Edit crontab
crontab -e

# Add this line for daily backup at 2 AM
0 2 * * * cd /path/to/project && npm run backup
```

### Using Vercel Cron (if hosting on Vercel)
Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/backup",
    "schedule": "0 2 * * *"
  }]
}
```

## Troubleshooting

### "Missing Supabase credentials" error
- Check your `.env` file has the required variables
- Make sure you're running the script from the project root

### "Permission denied" errors
- Use `SUPABASE_SERVICE_ROLE_KEY` instead of anon key for better permissions
- Check your Supabase project settings

### Large dataset issues
- The scripts handle pagination automatically
- For very large datasets, backups may take several minutes

## Backup Location

Backups are stored in: `backup/YYYY-MM-DD/`

This folder is gitignored and won't be committed to version control.
