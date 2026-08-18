# GIT_WORKFLOW.md

## 1. Goal

Prevent integration problems.

## 2. Branches

```text
main
  |
  +-- develop
        |
        +-- feature/auth
        +-- feature/profile
        +-- feature/video-upload
        +-- feature/assessment
        +-- feature/results
        +-- feature/leaderboard
        +-- feature/coach-dashboard
```

## 3. Branch Responsibilities

### main
Stable demo/production-ready code.

Do not push directly.

### develop
Integration branch.

Features are merged here after review.

### feature/*
Individual development branches.

## 4. Starting Work

```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature
```

## 5. During Work

Make small commits.

Example:

```bash
git add .
git commit -m "feat: add assessment creation endpoint"
```

Avoid:

```text
"final changes"
"changes"
"done"
"everything"
```

## 6. Before Push

```bash
git status
git diff
```

Run relevant tests.

Then:

```bash
git push -u origin feature/your-feature
```

## 7. Pull Request

Create:

```text
feature/your-feature -> develop
```

PR should contain:

```text
What changed?
Why?
How was it tested?
Any known limitation?
```

## 8. Review

At least one teammate reviews important changes.

Review:
- correctness
- architecture
- security
- naming
- tests
- unrelated changes

## 9. Main Protection

Configure GitHub so:
- direct pushes to main are restricted
- pull requests are required
- at least one approval is required
- required checks pass
- force pushes are disabled

## 10. Merge Conflicts

If a conflict occurs:

```bash
git checkout develop
git pull origin develop

git checkout feature/your-feature
git merge develop
```

Resolve conflicts manually.

Then:

```bash
git add .
git commit
git push
```

Do not randomly delete another person's code.

## 11. Secrets

Never commit:

```text
.env
API keys
passwords
private keys
service account files
Supabase service-role keys
JWT secrets
```

Use `.env.example`.

## 12. Golden Rule

Small changes + frequent integration > huge changes + late integration.
