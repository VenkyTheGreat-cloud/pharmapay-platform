-- Allow longer identifiers (email addresses) in OTP verifications
ALTER TABLE otp_verifications ALTER COLUMN mobile TYPE VARCHAR(255);
