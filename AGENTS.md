## Takhayal Website Collaboration Rules

- Because a partner may be working on the same website, do not commit directly to `main` for feature, launch, deployment, CMS, admin, or UI changes.
- Create a dedicated branch for each workstream before committing changes, using a clear name such as `codex/non-payment-launch-fixes`.
- Commit only the files that belong to the requested work. Leave unrelated local changes unstaged unless the user explicitly asks to include them.
- Push the branch and use a pull request so the partner can review, compare, and merge safely.
- If production must be deployed before the branch is merged, still sync the exact deployed code through a branch and PR immediately afterward.
- Before staging broad changes, confirm whether the user wants only the current task files or everything currently modified in the worktree.
