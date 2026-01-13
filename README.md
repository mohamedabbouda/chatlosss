
# Full Stack Whatsapp using Next.js, Socket.io, Node.js


This is the complete Source Code for the Whatsapp Clone built using Next.js, Socket.io, Node.js, Firebase, Tailwind CSS, Prisma, PostgresSQL, and many more awesome technologies with Voice Call and Video Call Functionality.




## Installation

Setup Client

```bash
  cd client
  yarn
```

Setup Server

```bash
  cd server
  yarn
  npx prisma init
  npx prisma generate
```

Now add environment variables in the server's .env file

```bash
    PORT=3005
    DATABASE_URL=<postgres databse url>
    ZEGO_APP_ID=<ZEGO_APP_ID>
    ZEGO_APP_SECRET="<ZEGO_APP_SECRET>"
```

In the `DATABASE_URL` you can add any databse url.

Now for the Video Call and Voice Call I have used Zegocloud's Voice Call and Video Call Services.

Head over to https://www.zegocloud.com and create a new project and get the App Id and App Secret.

Now after this add the environment variables in the `next.config.js` file.

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_ZEGO_APP_ID: <ZEGOCLOUD_APP_ID>,
    NEXT_PUBLIC_ZEGO_SERVER_ID: "<ZEGOCLOUD_SERVER_ID>",
  },
  reactStrictMode: false,
  images: {
    domains: ["localhost"],
  },
};

module.exports = nextConfig;

```

