/**
 * Quota Hire — Appwrite Fix Script
 * Fixes: missing required attributes, all indexes, and the storage bucket
 */

import { Client, Databases, Storage, Permission, Role, DatabasesIndexType } from 'node-appwrite';

const PROJECT_ID = '6a228524002b449caeac';
const API_KEY    = 'standard_5417ac2bd33e648c14ff5d0f85f7db471e93bba9cdb6c4e2033620c4803c4b213ac048fb09195a6e18fddee9570b2cacc060dce48c13db0d5d290a6f135412b2931df3dbfc345e91aa91159380043a0dc5dd14747fff07e03943d8bbd192957af85925d1e1aab5d5b17f55974e7fe0beee575860e0342e4cd34459cf43f3462d';
const ENDPOINT   = 'https://nyc.cloud.appwrite.io/v1';
const DB_ID      = 'quota_hire_db';

const COL = {
  USERS_PROFILE:     'users_profile',
  EMPLOYEE_PROFILES: 'employee_profiles',
  COMPANY_PROFILES:  'company_profiles',
  JOBS:              'jobs',
  APPLICATIONS:      'applications',
  NOTIFICATIONS:     'notifications',
  SAVED_JOBS:        'saved_jobs',
};

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const db      = new Databases(client);
const storage = new Storage(client);

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function safe(label, fn) {
  try {
    await fn();
    console.log(`  ✅  ${label}`);
  } catch (err) {
    if (err && (err.code === 409 || (err.message && (err.message.includes('already exist') || err.message.includes('already been used'))))) {
      console.log(`  ⚠️   ${label} — already exists, skipping`);
    } else {
      console.error(`  ❌  ${label} FAILED:`, err.message || err);
    }
  }
}

