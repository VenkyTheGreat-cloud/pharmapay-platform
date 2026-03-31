-- Migration 003: Pharmacy Onboarding
-- Adds pharmacy_owner role and pharmacies table for the Builder Portal

-- 1. Create pharmacies table
-- Pharmacy owners get role='admin' in the users table.
-- This table tracks the onboarding/provisioning state.
CREATE TABLE IF NOT EXISTS pharmacies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    slug VARCHAR(60) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    plan VARCHAR(20) DEFAULT 'starter' CHECK (plan IN ('starter', 'growth', 'enterprise')),
    status VARCHAR(30) DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'submitted', 'approved', 'rejected', 'building', 'live')),
    primary_color VARCHAR(9) DEFAULT '#185FA5',
    logo_url VARCHAR(500),
    features JSONB DEFAULT '{
        "gps_tracking": true,
        "photo_proof": true,
        "return_items": true,
        "payment_cash": true,
        "payment_bank": true,
        "payment_split": true,
        "payment_credit": false,
        "payment_upi": false,
        "excel_export": false,
        "push_notifications": true,
        "multi_store": false
    }'::jsonb,
    max_delivery_boys INT DEFAULT 10,
    max_outlets INT DEFAULT 1,
    config_json JSONB,
    build_id VARCHAR(255),
    build_status VARCHAR(30) CHECK (build_status IN ('queued', 'in_progress', 'completed', 'errored')),
    build_url VARCHAR(500),
    rejection_reason TEXT,
    approved_at TIMESTAMP,
    submitted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_pharmacies_owner_id ON pharmacies(owner_id);
CREATE INDEX IF NOT EXISTS idx_pharmacies_slug ON pharmacies(slug);
CREATE INDEX IF NOT EXISTS idx_pharmacies_status ON pharmacies(status);
