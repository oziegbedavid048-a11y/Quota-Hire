/**
 * Quota Hire — Appwrite Automated Setup Script
 * Creates: Database, 7 Collections, all Attributes, Indexes, Permissions, 2 Buckets
 */

import * as sdk from 'node-appwrite';

const PROJECT_ID  = '6a228524002b449caeac';
const API_KEY     = 'standard_5417ac2bd33e648c14ff5d0f85f7db471e93bba9cdb6c4e2033620c4803c4b213ac048fb09195a6e18fddee9570b2cacc060dce48c13db0d5d290a6f135412b2931df3dbfc345e91aa91159380043a0dc5dd14747fff07e03943d8bbd192957af85925d1e1aab5d5b17f55974e7fe0beee575860e0342e4cd34459cf43f3462d';
const ENDPOINT    = 'https://nyc.cloud.appwrite.io/v1';

// ── Fixed IDs (easy to reference in your .env later) ─────────────────────────
const DB_ID = 'quota_hire_db';

const COL = {
  USERS_PROFILE:      'users_profile',
  EMPLOYEE_PROFILES:  'employee_profiles',
  COMPANY_PROFILES:   'company_profiles',
  JOBS:               'jobs',
  APPLICATIONS:       'applications',
  NOTIFICATIONS:      'notifications',
  SAVED_JOBS:         'saved_jobs',
};

const BUCKET = {
  AVATARS: 'avatars',
  RESUMES: 'resumes',
};

