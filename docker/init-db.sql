-- Database initialization script for PostgreSQL
-- This script is run when the PostgreSQL container is first created

-- Ensure the database exists
CREATE DATABASE IF NOT EXISTS creator_compass;
CREATE DATABASE IF NOT EXISTS creator_compass_dev;

-- Grant all privileges to the user
GRANT ALL PRIVILEGES ON DATABASE creator_compass TO creator_user;
GRANT ALL PRIVILEGES ON DATABASE creator_compass_dev TO creator_user;

-- Enable necessary extensions
\c creator_compass;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c creator_compass_dev;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";