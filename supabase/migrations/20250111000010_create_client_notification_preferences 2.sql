-- =====================================================
-- Migration: Create Client Notification Preferences
-- Description: Manages client notification preferences for email, SMS, and push notifications
-- Constitutional Compliance: Principle 1 (BIGINT IDs), Principle 2 (VARCHAR + CHECK)
-- =====================================================

-- Create client_notification_preferences table
CREATE TABLE IF NOT EXISTS public.client_notification_preferences (
  id BIGSERIAL PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Email notifications
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  email_booking_confirmation BOOLEAN NOT NULL DEFAULT true,
  email_booking_reminder BOOLEAN NOT NULL DEFAULT true,
  email_booking_cancellation BOOLEAN NOT NULL DEFAULT true,
  email_contractor_assignment BOOLEAN NOT NULL DEFAULT true,
  email_marketing BOOLEAN NOT NULL DEFAULT false,

  -- SMS notifications
  sms_enabled BOOLEAN NOT NULL DEFAULT true,
  sms_booking_confirmation BOOLEAN NOT NULL DEFAULT true,
  sms_booking_reminder BOOLEAN NOT NULL DEFAULT true,
  sms_booking_cancellation BOOLEAN NOT NULL DEFAULT true,
  sms_contractor_assignment BOOLEAN NOT NULL DEFAULT true,

  -- Push notifications (for future mobile app)
  push_enabled BOOLEAN NOT NULL DEFAULT false,
  push_booking_confirmation BOOLEAN NOT NULL DEFAULT false,
  push_booking_reminder BOOLEAN NOT NULL DEFAULT false,
  push_booking_cancellation BOOLEAN NOT NULL DEFAULT false,
  push_contractor_assignment BOOLEAN NOT NULL DEFAULT false,

  -- Reminder timing preferences
  reminder_hours_before INTEGER NOT NULL DEFAULT 24 CHECK (reminder_hours_before IN (1, 2, 6, 12, 24, 48)),

  -- Quiet hours (no notifications during these times)
  quiet_hours_enabled BOOLEAN NOT NULL DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,

  -- Timezone for scheduling reminders
  timezone VARCHAR(100) NOT NULL DEFAULT 'Europe/Paris',

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_client_notification_preferences UNIQUE (client_id)
);

-- Create indexes for performance
CREATE INDEX idx_client_notification_preferences_client_id
  ON public.client_notification_preferences(client_id);

CREATE INDEX idx_client_notification_preferences_sms_enabled
  ON public.client_notification_preferences(sms_enabled)
  WHERE sms_enabled = true;

CREATE INDEX idx_client_notification_preferences_email_enabled
  ON public.client_notification_preferences(email_enabled)
  WHERE email_enabled = true;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_client_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_client_notification_preferences_updated_at
  BEFORE UPDATE ON public.client_notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_client_notification_preferences_updated_at();

-- Create function to initialize default preferences for new clients
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create preferences for client role
  IF NEW.raw_user_meta_data->>'role' = 'client' THEN
    INSERT INTO public.client_notification_preferences (client_id)
    VALUES (NEW.id)
    ON CONFLICT (client_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create preferences on user signup
DROP TRIGGER IF EXISTS trigger_create_default_notification_preferences ON auth.users;
CREATE TRIGGER trigger_create_default_notification_preferences
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();

-- Enable Row Level Security
ALTER TABLE public.client_notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Policy: Clients can view their own notification preferences
CREATE POLICY "Clients can view own notification preferences"
  ON public.client_notification_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = client_id);

-- Policy: Clients can update their own notification preferences
CREATE POLICY "Clients can update own notification preferences"
  ON public.client_notification_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id);

-- Policy: System can insert default preferences (via trigger)
CREATE POLICY "System can insert notification preferences"
  ON public.client_notification_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = client_id);

-- Policy: Admin can view all notification preferences
CREATE POLICY "Admin can view all notification preferences"
  ON public.client_notification_preferences
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add helpful comments
COMMENT ON TABLE public.client_notification_preferences IS 'Stores client notification preferences for email, SMS, and push notifications';
COMMENT ON COLUMN public.client_notification_preferences.reminder_hours_before IS 'Hours before appointment to send reminder (1, 2, 6, 12, 24, or 48)';
COMMENT ON COLUMN public.client_notification_preferences.quiet_hours_start IS 'Start time for quiet hours (no notifications)';
COMMENT ON COLUMN public.client_notification_preferences.quiet_hours_end IS 'End time for quiet hours (no notifications)';
COMMENT ON COLUMN public.client_notification_preferences.timezone IS 'Client timezone for scheduling reminders (e.g., Europe/Paris)';
