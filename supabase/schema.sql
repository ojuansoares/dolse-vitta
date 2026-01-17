-- =============================================
-- DATABASE SCHEMA - SUPABASE
-- =============================================
-- Run this script in Supabase SQL Editor
-- 
-- Naming convention:
--   - Table: singular name (admin, product, order)
--   - Fields: prefix with table initial (a_name, p_price)
--   - Foreign keys: prefix + referenced_table + _id (oi_product_id)
--
-- NOTE: All business logic is handled by Python backend.
-- Supabase only handles: tables, indexes, and RLS security.
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLE: admin
-- =============================================
-- Links to Supabase Auth (auth.users)
-- Only admin users can log in (no regular customers)
CREATE TABLE IF NOT EXISTS admin (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    a_email TEXT NOT NULL UNIQUE,
    a_name TEXT,
    a_phone TEXT,
    a_avatar_url TEXT,
    a_is_active BOOLEAN DEFAULT TRUE,
    a_created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    a_last_update TIMESTAMPTZ
);

-- =============================================
-- TABLE: category
-- =============================================
-- Product categories (Cakes, Desserts, Pies, etc.)
CREATE TABLE IF NOT EXISTS category (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    c_name TEXT NOT NULL,
    c_description TEXT,
    c_image_url TEXT,
    c_is_active BOOLEAN DEFAULT TRUE,
    c_sort_order INTEGER DEFAULT 0,
    c_created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    c_last_update TIMESTAMPTZ
);

-- =============================================
-- TABLE: product
-- =============================================
-- Items for sale (cakes, desserts, sweets)
CREATE TABLE IF NOT EXISTS product (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    p_category_id UUID REFERENCES category(id) ON DELETE SET NULL,
    p_name TEXT NOT NULL,
    p_description TEXT,
    p_price DECIMAL(10, 2) NOT NULL,
    p_image_url TEXT,
    p_is_available BOOLEAN DEFAULT TRUE,
    p_is_featured BOOLEAN DEFAULT FALSE,
    p_sort_order INTEGER DEFAULT 0,
    p_created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    p_last_update TIMESTAMPTZ
);

-- Index: faster queries by category
CREATE INDEX IF NOT EXISTS idx_product_category ON product(p_category_id);
-- Index: faster queries for available products
CREATE INDEX IF NOT EXISTS idx_product_available ON product(p_is_available);

-- =============================================
-- TABLE: order
-- =============================================
-- Customer orders (history/log)
-- Customer is NOT logged in - order sent via WhatsApp
CREATE TABLE IF NOT EXISTS "order" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    o_customer_name TEXT NOT NULL,
    o_customer_order TEXT,
    o_total DECIMAL(10, 2) NOT NULL,
    o_created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    o_last_update TIMESTAMPTZ
);

-- Index: order by date (most recent first)
CREATE INDEX IF NOT EXISTS idx_order_created ON "order"(o_created_at DESC);

