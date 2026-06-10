# Chatlosss

Chatlosss is a full-stack real-time chat application inspired by WhatsApp. It supports Google authentication, one-to-one messaging, image messages, voice messages, message search, voice/video calling, and a voice-note search feature powered by audio transcription.

## Features

* Google authentication with Firebase
* User onboarding with display name, about/status, and avatar support
* Real-time one-to-one messaging with Socket.IO
* Text messages
* Image messages
* Voice/audio messages with waveform playback
* Message delivery/read status
* Contact list with latest message previews
* Search inside conversations
* Voice-note keyword search using stored transcripts
* Demo transcription fallback for local testing without an OpenAI API key
* Message deletion
* Voice and video call support using Zego token generation
* PostgreSQL database with Prisma ORM
* Environment-based configuration for local development

## Tech Stack

### Frontend

* Next.js 13
* React
* Tailwind CSS
* Firebase Authentication
* Socket.IO Client
* WaveSurfer.js
* Axios
* Zego Express Engine

### Backend

* Node.js
* Express
* Socket.IO
* Prisma
* PostgreSQL
* Multer
* OpenAI SDK for optional audio transcription

## Project Structure

```text
chatlosss/
├── client/                 # Next.js frontend
│   ├── src/
│   │   ├── components/     # Chat, call, common UI components
│   │   ├── context/        # Global state reducer/context
│   │   ├── pages/          # Next.js pages
│   │   └── utils/          # API routes and helpers
│   └── public/
│
├── server/                 # Express backend
│   ├── controllers/        # Auth and message controllers
│   ├── prisma/             # Prisma schema and migrations
│   ├── routes/             # Express routes
│   ├── uploads/            # Local uploaded audio/images
│   └── utils/              # Prisma, token, transcription utilities
│
└── README.md
```

## Requirements

* Node.js
* npm
* PostgreSQL
* Firebase project for Google authentication
* Optional: OpenAI API key for real voice-note transcription
* Optional: Zego credentials for voice/video calling



## Installation

Clone the repository and install dependencies for both apps:

```bash
cd chatlosss

cd server
npm install

cd ../client
npm install
```

## Database Setup

Create a PostgreSQL database, then run Prisma migrations:

```bash
cd server
npm run prisma:migrate
npm run prisma:generate
```

You can inspect the database with:

```bash
npm run prisma:studio
```

## Running Locally

Start the backend:

```bash
cd server
npm run dev
```

The backend runs on:

```text
http://localhost:3005
```

Start the frontend:

```bash
cd client
npm run dev
```

The frontend runs on:

```text
http://localhost:3000
```

## Voice-Note Search

Chatlosss stores a `transcript` field for audio messages. When an audio message is sent, the backend attempts to transcribe it. The transcript is then searchable through the conversation search panel.

Example:

```text
Voice note says: "Did you book the hotel?"
Search keyword: "hotel"
Result: the matching voice note appears in search results
```

For local demo/testing, if no `OPENAI_API_KEY` is configured, the app uses a demo transcript fallback so the search feature can still be demonstrated without paid API usage.

## API Overview

### Auth Routes

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

## Current Limitations

* Voice/video calling requires valid Zego credentials.
* Real audio transcription requires an OpenAI API key.
* The demo transcription fallback is only for local testing and should be replaced by real transcription in production.

## Future Improvements

* Better mobile responsiveness
* Group chat support
* Message reactions
* Message editing
* Production deployment configuration
* Automated tests



