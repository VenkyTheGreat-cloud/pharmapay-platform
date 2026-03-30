-- Migration 002: Freelancer delivery boy model
-- Adds tables for delivery boys to apply to multiple pharmacies
-- Purely additive — no changes to existing tables or columns

-- Pharmacy public listings (extends users table for store_manager pharmacies)
CREATE TABLE IF NOT EXISTS pharmacy_listings (
    id UUID PRIMARY KEY REFERENCES users(id),
    slug VARCHAR(60) UNIQUE NOT NULL,
    display_name VARCHAR(120) NOT NULL,
    city VARCHAR(80),
    area VARCHAR(80),
    lat DECIMAL(10,8),
    lng DECIMAL(11,8),
    logo_url TEXT,
    primary_color CHAR(7) DEFAULT '#185FA5',
    is_accepting_riders BOOLEAN DEFAULT TRUE,
    plan VARCHAR(20) DEFAULT 'starter',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_listings_slug ON pharmacy_listings(slug);
CREATE INDEX IF NOT EXISTS idx_pharmacy_listings_city_area ON pharmacy_listings(city, area);

-- Junction table: delivery boys ↔ pharmacies (many-to-many)
CREATE TABLE IF NOT EXISTS delivery_boy_pharmacies (
    id BIGSERIAL PRIMARY KEY,
    delivery_boy_id BIGINT NOT NULL REFERENCES delivery_boys(id) ON DELETE CASCADE,
    pharmacy_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paused')),
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES users(id),
    UNIQUE(delivery_boy_id, pharmacy_id)
);

CREATE INDEX IF NOT EXISTS idx_delivery_boy_pharmacies_delivery_boy_id ON delivery_boy_pharmacies(delivery_boy_id);
CREATE INDEX IF NOT EXISTS idx_delivery_boy_pharmacies_pharmacy_id ON delivery_boy_pharmacies(pharmacy_id);
