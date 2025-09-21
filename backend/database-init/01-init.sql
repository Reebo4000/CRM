-- Database initialization script for Gemini CRM
-- This script runs when the PostgreSQL container starts for the first time

-- Create extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Set timezone
SET timezone = 'UTC';

-- Create database if it doesn't exist (for development)
SELECT 'CREATE DATABASE gemini_crm'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'gemini_crm')\gexec

-- Create database if it doesn't exist (for production)
SELECT 'CREATE DATABASE gemini_crm_prod'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'gemini_crm_prod')\gexec

-- Create a read-only user for reporting (optional)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'gemini_readonly') THEN
        CREATE ROLE gemini_readonly WITH LOGIN PASSWORD 'readonly123';
    END IF;
END
$$;

-- Grant connect privileges
GRANT CONNECT ON DATABASE gemini_crm TO gemini_readonly;
GRANT CONNECT ON DATABASE gemini_crm_prod TO gemini_readonly;

-- Note: Table-specific permissions will be granted after Sequelize creates the tables
