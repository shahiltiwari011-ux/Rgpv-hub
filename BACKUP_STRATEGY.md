# RGPV Study Hub - Disaster Recovery & Backup Strategy

As a production-ready resilient environment, system guarantees define the robustness of the data infrastructure.

## 1. Automated Supabase Backups
Supabase offers automated backups depending on the active tier.
* **Pro Plan**: Supabase captures Daily backups dynamically covering 7 days of point-in-time recovery (PITR).
* **Enterprise Plan**: Realtime replication ensuring zero RPO constraints.

### Logical Backup Execution (Manual Export)
It is highly recommended to manually pull a logical snapshot dump before any major architectural schema migrations:
```bash
# Export schema and logical data utilizing pg_dump natively
pg_dump --clean --if-exists --quote-all-identifiers \
 -h db.<PROJECT_REF>.supabase.co -U postgres > rgpv_backup.sql
```

## 2. Storage Bucket Durability
Files placed into the `uploads` bucket are not conventionally tracked under the standard Database logical dumps. 
* **Backing up files**: Currently requires either using the AWS S3 compatible API exposed through `storage.supabase.com` to mirror directories logically via tools like `rclone`, or using the native Supabase UI manual downloads.

## 3. JSON Fallback Consistency State
To ensure the JSON arrays in `data/notes.json`, `data/pyq.json` remain accurate as definitive static fail-safes during catastrophic database separation:
* **Recommendation**: Once every 3 months (end of Semester updates), export the Supabase tables natively to CSV/JSON format from the backend UI, and map them back into the `/data/` folder arrays pushing updates statically over Git.

## 4. Recovering from Destruction
If absolute failure occurs:
1. Re-provision Supabase Project.
2. Inject `supabase-setup.sql` directly into new DB.
3. Replace `.env` keys across Netlify / Vercel with new target configurations.
4. Execute `psql` restore of previously exported logical schema backups targeting `rgpv_backup.sql`.
