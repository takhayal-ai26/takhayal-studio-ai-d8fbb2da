# Takhayal Deployment Workflow

This project uses GitHub branches, pull requests, Vercel previews, and protected production deploys so two people can work together without accidentally shipping the wrong version.

## Golden Rule

Production should only deploy from the `main` branch after a reviewed pull request is merged.

Avoid running production deploys from a local laptop during normal work.

## Daily Workflow

1. Update your local `main`.

   ```bash
   git switch main
   git pull origin main
   ```

2. Create a new branch for the task.

   ```bash
   git switch -c feature/short-task-name
   ```

3. Make the smallest targeted change possible.

4. Run checks before pushing.

   ```bash
   npm run build
   npm test
   ```

5. Commit and push the branch.

   ```bash
   git status
   git add <changed-files>
   git commit -m "Describe the change"
   git push -u origin feature/short-task-name
   ```

6. Open a pull request into `main`.

7. Test the Vercel preview URL on desktop and mobile.

8. Merge only after the reviewer approves and the quality checks pass.

9. Verify production after the merge.

   Check the live domain and the affected routes, not only the Vercel deployment status.

## Vercel Setup

In Vercel, connect the project to the GitHub repository and use these rules:

- Production branch: `main`
- Preview deployments: enabled for pull requests
- Auto-production deploys: enabled only for `main`
- Manual production deploys from local machines: emergency use only

If a preview is validated and needs to become production without rebuilding, use Vercel's promote flow intentionally and record the deployment URL in the pull request.

## GitHub Branch Protection

Enable branch protection for `main` in GitHub:

- Require a pull request before merging
- Require at least one approval
- Require status checks to pass before merging
- Select the `Build and test` quality check
- Block force pushes
- Block direct pushes to `main`

For a private repository, GitHub may require a paid plan to enable branch protection or repository rulesets. If protection is unavailable, keep using pull requests and Vercel previews, but treat direct pushes to `main` as forbidden by team policy until the repository plan supports a hard block.

## Supabase and Database Changes

Database changes must be written as Supabase migrations and reviewed in the pull request.

Before merging a PR with migrations:

1. Confirm the migration belongs to this project.
2. Apply or verify the migration in the target Supabase environment.
3. Deploy the matching app version.
4. Test the public/admin behavior that depends on the database change.

Do not make manual production database changes that are not captured in a migration, except for emergency recovery work that is documented afterward.

## Emergency Rollback

If production breaks after a merge:

1. Use Vercel rollback to restore the last good deployment.
2. Open a fix branch from `main`.
3. Add the fix through a pull request.
4. Verify the preview before merging again.

For database-related incidents, confirm whether the app rollback also needs a database rollback or a forward-only repair migration.
