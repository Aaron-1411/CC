-- Migration 002: add client qualification + legal fields to bookings
-- Run in Supabase SQL editor

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS is_flash            boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS skin_tone           text,
  ADD COLUMN IF NOT EXISTS has_medical_condition boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_returning_client boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_deadline        text,
  ADD COLUMN IF NOT EXISTS join_waitlist       boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS referral_source     text,
  ADD COLUMN IF NOT EXISTS cover_up_darkness   text,
  ADD COLUMN IF NOT EXISTS dimensions          text;

-- cover_up_darkness and dimensions were added conceptually earlier but
-- may not have been migrated yet — IF NOT EXISTS handles both cases safely.

COMMENT ON COLUMN bookings.is_flash             IS 'true = client wants a flash piece, false = custom design';
COMMENT ON COLUMN bookings.skin_tone            IS 'fair | medium | olive | brown | deep';
COMMENT ON COLUMN bookings.has_medical_condition IS 'client self-declared medical condition that may affect tattooing';
COMMENT ON COLUMN bookings.is_returning_client  IS 'client already has a tattoo by Jordan';
COMMENT ON COLUMN bookings.has_deadline         IS 'freetext deadline, e.g. wedding date';
COMMENT ON COLUMN bookings.join_waitlist        IS 'client happy to take short-notice cancellation slots';
COMMENT ON COLUMN bookings.referral_source      IS 'word_of_mouth | instagram | google | existing_tattoo | other';
