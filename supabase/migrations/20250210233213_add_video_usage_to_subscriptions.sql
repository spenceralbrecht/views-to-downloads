-- Add content usage tracking columns to subscriptions table
ALTER TABLE subscriptions 
ADD COLUMN content_used_this_month INTEGER NOT NULL DEFAULT 0,
ADD COLUMN content_reset_date TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Create function to reset content_used_this_month at the start of each billing period
CREATE OR REPLACE FUNCTION reset_monthly_content_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is a new subscription or the reset date has passed
  IF (OLD IS NULL) OR (NEW.current_period_start != OLD.current_period_start) THEN
    NEW.content_used_this_month := 0;
    NEW.content_reset_date := NEW.current_period_start;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically reset usage when billing period changes
DROP TRIGGER IF EXISTS reset_content_usage_trigger ON subscriptions;
CREATE TRIGGER reset_content_usage_trigger
  BEFORE INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION reset_monthly_content_usage();