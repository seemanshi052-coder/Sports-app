# Backend

FastAPI backend for the Sports Talent Assessment Platform.

## Planned responsibilities

- REST API
- authentication verification
- athlete profile operations
- assessment creation
- video/assessment orchestration
- AI pipeline integration
- result retrieval
- leaderboard
- coach/scout APIs

## Run without Docker

Create a virtual environment and install:

```bash
pip install -r requirements.txt
```

The actual `app/main.py` will be added during backend implementation.

## Run with Docker

From repository root:

```bash
docker compose up --build
```

Then:

```text
http://localhost:8000/docs
```

will be used once `app/main.py` exists.

## Important

Do not place secrets in source code.

Use the repository `.env` file locally and `.env.example` as the template.
