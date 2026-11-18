# Implementation Status — C2C Role Refactor

## Scope
Simplified the account model to a Consumer-to-Consumer marketplace.

## Changes
- **Roles:** `user` and `mitra` only. Removed internal UI roles `seller`, `buyer`, `partner`, and `admin` (`src/components/demo-provider.tsx`).
- **Login:** email/password only; registration creates a normal `user`; removed quick “Penjual”, “Pembeli”, and “Admin” entries. Optional demo shortcuts are now Pengguna/Mitra (`src/routes/login.tsx`, `src/lib/supabase/env.ts`).
- **Navigation:** standard users see Beranda, Perangkat Saya, Aktivitas; mitra sees Dasbor Mitra. Removed the admin “Tinjauan” entry (`src/components/passport-ui.tsx`).
- **Selling:** “Jual perangkat” added directly to owned cards in My Devices, continuing to the existing listing/pricing screen. No store, seller application, merchant, or mode switch.
- **Ownership:** listing visibility and publishing remain owner-gated in `ListingScreen` (`d.owner !== user.id`) and by `publish_listing` in migration 001.
- **Mitra restriction:** mitra cannot buy, save devices, update devices, withdraw listings, or request verification; only `reviewVerification` is allowed. Enforced client-side and by the new backend guards in migration 002.
- **Disputes:** removed the admin actor. Buyer can refund and seller can release disputed demo funds (`src/lib/workflows.ts`, `src/lib/transaction-screens.tsx`).
- **Admin route:** `/admin` now redirects to `/` and no longer exposes a review dashboard.
- **Docs:** role definition updated in `docs/requirement.md` (two roles, no seller registration, six tables) and `AGENTS.md`.

## Preserved
- Trust Score, price estimation, and Compare logic unchanged.
- Six business tables unchanged; `seller_id`/`buyer_id` remain transaction context columns.
- Passport ownership transfer (`buy_listing`) and listing/transaction screens preserved.

## Database verification
Migration `001_digital_passport_mvp_v02.sql` already satisfies the model:
- `profiles.role` defaults to `user` with `check (role in ('user','mitra'))`.
- Column grants allow users to update only `full_name`, `avatar_url`, `phone`, so `role` cannot be self-assigned.
- `publish_listing` derives the seller from `auth.uid()` and rejects non-owners.
- `buy_listing` rejects purchasing one’s own device/listing (`buyer_id <> seller_id` check and RPC guard).
No legacy seller/store tables or columns exist. A non-destructive guard migration was added at `supabase/migrations/002_c2c_role_guards.sql`: it blocks `mitra` from publishing, withdrawing, or buying listings, and from inserting/updating devices or history, while leaving all tables and user data intact. It is not yet applied to the remote project.

## Test results
- Updated `src/test/workflows.test.ts` for buyer-refund/seller-release without an admin.
- **Not executed:** the `bash` tool fails in this environment with `ChildProcess.spawn NotFound`, so `npm run lint`, `npm run test`, and `npm run build` could not be run. No verification is claimed beyond code review.
