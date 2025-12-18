-- Add notification_preferences table for user email notification settings

CREATE TABLE notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own notification preferences
CREATE POLICY "Users can view their own notification preferences"
    ON notification_preferences FOR SELECT
    USING (user_id = auth.uid());

-- Users can update their own notification preferences
CREATE POLICY "Users can update their own notification preferences"
    ON notification_preferences FOR UPDATE
    USING (user_id = auth.uid());

-- Users can insert their own notification preferences
CREATE POLICY "Users can insert their own notification preferences"
    ON notification_preferences FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Create reusable trigger function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at on row modifications
CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

