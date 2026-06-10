import fs from "fs";
import OpenAI from "openai";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

const DEMO_TRANSCRIPT =
  "hotel booking test voice note demo transcript for searchable audio messages";

export const transcribeAudioFile = async (filePath) => {
  if (!process.env.OPENAI_API_KEY || !openai) {
    return DEMO_TRANSCRIPT;
  }

  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: process.env.OPENAI_TRANSCRIPTION_MODEL || "gpt-4o-mini-transcribe",
      response_format: "text",
    });

    if (typeof transcription === "string") {
      return transcription.trim();
    }

    return transcription?.text?.trim() || "";
  } catch (error) {
    return DEMO_TRANSCRIPT;
  }
};