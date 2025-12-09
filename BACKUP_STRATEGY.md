# Database Backup Strategy Reference

**Document Type**: Reference Plan
**Created**: December 9, 2025
**Updated**: December 9, 2025
**Status**: Documented for future implementation

---

## Platform Comparison (Updated)

| Platform | Native Backups | PITR | Setup Effort | Recommendation |
|----------|---------------|------|--------------|----------------|
| **Render** | ✅ Automatic daily | ✅ 7-day | Low | ⭐ Recommended |
| **Neon** | ✅ Automatic | ✅ 7-30 day | Low | ⭐ Recommended |
| **Supabase** | ✅ Automatic daily | ✅ 7-day | Low | Good alternative |
| **Railway** | ❌ Manual setup | ❌ Complex | High | Requires extra work |

**Note**: Railway does NOT natively provide automatic backups. Requires deploying additional backup service or using their Barman template.

---

## Backup Strategy Overview

**Approach**: Hybrid strategy with platform backups + off-platform redundancy.

| Environment | Backup Method | Provider | Frequency |
|-------------|---------------|----------|-----------|
| Development | Manual pg_dump | Local | Before migrations |
| Production | Managed automatic | Render/Neon (preferred) | Daily |
| Redundancy | Off-platform | Cloudflare R2 | Weekly |

---

## Development Backups

### Manual Commands
```bash
# Create backup
pg_dump learning_platform > backup_$(date +%Y%m%d).sql

# Create compressed backup
pg_dump learning_platform | gzip > backup_$(date +%Y%m%d).sql.gz

# Restore from backup
psql learning_platform < backup_file.sql

# Restore from compressed
gunzip -c backup_file.sql.gz | psql learning_platform
```

### When to Backup
- Before running `prisma migrate dev`
- Before major schema changes
- Before testing destructive operations

---

## Production Backups (Milestone 8)

### Option A: Render PostgreSQL (Recommended)
- ✅ Automatic daily backups included
- ✅ 7-day point-in-time recovery (PITR)
- ✅ One-click restore from dashboard
- ✅ No additional configuration needed

### Option B: Neon PostgreSQL (Recommended)
- ✅ Automatic continuous backups
- ✅ 7-30 day PITR (plan dependent)
- ✅ Branching feature for safe testing
- ✅ Generous free tier

### Option C: Railway PostgreSQL (Requires Setup)
Railway does NOT include automatic backups. You must set up one of:

**C1. Railway Backup Template** (Simpler):
- Deploy their [automated backup template](https://blog.railway.com/p/automated-postgresql-backups)
- Requires AWS S3 bucket + credentials
- Runs daily backup to S3
- Manual restore process

**C2. Railway + Barman Template** (Advanced):
- Deploy [PostgreSQL + Barman template](https://railway.com/deploy/postgresql-barman--1)
- Enables true PITR
- More complex setup
- Supports R2 or S3 storage

---

## Disaster Recovery Procedures

### Scenario 1: Accidental Data Deletion

**If using Render/Neon (with PITR)**:
1. Go to database dashboard
2. Select "Point-in-time Recovery"
3. Choose timestamp before the accident
4. Restore to new database instance
5. Verify data, then switch application

**If using Railway (with backup template)**:
1. Download latest backup from S3
2. Create new PostgreSQL instance on Railway
3. Run: `pg_restore -d 'NEW_DATABASE_URL' backup_folder`
4. Verify data is correct
5. Update application DATABASE_URL

**If NO backups exist**:
- Data is likely unrecoverable
- This is why backup setup is critical before production

### Scenario 2: Corrupted Database

1. Stop application immediately (prevent further writes)
2. If using PITR: restore to timestamp before corruption
3. If using daily backups: restore latest clean backup
4. Accept data loss between backup and incident
5. Investigate root cause before resuming

### Scenario 3: Complete Platform Outage

This is why off-platform R2 backups matter:
1. Spin up PostgreSQL on alternative platform
2. Restore from R2 backup
3. Update DNS/application config
4. Resume operations

---

## Off-Platform Redundancy (Post-Launch)

### Cloudflare R2 Backup Strategy
Since the project uses R2 for essay file storage, leverage same infrastructure.

**R2 Bucket**: `learning-platform-backups`
- Enable object versioning
- Configure lifecycle rules

### Retention Policy
| Backup Type | Frequency | Retention | Storage |
|-------------|-----------|-----------|---------|
| Platform managed | Daily | 7 days | Render/Neon |
| R2 full dump | Weekly | 4 weeks | Cloudflare R2 |
| R2 monthly archive | Monthly | 12 months | Cloudflare R2 |
| Pre-migration | Manual | Permanent | Cloudflare R2 |

### R2 Environment Variables (when ready)
```env
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BACKUP_BUCKET=learning-platform-backups
```

---

## Recovery Objectives

| Metric | Development | Production |
|--------|-------------|------------|
| **RPO** (max data loss) | 24 hours | 1 hour |
| **RTO** (recovery time) | 4 hours | 30 minutes |

---

## Glossary

### PITR (Point-in-Time Recovery)
The ability to restore your database to any specific moment in time, not just when a backup was taken. PostgreSQL achieves this by continuously writing changes to WAL (Write-Ahead Log) files. To recover, you restore a base backup and replay WAL logs up to your desired timestamp.

**Example**: If someone accidentally deletes data at 3:45 PM, you can restore to 3:44 PM and lose only 1 minute of data instead of a full day.

### Logical Backup (pg_dump)
Exports data as SQL statements (CREATE TABLE, INSERT, etc.). Human-readable, portable across PostgreSQL versions, but slower for large databases. Best for development and small-medium databases.

### Physical Backup
Copies actual database files on disk. Binary format, much faster for large databases, but must restore to same PostgreSQL version. Best for large production databases.

---

## Quick Reference Commands

```bash
# Development backup before migration
pg_dump learning_platform > premigration_$(date +%Y%m%d_%H%M%S).sql

# Compressed backup
pg_dump learning_platform | gzip > backup_$(date +%Y%m%d).sql.gz

# Restore from backup
psql learning_platform < backup_file.sql

# Restore compressed
gunzip -c backup_file.sql.gz | psql learning_platform

# Verify backup integrity
pg_restore --list backup_file.tar

# Check database size
psql -c "SELECT pg_size_pretty(pg_database_size('learning_platform'));"
```

---

## Implementation Timeline

| When | What | Notes |
|------|------|-------|
| Now | This reference document | ✅ Done |
| Milestone 8 | Choose platform (Render/Neon recommended) | Automatic backups included |
| Milestone 8 | Verify backup configuration | Test restore procedure |
| Post-launch | Add R2 redundancy | Optional enhancement |

---

## References

- [Railway: How to Backup and Restore Postgres](https://blog.railway.com/p/postgre-backup)
- [Railway: Automated PostgreSQL Backups](https://blog.railway.com/p/automated-postgresql-backups)
- [Railway: PostgreSQL + Barman Template](https://railway.com/deploy/postgresql-barman--1)
- [PostgreSQL: Continuous Archiving and PITR](https://www.postgresql.org/docs/current/continuous-archiving.html)