// ── Client Setup ──────────────────────────────────────────────────────────────
const client = new sdk.Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const db      = new sdk.Databases(client);
const storage = new sdk.Storage(client);

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ── Helpers ───────────────────────────────────────────────────────────────────
async function safe(label, fn) {
  try {
    const result = await fn();
    console.log(`  ✅  ${label}`);
    return result;
  } catch (err) {
    if (err && (err.code === 409 || (err.message && err.message.includes('already exist')))) {
      console.log(`  ⚠️   ${label} — already exists, skipping`);
      return null;
    }
    console.error(`  ❌  ${label} FAILED:`, err.message || err);
    // Don't throw — keep going so one failure doesn't stop everything
    return null;
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🚀  Quota Hire — Appwrite Setup Starting...\n');

  // ── 1. Database ─────────────────────────────────────────────────────────────
  console.log('📦  Creating Database...');
  await safe('Database: quota_hire_db', () =>
    db.create(DB_ID, 'Quota Hire DB')
  );
  await sleep(800);

  // ── 2. Collections ──────────────────────────────────────────────────────────
  const userPerms = [
    sdk.Permission.read(sdk.Role.users()),
    sdk.Permission.create(sdk.Role.users()),
    sdk.Permission.update(sdk.Role.users()),
    sdk.Permission.delete(sdk.Role.users()),
  ];

  const jobsPerms = [
    sdk.Permission.read(sdk.Role.any()),
    sdk.Permission.create(sdk.Role.users()),
    sdk.Permission.update(sdk.Role.users()),
    sdk.Permission.delete(sdk.Role.users()),
  ];

  console.log('\n📂  Creating Collections...');

  // Collection: users_profile
  await safe('Collection: users_profile', () =>
    db.createCollection(DB_ID, COL.USERS_PROFILE, 'Users Profile', userPerms)
  );
  await sleep(600);

  // Collection: employee_profiles
  await safe('Collection: employee_profiles', () =>
    db.createCollection(DB_ID, COL.EMPLOYEE_PROFILES, 'Employee Profiles', userPerms)
  );
  await sleep(600);

  // Collection: company_profiles
  await safe('Collection: company_profiles', () =>
    db.createCollection(DB_ID, COL.COMPANY_PROFILES, 'Company Profiles', userPerms)
  );
  await sleep(600);

  // Collection: jobs (public read)
  await safe('Collection: jobs', () =>
    db.createCollection(DB_ID, COL.JOBS, 'Jobs', jobsPerms)
  );
  await sleep(600);

  // Collection: applications
  await safe('Collection: applications', () =>
    db.createCollection(DB_ID, COL.APPLICATIONS, 'Applications', userPerms)
  );
  await sleep(600);

  // Collection: notifications
  await safe('Collection: notifications', () =>
    db.createCollection(DB_ID, COL.NOTIFICATIONS, 'Notifications', userPerms)
  );
  await sleep(600);

  // Collection: saved_jobs
  await safe('Collection: saved_jobs', () =>
    db.createCollection(DB_ID, COL.SAVED_JOBS, 'Saved Jobs', userPerms)
  );
  await sleep(1000);

  // ── 3. Attributes ───────────────────────────────────────────────────────────
  console.log('\n🔧  Creating Attributes for users_profile...');
  await safe('attr: user_id',        () => db.createStringAttribute(DB_ID, COL.USERS_PROFILE, 'user_id', 255, true));
  await sleep(400);
  await safe('attr: role',           () => db.createEnumAttribute(DB_ID, COL.USERS_PROFILE, 'role', ['employee','company','admin'], true, 'employee'));
  await sleep(400);
  await safe('attr: setup_completed',() => db.createBooleanAttribute(DB_ID, COL.USERS_PROFILE, 'setup_completed', true, false));
  await sleep(400);
  await safe('attr: location',       () => db.createStringAttribute(DB_ID, COL.USERS_PROFILE, 'location', 200, false, ''));
  await sleep(400);
  await safe('attr: avatar_url',     () => db.createUrlAttribute(DB_ID, COL.USERS_PROFILE, 'avatar_url', false));
  await sleep(400);
  await safe('attr: created_at',     () => db.createDatetimeAttribute(DB_ID, COL.USERS_PROFILE, 'created_at', true));
  await sleep(1000);

  console.log('\n🔧  Creating Attributes for employee_profiles...');
  await safe('attr: user_id',         () => db.createStringAttribute(DB_ID, COL.EMPLOYEE_PROFILES, 'user_id', 255, true));
  await sleep(400);
  await safe('attr: title',           () => db.createStringAttribute(DB_ID, COL.EMPLOYEE_PROFILES, 'title', 200, false, ''));
  await sleep(400);
  await safe('attr: bio',             () => db.createStringAttribute(DB_ID, COL.EMPLOYEE_PROFILES, 'bio', 5000, false, ''));
  await sleep(400);
  await safe('attr: linkedin_url',    () => db.createUrlAttribute(DB_ID, COL.EMPLOYEE_PROFILES, 'linkedin_url', false));
  await sleep(400);
  await safe('attr: resume_url',      () => db.createUrlAttribute(DB_ID, COL.EMPLOYEE_PROFILES, 'resume_url', false));
  await sleep(400);
  await safe('attr: resume_file_id',  () => db.createStringAttribute(DB_ID, COL.EMPLOYEE_PROFILES, 'resume_file_id', 255, false));
  await sleep(400);
  await safe('attr: education',       () => db.createStringAttribute(DB_ID, COL.EMPLOYEE_PROFILES, 'education', 3000, false, ''));
  await sleep(400);
  await safe('attr: skills',          () => db.createStringAttribute(DB_ID, COL.EMPLOYEE_PROFILES, 'skills', 100, false, null, true));
  await sleep(400);
  await safe('attr: experience_years',() => db.createIntegerAttribute(DB_ID, COL.EMPLOYEE_PROFILES, 'experience_years', true, 0, 100, 0));
  await sleep(400);
  await safe('attr: phone_number',    () => db.createStringAttribute(DB_ID, COL.EMPLOYEE_PROFILES, 'phone_number', 50, false, ''));
  await sleep(400);
  await safe('attr: country',         () => db.createStringAttribute(DB_ID, COL.EMPLOYEE_PROFILES, 'country', 100, false, ''));
  await sleep(400);
  await safe('attr: city',            () => db.createStringAttribute(DB_ID, COL.EMPLOYEE_PROFILES, 'city', 100, false, ''));
  await sleep(400);
  await safe('attr: postal_code',     () => db.createStringAttribute(DB_ID, COL.EMPLOYEE_PROFILES, 'postal_code', 50, false, ''));
  await sleep(400);
  await safe('attr: street_address',  () => db.createStringAttribute(DB_ID, COL.EMPLOYEE_PROFILES, 'street_address', 300, false, ''));
  await sleep(400);
  await safe('attr: updated_at',      () => db.createDatetimeAttribute(DB_ID, COL.EMPLOYEE_PROFILES, 'updated_at', false));
  await sleep(1000);

  console.log('\n🔧  Creating Attributes for company_profiles...');
  await safe('attr: user_id',       () => db.createStringAttribute(DB_ID, COL.COMPANY_PROFILES, 'user_id', 255, true));
  await sleep(400);
  await safe('attr: company_name',  () => db.createStringAttribute(DB_ID, COL.COMPANY_PROFILES, 'company_name', 200, true));
  await sleep(400);
  await safe('attr: website',       () => db.createUrlAttribute(DB_ID, COL.COMPANY_PROFILES, 'website', false));
  await sleep(400);
  await safe('attr: industry',      () => db.createStringAttribute(DB_ID, COL.COMPANY_PROFILES, 'industry', 100, false, ''));
  await sleep(400);
  await safe('attr: description',   () => db.createStringAttribute(DB_ID, COL.COMPANY_PROFILES, 'description', 5000, false, ''));
  await sleep(400);
  await safe('attr: logo_url',      () => db.createUrlAttribute(DB_ID, COL.COMPANY_PROFILES, 'logo_url', false));
  await sleep(400);
  await safe('attr: contact_email', () => db.createEmailAttribute(DB_ID, COL.COMPANY_PROFILES, 'contact_email', false));
  await sleep(400);
  await safe('attr: contact_phone', () => db.createStringAttribute(DB_ID, COL.COMPANY_PROFILES, 'contact_phone', 50, false, ''));
  await sleep(400);
  await safe('attr: updated_at',    () => db.createDatetimeAttribute(DB_ID, COL.COMPANY_PROFILES, 'updated_at', false));
  await sleep(1000);

  console.log('\n🔧  Creating Attributes for jobs...');
  await safe('attr: company_user_id',    () => db.createStringAttribute(DB_ID, COL.JOBS, 'company_user_id', 255, true));
  await sleep(400);
  await safe('attr: company_name',       () => db.createStringAttribute(DB_ID, COL.JOBS, 'company_name', 200, true));
  await sleep(400);
  await safe('attr: company_logo_url',   () => db.createUrlAttribute(DB_ID, COL.JOBS, 'company_logo_url', false));
  await sleep(400);
  await safe('attr: company_is_verified',() => db.createBooleanAttribute(DB_ID, COL.JOBS, 'company_is_verified', true, false));
  await sleep(400);
  await safe('attr: title',              () => db.createStringAttribute(DB_ID, COL.JOBS, 'title', 300, true));
  await sleep(400);
  await safe('attr: description',        () => db.createStringAttribute(DB_ID, COL.JOBS, 'description', 10000, true));
  await sleep(400);
  await safe('attr: requirements',       () => db.createStringAttribute(DB_ID, COL.JOBS, 'requirements', 500, false, null, true));
  await sleep(400);
  await safe('attr: employment_type',    () => db.createStringAttribute(DB_ID, COL.JOBS, 'employment_type', 100, false, 'Full-time'));
  await sleep(400);
  await safe('attr: is_remote',          () => db.createBooleanAttribute(DB_ID, COL.JOBS, 'is_remote', true, false));
  await sleep(400);
  await safe('attr: location',           () => db.createStringAttribute(DB_ID, COL.JOBS, 'location', 200, false, ''));
  await sleep(400);
  await safe('attr: salary_range',       () => db.createStringAttribute(DB_ID, COL.JOBS, 'salary_range', 200, false, ''));
  await sleep(400);
  await safe('attr: commission_range',   () => db.createStringAttribute(DB_ID, COL.JOBS, 'commission_range', 200, false, ''));
  await sleep(400);
  await safe('attr: currency',           () => db.createStringAttribute(DB_ID, COL.JOBS, 'currency', 100, false, 'USD'));
  await sleep(400);
  await safe('attr: status',             () => db.createEnumAttribute(DB_ID, COL.JOBS, 'status', ['pending','approved','rejected','closed'], true, 'pending'));
  await sleep(400);
  await safe('attr: created_at',         () => db.createDatetimeAttribute(DB_ID, COL.JOBS, 'created_at', true));
  await sleep(400);
  await safe('attr: updated_at',         () => db.createDatetimeAttribute(DB_ID, COL.JOBS, 'updated_at', false));
  await sleep(1000);

  console.log('\n🔧  Creating Attributes for applications...');
  await safe('attr: job_id',           () => db.createStringAttribute(DB_ID, COL.APPLICATIONS, 'job_id', 255, true));
  await sleep(400);
  await safe('attr: job_title',        () => db.createStringAttribute(DB_ID, COL.APPLICATIONS, 'job_title', 300, true));
  await sleep(400);
  await safe('attr: company_name',     () => db.createStringAttribute(DB_ID, COL.APPLICATIONS, 'company_name', 200, true));
  await sleep(400);
  await safe('attr: employee_user_id', () => db.createStringAttribute(DB_ID, COL.APPLICATIONS, 'employee_user_id', 255, true));
  await sleep(400);
  await safe('attr: employee_name',    () => db.createStringAttribute(DB_ID, COL.APPLICATIONS, 'employee_name', 200, true));
  await sleep(400);
  await safe('attr: status',           () => db.createEnumAttribute(DB_ID, COL.APPLICATIONS, 'status', ['pending','under_review','interview','decision','accepted','rejected'], true, 'pending'));
  await sleep(400);
  await safe('attr: cover_letter',     () => db.createStringAttribute(DB_ID, COL.APPLICATIONS, 'cover_letter', 5000, false, ''));
  await sleep(400);
  await safe('attr: applied_at',       () => db.createDatetimeAttribute(DB_ID, COL.APPLICATIONS, 'applied_at', true));
  await sleep(400);
  await safe('attr: updated_at',       () => db.createDatetimeAttribute(DB_ID, COL.APPLICATIONS, 'updated_at', false));
  await sleep(1000);

  console.log('\n🔧  Creating Attributes for notifications...');
  await safe('attr: user_id',    () => db.createStringAttribute(DB_ID, COL.NOTIFICATIONS, 'user_id', 255, true));
  await sleep(400);
  await safe('attr: title',      () => db.createStringAttribute(DB_ID, COL.NOTIFICATIONS, 'title', 300, true));
  await sleep(400);
  await safe('attr: message',    () => db.createStringAttribute(DB_ID, COL.NOTIFICATIONS, 'message', 2000, true));
  await sleep(400);
  await safe('attr: read',       () => db.createBooleanAttribute(DB_ID, COL.NOTIFICATIONS, 'read', true, false));
  await sleep(400);
  await safe('attr: created_at', () => db.createDatetimeAttribute(DB_ID, COL.NOTIFICATIONS, 'created_at', true));
  await sleep(1000);

  console.log('\n🔧  Creating Attributes for saved_jobs...');
  await safe('attr: user_id',  () => db.createStringAttribute(DB_ID, COL.SAVED_JOBS, 'user_id', 255, true));
  await sleep(400);
  await safe('attr: job_id',   () => db.createStringAttribute(DB_ID, COL.SAVED_JOBS, 'job_id', 255, true));
  await sleep(400);
  await safe('attr: saved_at', () => db.createDatetimeAttribute(DB_ID, COL.SAVED_JOBS, 'saved_at', true));
  await sleep(2000); // extra wait before indexes

  // ── 4. Indexes ──────────────────────────────────────────────────────────────
  console.log('\n🗂️   Creating Indexes...');

  await safe('index: users_profile.user_id (unique)', () =>
    db.createIndex(DB_ID, COL.USERS_PROFILE, 'user_id_idx', sdk.IndexType.Unique, ['user_id'])
  );
  await sleep(600);
  await safe('index: users_profile.role', () =>
    db.createIndex(DB_ID, COL.USERS_PROFILE, 'role_idx', sdk.IndexType.Key, ['role'])
  );
  await sleep(600);

  await safe('index: employee_profiles.user_id (unique)', () =>
    db.createIndex(DB_ID, COL.EMPLOYEE_PROFILES, 'user_id_idx', sdk.IndexType.Unique, ['user_id'])
  );
  await sleep(600);

  await safe('index: company_profiles.user_id (unique)', () =>
    db.createIndex(DB_ID, COL.COMPANY_PROFILES, 'user_id_idx', sdk.IndexType.Unique, ['user_id'])
  );
  await sleep(600);

  await safe('index: jobs.status', () =>
    db.createIndex(DB_ID, COL.JOBS, 'status_idx', sdk.IndexType.Key, ['status'])
  );
  await sleep(600);
  await safe('index: jobs.company_user_id', () =>
    db.createIndex(DB_ID, COL.JOBS, 'company_user_idx', sdk.IndexType.Key, ['company_user_id'])
  );
  await sleep(600);
  await safe('index: jobs.title (fulltext)', () =>
    db.createIndex(DB_ID, COL.JOBS, 'title_search', sdk.IndexType.Fulltext, ['title'])
  );
  await sleep(600);
  await safe('index: jobs.created_at', () =>
    db.createIndex(DB_ID, COL.JOBS, 'created_at_idx', sdk.IndexType.Key, ['created_at'])
  );
  await sleep(600);

  await safe('index: applications.employee_user_id', () =>
    db.createIndex(DB_ID, COL.APPLICATIONS, 'employee_idx', sdk.IndexType.Key, ['employee_user_id'])
  );
  await sleep(600);
  await safe('index: applications.job_id', () =>
    db.createIndex(DB_ID, COL.APPLICATIONS, 'job_idx', sdk.IndexType.Key, ['job_id'])
  );
  await sleep(600);
  await safe('index: applications.unique_application (composite unique)', () =>
    db.createIndex(DB_ID, COL.APPLICATIONS, 'unique_application', sdk.IndexType.Unique, ['job_id', 'employee_user_id'])
  );
  await sleep(600);

  await safe('index: notifications.user_id', () =>
    db.createIndex(DB_ID, COL.NOTIFICATIONS, 'user_id_idx', sdk.IndexType.Key, ['user_id'])
  );
  await sleep(600);
  await safe('index: notifications.read', () =>
    db.createIndex(DB_ID, COL.NOTIFICATIONS, 'read_idx', sdk.IndexType.Key, ['read'])
  );
  await sleep(600);

  await safe('index: saved_jobs.user_id', () =>
    db.createIndex(DB_ID, COL.SAVED_JOBS, 'user_id_idx', sdk.IndexType.Key, ['user_id'])
  );
  await sleep(600);
  await safe('index: saved_jobs.unique_save (composite unique)', () =>
    db.createIndex(DB_ID, COL.SAVED_JOBS, 'unique_save', sdk.IndexType.Unique, ['user_id', 'job_id'])
  );
  await sleep(1000);

  // ── 5. Storage Buckets ──────────────────────────────────────────────────────
  console.log('\n🪣  Creating Storage Buckets...');

  await safe('Bucket: avatars', () =>
    storage.createBucket(
      BUCKET.AVATARS,
      'Avatars',
      [
        sdk.Permission.read(sdk.Role.any()),
        sdk.Permission.create(sdk.Role.users()),
        sdk.Permission.update(sdk.Role.users()),
        sdk.Permission.delete(sdk.Role.users()),
      ],
      false,   // fileSecurity
      true,    // enabled
      5242880, // 5 MB max file size
      ['jpg', 'jpeg', 'png', 'webp', 'gif']
    )
  );
  await sleep(800);

  await safe('Bucket: resumes', () =>
    storage.createBucket(
      BUCKET.RESUMES,
      'Resumes',
      [
        sdk.Permission.read(sdk.Role.users()),
        sdk.Permission.create(sdk.Role.users()),
        sdk.Permission.update(sdk.Role.users()),
        sdk.Permission.delete(sdk.Role.users()),
      ],
      false,    // fileSecurity
      true,     // enabled
      10485760, // 10 MB max file size
      ['pdf', 'doc', 'docx']
    )
  );
  await sleep(500);

  // ── 6. Summary ──────────────────────────────────────────────────────────────
  console.log('\n\n════════════════════════════════════════════════════════');
  console.log('✅  QUOTA HIRE — APPWRITE SETUP COMPLETE!');
  console.log('════════════════════════════════════════════════════════\n');
  console.log('Copy these values into your .env file:\n');
  console.log(`VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1`);
  console.log(`VITE_APPWRITE_PROJECT_ID=${PROJECT_ID}`);
  console.log(`VITE_APPWRITE_DATABASE_ID=${DB_ID}`);
  console.log(`VITE_APPWRITE_COL_USERS_PROFILE=${COL.USERS_PROFILE}`);
  console.log(`VITE_APPWRITE_COL_EMPLOYEE_PROFILES=${COL.EMPLOYEE_PROFILES}`);
  console.log(`VITE_APPWRITE_COL_COMPANY_PROFILES=${COL.COMPANY_PROFILES}`);
  console.log(`VITE_APPWRITE_COL_JOBS=${COL.JOBS}`);
  console.log(`VITE_APPWRITE_COL_APPLICATIONS=${COL.APPLICATIONS}`);
  console.log(`VITE_APPWRITE_COL_NOTIFICATIONS=${COL.NOTIFICATIONS}`);
  console.log(`VITE_APPWRITE_COL_SAVED_JOBS=${COL.SAVED_JOBS}`);
  console.log(`VITE_APPWRITE_BUCKET_AVATARS=${BUCKET.AVATARS}`);
  console.log(`VITE_APPWRITE_BUCKET_RESUMES=${BUCKET.RESUMES}`);
  console.log(`\nAPPWRITE_API_KEY=${API_KEY}  (backend only — never put in VITE_)`);
  console.log('\n════════════════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('\n💥  Fatal error:', err.message || err);
  process.exit(1);
});
