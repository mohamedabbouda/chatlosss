CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX "Messages_message_trgm_idx"
ON "Messages"
USING GIN ("message" gin_trgm_ops);

CREATE INDEX "Messages_transcript_trgm_idx"
ON "Messages"
USING GIN ("transcript" gin_trgm_ops);
