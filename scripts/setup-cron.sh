#!/bin/bash

# Script to set up the daily backup cron job

PROJECT_DIR="/Users/vishrudhrajrs/Desktop/Projects/shrenidhiboards"
CRON_SCRIPT="$PROJECT_DIR/scripts/backup-cron.sh"
CRON_JOB="0 23 * * * $CRON_SCRIPT"

echo "🔧 Setting up daily backup cron job..."
echo "📅 Schedule: Every day at 11:00 PM"
echo "📁 Script: $CRON_SCRIPT"
echo ""

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "$CRON_SCRIPT"; then
    echo "⚠️  Cron job already exists!"
    echo ""
    echo "Current cron jobs:"
    crontab -l | grep -v "^#"
    echo ""
    read -p "Do you want to remove the existing job and add a new one? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Remove existing job
        crontab -l 2>/dev/null | grep -v "$CRON_SCRIPT" | crontab -
        echo "✅ Removed existing cron job"
    else
        echo "❌ Cancelled. Existing cron job remains."
        exit 0
    fi
fi

# Add the cron job
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

if [ $? -eq 0 ]; then
    echo "✅ Cron job added successfully!"
    echo ""
    echo "Current cron jobs:"
    crontab -l | grep -v "^#"
    echo ""
    echo "📝 To view logs: tail -f $PROJECT_DIR/backup/cron-backup.log"
    echo "📝 To remove: crontab -e (then delete the line)"
else
    echo "❌ Failed to add cron job"
    exit 1
fi
