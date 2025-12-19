-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Configuration table for PIN
CREATE TABLE IF NOT EXISTS app_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pin_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Party Master
CREATE TABLE IF NOT EXISTS parties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  city TEXT NOT NULL,
  grade TEXT NOT NULL CHECK (grade IN ('purchaser', 'supplier')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product Master
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_name TEXT NOT NULL,
  product_grade TEXT NOT NULL,
  gst_slab DECIMAL(5,2) NOT NULL,
  confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchase Price Master (with version control)
CREATE TABLE IF NOT EXISTS purchase_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price_per_kg DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(party_id, product_id)
);

-- Purchase Price History (for version control)
CREATE TABLE IF NOT EXISTS purchase_price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_price_id UUID NOT NULL REFERENCES purchase_prices(id) ON DELETE CASCADE,
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  old_price DECIMAL(10,2),
  new_price DECIMAL(10,2) NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supply Price Master (with version control)
CREATE TABLE IF NOT EXISTS supply_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price_per_kg DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(party_id, product_id)
);

-- Supply Price History (for version control)
CREATE TABLE IF NOT EXISTS supply_price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supply_price_id UUID NOT NULL REFERENCES supply_prices(id) ON DELETE CASCADE,
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  old_price DECIMAL(10,2),
  new_price DECIMAL(10,2) NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchase Transactions
CREATE TABLE IF NOT EXISTS purchase_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  party_id UUID NOT NULL REFERENCES parties(id),
  purchase_voucher_number TEXT NOT NULL UNIQUE,
  vehicle_number TEXT,
  is_built BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchase Transaction Items
CREATE TABLE IF NOT EXISTS purchase_transaction_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_transaction_id UUID NOT NULL REFERENCES purchase_transactions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  weight_kg DECIMAL(10,2) NOT NULL,
  price_per_kg DECIMAL(10,2) NOT NULL,
  gst_percent DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supply Transactions
CREATE TABLE IF NOT EXISTS supply_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  party_id UUID NOT NULL REFERENCES parties(id),
  purchase_transaction_id UUID NOT NULL REFERENCES purchase_transactions(id),
  is_built BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supply Transaction Items
CREATE TABLE IF NOT EXISTS supply_transaction_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supply_transaction_id UUID NOT NULL REFERENCES supply_transactions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  weight_kg DECIMAL(10,2) NOT NULL,
  price_per_kg DECIMAL(10,2) NOT NULL,
  gst_percent DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Receipts
CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  party_id UUID NOT NULL REFERENCES parties(id),
  receipt_number TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('Gpay', 'cash')),
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  party_id UUID NOT NULL REFERENCES parties(id),
  paid_amount DECIMAL(10,2) NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('Gpay', 'cash')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  voucher_number TEXT NOT NULL,
  pay_to TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  expense_grade TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Functions for price history tracking
CREATE OR REPLACE FUNCTION track_purchase_price_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.price_per_kg IS DISTINCT FROM NEW.price_per_kg THEN
    INSERT INTO purchase_price_history (
      purchase_price_id,
      party_id,
      product_id,
      old_price,
      new_price
    ) VALUES (
      NEW.id,
      NEW.party_id,
      NEW.product_id,
      OLD.price_per_kg,
      NEW.price_per_kg
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION track_supply_price_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.price_per_kg IS DISTINCT FROM NEW.price_per_kg THEN
    INSERT INTO supply_price_history (
      supply_price_id,
      party_id,
      product_id,
      old_price,
      new_price
    ) VALUES (
      NEW.id,
      NEW.party_id,
      NEW.product_id,
      OLD.price_per_kg,
      NEW.price_per_kg
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for price history
CREATE TRIGGER purchase_price_history_trigger
  BEFORE UPDATE ON purchase_prices
  FOR EACH ROW
  EXECUTE FUNCTION track_purchase_price_change();

CREATE TRIGGER supply_price_history_trigger
  BEFORE UPDATE ON supply_prices
  FOR EACH ROW
  EXECUTE FUNCTION track_supply_price_change();

-- Insert initial price history for new prices
CREATE OR REPLACE FUNCTION insert_initial_purchase_price_history()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO purchase_price_history (
    purchase_price_id,
    party_id,
    product_id,
    old_price,
    new_price
  ) VALUES (
    NEW.id,
    NEW.party_id,
    NEW.product_id,
    NULL,
    NEW.price_per_kg
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION insert_initial_supply_price_history()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO supply_price_history (
    supply_price_id,
    party_id,
    product_id,
    old_price,
    new_price
  ) VALUES (
    NEW.id,
    NEW.party_id,
    NEW.product_id,
    NULL,
    NEW.price_per_kg
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER purchase_price_initial_history_trigger
  AFTER INSERT ON purchase_prices
  FOR EACH ROW
  EXECUTE FUNCTION insert_initial_purchase_price_history();

CREATE TRIGGER supply_price_initial_history_trigger
  AFTER INSERT ON supply_prices
  FOR EACH ROW
  EXECUTE FUNCTION insert_initial_supply_price_history();
