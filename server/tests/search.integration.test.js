
import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";

test("fuzzy search finds audio transcripts only in the selected conversation", async () => {
  const urlString = process.env.DATABASE_URL;

  if (!urlString) {
    throw new Error("DATABASE_URL must be explicitly provided.");
  }

  const url = new URL(urlString);

  if (decodeURIComponent(url.pathname.slice(1)) !== "chatlosss_test") {
    throw new Error("Refusing to run against a non-test database.");
  }

  const prisma = new PrismaClient();

  const userIds = [];
  const messageIds = [];

  try {
    // Verify the database on the actual connection.
    const [db] = await prisma.$queryRaw`
      SELECT current_database() AS name
    `;

    assert.equal(db.name, "chatlosss_test");

    // Import only after verifying the test database.
    const { searchConversationMessages } = await import(
      "../src/modules/messages/message.service.js"
    );

    const suffix = randomUUID();

    const userA = await prisma.user.create({
      data: {
        name: "Test User A",
        email: `test-a-${suffix}@example.com`,
      },
    });
    userIds.push(userA.id);

    const userB = await prisma.user.create({
      data: {
        name: "Test User B",
        email: `test-b-${suffix}@example.com`,
      },
    });
    userIds.push(userB.id);

    const userC = await prisma.user.create({
      data: {
        name: "Test User C",
        email: `test-c-${suffix}@example.com`,
      },
    });
    userIds.push(userC.id);

    // A voice note in the selected conversation: A <-> B
    const expectedMessage = await prisma.messages.create({
      data: {
        senderId: userA.id,
        recieverId: userB.id,
        type: "audio",
        message: "test-voice-a.wav",
        transcript: "Hello, I have a lot of stuff to do today.",
      },
    });
    messageIds.push(expectedMessage.id);

    // Similar voice note in a different conversation: A <-> C
    const unrelatedMessage = await prisma.messages.create({
      data: {
        senderId: userA.id,
        recieverId: userC.id,
        type: "audio",
        message: "test-voice-c.wav",
        transcript: "Hello from another conversation.",
      },
    });
    messageIds.push(unrelatedMessage.id);

    // Call the actual search service.
    const results = await searchConversationMessages({
      userId: userA.id,
      contactId: userB.id,
      query: "helo",
      type: "audio",
    });

    // The misspelled query should find "Hello".
    assert.ok(
      results.some((message) => message.id === expectedMessage.id),
      "Expected the fuzzy search to find the voice note"
    );

    // Results must not contain messages from another conversation.
    assert.ok(
      !results.some((message) => message.id === unrelatedMessage.id),
      "Search leaked a message from another conversation"
    );

    assert.equal(results.length, 1);
  } finally {
    // Only delete records created by this test.
    if (messageIds.length > 0) {
      await prisma.messages.deleteMany({
        where: { id: { in: messageIds } },
      });
    }

    if (userIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: userIds } },
      });
    }

    await prisma.$disconnect();
  }
});




test("search respects text, audio, and all filters", async () => {
  const urlString = process.env.DATABASE_URL;

  if (!urlString) {
    throw new Error("DATABASE_URL must be explicitly provided.");
  }

  const url = new URL(urlString);

  if (decodeURIComponent(url.pathname.slice(1)) !== "chatlosss_test") {
    throw new Error("Refusing to run against a non-test database.");
  }

  const prisma = new PrismaClient();
  const userIds = [];
  const messageIds = [];

  try {
    const [db] = await prisma.$queryRaw`
      SELECT current_database() AS name
    `;

    assert.equal(db.name, "chatlosss_test");

    const { searchConversationMessages } = await import(
      "../src/modules/messages/message.service.js"
    );

    const suffix = randomUUID();

    const userA = await prisma.user.create({
      data: {
        name: "Filter Test A",
        email: `filter-a-${suffix}@example.com`,
      },
    });
    userIds.push(userA.id);

    const userB = await prisma.user.create({
      data: {
        name: "Filter Test B",
        email: `filter-b-${suffix}@example.com`,
      },
    });
    userIds.push(userB.id);

    const textMessage = await prisma.messages.create({
      data: {
        senderId: userA.id,
        recieverId: userB.id,
        type: "text",
        message: "Hello from a text message",
      },
    });
    messageIds.push(textMessage.id);

    const audioMessage = await prisma.messages.create({
      data: {
        senderId: userB.id,
        recieverId: userA.id,
        type: "audio",
        message: "test-voice.wav",
        transcript: "Hello from a voice note",
      },
    });
    messageIds.push(audioMessage.id);

    const search = (type) =>
      searchConversationMessages({
        userId: userA.id,
        contactId: userB.id,
        query: "helo",
        type,
      });

    const textResults = await search("text");
    assert.deepEqual(
      textResults.map((message) => message.id),
      [textMessage.id]
    );

    const audioResults = await search("audio");
    assert.deepEqual(
      audioResults.map((message) => message.id),
      [audioMessage.id]
    );

    const allResults = await search("all");
    assert.deepEqual(
      new Set(allResults.map((message) => message.id)),
      new Set([textMessage.id, audioMessage.id])
    );
  } finally {
    if (messageIds.length) {
      await prisma.messages.deleteMany({
        where: { id: { in: messageIds } },
      });
    }

    if (userIds.length) {
      await prisma.user.deleteMany({
        where: { id: { in: userIds } },
      });
    }

    await prisma.$disconnect();
  }
});



