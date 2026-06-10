import { renameSync } from "fs";
import getPrismaInstance from "../utils/PrismaClient.js";
import { transcribeAudioFile } from "../utils/TranscriptionService.js";

const parseUserId = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

export const getMessages = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const from = parseUserId(req.params.from);
    const to = parseUserId(req.params.to);

    if (!from || !to) {
      return res.status(400).send("Valid from and to user ids are required.");
    }

    const messages = await prisma.messages.findMany({
      where: {
        OR: [
          {
            senderId: from,
            recieverId: to,
          },
          {
            senderId: to,
            recieverId: from,
          },
        ],
      },
      orderBy: {
        id: "asc",
      },
    });

    const unreadMessages = [];

    messages.forEach((message, index) => {
      if (message.messageStatus !== "read" && message.senderId === to) {
        messages[index].messageStatus = "read";
        unreadMessages.push(message.id);
      }
    });

    if (unreadMessages.length) {
      await prisma.messages.updateMany({
        where: {
          id: { in: unreadMessages },
        },
        data: {
          messageStatus: "read",
        },
      });
    }

    return res.status(200).json({ messages });
  } catch (err) {
    next(err);
  }
};

export const addMessage = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();

    const { message } = req.body;
    const from = parseUserId(req.body.from);
    const to = parseUserId(req.body.to);

    if (!message || !from || !to) {
      return res.status(400).send("Valid from, to and message are required.");
    }

    const getUser = onlineUsers.get(to.toString());

    const newMessage = await prisma.messages.create({
      data: {
        message,
        transcript: "",
        sender: { connect: { id: from } },
        reciever: { connect: { id: to } },
        messageStatus: getUser ? "delivered" : "sent",
      },
      include: { sender: true, reciever: true },
    });

    return res.status(201).send({ message: newMessage });
  } catch (err) {
    next(err);
  }
};

export const getInitialContactsWithMessages = async (req, res, next) => {
  try {
    const userId = parseUserId(req.params.from);

    if (!userId) {
      return res.status(400).send("Valid user id is required.");
    }

    const prisma = getPrismaInstance();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        sentMessages: {
          include: { reciever: true, sender: true },
          orderBy: { createdAt: "desc" },
        },
        recievedMessages: {
          include: { reciever: true, sender: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      return res.status(404).send("User not found.");
    }

    const messages = [...user.sentMessages, ...user.recievedMessages];
    messages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

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

        let user = {
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
          user = {
            ...user,
            ...msg.reciever,
            totalUnreadMessages: 0,
          };
        } else {
          user = {
            ...user,
            ...msg.sender,
            totalUnreadMessages: messageStatus !== "read" ? 1 : 0,
          };
        }

        users.set(calculatedId, {
          ...user,
        });
      } else if (msg.messageStatus !== "read" && !isSender) {
        const user = users.get(calculatedId);
        users.set(calculatedId, {
          ...user,
          totalUnreadMessages: user.totalUnreadMessages + 1,
        });
      }
    });

    if (messageStatusChange.length) {
      await prisma.messages.updateMany({
        where: {
          id: { in: messageStatusChange },
        },
        data: {
          messageStatus: "delivered",
        },
      });
    }

    return res.status(200).json({
      users: Array.from(users.values()),
      onlineUsers: Array.from(onlineUsers.keys()),
    });
  } catch (err) {
    next(err);
  }
};

export const addAudioMessage = async (req, res, next) => {
  try {
    if (req.file) {
      const date = Date.now();
      const fileName = "uploads/recordings/" + date + req.file.originalname;
      renameSync(req.file.path, fileName);

      const prisma = getPrismaInstance();
      const from = parseUserId(req.query.from);
      const to = parseUserId(req.query.to);

      if (from && to) {
        const transcript = await transcribeAudioFile(fileName);

        const message = await prisma.messages.create({
          data: {
            message: fileName,
            transcript,
            sender: { connect: { id: from } },
            reciever: { connect: { id: to } },
            type: "audio",
          },
        });

        return res.status(201).json({ message });
      }

      return res.status(400).send("Valid from and to user ids are required.");
    }

    return res.status(400).send("Audio is required.");
  } catch (err) {
    next(err);
  }
};

export const addImageMessage = async (req, res, next) => {
  try {
    if (req.file) {
      const date = Date.now();
      const fileName = "uploads/images/" + date + req.file.originalname;
      renameSync(req.file.path, fileName);

      const prisma = getPrismaInstance();
      const from = parseUserId(req.query.from);
      const to = parseUserId(req.query.to);

      if (from && to) {
        const message = await prisma.messages.create({
          data: {
            message: fileName,
            transcript: "",
            sender: { connect: { id: from } },
            reciever: { connect: { id: to } },
            type: "image",
          },
        });

        return res.status(201).json({ message });
      }

      return res.status(400).send("Valid from and to user ids are required.");
    }

    return res.status(400).send("Image is required.");
  } catch (err) {
    next(err);
  }
};

export const deleteMessage = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();

    const messageId = Number.parseInt(req.params.messageId, 10);
    const userId = parseUserId(req.query.userId);

    if (!messageId || !userId) {
      return res.status(400).send("Valid messageId and userId are required.");
    }

    const message = await prisma.messages.findUnique({
      where: {
        id: messageId,
      },
    });

    if (!message) {
      return res.status(404).send("Message not found.");
    }

    if (message.senderId !== userId && message.recieverId !== userId) {
      return res.status(403).send("You cannot delete this message.");
    }

    await prisma.messages.delete({
      where: {
        id: messageId,
      },
    });

    return res.status(200).json({
      messageId,
    });
  } catch (err) {
    next(err);
  }
};


export const searchMessages = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();

    const userId = parseUserId(req.query.userId);
    const contactId = parseUserId(req.query.contactId);
    const query = req.query.query?.trim();
    const type = req.query.type || "all";

    if (!userId || !contactId || !query) {
      return res.status(400).send("userId, contactId and query are required.");
    }

    const searchableTypeFilter =
      type === "text" || type === "audio"
        ? { type }
        : { type: { in: ["text", "audio"] } };

    const searchableContentFilter =
      type === "text"
        ? {
            message: {
              contains: query,
              mode: "insensitive",
            },
          }
        : type === "audio"
        ? {
            transcript: {
              contains: query,
              mode: "insensitive",
            },
          }
        : {
            OR: [
              {
                AND: [
                  { type: "text" },
                  {
                    message: {
                      contains: query,
                      mode: "insensitive",
                    },
                  },
                ],
              },
              {
                AND: [
                  { type: "audio" },
                  {
                    transcript: {
                      contains: query,
                      mode: "insensitive",
                    },
                  },
                ],
              },
            ],
          };

    const messages = await prisma.messages.findMany({
      where: {
        AND: [
          {
            OR: [
              {
                senderId: userId,
                recieverId: contactId,
              },
              {
                senderId: contactId,
                recieverId: userId,
              },
            ],
          },
          searchableTypeFilter,
          searchableContentFilter,
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({ messages });
  } catch (err) {
    next(err);
  }
};