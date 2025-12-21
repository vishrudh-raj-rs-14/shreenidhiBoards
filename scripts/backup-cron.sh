#!/bin/bash

# Cron-friendly backup script
# This script ensures the environment is set up correctly for cron execution

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

# Change to project directory
cd "$PROJECT_DIR"

# Load environment variables from .env file if it exists
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Run the backup script
node scripts/backup.js >> "$PROJECT_DIR/backup/cron-backup.log" 2>&1

# Optional: Keep only last 30 days of backups
# Uncomment the following lines if you want automatic cleanup
# find "$PROJECT_DIR/backup" -type d -name "*-*-*" -mtime +30 -exec rm -rf {} \;
