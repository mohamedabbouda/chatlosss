import getPrismaClient from "../../services/prisma.service.js";
import { transcribeAudioFile } from "../../services/transcription.service.js";
import { ApiError } from "../../utils/api-error.js";
import { moveUploadedFile } from "../../utils/file-storage.js";

const getOnlineUserSocket = (userId) => {
  return global.onlineUsers?.get(userId.toString());
};

export const getConversationMessages = async ({ from, to }) => {
  const prisma = getPrismaClient();

  const messages = await prisma.messages.findMany({
    where: {
      OR: [
        { senderId: from, recieverId: to },
        { senderId: to, recieverId: from },
      ],
    },
    orderBy: {
      id: "asc",
    },
  });

  const unreadMessageIds = messages
    .filter((message) => message.messageStatus !== "read" && message.senderId === to)
    .map((message) => message.id);

  if (unreadMessageIds.length) {
    await prisma.messages.updateMany({
      where: {
        id: {
          in: unreadMessageIds,
        },
      },
      data: {
        messageStatus: "read",
      },
    });
  }

  return messages.map((message) =>
    unreadMessageIds.includes(message.id)
      ? { ...message, messageStatus: "read" }
      : message
  );
};

export const createTextMessage = async ({ from, to, message }) => {
  const prisma = getPrismaClient();
  const receiverSocket = getOnlineUserSocket(to);

  return prisma.messages.create({
    data: {
      message,
      transcript: "",
      sender: {
        connect: {
          id: from,
        },
      },
      reciever: {
        connect: {
          id: to,
        },
      },
      messageStatus: receiverSocket ? "delivered" : "sent",
    },
    include: {
      sender: true,
      reciever: true,
    },
  });
};

export const getInitialContacts = async ({ userId }) => {
  const prisma = getPrismaClient();

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      sentMessages: {
        include: {
          reciever: true,
          sender: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      recievedMessages: {
        include: {
          reciever: true,
          sender: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  const messages = [...user.sentMessages, ...user.recievedMessages].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  const users = new Map();
  const messageStatusChange = [];

  messages.forEach((msg) => {
    const isSender = msg.senderId === userId;
    const calculatedId = isSender ? msg.recieverId : msg.senderId;

    if (msg.messageStatus === "sent") {
      messageStatusChange.push(msg.id);
    }

    if (!users.get(calculatedId)) {
      const {
        id,
        type,
        message,
        transcript,
        messageStatus,
        createdAt,
        senderId,
        recieverId,
      } = msg;

      let contact = {
        messageId: id,
        type,
        message,
        transcript,
        messageStatus,
        createdAt,
        senderId,
        recieverId,
      };

      if (isSender) {
        contact = {
          ...contact,
          ...msg.reciever,
          totalUnreadMessages: 0,
        };
      } else {
        contact = {
          ...contact,
          ...msg.sender,
          totalUnreadMessages: messageStatus !== "read" ? 1 : 0,
        };
      }

      users.set(calculatedId, contact);
    } else if (msg.messageStatus !== "read" && !isSender) {
      const contact = users.get(calculatedId);
      users.set(calculatedId, {
        ...contact,
        totalUnreadMessages: contact.totalUnreadMessages + 1,
      });
    }
  });

  if (messageStatusChange.length) {
    await prisma.messages.updateMany({
      where: {
        id: {
          in: messageStatusChange,
        },
      },
      data: {
        messageStatus: "delivered",
      },
    });
  }

  return {
    users: Array.from(users.values()),
    onlineUsers: Array.from(global.onlineUsers?.keys() || []),
  };
};

export const createAudioMessage = async ({ file, from, to }) => {
  if (!file) {
    throw new ApiError(400, "Audio is required.");
  }

  const fileName = moveUploadedFile(file, "uploads/recordings");

  const prisma = getPrismaClient();
  const transcript = await transcribeAudioFile(fileName);

  return prisma.messages.create({
    data: {
      message: fileName,
      transcript,
      sender: {
        connect: {
          id: from,
        },
      },
      reciever: {
        connect: {
          id: to,
        },
      },
      type: "audio",
    },
  });
};

export const createImageMessage = async ({ file, from, to }) => {
  if (!file) {
    throw new ApiError(400, "Image is required.");
  }

  const fileName = moveUploadedFile(file, "uploads/images");

  const prisma = getPrismaClient();

  return prisma.messages.create({
    data: {
      message: fileName,
      transcript: "",
      sender: {
        connect: {
          id: from,
        },
      },
      reciever: {
        connect: {
          id: to,
        },
      },
      type: "image",
    },
  });
};

export const removeMessage = async ({ messageId, userId }) => {
  const prisma = getPrismaClient();

  const message = await prisma.messages.findUnique({
    where: {
      id: messageId,
    },
  });

  if (!message) {
    throw new ApiError(404, "Message not found.");
  }

  if (message.senderId !== userId && message.recieverId !== userId) {
    throw new ApiError(403, "You cannot delete this message.");
  }

  await prisma.messages.delete({
    where: {
      id: messageId,
    },
  });

  return messageId;
};

export const searchConversationMessages = async ({
  userId,
  contactId,
  query,
  type,
}) => {
  const prisma = getPrismaClient();

  const searchTerm = query.trim();
  const searchType = type || "all";

  // Escape LIKE special characters so the user's input is literal.
  const escapedTerm = searchTerm.replace(/[\\%_]/g, "\\$&");
  const pattern = `%${escapedTerm}%`;

  return prisma.$transaction(async (tx) => {
    // The threshold applies to this transaction only.
    await tx.$queryRaw`
      SELECT set_config(
        'pg_trgm.word_similarity_threshold',
        '0.5',
        true
      )
    `;

    const messages = await tx.$queryRaw`
      SELECT m.*
      FROM "Messages" AS m
      WHERE
        (
          (
            m."senderId" = ${userId}
            AND m."recieverId" = ${contactId}
          )
          OR
          (
            m."senderId" = ${contactId}
            AND m."recieverId" = ${userId}
          )
        )
        AND
        (
          (
            m.type = 'text'
            AND ${searchType} IN ('all', 'text')
            AND (
              m.message ILIKE ${pattern}
              OR ${searchTerm} <% m.message
            )
          )
          OR
          (
            m.type = 'audio'
            AND ${searchType} IN ('all', 'audio')
            AND (
              m.transcript ILIKE ${pattern}
              OR ${searchTerm} <% m.transcript
            )
          )
        )
      ORDER BY
        CASE
          WHEN m.type = 'text'
            AND m.message ILIKE ${pattern}
            THEN 0
          WHEN m.type = 'audio'
            AND m.transcript ILIKE ${pattern}
            THEN 0
          ELSE 1
        END ASC,
        CASE
          WHEN m.type = 'text'
            THEN word_similarity(${searchTerm}, m.message)
          ELSE word_similarity(${searchTerm}, m.transcript)
        END DESC,
        m."createdAt" DESC,
        m.id DESC
    `;

    return messages;
  });
};
