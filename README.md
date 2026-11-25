# ReachInbox – Email Job Scheduler

A backend email scheduling application built using Node.js, TypeScript, Express, PostgreSQL, Redis, BullMQ, Ethereal Email, Slack OAuth and Elasticsearch.

## 1. Project Overview

ReachInbox is designed to schedule emails and process them asynchronously using a background job queue.

The application stores email information in PostgreSQL, uses Redis for queue processing and rate limiting, and uses BullMQ to manage scheduled email jobs.

Ethereal Email is used as a test SMTP service.

## 2. Technology Stack

| Technology | Purpose |
|---|---|
| Node.js | Runtime environment |
| TypeScript | Backend development |
| Express.js | REST API |
| PostgreSQL | Persistent email storage |
| Redis | Queue and rate-limit storage |
| BullMQ | Background job processing |
| Nodemailer | SMTP email sending |
| Ethereal Email | Email testing |
| Slack API | OAuth and notifications |
| Elasticsearch | Email indexing and search infrastructure |

## 3. Project Structure

```text
ReachInbox-Email-Scheduler/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── database/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── workers/
│   │   └── scripts/
│   ├── .env
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
├── docs/
├── docker-compose.yml
├── .gitignore
└── README.md
```

## 4. Prerequisites

- Node.js and npm
- Docker Desktop
- Git
- A GitHub account

## 5. Backend Setup

Clone the repository:

```bash
git clone YOUR_REPOSITORY_URL
cd ReachInbox-Email-Scheduler
```

Start the infrastructure:

```bash
docker compose up -d
```

This starts PostgreSQL, Redis and Elasticsearch.

Navigate to the backend:

```bash
cd backend
npm install
```

Create a `.env` file using the following variables:

```env
PORT=5000

DATABASE_URL=postgresql://reachinbox:YOUR_PASSWORD@localhost:5432/reachinbox_db

REDIS_HOST=localhost
REDIS_PORT=6379

SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=YOUR_ETHEREAL_USER
SMTP_PASS=YOUR_ETHEREAL_PASSWORD

MIN_EMAIL_DELAY_MS=2000
MAX_EMAILS_PER_HOUR=200
WORKER_CONCURRENCY=5

ELASTICSEARCH_URL=http://localhost:9200

SLACK_CLIENT_ID=YOUR_SLACK_CLIENT_ID
SLACK_CLIENT_SECRET=YOUR_SLACK_CLIENT_SECRET
SLACK_REDIRECT_URI=http://localhost:5000/api/slack/callback
SLACK_CHANNEL_ID=YOUR_SLACK_CHANNEL_ID
```

Run the database schema using the PostgreSQL container:

```powershell
Get-Content .\src\database\schema.sql | docker exec -i reachinbox-postgres psql -U reachinbox -d reachinbox_db
```

Start the backend server in one terminal:

```bash
npx tsx watch src/server.ts
```

Start the BullMQ worker in another terminal:

```bash
npx tsx watch src/workers/emailWorker.ts
```

Backend API:

```text
http://localhost:5000
```

Health endpoint:

```text
http://localhost:5000/health
```

## 6. Ethereal Email Setup

1. Visit https://ethereal.email/
2. Generate a test email account.
3. Copy the SMTP username and password.
4. Add the credentials to the backend `.env` file.
5. Restart the backend and worker.

Ethereal provides a test inbox and preview links. Emails sent through this configuration are not delivered to real recipients.

## 7. Architecture Overview

### Email Scheduling

1. The client submits email information through the Express API.
2. The email details are stored in PostgreSQL.
3. A BullMQ job is created with a delay based on the scheduled time.
4. The background worker processes the job when it becomes eligible.
5. Nodemailer sends the email through Ethereal SMTP.
6. PostgreSQL is updated with the delivery status.

### Persistence

PostgreSQL stores email records, while Docker volumes preserve database and Redis data across normal container restarts.

BullMQ uses Redis-backed job storage. Full recovery of jobs in every server-crash or partial-failure scenario requires additional verification and recovery handling.

### Rate Limiting

Redis is used to track sender activity and enforce a minimum delay between email sends.

The implementation uses an atomic Redis operation to coordinate rate-limit checks.

### Concurrency

Worker concurrency is configurable through the `WORKER_CONCURRENCY` environment variable.

The current default is five concurrent jobs.

### Slack Integration

Slack OAuth is implemented to connect a workspace. Installation details are stored in PostgreSQL, and Slack notifications can be sent through the connected bot.

## 8. Features Implemented

### Backend

- Express REST API
- PostgreSQL email storage
- BullMQ background job processing
- Delayed email scheduling
- Ethereal SMTP integration
- Redis-based minimum-delay rate limiting
- Configurable worker concurrency
- Slack OAuth integration
- Slack notification service
- Elasticsearch container and initial indexing/search integration

### Pending or incomplete

- Complete Elasticsearch indexing and search verification
- Reliable recovery of jobs across all restart scenarios
- Strong end-to-end duplicate-send protection
- Complete hourly-limit and notification testing
- BullMQ live dashboard
- Frontend implementation
- Google OAuth
- Scheduled and sent email dashboard

## 9. Assumptions and Trade-offs

- Ethereal Email is used for demonstration instead of a production SMTP provider.
- PostgreSQL and Redis are run locally through Docker.
- Slack integration uses a locally configured OAuth application.
- The application is currently focused on backend functionality.
- Some advanced reliability and frontend requirements remain incomplete and require further development.

## 10. Future Improvements

- Complete frontend dashboard using React or Next.js.
- Google OAuth authentication.
- Bull Board queue monitoring.
- Stronger transactional scheduling and restart recovery.
- Improved duplicate-send protection.
- Complete Elasticsearch integration.
- End-to-end testing and deployment.

## 11. Author

ReachInbox Email Scheduler – Project Submission.
