-- Function to send email notification when shipment is ready for client choice
CREATE OR REPLACE FUNCTION notify_client_shipment_ready()
RETURNS TRIGGER AS $$
DECLARE
  client_email TEXT;
  client_name TEXT;
  shipment_id TEXT;
BEGIN
  -- Only trigger when status changes to AWAITING_ACCEPTANCE and calculatedPriceEur is set
  IF NEW.status = 'AWAITING_ACCEPTANCE' AND NEW.calculatedPriceEur IS NOT NULL AND OLD.status != 'AWAITING_ACCEPTANCE' THEN
    -- Get client email
    SELECT email, "displayName" INTO client_email, client_name
    FROM "Client"
    WHERE id = NEW."clientId";

    shipment_id := NEW.id;

    -- Call Supabase Edge Function to send email
    -- This will be handled by a database webhook or Edge Function
    -- For now, we'll use pg_notify to trigger an external service
    PERFORM pg_notify('shipment_ready', json_build_object(
      'shipmentId', shipment_id,
      'clientEmail', client_email,
      'clientName', client_name,
      'calculatedPrice', NEW."calculatedPriceEur"
    )::text);

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER shipment_ready_notification
AFTER UPDATE ON "ShipmentOrder"
FOR EACH ROW
EXECUTE FUNCTION notify_client_shipment_ready();

-- Note: To actually send emails, you'll need to:
-- 1. Create a Supabase Edge Function that listens to pg_notify or webhook
-- 2. Or use Supabase's built-in email service (if available)
-- 3. Or use an external email service (SendGrid, Resend, etc.) via Edge Function

