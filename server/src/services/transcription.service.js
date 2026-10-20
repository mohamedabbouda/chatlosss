
import fs from "node:fs";
import OpenAI from "openai";

import { env } from "../config/env.js";

let openai = null;

const getOpenAIClient = () => {
  if (!env.openaiApiKey) {
    throw new Error(
      "OPENAI_API_KEY is missing. Real audio transcription is unavailable."
    );
  }

  if (!openai) {
    openai = new OpenAI({
      apiKey: env.openaiApiKey,
    });
  }

  return openai;
};

export const transcribeAudioFile = async (filePath) => {
  const client = getOpenAIClient();

  try {
    console.log("Starting audio transcription:", filePath);

    const result = await client.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: env.openaiTranscriptionModel,
      response_format: "json",
    });

    const transcript = result.text?.trim() || "";

    if (!transcript) {
      throw new Error("Transcription returned empty text.");
    }

    console.log("Audio transcription completed.");

    return transcript;
  } catch (error) {
    console.error("Audio transcription failed:", {
      message: error.message,
      status: error.status,
      code: error.code,
    });

    throw error;
  }
};
