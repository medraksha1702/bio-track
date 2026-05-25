-- Add new fields to customers table
ALTER TABLE customers
ADD COLUMN contact_number VARCHAR(20),
ADD COLUMN gst_number VARCHAR(50),
ADD COLUMN bill_to_address TEXT,
ADD COLUMN ship_to_address TEXT;

-- Add comments for documentation
COMMENT ON COLUMN customers.contact_number IS 'Customer contact phone number';
COMMENT ON COLUMN customers.gst_number IS 'Customer GST/Tax identification number';
COMMENT ON COLUMN customers.bill_to_address IS 'Billing address for the customer';
COMMENT ON COLUMN customers.ship_to_address IS 'Shipping address for the customer';
