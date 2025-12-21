# Cron Job Setup for Daily Backups

This guide will help you set up an automated daily backup at 11 PM.

## Quick Setup

### Step 1: Open Crontab Editor

```bash
crontab -e
```

If this is your first time, you'll be asked to choose an editor. Choose your preferred editor (nano is recommended for beginners).

### Step 2: Add the Cron Job

Add this line to your crontab file:

```bash
0 23 * * * /Users/vishrudhrajrs/Desktop/Projects/shrenidhiboards/scripts/backup-cron.sh
```

This means:
- `0` - minute (0th minute)
- `23` - hour (11 PM in 24-hour format)
- `*` - day of month (every day)
- `*` - month (every month)
- `*` - day of week (every day of week)

### Step 3: Save and Exit

- **Nano**: Press `Ctrl+X`, then `Y`, then `Enter`
- **Vi/Vim**: Press `Esc`, type `:wq`, then `Enter`

### Step 4: Verify the Cron Job

```bash
crontab -l
```

You should see your cron job listed.

## Alternative: Using the Full Path with Node

If the shell script doesn't work, you can use this direct approach:

```bash
0 23 * * * cd /Users/vishrudhrajrs/Desktop/Projects/shrenidhiboards && /usr/local/bin/node scripts/backup.js >> /Users/vishrudhrajrs/Desktop/Projects/shrenidhiboards/backup/cron-backup.log 2>&1
```

**Note**: Replace `/usr/local/bin/node` with your actual Node.js path. Find it with:
```bash
which node
```

## Viewing Backup Logs

Backup logs are saved to:
```
backup/cron-backup.log
```

View the latest logs:
```bash
tail -f backup/cron-backup.log
```

## Testing the Cron Job

Test the backup script manually first:

```bash
cd /Users/vishrudhrajrs/Desktop/Projects/shrenidhiboards
./scripts/backup-cron.sh
```

Or directly:
```bash
npm run backup
```

## Troubleshooting

### Cron job not running?

1. **Check cron service is running** (macOS):
   ```bash
   sudo launchctl list | grep cron
   ```

2. **Check cron logs**:
   ```bash
   grep CRON /var/log/system.log
   ```

3. **Verify environment variables**: Cron runs with minimal environment. The script loads from `.env` file, but make sure the file path is correct.

4. **Check file permissions**:
   ```bash
   chmod +x scripts/backup-cron.sh
   ```

5. **Test with a simple cron job first**:
   ```bash
   # Add this to crontab to test (runs every minute)
   * * * * * echo "Cron is working" >> /tmp/cron-test.log
   ```

### Node.js not found?

If you get "node: command not found", use the full path:

1. Find Node.js path:
   ```bash
   which node
   ```

2. Update the cron job to use the full path, or add to the shell script:
   ```bash
   export PATH="/usr/local/bin:$PATH"
   ```

## Disabling the Cron Job

To remove the cron job:

```bash
crontab -e
# Delete or comment out the backup line
# Save and exit
```

Or remove all cron jobs:
```bash
crontab -r
```

## Backup Cleanup (Optional)

To automatically delete backups older than 30 days, uncomment the cleanup lines in `scripts/backup-cron.sh`:

```bash
find "$PROJECT_DIR/backup" -type d -name "*-*-*" -mtime +30 -exec rm -rf {} \;
```

## Schedule Examples

- **Daily at 11 PM**: `0 23 * * *`
- **Daily at 2 AM**: `0 2 * * *`
- **Every 6 hours**: `0 */6 * * *`
- **Weekly on Sunday at 11 PM**: `0 23 * * 0`
- **Monthly on 1st at 11 PM**: `0 23 1 * *`

## Important Notes

- Cron jobs run with minimal environment variables
- The backup script loads environment from `.env` file
- Make sure your `.env` file has the correct Supabase credentials
- Backups are stored in `backup/YYYY-MM-DD/` folders
- The `backup/` folder is gitignored and won't be committed
