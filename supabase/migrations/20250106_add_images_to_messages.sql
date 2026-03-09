-- Add images and metadata columns to messages table if they don't exist
-- This migration ensures the messages table has all required columns for the chat interface

-- Add images column to store array of image URLs
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'images'
  ) THEN
    ALTER TABLE messages ADD COLUMN images JSONB;
  END IF;
END $$;

-- Add metadata column to store message metadata (category, cost, difficulty, etc.)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE messages ADD COLUMN metadata JSONB;
  END IF;
END $$;

-- Create index on metadata for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_metadata ON messages USING GIN (metadata);

-- Add comment to document the columns
COMMENT ON COLUMN messages.images IS 'Array of image URLs uploaded with the message';
COMMENT ON COLUMN messages.metadata IS 'Message metadata including category, cost estimates, difficulty, etc.';
