-- DataPulse initial schema + minimal seed for local development
-- Compatible with MySQL 8+

CREATE DATABASE IF NOT EXISTS aad_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE aad_db;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS shipments;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS stores;
DROP TABLE IF EXISTS customer_profiles;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  id BIGINT NOT NULL AUTO_INCREMENT,
  email VARCHAR(150) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role_type VARCHAR(30) NOT NULL,
  first_name VARCHAR(80),
  last_name VARCHAR(80),
  gender VARCHAR(20),
  is_active BIT(1),
  created_at DATETIME(6),
  updated_at DATETIME(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_email (email)
);

CREATE TABLE categories (
  id BIGINT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  parent_id BIGINT,
  created_at DATETIME(6),
  PRIMARY KEY (id),
  CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories (id)
);

CREATE TABLE stores (
  id BIGINT NOT NULL AUTO_INCREMENT,
  owner_id BIGINT NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  status VARCHAR(30),
  country VARCHAR(255),
  city VARCHAR(255),
  created_at DATETIME(6),
  updated_at DATETIME(6),
  PRIMARY KEY (id),
  KEY idx_stores_owner_id (owner_id),
  KEY idx_stores_status (status),
  KEY idx_stores_city (city),
  CONSTRAINT fk_stores_owner FOREIGN KEY (owner_id) REFERENCES users (id)
);

