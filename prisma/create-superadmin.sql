-- Script to create Superadmin account
-- Run this in Supabase SQL Editor after applying the SUPERADMIN role migration

-- Insert Superadmin user using the insert_user RPC function
-- Password: You should set a secure password and hash it
-- For now, we'll use a temporary password that should be changed immediately

-- First, let's check if the user already exists
DO $$
DECLARE
  superadmin_email TEXT := 'm.nowak@makconsulting.pl';
  superadmin_password_hash TEXT;
  existing_user_id TEXT;
BEGIN
  -- Check if user exists
  SELECT id INTO existing_user_id
  FROM "User"
  WHERE email = superadmin_email;
  
  IF existing_user_id IS NULL THEN
    -- Generate password hash (you should use a proper password hashing function)
    -- For now, using a placeholder - you'll need to hash a real password
    -- Password: Admin@2024! (CHANGE THIS!)
    -- This hash is for: Admin@2024! - USE YOUR OWN SECURE PASSWORD!
    superadmin_password_hash := '$2b$10$XxJ9K9qyN8qZzQzQzQzQzO8qZzQzQzQzQzQzQzQzQzQzQzQzQzQzQz';
    
    -- Call the insert_user RPC function
    PERFORM insert_user(
      superadmin_email,
      superadmin_password_hash, -- Replace with actual hash!
      'Michał Nowak',
      NULL,
      'SUPERADMIN'::"Role"
    );
    
    RAISE NOTICE 'Superadmin user created: %', superadmin_email;
  ELSE
    RAISE NOTICE 'Superadmin user already exists: %', superadmin_email;
    
    -- Update existing user to SUPERADMIN role if not already
    UPDATE "User"
    SET role = 'SUPERADMIN'::"Role"
    WHERE id = existing_user_id AND role != 'SUPERADMIN'::"Role";
    
    RAISE NOTICE 'User role updated to SUPERADMIN';
  END IF;
END $$;

-- Verify the superadmin was created
SELECT id, email, role, name
FROM "User"
WHERE email = 'm.nowak@makconsulting.pl';

