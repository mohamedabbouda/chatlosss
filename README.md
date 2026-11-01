# Chatlosss

**A full-stack, real-time chat application with voice transcription and intelligent message search.**

Chatlosss is a real-time messaging application built with Next.js, React, Node.js, Express, Socket.IO, and PostgreSQL.

It supports one-to-one messaging, image and audio sharing, Google authentication, message delivery states, and voice/video calling.

One of its key features is **searchable voice messages**. Audio notes can be transcribed asynchronously and their transcripts stored in PostgreSQL, allowing users to search spoken content alongside regular text messages.

Chatlosss also implements **typo-tolerant search** using PostgreSQL's `pg_trgm` extension and GIN indexes, combining substring matching with trigram similarity and relevance-based ranking.

## Features

### Real-Time Messaging

- One-to-one messaging using Socket.IO
- Real-time message delivery
- Text, image, and voice messages
- Message delivery and read status
- Online user presence
- Typing indicators
- Message deletion
- Contact list with latest-message previews

### Authentication and User Profiles

- Google authentication using Firebase
- User onboarding
- Profile name, avatar, and status/about information

### Audio Messages and Transcription

- Voice-note recording and playback
- Audio waveform visualization using WaveSurfer.js
- Audio file uploads using Multer
- Asynchronous voice-note transcription
- PostgreSQL storage of transcription results
- Transcription status tracking and retry-related database fields
- Optional OpenAI-powered transcription
- Demo transcription fallback for local development

### Intelligent Message Search

- Search within individual conversations
- Search text messages and audio transcripts
- Case-insensitive substring matching
- Typo-tolerant fuzzy matching
- PostgreSQL GIN trigram indexes
- Relevance-based result ordering
- Exact substring matches ranked before fuzzy matches
- Text-only, audio-only, and combined search filters
- Conversation-scoped search results

### Voice and Video Calls

- Voice and video calling interfaces
- Zego-based calling integration
- Token generation for calling functionality

Voice and video calling require valid Zego configuration.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js 13, React, Tailwind CSS |
| Backend | Node.js, Express |
| Real-time communication | Socket.IO |
| Database | PostgreSQL |
| ORM | Prisma |
| Authentication | Firebase Authentication |
| Search | PostgreSQL `pg_trgm`, GIN indexes |
| Audio transcription | OpenAI SDK |
| File uploads | Multer |
| Audio playback | WaveSurfer.js |
| HTTP requests | Axios |
| Voice/video calls | Zego Express Engine |
| Testing | Node.js built-in test runner, Prisma, PostgreSQL |

---

## Architecture Overview

Chatlosss uses a client-server architecture with PostgreSQL as its persistent data store.

```text
                    Next.js / React
                          |
              +-----------+-----------+
              |                       |
         HTTP / REST                Socket.IO
              |                       |
              v                       v
         Express API            Real-time Server
              |                       |
              +-----------+-----------+
                          |
                    Service Layer
                          |
                     Prisma ORM
                          |
                      PostgreSQL
```

The frontend communicates with the backend through REST endpoints for operations such as retrieving messages and searching conversations.

Socket.IO handles real-time events, including message delivery, online presence, and typing indicators.

Prisma manages access to PostgreSQL.

Audio transcription is handled separately from the initial audio-message creation request.

---

## Project Structure

The backend uses a modular structure under `server/src/`.

```text
chatlosss/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── utils/
│   ├── public/
│   └── package.json
│
├── server/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── src/
│   │   ├── modules/
│   │   │   └── messages/
│   │   ├── services/
│   │   ├── workers/
│   │   └── utils/
│   ├── tests/
│   │   ├── search.test.js
│   │   ├── search.integration.test.js
│   │   └── test-database.js
│   ├── uploads/
│   ├── index.js
│   └── package.json
│
└── README.md
```

The actual directory layout may evolve as the application is further refactored.

---

## Getting Started

### Prerequisites

Before running Chatlosss locally, ensure you have:

- Node.js and npm
- PostgreSQL
- A Firebase project configured for Google authentication

Optional integrations:

- OpenAI API key for real audio transcription
- Zego credentials for voice/video calling

### 1. Clone the Repository

```bash
git clone https://github.com/mohamedabbouda/chatlosss.git
cd chatlosss
```

### 2. Install Backend Dependencies

```bash
cd server
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../client
npm install
```

### 4. Configure Environment Variables

Create local environment files using the example configuration files provided in the repository.

For the backend, configure the PostgreSQL connection:

```env
DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/chatlosss?schema=public"
PORT=3005
CLIENT_URL="http://localhost:3000"
```

If using OpenAI transcription, also configure:

```env
OPENAI_API_KEY="your-api-key"
```

The frontend needs to know the backend URL:

```env
NEXT_PUBLIC_SERVER_URL="http://localhost:3005"
```

