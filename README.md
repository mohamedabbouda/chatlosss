# Chatlosss — Full-Stack Real-Time Chat App

Chatlosss is a full-stack WhatsApp-style chat application built with Next.js, Express, Socket.IO, Prisma, PostgreSQL, Firebase Authentication, and Tailwind CSS.

The app supports real-time messaging, Google login, contact discovery, image messages, audio messages, message persistence, and experimental voice/video call support using ZEGOCLOUD.

## Features

- Google authentication with Firebase Auth
- Real-time one-to-one messaging with Socket.IO
- PostgreSQL database integration with Prisma ORM
- Persistent chat history
- Contact list with unread message counts
- Image message upload
- Audio message recording and playback
- Online user tracking
- Voice and video call flow with ZEGOCLOUD token generation
- Separate client/server environment configuration

## Tech Stack

### Frontend

- Next.js 13
- React 18
- Tailwind CSS
- Socket.IO Client
- Firebase Auth
- Axios
- ZEGOCLOUD WebRTC SDK
- Wavesurfer.js

### Backend

- Node.js
- Express
- Socket.IO
- Prisma
- PostgreSQL
- Multer
- ZEGOCLOUD token generation

## Project Structure

```text
chatlosss/
├── client/                 # Next.js frontend
├── server/                 # Express + Socket.IO backend
├── docs/                   # Cleanup and project notes
├── README.md
└── package-lock.json
````

## Prerequisites

Install these before running the project:

* Node.js 20+
* npm 10+
* PostgreSQL 14+
* A Firebase project with Google authentication enabled
* Optional: ZEGOCLOUD app credentials for voice/video calls

## Environment Variables

Create environment files from the examples.

### Server

```bash
cp server/.env.example server/.env
```

Example:

```env
PORT=3005
CLIENT_URL=http://localhost:3000
DATABASE_URL="postgresql://postgres:password@localhost:5432/chatlosss?schema=public"

ZEGO_APP_ID=
ZEGO_APP_SECRET=
```

### Client

```bash
cp client/.env.example client/.env.local
```

Example:

```env
NEXT_PUBLIC_SERVER_URL=http://localhost:3005
NEXT_PUBLIC_ZEGO_APP_ID=
NEXT_PUBLIC_ZEGO_SERVER_ID=
```

## Database Setup

Create a local PostgreSQL database:

```bash
createdb chatlosss
```

Then run Prisma commands from the server folder:

```bash
cd server
npm install
npm run prisma:generate
npm run prisma:migrate
```

Optional: open Prisma Studio:

```bash
npm run prisma:studio
```

## Installation

Install server dependencies:

```bash
cd server
npm install
```

Install client dependencies:

```bash
cd ../client
npm install
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

Start the frontend in a second terminal:

```bash
cd client
npm run dev
```

The frontend runs on:

```text
http://localhost:3000
```

## Useful Scripts

### Server

```bash
npm run dev              # Start backend with nodemon
npm start                # Start backend with node
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open Prisma Studio
```

### Client

```bash
npm run dev      # Start Next.js development server
npm run build    # Build production frontend
npm start        # Start production frontend
npm run lint     # Run Next.js lint
```

## Current Status

Completed cleanup work includes:

* Local PostgreSQL and Prisma migration setup
* Environment variable examples for client and server
* Socket.IO server configuration cleanup
* Hardcoded API host removal
* Hardcoded ZEGOCLOUD config removal from Next config
* Upload folder auto-creation on backend startup
* Server dependency cleanup
* Server audit reduced to 0 vulnerabilities
* Client dependency updates for Next.js and Firebase
* Message controller ID validation
* Core flow testing:

  * Google login
  * contact loading
  * text messages
  * image messages
  * audio messages
  * message persistence after refresh

## Known Limitations

* Some client audit issues remain because fixing them requires major upgrades to Next.js and/or the ZEGOCLOUD SDK.
* Upload validation is intentionally deferred because strict MIME validation blocked browser-recorded audio in testing.
* Voice/video call support requires valid ZEGOCLOUD credentials.
* Backend routes currently rely on client-provided user IDs; stronger token-based authorization is planned as future work.

See `docs/cleanup-notes.md` for detailed cleanup notes and deferred tasks.

## Author

Mohamed Abbouda
EOF

```
```
