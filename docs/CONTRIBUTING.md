# CONTRIBUTING.md

## 1. Before Starting

Read:
- README.md
- docs/PROJECT.md
- docs/ARCHITECTURE.md
- docs/API_CONTRACT.md

Then run the project locally.

## 2. Feature Development

Every feature should follow:

```text
Requirement
  ↓
UI/API design
  ↓
API contract
  ↓
Database changes if needed
  ↓
Implementation
  ↓
Integration
  ↓
Testing
  ↓
Pull Request
  ↓
Review
  ↓
Merge
```

## 3. Definition of Done

A feature is complete only if:

- UI is implemented
- API is implemented where required
- database/storage is integrated where required
- validation exists
- errors are handled
- tests pass
- integration is verified
- documentation is updated
- PR is reviewed
- code is merged into develop

## 4. AI Coding Tools

Antigravity, ChatGPT, Copilot, or other AI tools may be used.

However:

The developer remains responsible for:
- understanding the code
- reviewing changes
- checking security
- running tests
- verifying behavior

Never blindly paste generated code.

## 5. Lovable

Lovable is used for the coach/scout web dashboard.

It must use:
- the agreed API
- the agreed authentication strategy
- the agreed database/backend architecture

It must not create an independent application backend without team approval.

## 6. Naming

Use clear names.

Examples:

```text
assessment_id
athlete_id
video_storage_path
overall_score
created_at
```

Avoid unexplained abbreviations.

## 7. API Changes

Before changing an existing endpoint:
1. Tell the team.
2. Update API_CONTRACT.md.
3. Update clients.
4. Test both sides.

## 8. Database Changes

Use migrations.

Do not silently change tables.

Update DATABASE_SCHEMA.md when the conceptual schema changes.

## 9. Error Handling

Every user-facing operation should handle:
- loading
- success
- empty state
- validation error
- network error
- server error
- processing failure

## 10. Documentation Rule

If you make an architectural decision that another teammate will need to know, document it.