Configure the remaining Firebase and Zego settings according to the application's environment configuration.

**Security:** Never commit real API keys, access tokens, passwords, or local `.env` files.

---

## Database Setup

Chatlosss uses PostgreSQL with Prisma ORM.

### 1. Create a Database

For example:

```bash
createdb chatlosss
```

Alternatively, create the database through your preferred PostgreSQL administration tool.

### 2. Configure Prisma

Set the `DATABASE_URL` environment variable to point to the database.

Generate the Prisma Client:

```bash
cd server
npm run prisma:generate
```

### 3. Apply Database Migrations

The project includes Prisma migrations and a custom SQL migration for the PostgreSQL trigram indexes.

For an existing database with a previously applied migration history:

```bash
npx prisma migrate status
npx prisma migrate deploy
```

**Migration status:** The existing development database has successfully applied the trigram migration. However, the repository's transcription migration history contains a known duplicate-column issue that must be corrected before a completely fresh migration replay can be considered reliable.

Do not reset a database containing important messages merely to work around this issue.

### 4. Inspect the Database

Launch Prisma Studio:

```bash
npm run prisma:studio
```

Prisma Studio provides a graphical interface for inspecting users, messages, transcripts, and other stored fields.

---

## Running Locally

Start the backend from the `server` directory:

```bash
npm run dev
```

The backend uses:

`http://localhost:3005`

In a separate terminal, start the frontend from the `client` directory:

```bash
npm run dev
```

The frontend is available at:

`http://localhost:3000`

Open the frontend URL in your browser and sign in using the configured Firebase authentication provider.

---

## Asynchronous Voice-Note Transcription

Voice notes are handled separately from ordinary text messages.

Instead of waiting for audio transcription to complete during the upload request, Chatlosss first stores the audio message in PostgreSQL.

The transcription process is then handled asynchronously.

### Processing Flow

```text
User records a voice note
            |
            v
Frontend uploads audio file
            |
            v
Express stores uploaded audio
            |
            v
Prisma creates audio-message record
            |
            v
transcriptionStatus = "pending"
            |
            v
Server responds to the client
            |
            v
Background transcription worker
            |
            v
Audio transcription
            |
            v
Transcript stored in PostgreSQL
            |
            v
Voice note becomes searchable
```

### Transcription Metadata

The `Messages` model includes fields for managing transcription processing.

| Field | Purpose |
|---|---|
| `transcript` | Stores recognized speech as searchable text |
| `transcriptionStatus` | Tracks transcription processing state |
| `transcriptionAttempts` | Records transcription attempts |
| `transcriptionError` | Stores error information |
| `transcriptionClaimToken` | Supports tracking a worker's processing claim |
| `transcriptionLeaseUntil` | Stores a processing lease deadline |
| `transcriptionNextRetryAt` | Stores a scheduled retry time |

These fields support asynchronous processing and recovery-related workflows.

### Local Demo Transcription

The project also includes a demo transcription fallback intended for local development without an OpenAI API key.

This allows transcription-related search behavior to be demonstrated without requiring paid transcription requests.

Demo transcripts should not be treated as actual speech recognition output.

---

## Intelligent Message Search

Chatlosss supports searching both written messages and recognized speech from voice notes.

The backend uses PostgreSQL's `pg_trgm` extension to provide fuzzy matching and efficient indexed search when the query planner determines that an index scan is beneficial.

### How Search Works

When a user enters a query, the frontend sends a request to the conversation search API.

The backend:

1. Restricts the search to the selected conversation.
2. Applies the selected message-type filter.
3. Searches the `message` field for text messages.
4. Searches the `transcript` field for audio messages.
5. Combines substring matching with trigram-based fuzzy matching.
6. Ranks exact substring matches ahead of fuzzy matches.
7. Uses similarity scores and timestamps to order results.

### Example

Suppose a user records a voice note saying:

```text
Hello, I have a lot of stuff to do today.
```

The stored transcript can be searched using:

```text
hello
```

The current implementation can also find this voice note when searching for:

```text
helo
```

This works because the fuzzy-search logic compares overlapping character trigrams rather than requiring an exact spelling match.

### PostgreSQL Trigram Indexes

The database uses the `pg_trgm` extension:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

Two GIN indexes support searching text messages and audio transcripts:

```sql
CREATE INDEX "Messages_message_trgm_idx"
ON "Messages"
USING GIN ("message" gin_trgm_ops);

CREATE INDEX "Messages_transcript_trgm_idx"
ON "Messages"
USING GIN ("transcript" gin_trgm_ops);
```

These indexes are defined in the custom migration:

```text
server/prisma/migrations/
  20261101010000_add_message_trigram_indexes/
    migration.sql
```

PostgreSQL maintains the indexes automatically as indexed column values are inserted, updated, or deleted.

### Fuzzy Matching

