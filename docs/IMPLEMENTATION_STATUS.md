# Implementation Status — Paspor Digital MVP Audit & Remediation

Last Updated: 2026-11-19 (Session 01 — Database Remediation Completed)

---

## Executive Summary
Following the 5-session comprehensive audit ([`docs/audit/MVP_AUDIT.md`](file:///d:/Hackathon/passport-purchase-playground/docs/audit/MVP_AUDIT.md)) and backlog planning ([`docs/audit/IMPLEMENTATION_BACKLOG.md`](file:///d:/Hackathon/passport-purchase-playground/docs/audit/IMPLEMENTATION_BACKLOG.md)), **Session 01 (Database Remediation)** is complete.

All critical P0 database remediation tasks (`TASK-P0-1`, `TASK-P0-2`, `TASK-P0-3`, and `TASK-P0-5`) have been authored into non-destructive database migrations. `TASK-P0-4` (`refresh_listing_estimate`) is deferred to Session 04 (AI & Pricing) as planned.

- **Migration 001** (`supabase/migrations/001_digital_passport_mvp_v02.sql`): Base 6-table schema.
- **Migration 002** (`supabase/migrations/002_c2c_role_guards.sql`): C2C role guards preventing Mitra accounts from buying, listing, or inserting devices/history.
- **Migration 003** (`supabase/migrations/003_verification_and_public_rpcs.sql`): Complete verification lifecycle RPCs, scoped storage RLS, public passport endpoint, authoritative DB Trust Score engine, anti-stale transfer hooks, and trigger recursion guards.

> [!IMPORTANT]
> The database migration files exist in the repository. They must now be applied to the remote Supabase project via the Supabase Dashboard SQL Editor in sequential order (`002` followed by `003`).

---

## Migration Architecture & Remediations

### 1. Migration 002 Review (`TASK-P0-1`)
- **Status**: Reviewed, sound, pending remote deployment.
- **Enforcements**:
  - `is_mitra()` helper function.
  - `publish_listing`: Rejects callers with `role = 'mitra'`.
  - `withdraw_listing`: Rejects callers with `role = 'mitra'`.
  - `buy_listing`: Rejects callers with `role = 'mitra'`.
  - RLS Policies: `devices_insert_own`, `devices_update_own`, and `histories_insert_own` explicitly enforce `not public.is_mitra()`.

### 2. Migration 003 Implementation (`TASK-P0-2`, `TASK-P0-3`, `TASK-P0-5`)
- **File**: [`supabase/migrations/003_verification_and_public_rpcs.sql`](file:///d:/Hackathon/passport-purchase-playground/supabase/migrations/003_verification_and_public_rpcs.sql)
- **Constraint Refinement**:
  - Replaced legacy `verifier_id is not null` check constraint with `history_records_verification_check`. `verifier_id` is only required when `verification_status in ('verified', 'rejected')`, enabling `'pending'` records to be created with `verifier_id = null`.
- **Verification Lifecycle RPCs** (`TASK-P0-2`):
  - `request_verification(p_history_id uuid)`: Enforces caller ownership, rejects Mitra accounts, blocks actively listed devices, requires evidence attachment, blocks re-verifying level 3 records, sets status to `'pending'`.
  - `pending_verifications()`: Strictly restricted to Mitra callers (`is_mitra()`), excludes stale records where ownership transferred, excludes self-verification records, returns complete `PendingVerificationRow` schema.
  - `review_verification(p_history_id uuid, p_approve boolean, p_note text)`: Restricted to Mitra callers, verifies current ownership matches record creator, prevents self-verification, enforces mandatory note on rejection, promotes to level 3 on approval.
- **Anti-Stale Transfer Invalidation** (`TASK-P0-2`):
  - `buy_listing(p_listing_id uuid)`: Enhanced to atomically reset any pending verification requests on the purchased device back to `'not_requested'`, preventing new owners from inheriting unreviewed pending requests.
- **Scoped Evidence Storage Policy** (`TASK-P0-2`):
  - Replaced `evidence_read_own` on `storage.objects` (`device-evidence` bucket) with `evidence_read_authorized`. Mitra accounts are granted read access **strictly and only** to storage objects associated with pending verification records or records verified by the Mitra caller. Arbitrary read access is denied. Original uploaders and new device owners retain scoped read access.
- **Public Passport Resolution** (`TASK-P0-5`):
  - `public_passport(p_key text)`: Callable by `anon` and `authenticated`. Resolves by UUID or `passport_code`. Sanitizes specifications (strips purchase price/location), filters only public histories, strips internal evidence paths, matches `PublicPassportRow` contract.
- **Authoritative Database Trust Score Engine** (`TASK-P0-3`):
  - Implemented `calculate_trust_score(p_device_id uuid)` adhering to PRD specifications.
  - Implemented `sync_trust_score_from_history` trigger (`AFTER INSERT OR UPDATE OR DELETE ON public.history_records`).
  - Implemented `sync_trust_score_from_device` trigger (`BEFORE INSERT OR UPDATE OF serial_number, imei, photo_url, lock_status ON public.devices`). Evaluates `NEW` row directly on insert/update without trigger recursion or querying uncommitted rows.
  - Refactored `guard_device_update`: Allows score updates even if a device is actively listed when user-editable attributes remain unchanged.
  - Backfill included: `UPDATE public.devices SET trust_score = public.calculate_trust_score(id);`.
- **RPC Grants & Security Definer**:
  - Revoked all default permissions from `public, anon, authenticated`.
  - Explicitly granted `anon, authenticated` to `public_passport`.
  - Explicitly granted `authenticated` to `request_verification`, `pending_verifications`, `review_verification`, and `calculate_trust_score`.

---

## Trust Score Formula Conflict & Decision Needed

During audit and implementation, a discrepancy between the canonical PRD and client-side code was identified:

| Factor | PRD Standard (`docs/requirement.md:98-114`) | Client Implementation (`src/lib/passport.ts:72-105`) | Migration 003 Implementation |
| :--- | :--- | :--- | :--- |
| **Complete Identity** (Serial/IMEI + Photo) | **20 pts** | 20 pts | **20 pts** |
| **Purchase Proof** (Level 2+ Record) | **15 pts** | 15 pts | **15 pts** |
| **Battery Condition** (Level 2+ Record) | **15 pts** | 15 pts | **15 pts** |
| **Service History** (Level 2+ Record) | **20 pts** (5 pts/record, max 4) | 15 pts (Flat bonus if ≥1 record) | **20 pts** (5 pts/record, max 4) |
| **Mitra Verification** (Level 3 Record) | **20 pts** (10 pts/record, max 2) | 35 pts (7 pts/record, max 5) | **20 pts** (10 pts/record, max 2) |
| **Clean Lock Status** (`claimed_unlocked`) | **10 pts** | 0 pts (Missing completely) | **10 pts** |
| **Total Maximum** | **100 pts** | 100 pts | **100 pts** |

> [!NOTE]
> **Decision Implemented**: Migration 003 implements the **PRD Standard (100 pts)** as the authoritative backend ground truth. In subsequent Session 02/03 (`TASK-P1-3`), `src/lib/passport.ts` and `src/test/passport.test.ts` should be updated to align with this formula.

---

## Feature Classification Matrix (FR-01 – FR-16)

| ID | Feature | Classification | Remediation Status |
| :--- | :--- | :--- | :--- |
| **FR-01** | Register & Login | **PARTIAL** | Email/password works. Pending Supabase Auth setting to disable email confirmation (`FINDING-05`). |
| **FR-02** | Create Passport | **VERIFIED** | Zod validation, unique serial/IMEI indices, UUID `passport_code`. |
| **FR-03** | Add History Records | **VERIFIED** | Uploads to `device-evidence`, trigger validation, ownership enforcement. |
| **FR-04** | Trust Levels (L1-L3) | **VERIFIED** | Migration 003 refines check constraint; L3 strictly assigned by Mitra review. |
| **FR-05** | Mitra Verification | **REMEDIATED (PENDING REMOTE DEPLOY)** | `request_verification`, `pending_verifications`, and `review_verification` RPCs and scoped storage policy implemented in `003`. |
| **FR-06** | Trust Score Calculation | **REMEDIATED (PENDING REMOTE DEPLOY)** | Authoritative DB engine, trigger synchronization, and backfill implemented in `003`. |
| **FR-07** | Publish Listing | **PARTIAL** | `publish_listing` secured in `002`; withdrawal UI button pending (`TASK-P0-6`). |
| **FR-08** | Browse Marketplace | **PARTIAL** | Anonymous feed decoupling pending (`TASK-P2-1`). |
| **FR-09** | Detail Screen | **VERIFIED** | Specs, masked serial, timeline, level chips, price labels. |
| **FR-10** | Simulated Purchase | **VERIFIED** | Atomic `buy_listing` RPC; `003` adds anti-stale pending request invalidation. |
| **FR-11** | QR Code Paspor | **REMEDIATED (PENDING REMOTE DEPLOY)** | `public_passport` RPC implemented in `003` for external scans. |
| **FR-12** | AI OCR Receipt | **NOT_IMPLEMENTED** | Optional feature out of MVP scope. |
| **FR-13** | Anomaly Detection | **VERIFIED** | Rule-based anomalies functional. |
| **FR-14** | Estimated Price Formula | **PARTIAL** | Formula functional; reference seed data pending (`TASK-P1-1`). |
| **FR-15** | AI Price Explanation | **MOCK_ONLY** | Real AI integration deferred to Session 04 (`TASK-P2-4`). |
| **FR-16** | Price Badges & Premium | **VERIFIED** | Murah / Wajar / Mahal badges and passport premium rendered. |
| **Compare** | Compare Devices | **VERIFIED** | Transient frontend state, up to 3 devices. |

---

## Deployment & Verification Guide

### Step 1: Deploy Migrations via Supabase SQL Editor
1. Open your **Supabase Dashboard** -> **SQL Editor**.
2. Run [`supabase/migrations/002_c2c_role_guards.sql`](file:///d:/Hackathon/passport-purchase-playground/supabase/migrations/002_c2c_role_guards.sql).
3. Run [`supabase/migrations/003_verification_and_public_rpcs.sql`](file:///d:/Hackathon/passport-purchase-playground/supabase/migrations/003_verification_and_public_rpcs.sql).

### Step 2: Targeted SQL Verification Test Suite
Execute these queries in the Supabase SQL Editor to verify the remediations:

```sql
-- 1. Test public_passport resolution (Anon access)
-- Replace with an existing passport_code or device_id
select * from public.public_passport('DSP-00000000-0000-0000-0000-000000000000');

-- 2. Verify calculate_trust_score function
select id, brand, model, trust_score, public.calculate_trust_score(id) as recalculated_score
from public.devices
limit 5;

-- 3. Verify Mitra Queue is empty for regular users (Should raise error or return empty)
-- As a regular user:
select * from public.pending_verifications();

-- 4. Verify History Verification Check Constraint allows 'pending' without verifier_id
-- (Constraint test in rollback transaction)
begin;
  insert into public.history_records (
    device_id, created_by, type, title, evidence_url, verification_status, requested_at
  ) values (
    (select id from public.devices limit 1),
    (select owner_id from public.devices limit 1),
    'service',
    'Test Service',
    'uploader_uuid/test.jpg',
    'pending',
    now()
  );
rollback;

-- 5. Verify Negative Permissions: Mitra cannot publish listing
-- (Assuming Mitra user UUID is set in session)
-- select public.publish_listing('device-uuid', 'Title', 1000000); -> Expect: 'Mitra accounts cannot publish listings'
```