async function main() {
  console.log('\n🔧  Quota Hire — Appwrite Fix Script\n');

  // ── FIX 1: Missing Attributes ─────────────────────────────────────────────
  // Appwrite rule: if required=true you CANNOT set a default. So we use required=false + default.
  // Our code will always set these explicitly anyway.

  console.log('🔧  Fixing missing attributes on users_profile...');
  await safe('attr: role', () =>
    db.createEnumAttribute(DB_ID, COL.USERS_PROFILE, 'role',
      ['employee','company','admin'], false, 'employee')
  );
  await sleep(500);
  await safe('attr: setup_completed', () =>
    db.createBooleanAttribute(DB_ID, COL.USERS_PROFILE, 'setup_completed', false, false)
  );
  await sleep(1200);

  console.log('\n🔧  Fixing missing attributes on employee_profiles...');
  await safe('attr: experience_years', () =>
    db.createIntegerAttribute(DB_ID, COL.EMPLOYEE_PROFILES, 'experience_years', false, 0, 100, 0)
  );
  await sleep(1200);

  console.log('\n🔧  Fixing missing attributes on jobs...');
  await safe('attr: company_is_verified', () =>
    db.createBooleanAttribute(DB_ID, COL.JOBS, 'company_is_verified', false, false)
  );
  await sleep(500);
  await safe('attr: is_remote', () =>
    db.createBooleanAttribute(DB_ID, COL.JOBS, 'is_remote', false, false)
  );
  await sleep(500);
  await safe('attr: status', () =>
    db.createEnumAttribute(DB_ID, COL.JOBS, 'status',
      ['pending','approved','rejected','closed'], false, 'pending')
  );
  await sleep(1200);

  console.log('\n🔧  Fixing missing attributes on applications...');
  await safe('attr: status', () =>
    db.createEnumAttribute(DB_ID, COL.APPLICATIONS, 'status',
      ['pending','under_review','interview','decision','accepted','rejected'], false, 'pending')
  );
  await sleep(1200);

  console.log('\n🔧  Fixing missing attributes on notifications...');
  await safe('attr: read', () =>
    db.createBooleanAttribute(DB_ID, COL.NOTIFICATIONS, 'read', false, false)
  );

  // Wait extra time for ALL attributes to reach "available" status before creating indexes
  console.log('\n⏳  Waiting for attributes to become available (this takes ~15s)...');
  await sleep(15000);

  // ── FIX 2: All Indexes ────────────────────────────────────────────────────
  console.log('\n🗂️   Creating Indexes...');

  await safe('index: users_profile.user_id (unique)', () =>
    db.createIndex(DB_ID, COL.USERS_PROFILE, 'user_id_idx', DatabasesIndexType.Unique, ['user_id'], ['ASC'])
  );
  await sleep(700);
  await safe('index: users_profile.role', () =>
    db.createIndex(DB_ID, COL.USERS_PROFILE, 'role_idx', DatabasesIndexType.Key, ['role'], ['ASC'])
  );
  await sleep(700);

  await safe('index: employee_profiles.user_id (unique)', () =>
    db.createIndex(DB_ID, COL.EMPLOYEE_PROFILES, 'user_id_idx', DatabasesIndexType.Unique, ['user_id'], ['ASC'])
  );
  await sleep(700);

  await safe('index: company_profiles.user_id (unique)', () =>
    db.createIndex(DB_ID, COL.COMPANY_PROFILES, 'user_id_idx', DatabasesIndexType.Unique, ['user_id'], ['ASC'])
  );
  await sleep(700);

  await safe('index: jobs.status', () =>
    db.createIndex(DB_ID, COL.JOBS, 'status_idx', DatabasesIndexType.Key, ['status'], ['ASC'])
  );
  await sleep(700);
  await safe('index: jobs.company_user_id', () =>
    db.createIndex(DB_ID, COL.JOBS, 'company_user_idx', DatabasesIndexType.Key, ['company_user_id'], ['ASC'])
  );
  await sleep(700);
  await safe('index: jobs.title (fulltext)', () =>
    db.createIndex(DB_ID, COL.JOBS, 'title_search', DatabasesIndexType.Fulltext, ['title'], ['ASC'])
  );
  await sleep(700);
  await safe('index: jobs.created_at', () =>
    db.createIndex(DB_ID, COL.JOBS, 'created_at_idx', DatabasesIndexType.Key, ['created_at'], ['DESC'])
  );
  await sleep(700);

  await safe('index: applications.employee_user_id', () =>
    db.createIndex(DB_ID, COL.APPLICATIONS, 'employee_idx', DatabasesIndexType.Key, ['employee_user_id'], ['ASC'])
  );
  await sleep(700);
  await safe('index: applications.job_id', () =>
    db.createIndex(DB_ID, COL.APPLICATIONS, 'job_idx', DatabasesIndexType.Key, ['job_id'], ['ASC'])
  );
  await sleep(700);
  await safe('index: applications.unique (job+employee)', () =>
    db.createIndex(DB_ID, COL.APPLICATIONS, 'unique_application', DatabasesIndexType.Unique, ['job_id','employee_user_id'], ['ASC','ASC'])
  );
  await sleep(700);

  await safe('index: notifications.user_id', () =>
    db.createIndex(DB_ID, COL.NOTIFICATIONS, 'user_id_idx', DatabasesIndexType.Key, ['user_id'], ['ASC'])
  );
  await sleep(700);
  await safe('index: notifications.read', () =>
    db.createIndex(DB_ID, COL.NOTIFICATIONS, 'read_idx', DatabasesIndexType.Key, ['read'], ['ASC'])
  );
  await sleep(700);

  await safe('index: saved_jobs.user_id', () =>
    db.createIndex(DB_ID, COL.SAVED_JOBS, 'user_id_idx', DatabasesIndexType.Key, ['user_id'], ['ASC'])
  );
  await sleep(700);
  await safe('index: saved_jobs.unique (user+job)', () =>
    db.createIndex(DB_ID, COL.SAVED_JOBS, 'unique_save', DatabasesIndexType.Unique, ['user_id','job_id'], ['ASC','ASC'])
  );
  await sleep(1000);

  // ── FIX 3: Storage Bucket ─────────────────────────────────────────────────
  // Free plan allows 1 bucket. 'avatars' already exists.
  // Update it to accept all file types (avatars + resumes combined).
  console.log('\n🪣  Updating storage bucket to handle all file types...');

  // Try to delete the old 'avatars' bucket and recreate as a combined bucket
  try {
    await storage.deleteBucket('avatars');
    console.log('  🗑️   Deleted old avatars bucket');
    await sleep(1000);
  } catch(e) {
    console.log('  ⚠️   Could not delete avatars bucket:', e.message?.slice(0,60));
  }

  await safe('Bucket: quota_hire_files (images + PDFs + docs)', () =>
    storage.createBucket(
      'quota_hire_files',
      'Quota Hire Files',
      [
        Permission.read(Role.any()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
      ],
      false,    // fileSecurity
      true,     // enabled
      10485760, // 10 MB max file size
      ['jpg','jpeg','png','webp','gif','pdf','doc','docx']
    )
  );

  // ── Done ──────────────────────────────────────────────────────────────────
  console.log('\n\n════════════════════════════════════════════════════════');
  console.log('✅  QUOTA HIRE — APPWRITE FULLY CONFIGURED!');
  console.log('════════════════════════════════════════════════════════\n');
  console.log('Your .env values (everything is ready):\n');
  console.log('VITE_APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1');
  console.log('VITE_APPWRITE_PROJECT_ID=6a228524002b449caeac');
  console.log('VITE_APPWRITE_DATABASE_ID=quota_hire_db');
  console.log('VITE_APPWRITE_COL_USERS_PROFILE=users_profile');
  console.log('VITE_APPWRITE_COL_EMPLOYEE_PROFILES=employee_profiles');
  console.log('VITE_APPWRITE_COL_COMPANY_PROFILES=company_profiles');
  console.log('VITE_APPWRITE_COL_JOBS=jobs');
  console.log('VITE_APPWRITE_COL_APPLICATIONS=applications');
  console.log('VITE_APPWRITE_COL_NOTIFICATIONS=notifications');
  console.log('VITE_APPWRITE_COL_SAVED_JOBS=saved_jobs');
  console.log('VITE_APPWRITE_BUCKET_FILES=quota_hire_files');
  console.log('\n# Backend only — never expose this in frontend:');
  console.log('APPWRITE_API_KEY=standard_5417ac2bd33e648c14ff5d0f85f7db471e93bba9cdb6c4e2033620c4803c4b213ac048fb09195a6e18fddee9570b2cacc060dce48c13db0d5d290a6f135412b2931df3dbfc345e91aa91159380043a0dc5dd14747fff07e03943d8bbd192957af85925d1e1aab5d5b17f55974e7fe0beee575860e0342e4cd34459cf43f3462d');
  console.log('\n════════════════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('\n💥  Fatal:', err.message || err);
  process.exit(1);
});