CREATE TABLE customer_profiles (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  age INT,
  city VARCHAR(255),
  country VARCHAR(255),
  membership_type VARCHAR(30),
  total_spend DECIMAL(12,2),
  items_purchased INT,
  avg_rating DECIMAL(3,2),
  discount_applied BIT(1),
  satisfaction_level VARCHAR(30),
  created_at DATETIME(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_customer_profiles_user_id (user_id),
  CONSTRAINT fk_customer_profiles_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE products (
  id BIGINT NOT NULL AUTO_INCREMENT,
  store_id BIGINT NOT NULL,
  category_id BIGINT,
  sku VARCHAR(100),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  unit_price DECIMAL(10,2) NOT NULL,
  stock_quantity INT,
  importance VARCHAR(30),
  is_active BIT(1),
  created_at DATETIME(6),
  updated_at DATETIME(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_products_sku (sku),
  KEY idx_products_store_id (store_id),
  KEY idx_products_category_id (category_id),
  KEY idx_products_name (name),
  CONSTRAINT fk_products_store FOREIGN KEY (store_id) REFERENCES stores (id),
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories (id)
);

CREATE TABLE orders (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  store_id BIGINT NOT NULL,
  status VARCHAR(30),
  payment_method VARCHAR(30),
  fulfilment VARCHAR(30),
  sales_channel VARCHAR(80),
  grand_total DECIMAL(12,2) NOT NULL,
  currency VARCHAR(10),
  notes TEXT,
  ordered_at DATETIME(6),
  updated_at DATETIME(6),
  PRIMARY KEY (id),
  KEY idx_orders_user_id (user_id),
  KEY idx_orders_store_id (store_id),
  KEY idx_orders_status (status),
  KEY idx_orders_ordered_at (ordered_at),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT fk_orders_store FOREIGN KEY (store_id) REFERENCES stores (id)
);

CREATE TABLE order_items (
  id BIGINT NOT NULL AUTO_INCREMENT,
  order_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  discount DECIMAL(5,2),
  PRIMARY KEY (id),
  KEY idx_order_items_order_id (order_id),
  KEY idx_order_items_product_id (product_id),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders (id),
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products (id)
);

CREATE TABLE shipments (
  id BIGINT NOT NULL AUTO_INCREMENT,
  order_id BIGINT NOT NULL,
  tracking_number VARCHAR(100),
  warehouse_block VARCHAR(50),
  mode_of_shipment VARCHAR(30),
  ship_service_level VARCHAR(30),
  carrier VARCHAR(255),
  customer_care_calls INT,
  customer_rating INT,
  cost_of_product DECIMAL(10,2),
  prior_purchases INT,
  discount_offered DECIMAL(5,2),
  status VARCHAR(30),
  estimated_delivery DATE,
  actual_delivery DATE,
  created_at DATETIME(6),
  updated_at DATETIME(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_shipments_order_id (order_id),
  KEY idx_shipments_status (status),
  KEY idx_shipments_tracking_number (tracking_number),
  CONSTRAINT fk_shipments_order FOREIGN KEY (order_id) REFERENCES orders (id)
);

CREATE TABLE reviews (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  order_id BIGINT,
  star_rating INT NOT NULL,
  title VARCHAR(255),
  body TEXT,
  helpful_votes INT,
  total_votes INT,
  sentiment VARCHAR(30),
  marketplace VARCHAR(50),
  verified BIT(1),
  created_at DATETIME(6),
  PRIMARY KEY (id),
  KEY idx_reviews_user_id (user_id),
  KEY idx_reviews_product_id (product_id),
  KEY idx_reviews_order_id (order_id),
  KEY idx_reviews_star_rating (star_rating),
  CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products (id),
  CONSTRAINT fk_reviews_order FOREIGN KEY (order_id) REFERENCES orders (id)
);

CREATE TABLE refresh_tokens (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  token VARCHAR(512) NOT NULL,
  expires_at DATETIME(6) NOT NULL,
  revoked BIT(1),
  created_at DATETIME(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_refresh_tokens_token (token),
  KEY idx_refresh_tokens_user_id (user_id),
  KEY idx_refresh_tokens_expires_at (expires_at),
  KEY idx_refresh_tokens_revoked (revoked),
  CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE audit_logs (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(80),
  entity_id BIGINT,
  details TEXT,
  ip_address VARCHAR(45),
  created_at DATETIME(6),
  PRIMARY KEY (id),
  KEY idx_audit_logs_user_id (user_id),
  KEY idx_audit_logs_entity (entity_type, entity_id),
  KEY idx_audit_logs_created_at (created_at),
  CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Minimal seed data (safe for demo/dev)
INSERT INTO users (id, email, password_hash, role_type, first_name, last_name, gender, is_active, created_at, updated_at) VALUES
  (1, 'admin@datapulse.local', '$2a$10$7EqJtq98hPqEX7fNZaFWoO5.2a6Yqq/RSBksiBeIV/pY5Pja/q', 'ADMIN', 'Admin', 'User', 'OTHER', b'1', NOW(), NOW()),
  (2, 'corp@datapulse.local', '$2a$10$7EqJtq98hPqEX7fNZaFWoO5.2a6Yqq/RSBksiBeIV/pY5Pja/q', 'CORPORATE', 'Corp', 'Owner', 'OTHER', b'1', NOW(), NOW()),
  (3, 'customer@datapulse.local', '$2a$10$7EqJtq98hPqEX7fNZaFWoO5.2a6Yqq/RSBksiBeIV/pY5Pja/q', 'INDIVIDUAL', 'Jane', 'Customer', 'FEMALE', b'1', NOW(), NOW());

INSERT INTO stores (id, owner_id, name, description, status, country, city, created_at, updated_at) VALUES
  (1, 2, 'DataPulse Demo Store', 'Demo store for local setup', 'OPEN', 'Turkey', 'Istanbul', NOW(), NOW());

INSERT INTO categories (id, name, parent_id, created_at) VALUES
  (1, 'Electronics', NULL, NOW()),
  (2, 'Fashion', NULL, NOW());

INSERT INTO products (id, store_id, category_id, sku, name, description, unit_price, stock_quantity, importance, is_active, created_at, updated_at) VALUES
  (1, 1, 1, 'SKU-1001', 'Wireless Headphones', 'Demo product', 1499.90, 25, 'HIGH', b'1', NOW(), NOW()),
  (2, 1, 2, 'SKU-1002', 'Classic T-Shirt', 'Demo product', 299.90, 80, 'MEDIUM', b'1', NOW(), NOW());

INSERT INTO customer_profiles (id, user_id, age, city, country, membership_type, total_spend, items_purchased, avg_rating, discount_applied, satisfaction_level, created_at) VALUES
  (1, 3, 28, 'Istanbul', 'Turkey', 'GOLD', 1799.80, 6, 4.70, b'1', 'HIGH', NOW());

