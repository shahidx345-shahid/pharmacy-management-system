-- Create profiles table for user management
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  pharmacy_name TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create medicines table
CREATE TABLE IF NOT EXISTS public.medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  generic_name TEXT,
  manufacturer TEXT,
  batch_number TEXT NOT NULL,
  quantity_in_stock INTEGER NOT NULL DEFAULT 0,
  unit_price DECIMAL(10, 2) NOT NULL,
  expiry_date DATE NOT NULL,
  category TEXT,
  description TEXT,
  sku TEXT UNIQUE,
  reorder_level INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  date_of_birth DATE,
  customer_type TEXT DEFAULT 'retail',
  loyalty_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create prescriptions table
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  doctor_name TEXT NOT NULL,
  doctor_license TEXT,
  prescription_date DATE NOT NULL,
  expiry_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create prescription items table
CREATE TABLE IF NOT EXISTS public.prescription_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  medicine_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  dosage TEXT,
  frequency TEXT,
  duration TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create sales table
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  invoice_number TEXT UNIQUE NOT NULL,
  sale_date DATE NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'completed',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create sale items table
CREATE TABLE IF NOT EXISTS public.sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  medicine_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  discount_percent DECIMAL(5, 2) DEFAULT 0,
  line_total DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create inventory transactions table for tracking
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medicine_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL,
  quantity_change INTEGER NOT NULL,
  reference_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for profiles
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- Create RLS Policies for medicines
CREATE POLICY "medicines_select_own" ON public.medicines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "medicines_insert_own" ON public.medicines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "medicines_update_own" ON public.medicines FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "medicines_delete_own" ON public.medicines FOR DELETE USING (auth.uid() = user_id);

-- Create RLS Policies for customers
CREATE POLICY "customers_select_own" ON public.customers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "customers_insert_own" ON public.customers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "customers_update_own" ON public.customers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "customers_delete_own" ON public.customers FOR DELETE USING (auth.uid() = user_id);

-- Create RLS Policies for prescriptions
CREATE POLICY "prescriptions_select_own" ON public.prescriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "prescriptions_insert_own" ON public.prescriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "prescriptions_update_own" ON public.prescriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "prescriptions_delete_own" ON public.prescriptions FOR DELETE USING (auth.uid() = user_id);

-- Create RLS Policies for prescription_items
CREATE POLICY "prescription_items_select" ON public.prescription_items FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.prescriptions WHERE prescriptions.id = prescription_items.prescription_id AND prescriptions.user_id = auth.uid()));
CREATE POLICY "prescription_items_insert" ON public.prescription_items FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.prescriptions WHERE prescriptions.id = prescription_items.prescription_id AND prescriptions.user_id = auth.uid()));
CREATE POLICY "prescription_items_update" ON public.prescription_items FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.prescriptions WHERE prescriptions.id = prescription_items.prescription_id AND prescriptions.user_id = auth.uid()));
CREATE POLICY "prescription_items_delete" ON public.prescription_items FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.prescriptions WHERE prescriptions.id = prescription_items.prescription_id AND prescriptions.user_id = auth.uid()));

-- Create RLS Policies for sales
CREATE POLICY "sales_select_own" ON public.sales FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "sales_insert_own" ON public.sales FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sales_update_own" ON public.sales FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "sales_delete_own" ON public.sales FOR DELETE USING (auth.uid() = user_id);

-- Create RLS Policies for sale_items
CREATE POLICY "sale_items_select" ON public.sale_items FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.sales WHERE sales.id = sale_items.sale_id AND sales.user_id = auth.uid()));
CREATE POLICY "sale_items_insert" ON public.sale_items FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.sales WHERE sales.id = sale_items.sale_id AND sales.user_id = auth.uid()));
CREATE POLICY "sale_items_update" ON public.sale_items FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.sales WHERE sales.id = sale_items.sale_id AND sales.user_id = auth.uid()));
CREATE POLICY "sale_items_delete" ON public.sale_items FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.sales WHERE sales.id = sale_items.sale_id AND sales.user_id = auth.uid()));

-- Create RLS Policies for inventory_transactions
CREATE POLICY "inventory_transactions_select_own" ON public.inventory_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "inventory_transactions_insert_own" ON public.inventory_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "inventory_transactions_update_own" ON public.inventory_transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "inventory_transactions_delete_own" ON public.inventory_transactions FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_medicines_user_id ON public.medicines(user_id);
CREATE INDEX idx_medicines_expiry_date ON public.medicines(expiry_date);
CREATE INDEX idx_customers_user_id ON public.customers(user_id);
CREATE INDEX idx_prescriptions_user_id ON public.prescriptions(user_id);
CREATE INDEX idx_prescriptions_customer_id ON public.prescriptions(customer_id);
CREATE INDEX idx_sales_user_id ON public.sales(user_id);
CREATE INDEX idx_sales_sale_date ON public.sales(sale_date);
CREATE INDEX idx_inventory_transactions_user_id ON public.inventory_transactions(user_id);
CREATE INDEX idx_inventory_transactions_medicine_id ON public.inventory_transactions(medicine_id);
