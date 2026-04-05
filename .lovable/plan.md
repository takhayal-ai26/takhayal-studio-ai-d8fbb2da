
## Plan: Resolution, Credits & Admin Pricing System

### Step 1 — Database Schema (Migration)
- Add columns to `model_pricing_tiers`: `is_available` (boolean), `resolution_label` (text), `actual_pixels` (integer)
- Create `model_test_log` table with admin-only RLS
- Create `deduct_credits` RPC function (atomic credit deduction with refund capability)

### Step 2 — Seed Resolution Data
- Set `resolution_label` and `actual_pixels` based on existing `quality_level` column
- Disable invalid resolution rows per model (e.g., Flux Schnell gets only 1K, Seedream only 2K/4K, etc.)

### Step 3 — Studio Resolution Selector
- Make resolution dropdown load dynamically from `model_pricing_tiers` filtered by selected model + `is_available = true`
- Show live credits from the exact model+resolution row
- Pass `actual_pixels` to the generate edge function

### Step 4 — Admin Pricing Matrix Enhancements
- Make credits field editable with real-time margin recalculation
- Wire `is_available` toggle to database
- Add credit value setting at top of page
- Audit log on save

### Step 5 — Tool Provider Margins (Editable)
- Add inline edit for credits and available toggle per tool provider
- Auto-calculate margin/revenue
- Write to `tool_providers` table on save

### Step 6 — Credits System Integrity
- Realtime subscription for credit balance in navbar
- Pre-check credits before generation
- Use `deduct_credits` RPC for atomic server-side deduction
- Instant balance update after purchase

### Step 7 — Resolution Test Feature (Admin)
- "Test Resolution" button per model in admin
- Sends test generation, compares actual vs expected pixels
- Logs results to `model_test_log`

### What won't change
- UI design, colors, fonts, auth, admin nav, Studio/Gallery layout
- 3-step edit flow pattern in Pricing Matrix
- `admin_audit_log` schema
