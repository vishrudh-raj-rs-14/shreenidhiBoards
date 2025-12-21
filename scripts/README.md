# Database Backup & Restore Scripts

These scripts help you backup and restore your Supabase database data.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Make sure your `.env` file contains:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Backup

### Create a backup:
```bash
npm run backup
```

Or directly:
```bash
node scripts/backup.js
```

This will:
- Create a backup folder with today's date (YYYY-MM-DD)
- Export all tables to JSON files
- Save metadata about the backup

### Backup Location:
Backups are stored in: `backup/YYYY-MM-DD/`

Each backup contains:
- Individual JSON files for each table
- `_metadata.json` with backup information

## Restore

### List available backups:
```bash
npm run backup:list
```

### Restore from most recent backup:
```bash
npm run restore
```

### Restore from specific date:
```bash
npm run restore 2024-01-15
```

Or directly:
```bash
node scripts/restore.js 2024-01-15
```

⚠️ **WARNING**: Restore will DELETE all existing data and replace it with backup data!

## Tables Backed Up

The following tables are backed up:
1. app_config
2. parties
3. products
4. purchase_prices
5. purchase_price_history
6. supply_prices
7. supply_price_history
8. purchase_transactions
9. purchase_transaction_items
10. supply_transactions
11. supply_transaction_items
12. receipts
13. payments
14. expenses

## Notes

- Backups are organized by date in subfolders
- Each table is saved as a separate JSON file
- The restore process respects foreign key constraints
- Data is restored in the correct order to maintain relationships
- Large tables are restored in batches of 100 records

## Automated Backups

You can set up automated backups using cron (Linux/Mac) or Task Scheduler (Windows):

### Linux/Mac (cron):
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/project && npm run backup
```

### Windows (Task Scheduler):
Create a scheduled task to run:
```
cd C:\path\to\project && npm run backup
```