The implementation combines PostgreSQL's case-insensitive `ILIKE` operator with the trigram word-similarity operator `<%`.

Conceptually:

```sql
SELECT *
FROM "Messages"
WHERE
    transcript ILIKE '%helo%'
    OR 'helo' <% transcript;
```

The actual application query also includes conversation constraints, message-type filtering, parameterized values, and relevance ordering.

The fuzzy-matching threshold is currently set to `0.5` for each search transaction.

### Relevance Ranking

Results are ordered according to:

1. Exact substring matches
2. Trigram similarity score
3. Message creation time

This prioritizes more relevant search results while still allowing typo-tolerant matches.

### Search Limitations

Trigram similarity is based on character patterns, not semantic meaning.

As a result:

- Some spelling mistakes may not meet the current threshold.
- Short queries can be difficult to match reliably.
- Lowering the threshold can increase false positives.
- Arabic, German, and English text are not automatically translated into a shared language.
- The presence of GIN indexes does not guarantee PostgreSQL will use them for every search.

PostgreSQL's query planner chooses between index scans and sequential scans based on estimated execution cost.

---

## API Overview

### Authentication Routes

```text
POST /api/auth/check-user
POST /api/auth/onBoardUser
GET  /api/auth/get-contacts
GET  /api/auth/generate-token/:userId
```

### Message Routes

```text
POST   /api/messages/add-message
POST   /api/messages/add-image-message
POST   /api/messages/add-audio-message
GET    /api/messages/get-messages/:from/:to
GET    /api/messages/get-initial-contacts/:from
GET    /api/messages/search
DELETE /api/messages/delete-message/:messageId
```

### Conversation Search Example

```http
GET /api/messages/search?userId=1&contactId=3&query=helo&type=audio
```

Supported search filters:

- `all`
- `text`
- `audio`

The API returns matching message records.

The search endpoint currently relies on user IDs supplied to the backend. Server-side identity verification and authorization require further hardening before production deployment.

---

## Testing

Chatlosss uses Node.js's built-in test runner with Prisma and a separate PostgreSQL test database.

### Test Database

Integration tests run against:

```text
chatlosss_test
```

This is separate from the local development database:

```text
chatlosss
```

The integration tests verify the database name before creating test records.

### Running Integration Tests

From the `server` directory:

```bash
npm run test:integration
```

The configured script targets the local `chatlosss_test` database.

### Current Test Coverage

The project currently includes four passing integration tests:

| Test | Description |
|---|---|
| Fuzzy search and conversation isolation | Verifies that `helo` finds `Hello` without returning messages from another conversation |
| Message-type filters | Verifies `text`, `audio`, and `all` filters |
| Search relevance ranking | Verifies that exact substring matches rank ahead of fuzzy matches |
| Special-character search | Verifies that text containing `%` and `_` can be found |

**Latest verified result:**

```text
tests 4
pass  4
fail  0
```

The tests create temporary users and messages, invoke the actual search service, verify the results, and clean up test records afterward.

Additional negative tests, API-level authorization tests, and frontend tests are planned.

---

## Current Limitations

Chatlosss is an actively developed portfolio project and is not yet production-hardened.

Known limitations include:

- Server-side Firebase token verification and authorization need further hardening.
- Fuzzy-search thresholds require more evaluation, particularly for short queries and different languages.
- Database performance testing on larger datasets is still pending.
- The Prisma migration history needs cleanup to support reliable fresh deployments.
- The frontend's image-search filter requires alignment with the backend's supported search filters.
- Voice and video calling require valid Zego credentials.
- Production deployment, monitoring, and operational safeguards are not yet fully configured.
- Additional automated testing is required.

---

## Future Improvements

### Search

- Better typo correction for short queries
- Query normalization for multilingual search
- Search-result highlighting improvements
- Pagination and limits for large search results
- Benchmarking on larger datasets
- Search relevance evaluation

### Backend

- Stronger authentication and conversation authorization
- Reliable fresh-database migration setup
- Additional input validation
- More automated integration tests
- Performance monitoring and observability
- Production deployment configuration

### Frontend

- Improved mobile responsiveness
- Better loading and empty states
- Improved error handling
- Group chat support
- Message editing
- Additional accessibility improvements

---

## Development References

The following official documentation is useful for understanding the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [Express Documentation](https://expressjs.com/)
- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PostgreSQL pg_trgm Documentation](https://www.postgresql.org/docs/14/pgtrgm.html)
- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Node.js Test Runner](https://nodejs.org/api/test.html)

---

## Project Status

**Active development**

The real-time messaging application, asynchronous transcription workflow, conversation search, PostgreSQL trigram indexing, and initial search integration tests have been implemented and exercised locally.

The current development priorities are improving security, deployment reliability, search quality, and automated test coverage.

---

## Author

**Mohamed Abouda**

[GitHub](https://github.com/mohamedabbouda)
