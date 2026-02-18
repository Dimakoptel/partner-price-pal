
-- Add is_approved column to profiles (default false for new users, admins are auto-approved via trigger)
ALTER TABLE public.profiles ADD COLUMN is_approved boolean NOT NULL DEFAULT false;

-- Auto-approve existing users
UPDATE public.profiles SET is_approved = true;
