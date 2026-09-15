CREATE TABLE IF NOT EXISTS schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  director_name TEXT NOT NULL,
  accountant_name TEXT NOT NULL,
  sales_manager_name TEXT NOT NULL,
  sales_manager_role TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id),
  level_name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id UUID NOT NULL REFERENCES levels(id),
  barcode TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  image_url TEXT,
  unit_price DECIMAL(10,2) NOT NULL,
  total_quantity INTEGER NOT NULL DEFAULT 0,
  sold_quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id),
  transaction_date TIMESTAMP DEFAULT NOW(),
  total_amount DECIMAL(10,2) NOT NULL,
  total_items INTEGER NOT NULL,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES sales_transactions(id),
  book_id UUID NOT NULL REFERENCES books(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS returns_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id),
  book_id UUID NOT NULL REFERENCES books(id),
  quantity INTEGER NOT NULL,
  return_date TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all read" ON schools FOR SELECT USING (true);
CREATE POLICY "Allow all read" ON levels FOR SELECT USING (true);
CREATE POLICY "Allow all read" ON books FOR SELECT USING (true);
CREATE POLICY "Allow all read" ON sales_transactions FOR SELECT USING (true);
CREATE POLICY "Allow all read" ON sale_items FOR SELECT USING (true);
CREATE POLICY "Allow all read" ON returns_transactions FOR SELECT USING (true);

CREATE POLICY "Allow all insert" ON sales_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all insert" ON sale_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all insert" ON returns_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON books FOR UPDATE USING (true);