test("exact substring matches rank before fuzzy matches", async () => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL must be explicitly provided.");
  }

  const url = new URL(databaseUrl);

  if (decodeURIComponent(url.pathname.slice(1)) !== "chatlosss_test") {
    throw new Error("Refusing to run against a non-test database.");
  }

  const prisma = new PrismaClient();
  const userIds = [];
  const messageIds = [];

  try {
    const [db] = await prisma.$queryRaw`
      SELECT current_database() AS name
    `;
    assert.equal(db.name, "chatlosss_test");

    const { searchConversationMessages } = await import(
      "../src/modules/messages/message.service.js"
    );

    const suffix = randomUUID();

    const userA = await prisma.user.create({
      data: {
        name: "Ranking Test A",
        email: `ranking-a-${suffix}@example.com`,
      },
    });
    userIds.push(userA.id);

    const userB = await prisma.user.create({
      data: {
        name: "Ranking Test B",
        email: `ranking-b-${suffix}@example.com`,
      },
    });
    userIds.push(userB.id);

    // Create the fuzzy match first.
    const fuzzyMessage = await prisma.messages.create({
      data: {
        senderId: userA.id,
        recieverId: userB.id,
        type: "text",
        message: "Hello",
      },
    });
    messageIds.push(fuzzyMessage.id);

    // This contains the search query literally.
    const exactMessage = await prisma.messages.create({
      data: {
        senderId: userA.id,
        recieverId: userB.id,
        type: "text",
        message: "Please check the helo document.",
      },
    });
    messageIds.push(exactMessage.id);

    const results = await searchConversationMessages({
      userId: userA.id,
      contactId: userB.id,
      query: "helo",
      type: "text",
    });

    assert.equal(results.length, 2);

    assert.equal(
      results[0].id,
      exactMessage.id,
      "Exact substring match should rank first"
    );

    assert.equal(
      results[1].id,
      fuzzyMessage.id,
      "Fuzzy match should rank after exact match"
    );
  } finally {
    if (messageIds.length) {
      await prisma.messages.deleteMany({
        where: { id: { in: messageIds } },
      });
    }

    if (userIds.length) {
      await prisma.user.deleteMany({
        where: { id: { in: userIds } },
      });
    }

    await prisma.$disconnect();
  }
});


test("search treats LIKE wildcard characters literally", async () => {
  const urlString = process.env.DATABASE_URL;

  if (!urlString) {
    throw new Error("DATABASE_URL must be explicitly provided.");
  }

  const url = new URL(urlString);

  if (decodeURIComponent(url.pathname.slice(1)) !== "chatlosss_test") {
    throw new Error("Refusing to run against a non-test database.");
  }

  const prisma = new PrismaClient();
  const userIds = [];
  const messageIds = [];

  try {
    const [db] = await prisma.$queryRaw`
      SELECT current_database() AS name
    `;
    assert.equal(db.name, "chatlosss_test");

    const { searchConversationMessages } = await import(
      "../src/modules/messages/message.service.js"
    );

    const suffix = randomUUID();

    const userA = await prisma.user.create({
      data: {
        name: "Wildcard Test A",
        email: `wildcard-a-${suffix}@example.com`,
      },
    });
    userIds.push(userA.id);

    const userB = await prisma.user.create({
      data: {
        name: "Wildcard Test B",
        email: `wildcard-b-${suffix}@example.com`,
      },
    });
    userIds.push(userB.id);

    const percentMessage = await prisma.messages.create({
      data: {
        senderId: userA.id,
        recieverId: userB.id,
        type: "text",
        message: "Progress is 100% complete.",
      },
    });
    messageIds.push(percentMessage.id);

    const underscoreMessage = await prisma.messages.create({
      data: {
        senderId: userA.id,
        recieverId: userB.id,
        type: "text",
        message: "The file is named report_final.",
      },
    });
    messageIds.push(underscoreMessage.id);

    const percentResults = await searchConversationMessages({
      userId: userA.id,
      contactId: userB.id,
      query: "100%",
      type: "text",
    });

    assert.ok(
      percentResults.some((message) => message.id === percentMessage.id)
    );

    const underscoreResults = await searchConversationMessages({
      userId: userA.id,
      contactId: userB.id,
      query: "report_final",
      type: "text",
    });

    assert.ok(
      underscoreResults.some((message) => message.id === underscoreMessage.id)
    );
  } finally {
    if (messageIds.length) {
      await prisma.messages.deleteMany({
        where: { id: { in: messageIds } },
      });
    }

    if (userIds.length) {
      await prisma.user.deleteMany({
        where: { id: { in: userIds } },
      });
    }

    await prisma.$disconnect();
  }
});