-- =============================================
-- TABLE: order_item
-- =============================================
-- Products in each order
CREATE TABLE IF NOT EXISTS order_item (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    oi_order_id UUID REFERENCES "order"(id) ON DELETE CASCADE NOT NULL,
    oi_product_id UUID REFERENCES product(id) ON DELETE SET NULL,
    oi_product_name TEXT NOT NULL,
    oi_product_price DECIMAL(10, 2) NOT NULL,
    oi_quantity INTEGER NOT NULL DEFAULT 1,
    oi_subtotal DECIMAL(10, 2) NOT NULL,
    oi_created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index: get items by order
CREATE INDEX IF NOT EXISTS idx_order_item_order ON order_item(oi_order_id);

-- =============================================
-- RLS (Row Level Security)
-- =============================================
-- CRITICAL: Protects data even if anon_key is exposed

ALTER TABLE admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE category ENABLE ROW LEVEL SECURITY;
ALTER TABLE product ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------
-- ADMIN policies
-- ---------------------------------------------
-- Admins can only see/edit their own profile
CREATE POLICY "admin_select_own" ON admin 
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "admin_update_own" ON admin 
    FOR UPDATE USING (auth.uid() = id);

-- Allow insert when user registers (service_role or matching id)
CREATE POLICY "admin_insert" ON admin 
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ---------------------------------------------
-- CATEGORY policies
-- ---------------------------------------------
-- Anyone can view active categories (public menu)
CREATE POLICY "category_select_public" ON category 
    FOR SELECT USING (c_is_active = TRUE);

-- Only admins can manage categories (insert, update, delete)
CREATE POLICY "category_admin_insert" ON category 
    FOR INSERT WITH CHECK (
        auth.uid() IN (SELECT id FROM admin WHERE a_is_active = TRUE)
    );

CREATE POLICY "category_admin_update" ON category 
    FOR UPDATE USING (
        auth.uid() IN (SELECT id FROM admin WHERE a_is_active = TRUE)
    );

CREATE POLICY "category_admin_delete" ON category 
    FOR DELETE USING (
        auth.uid() IN (SELECT id FROM admin WHERE a_is_active = TRUE)
    );

-- Admins can also see inactive categories
CREATE POLICY "category_admin_select_all" ON category 
    FOR SELECT USING (
        auth.uid() IN (SELECT id FROM admin WHERE a_is_active = TRUE)
    );

-- ---------------------------------------------
-- PRODUCT policies
-- ---------------------------------------------
-- Anyone can view available products (public menu)
CREATE POLICY "product_select_public" ON product 
    FOR SELECT USING (p_is_available = TRUE);

-- Only admins can manage products
CREATE POLICY "product_admin_insert" ON product 
    FOR INSERT WITH CHECK (
        auth.uid() IN (SELECT id FROM admin WHERE a_is_active = TRUE)
    );

CREATE POLICY "product_admin_update" ON product 
    FOR UPDATE USING (
        auth.uid() IN (SELECT id FROM admin WHERE a_is_active = TRUE)
    );

CREATE POLICY "product_admin_delete" ON product 
    FOR DELETE USING (
        auth.uid() IN (SELECT id FROM admin WHERE a_is_active = TRUE)
    );

-- Admins can also see unavailable products
CREATE POLICY "product_admin_select_all" ON product 
    FOR SELECT USING (
        auth.uid() IN (SELECT id FROM admin WHERE a_is_active = TRUE)
    );

-- ---------------------------------------------
-- ORDER policies
-- ---------------------------------------------
-- Anyone can CREATE orders (customers don't log in)
CREATE POLICY "order_insert_public" ON "order" 
    FOR INSERT WITH CHECK (TRUE);

-- Only admins can view orders
CREATE POLICY "order_select_admin" ON "order" 
    FOR SELECT USING (
        auth.uid() IN (SELECT id FROM admin WHERE a_is_active = TRUE)
    );

-- Only admins can update orders (change status, etc.)
CREATE POLICY "order_update_admin" ON "order" 
    FOR UPDATE USING (
        auth.uid() IN (SELECT id FROM admin WHERE a_is_active = TRUE)
    );

-- Only admins can delete orders
CREATE POLICY "order_delete_admin" ON "order" 
    FOR DELETE USING (
        auth.uid() IN (SELECT id FROM admin WHERE a_is_active = TRUE)
    );

-- ---------------------------------------------
-- ORDER_ITEM policies
-- ---------------------------------------------
-- Anyone can CREATE order items (with order)
CREATE POLICY "order_item_insert_public" ON order_item 
    FOR INSERT WITH CHECK (TRUE);

-- Only admins can view order items
CREATE POLICY "order_item_select_admin" ON order_item 
    FOR SELECT USING (
        auth.uid() IN (SELECT id FROM admin WHERE a_is_active = TRUE)
    );
