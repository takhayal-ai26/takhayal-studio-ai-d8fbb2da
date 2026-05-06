# Takhayal Partner Onboarding and Safe Work Guide

This guide explains exactly how to install the project, work safely with a partner, open pull requests, test previews, and avoid accidental production or database mistakes.

## 1. Accounts and Access Needed

Ask Nasser to give you access to these:

- GitHub repository collaborator access.
- Vercel project access for preview deployments and environment variables.
- Supabase access only if your task involves database/admin/backend work.

Do not share passwords, API keys, Supabase keys, or Vercel tokens in WhatsApp, email, GitHub comments, or chat. Use Vercel access, Supabase access, or a secure password manager.

## 2. Install Required Tools

Install these on your computer:

- Git
- Node.js 20 LTS or newer
- npm, included with Node.js
- VS Code or your preferred editor
- GitHub CLI, optional but helpful
- Vercel CLI, only needed if you must pull environment variables locally
- Supabase CLI, only needed if you are explicitly approved to work on database migrations

macOS with Homebrew:

```bash
brew install git node gh
npm install -g vercel
brew install supabase/tap/supabase
```

Check versions:

```bash
git --version
node -v
npm -v
gh --version
vercel --version
supabase --version
```

## 3. Clone the Repository

Clone the repo from GitHub. Do not download the ZIP.

```bash
git clone https://github.com/nasseralhilaly1989-beep/takhayal-studio-ai-d8fbb2da.git
cd takhayal-studio-ai-d8fbb2da
```

Install dependencies:

```bash
npm install
```

## 4. Environment Variables

Create a local `.env.local` file. Never commit this file.

The project expects these variables:

```bash
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_URL=
VITE_SUPABASE_PROJECT_ID=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_URL=
PAYMENT_GATEWAY_PROVIDER=pending
PAYMENT_WEBHOOK_SECRET=
```

The production Supabase project is:

```bash
junmnibsurnslpcqhjle
https://junmnibsurnslpcqhjle.supabase.co
```

Safe ways to get env vars:

1. Preferred: Nasser grants Vercel project access, then run:

   ```bash
   vercel login
   vercel link
   vercel env pull .env.local
   ```

2. Alternative: Nasser sends `.env.local` through a secure password manager.

After setting env vars, confirm `.env.local` is not staged:

```bash
git status --short
```

## 5. Run the Project Locally

Start the dev server:

```bash
npm run dev
```

Open the local URL printed by Vite, usually:

```text
http://localhost:5173
```

Useful local routes:

```text
/en
/ar
/en/video/generate-video
/ar/video/generate-video
/admin/content
```

## 6. Daily Safe Workflow

Every task starts from fresh `main`:

```bash
git switch main
git pull origin main
```

Create a new branch for one task:

```bash
git switch -c partner/short-task-name
```

Examples:

```bash
git switch -c partner/fix-pricing-copy
git switch -c partner/update-homepage-section
git switch -c partner/admin-tool-labels
```

Make small, targeted changes. Do not rewrite unrelated files.

## 7. Before You Push

Always inspect what changed:

```bash
git status
git diff
```

Run the project checks:

```bash
npm run build
npm test
npm run lint
```

If a check fails, do not push until you understand whether it is caused by your change.

Commit only the files related to your task:

```bash
git add path/to/file1 path/to/file2
git commit -m "Describe the change clearly"
git push -u origin partner/short-task-name
```

Do not use `git add .` unless you have checked every changed file and are sure all of them belong in the PR.

## 8. Pull Request Rules

Open a pull request into `main`.

The PR must include:

- What changed.
- What route/page/admin area is affected.
- How you tested it.
- Screenshots or screen recording for UI changes.
- Whether database, auth, payment, or env vars are involved.

Before merge:

- GitHub checks must pass.
- Vercel preview must pass.
- The changed page must be tested in the Vercel preview.
- Test desktop and mobile.
- Test English and Arabic if the route is bilingual.
- Nasser or the partner must review the PR.

## 9. Deployment Rule

Merging to `main` deploys production.

Treat the merge button like the production deploy button.

Do not:

- Push directly to `main`.
- Manually deploy production from your laptop.
- Merge a PR with failing checks.
- Merge a PR before checking the Vercel preview.

After merge, verify production:

```text
https://takhayal.ai
https://www.takhayal.ai
```

Also verify the specific route you changed.

## 10. Supabase and Database Safety

The production Supabase project is:

```text
junmnibsurnslpcqhjle
```

Never run these without explicit approval:

```bash
supabase db push --linked
supabase db reset --linked
supabase migration repair --linked
supabase db query --linked -f some-file.sql
```

Database work requires this process:

1. Confirm the target project is `junmnibsurnslpcqhjle`.
2. Create or confirm a fresh backup.
3. Review the exact SQL or migration.
4. Apply only the approved change.
5. Verify the database state.
6. Verify the live website/admin behavior.

If your task touches these areas, stop and ask before continuing:

- Supabase migrations
- Auth
- Payments
- Credits
- Admin permissions
- Tools table
- Models or video models
- Legal policy storage
- Content blocks
- Translation overrides
- SEO landing pages

## 11. Vercel Safety

Use Vercel previews for PR testing.

Do not change production environment variables unless Nasser approves the exact change.

Do not promote or rollback deployments unless this is an agreed emergency action.

If a preview looks broken:

1. Confirm GitHub checks passed.
2. Open the Vercel deployment logs.
3. Check whether Preview environment variables exist.
4. Do not merge until the preview is fixed or the issue is clearly unrelated.

## 12. Admin/CMS Work Rules

Admin controls must be real, not just UI.

For admin/CMS changes, verify:

- The admin form saves successfully.
- Data persists after refresh.
- The public website reflects the admin change.
- English and Arabic still work.
- Mobile layout is not broken.

For content changes, prefer admin/CMS controls when possible instead of hardcoding copy in code.

## 13. UI Work Rules

Keep changes consistent with the existing design system.

Before opening a PR, check:

- Desktop layout
- Mobile layout
- Arabic RTL layout
- English layout
- Text overflow
- Image/video preview overflow
- Buttons and forms
- Loading and empty states where relevant

Do not add new libraries unless Nasser approves first.

## 14. Emergency Rules

If production breaks:

1. Tell Nasser immediately.
2. Do not keep pushing random fixes to `main`.
3. Use Vercel rollback only if agreed.
4. Create a fix branch from latest `main`.
5. Open a PR with the fix.
6. Verify preview before merging.

If database data looks wrong:

1. Stop.
2. Do not run migrations or manual SQL.
3. Confirm the Supabase project.
4. Check backups.
5. Prepare a targeted recovery plan.

## 15. Final Checklist Before Asking for Review

Use this checklist on every PR:

```text
[ ] I created a branch from latest main.
[ ] I changed only files related to this task.
[ ] I did not commit .env.local or secrets.
[ ] I ran npm run build.
[ ] I ran npm test.
[ ] I ran npm run lint.
[ ] I tested the affected route locally.
[ ] I tested the Vercel preview.
[ ] I checked mobile layout.
[ ] I checked Arabic if the change is bilingual.
[ ] I mentioned any database/env/deployment impact in the PR.
```

## 16. The Short Version

Work on a branch. Open a PR. Wait for checks. Test the Vercel preview. Review together. Merge only when ready. Never push directly to `main`. Never touch production Supabase or Vercel settings without explicit approval.
