-- Fix for trigger creation
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_copurchase') THEN
        DROP TRIGGER trigger_update_copurchase ON orders;
    END IF;
END $$;

CREATE TRIGGER trigger_update_copurchase
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_copurchase_patterns();
