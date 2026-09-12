-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: localhost    Database: denla
-- ------------------------------------------------------
-- Server version	8.0.41

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `denla`
--

/*!40000 DROP DATABASE IF EXISTS `denla`*/;

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `denla` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `denla`;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `user_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_entity_type` (`entity_type`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cart`
--

DROP TABLE IF EXISTS `cart`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart`
--

LOCK TABLES `cart` WRITE;
/*!40000 ALTER TABLE `cart` DISABLE KEYS */;
/*!40000 ALTER TABLE `cart` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cash_register`
--

DROP TABLE IF EXISTS `cash_register`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cash_register` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `terminal_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cashier_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `opening_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `closing_date` datetime DEFAULT NULL,
  `opening_balance` decimal(12,2) NOT NULL DEFAULT '0.00',
  `closing_balance` decimal(12,2) DEFAULT NULL,
  `total_sales` decimal(12,2) DEFAULT '0.00',
  `total_cash_sales` decimal(12,2) DEFAULT '0.00',
  `total_card_sales` decimal(12,2) DEFAULT '0.00',
  `total_mpesa_sales` decimal(12,2) DEFAULT '0.00',
  `expected_cash` decimal(12,2) DEFAULT NULL,
  `actual_cash` decimal(12,2) DEFAULT NULL,
  `cash_difference` decimal(12,2) DEFAULT NULL,
  `status` enum('open','closed') COLLATE utf8mb4_unicode_ci DEFAULT 'open',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_terminal_id` (`terminal_id`),
  KEY `idx_cashier_id` (`cashier_id`),
  KEY `idx_opening_date` (`opening_date`),
  KEY `idx_status` (`status`),
  CONSTRAINT `cash_register_ibfk_1` FOREIGN KEY (`cashier_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cash_register`
--

LOCK TABLES `cash_register` WRITE;
/*!40000 ALTER TABLE `cash_register` DISABLE KEYS */;
/*!40000 ALTER TABLE `cash_register` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `parent_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `sort_order` int DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `icon` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_code` (`code`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_is_active` (`is_active`),
  CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES ('b8960797-add9-11f1-8a5c-0250f227b463','Groceries','GRC','General grocery items',NULL,1,0,'2026-09-11 15:10:04','2026-09-11 15:10:04',NULL,NULL,NULL,NULL),('b89676f6-add9-11f1-8a5c-0250f227b463','Beverages','BEV','Drinks and beverages',NULL,1,0,'2026-09-11 15:10:04','2026-09-11 15:10:04',NULL,NULL,NULL,NULL),('b8967ac2-add9-11f1-8a5c-0250f227b463','Dairy Products','DAI','Milk, cheese, yogurt',NULL,1,0,'2026-09-11 15:10:04','2026-09-11 15:10:04',NULL,NULL,NULL,NULL),('b8967ccc-add9-11f1-8a5c-0250f227b463','Meat & Poultry','MEA','Fresh and frozen meat',NULL,1,0,'2026-09-11 15:10:04','2026-09-11 15:10:04',NULL,NULL,NULL,NULL),('b8967eba-add9-11f1-8a5c-0250f227b463','Fruits & Vegetables','FRU','Fresh produce',NULL,1,0,'2026-09-11 15:10:04','2026-09-11 15:10:04',NULL,NULL,NULL,NULL),('b8968098-add9-11f1-8a5c-0250f227b463','Bakery','BAK','Bread and baked goods',NULL,1,0,'2026-09-11 15:10:04','2026-09-11 15:10:04',NULL,NULL,NULL,NULL),('b8968249-add9-11f1-8a5c-0250f227b463','Household Items','HOU','Cleaning and household supplies',NULL,1,0,'2026-09-11 15:10:04','2026-09-11 15:10:04',NULL,NULL,NULL,NULL),('b8968486-add9-11f1-8a5c-0250f227b463','Personal Care','PER','Toiletries and personal care',NULL,1,0,'2026-09-11 15:10:04','2026-09-11 15:10:04',NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contact_messages`
--

DROP TABLE IF EXISTS `contact_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contact_messages` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('unread','read','replied') COLLATE utf8mb4_unicode_ci DEFAULT 'unread',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contact_messages`
--

LOCK TABLES `contact_messages` WRITE;
/*!40000 ALTER TABLE `contact_messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `contact_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `customer_type` enum('regular','wholesale','vip') COLLATE utf8mb4_unicode_ci DEFAULT 'regular',
  `loyalty_points` int DEFAULT '0',
  `credit_limit` decimal(12,2) DEFAULT '0.00',
  `current_balance` decimal(12,2) DEFAULT '0.00',
  `is_active` tinyint(1) DEFAULT '1',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_phone` (`phone`),
  KEY `idx_email` (`email`),
  KEY `idx_customer_type` (`customer_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES ('10dd93bc-949f-429e-907d-ccef5bbcca0b','Walk-in Customer',NULL,NULL,NULL,'regular',0,0.00,0.00,1,NULL,'2026-09-11 15:11:48','2026-09-11 15:11:48'),('94e746d8-fdad-4893-9ba2-f2480e6af8df','Jane Doe','jane@example.com','+254700111222',NULL,'regular',0,0.00,0.00,1,NULL,'2026-09-11 15:11:48','2026-09-11 15:11:48'),('a52f4b6a-0699-4ebd-9252-536a222029d0','ABC Restaurant','orders@abcrestaurant.com','+254700333444',NULL,'wholesale',0,100000.00,0.00,1,NULL,'2026-09-11 15:11:48','2026-09-11 15:11:48'),('ec1a3a13-548f-4c39-bd9d-639aa6004fc1','XYZ Hotel','procurement@xyzhotel.com','+254700555666',NULL,'wholesale',0,200000.00,0.00,1,NULL,'2026-09-11 15:11:48','2026-09-11 15:11:48');
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `daily_sales_report`
--

DROP TABLE IF EXISTS `daily_sales_report`;
/*!50001 DROP VIEW IF EXISTS `daily_sales_report`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `daily_sales_report` AS SELECT 
 1 AS `date`,
 1 AS `transactions_count`,
 1 AS `total_sales`,
 1 AS `subtotal`,
 1 AS `total_tax`,
 1 AS `total_discount`,
 1 AS `average_sale`,
 1 AS `cash_sales`,
 1 AS `card_sales`,
 1 AS `mpesa_sales`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `daily_sales_summary`
--

DROP TABLE IF EXISTS `daily_sales_summary`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `daily_sales_summary` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `summary_date` date NOT NULL,
  `total_sales` decimal(12,2) DEFAULT '0.00',
  `total_transactions` int DEFAULT '0',
  `total_customers` int DEFAULT '0',
  `total_items_sold` decimal(12,2) DEFAULT '0.00',
  `total_profit` decimal(12,2) DEFAULT '0.00',
  `cash_sales` decimal(12,2) DEFAULT '0.00',
  `card_sales` decimal(12,2) DEFAULT '0.00',
  `mpesa_sales` decimal(12,2) DEFAULT '0.00',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `summary_date` (`summary_date`),
  KEY `idx_summary_date` (`summary_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `daily_sales_summary`
--

LOCK TABLES `daily_sales_summary` WRITE;
/*!40000 ALTER TABLE `daily_sales_summary` DISABLE KEYS */;
/*!40000 ALTER TABLE `daily_sales_summary` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expenses`
--

DROP TABLE IF EXISTS `expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expenses` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `expense_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` enum('rent','utilities','salaries','supplies','maintenance','transport','other') COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `expense_date` date NOT NULL,
  `payment_method` enum('cash','card','bank_transfer','cheque') COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approved_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recorded_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `expense_number` (`expense_number`),
  KEY `approved_by` (`approved_by`),
  KEY `recorded_by` (`recorded_by`),
  KEY `idx_expense_date` (`expense_date`),
  KEY `idx_category` (`category`),
  CONSTRAINT `expenses_ibfk_1` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `expenses_ibfk_2` FOREIGN KEY (`recorded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expenses`
--

LOCK TABLES `expenses` WRITE;
/*!40000 ALTER TABLE `expenses` DISABLE KEYS */;
/*!40000 ALTER TABLE `expenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `expiring_products`
--

DROP TABLE IF EXISTS `expiring_products`;
/*!50001 DROP VIEW IF EXISTS `expiring_products`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `expiring_products` AS SELECT 
 1 AS `batch_id`,
 1 AS `product_name`,
 1 AS `sku`,
 1 AS `batch_number`,
 1 AS `expiry_date`,
 1 AS `quantity`,
 1 AS `days_to_expiry`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `low_stock_products`
--

DROP TABLE IF EXISTS `low_stock_products`;
/*!50001 DROP VIEW IF EXISTS `low_stock_products`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `low_stock_products` AS SELECT 
 1 AS `id`,
 1 AS `name`,
 1 AS `sku`,
 1 AS `barcode`,
 1 AS `current_stock`,
 1 AS `minimum_stock`,
 1 AS `reorder_quantity`,
 1 AS `category_name`,
 1 AS `supplier_name`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `mpesa_transactions`
--

DROP TABLE IF EXISTS `mpesa_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mpesa_transactions` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `merchant_request_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `checkout_request_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone_number` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `account_reference` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `transaction_desc` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `result_code` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `result_desc` text COLLATE utf8mb4_unicode_ci,
  `mpesa_receipt_number` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `transaction_date` datetime DEFAULT NULL,
  `status` enum('pending','completed','failed','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `checkout_request_id` (`checkout_request_id`),
  KEY `idx_checkout_request` (`checkout_request_id`),
  KEY `idx_phone` (`phone_number`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mpesa_transactions`
--

LOCK TABLES `mpesa_transactions` WRITE;
/*!40000 ALTER TABLE `mpesa_transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `mpesa_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `order_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `user_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `status` enum('pending','processing','shipped','delivered','cancelled','refunded') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `payment_status` enum('pending','paid','failed','refunded') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `payment_method` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shipping_address` json DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_batches`
--

DROP TABLE IF EXISTS `product_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_batches` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `product_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `manufacture_date` date DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `cost_price` decimal(10,2) DEFAULT NULL,
  `supplier_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `received_date` date DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `supplier_id` (`supplier_id`),
  KEY `idx_product_id` (`product_id`),
  KEY `idx_expiry_date` (`expiry_date`),
  KEY `idx_batch_number` (`batch_number`),
  CONSTRAINT `product_batches_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `product_batches_ibfk_2` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_batches`
--

LOCK TABLES `product_batches` WRITE;
/*!40000 ALTER TABLE `product_batches` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_sales_analytics`
--

DROP TABLE IF EXISTS `product_sales_analytics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_sales_analytics` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `product_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` date NOT NULL,
  `quantity_sold` decimal(10,2) DEFAULT '0.00',
  `total_revenue` decimal(12,2) DEFAULT '0.00',
  `total_profit` decimal(12,2) DEFAULT '0.00',
  `number_of_transactions` int DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_product_date` (`product_id`,`date`),
  KEY `idx_date` (`date`),
  KEY `idx_product_id` (`product_id`),
  CONSTRAINT `product_sales_analytics_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_sales_analytics`
--

LOCK TABLES `product_sales_analytics` WRITE;
/*!40000 ALTER TABLE `product_sales_analytics` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_sales_analytics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sku` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `barcode` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `unit_of_measure` enum('piece','kg','g','liter','ml','box','pack','dozen') COLLATE utf8mb4_unicode_ci DEFAULT 'piece',
  `cost_price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `selling_price` decimal(10,2) NOT NULL,
  `wholesale_price` decimal(10,2) DEFAULT NULL,
  `minimum_price` decimal(10,2) DEFAULT NULL,
  `current_stock` decimal(10,2) DEFAULT '0.00',
  `minimum_stock` decimal(10,2) DEFAULT '10.00',
  `maximum_stock` decimal(10,2) DEFAULT '1000.00',
  `reorder_quantity` decimal(10,2) DEFAULT '50.00',
  `is_active` tinyint(1) DEFAULT '1',
  `is_taxable` tinyint(1) DEFAULT '1',
  `tax_rate` decimal(5,2) DEFAULT '0.00',
  `has_expiry` tinyint(1) DEFAULT '0',
  `default_supplier_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `views_count` int DEFAULT '0',
  `is_featured` tinyint(1) DEFAULT '0',
  `is_deal` tinyint(1) DEFAULT '0',
  `is_new_arrival` tinyint(1) DEFAULT '0',
  `brand` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `low_stock_threshold` int DEFAULT '10',
  `specifications` json DEFAULT NULL,
  `meta_title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meta_description` text COLLATE utf8mb4_unicode_ci,
  `meta_keywords` text COLLATE utf8mb4_unicode_ci,
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price` decimal(10,2) DEFAULT '0.00',
  `old_price` decimal(10,2) DEFAULT NULL,
  `stock` int DEFAULT '0',
  `images` json DEFAULT NULL,
  `condition` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'new',
  PRIMARY KEY (`id`),
  UNIQUE KEY `sku` (`sku`),
  UNIQUE KEY `barcode` (`barcode`),
  KEY `default_supplier_id` (`default_supplier_id`),
  KEY `idx_sku` (`sku`),
  KEY `idx_barcode` (`barcode`),
  KEY `idx_category` (`category_id`),
  KEY `idx_name` (`name`),
  KEY `idx_is_active` (`is_active`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `products_ibfk_2` FOREIGN KEY (`default_supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES ('005cec24-159e-44e3-a2c9-c129f1283eea','Fry Mate Cooking Fat 1kg','FRY-MATE-COOKING-FAT',NULL,'b8960797-add9-11f1-8a5c-0250f227b463','Kapa Oil Refineries - Kenya','piece',247.50,330.00,NULL,NULL,45.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:21',0,0,0,0,'Kapa Oil Refineries',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/fry mate cooking fat.jpg\"]','new'),('008b498d-e380-4df4-b255-9696059ef444','Golden Fry Cooking Oil 1L','GOLDEN-FRY-COOKING-O',NULL,'b8960797-add9-11f1-8a5c-0250f227b463','Bidco Africa - Kenya','piece',225.00,300.00,NULL,NULL,47.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:59','2026-09-12 09:04:21',0,0,0,0,'Bidco Africa',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/goldenfry.jpg\"]','new'),('01d50d54-8bed-4d9a-870a-c69353971335','Ketepa Pride Tea Leaves 250g','KETEPA-PRIDE-TEA-LEA',NULL,'b89676f6-add9-11f1-8a5c-0250f227b463','Ketepa - Kenya','piece',157.50,210.00,NULL,NULL,58.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:21',0,0,0,0,'Ketepa',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/ketepa.jpg\"]','new'),('081b2a21-0a1c-4575-b7f9-ac6e370a1058','Soap Bar','HOU001','1234567890041','b8968249-add9-11f1-8a5c-0250f227b463',NULL,'piece',40.00,65.00,58.50,55.25,300.00,10.00,1000.00,50.00,1,1,16.00,0,'c9ac7085-c6bb-4edb-a921-a0de689ff7ef',NULL,NULL,'2026-09-11 15:11:48','2026-09-12 09:04:21',0,0,0,0,NULL,10,NULL,NULL,NULL,NULL,NULL,65.00,NULL,300,'[\"/img/items/dettol soap.jpg\"]','new'),('08e8d8ea-db04-4490-8b8b-85ffb7f8af9a','Rosy Toilet Paper 2 Ply 4-Pack','ROSY-TOILET-PAPER-2-',NULL,'b8968249-add9-11f1-8a5c-0250f227b463','Kim-Fay East Africa - Kenya','piece',150.00,200.00,NULL,NULL,69.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:59','2026-09-12 09:04:21',0,0,0,0,'Kim-Fay East Africa',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/rossy tissue paper.jpg\"]','new'),('0d35a4fd-6d23-4d3e-9c41-4d06a14259c1','Cadbury Drinking Chocolate 400g','CADBURY-DRINKING-CHO',NULL,'b89676f6-add9-11f1-8a5c-0250f227b463','Mondelez - International','piece',337.50,450.00,NULL,NULL,51.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:20',0,0,0,0,'Mondelez',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/cadbury drinking chocolate.jpg\"]','new'),('0d6da1b7-c0f7-4066-bc2d-6f79f4d13433','Brookside Lala 500ml','BROOKSIDE-LALA-500ML',NULL,'b8960797-add9-11f1-8a5c-0250f227b463','Brookside Dairy - Kenya','piece',60.00,80.00,NULL,NULL,47.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:20',0,0,0,0,'Brookside Dairy',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/brookside fresh milk.jpg\"]','new'),('0e07c1d7-529e-40db-9543-8b6e09b9b00d','Toilet Paper - 4 Roll','HOU003','1234567890043','b8968249-add9-11f1-8a5c-0250f227b463',NULL,'pack',120.00,180.00,162.00,153.00,200.00,10.00,1000.00,50.00,1,1,16.00,0,'c9ac7085-c6bb-4edb-a921-a0de689ff7ef',NULL,NULL,'2026-09-11 15:11:48','2026-09-12 09:04:21',0,0,0,0,NULL,10,NULL,NULL,NULL,NULL,NULL,180.00,NULL,200,'[\"/img/items/rossy tissue paper.jpg\"]','new'),('0ed36a07-b98d-464d-a91b-ddd66804ae7d','Fay Tissues Pocket Pack','FAY-TISSUES-POCKET-P',NULL,'b8968249-add9-11f1-8a5c-0250f227b463','Kim-Fay East Africa - Kenya','piece',30.00,40.00,NULL,NULL,44.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:59','2026-09-11 16:58:59',0,0,0,0,'Kim-Fay East Africa',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,NULL,'new'),('1131fc41-e526-4aaa-b4d2-65c3e68988d3','Pembe Maize Meal 2kg','PEMBE-MAIZE-MEAL-2KG',NULL,'b8960797-add9-11f1-8a5c-0250f227b463','Pembe Flour Mills - Kenya','piece',112.50,150.00,NULL,NULL,29.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:21',0,0,0,0,'Pembe Flour Mills',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/pembemaizeflour.jpg\"]','new'),('12ed62ec-fe99-4467-a983-c5291a5703e4','Butter - 500g','DAI003','1234567890023','b8967ac2-add9-11f1-8a5c-0250f227b463',NULL,'g',180.00,250.00,225.00,212.50,100.00,10.00,1000.00,50.00,1,1,16.00,1,'b03fcc44-ad25-486f-9def-ec268fcad807',NULL,NULL,'2026-09-11 15:11:48','2026-09-11 16:36:48',0,0,0,0,NULL,10,NULL,NULL,NULL,NULL,NULL,250.00,NULL,100,NULL,'new'),('16bec60b-3347-4903-9412-80bdf91990fb','Afia Juice Mango 500ml','AFIA-JUICE-MANGO-500',NULL,'b89676f6-add9-11f1-8a5c-0250f227b463','Kevian Kenya - Kenya','piece',52.50,70.00,NULL,NULL,61.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:20',0,0,0,0,'Kevian Kenya',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/afia drink.jpg\"]','new'),('17846000-cec4-4173-91a7-1a40ed02e6b5','Toilex Toilet Paper 1 Ply Single','TOILEX-TOILET-PAPER-',NULL,'b8968249-add9-11f1-8a5c-0250f227b463','Chandaria Industries - Kenya','piece',22.50,30.00,NULL,NULL,23.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:59','2026-09-12 09:04:21',0,0,0,0,'Chandaria Industries',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/rossy tissue paper.jpg\"]','new'),('1c3f38b3-09e5-43a6-af3f-02fbbca5dc86','Tropical Heat Pilau Masala 100g','TROPICAL-HEAT-PILAU-',NULL,'b8960797-add9-11f1-8a5c-0250f227b463','Deepa Industries - Kenya','piece',112.50,150.00,NULL,NULL,30.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:59','2026-09-12 09:04:21',0,0,0,0,'Deepa Industries',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/tropical heat.jpg\"]','new'),('1cbfc247-568c-412f-88a3-bd1b89d32061','Panga Bar Soap 1kg','PANGA-BAR-SOAP-1KG',NULL,'b8968249-add9-11f1-8a5c-0250f227b463','Kapa Oil Refineries - Kenya','piece',135.00,180.00,NULL,NULL,57.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:21',0,0,0,0,'Kapa Oil Refineries',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/dettol soap.jpg\"]','new'),('2059b85e-4284-43cd-9a40-83bf79735ccf','Harpic Toilet Cleaner 500ml','HARPIC-TOILET-CLEANE',NULL,'b8968249-add9-11f1-8a5c-0250f227b463','Reckitt Bencwiser - Kenya','piece',195.00,260.00,NULL,NULL,42.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-11 16:58:58',0,0,0,0,'Reckitt Bencwiser',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,NULL,'new'),('22849bde-6b42-4356-ae40-ea1c3b4d2b3f','Del Monte Mango Juice 1L','DEL-MONTE-MANGO-JUIC',NULL,'b89676f6-add9-11f1-8a5c-0250f227b463','Del Monte Kenya - Kenya','piece',157.50,210.00,NULL,NULL,32.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:21',0,0,0,0,'Del Monte Kenya',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/delmonte juice.jpg\"]','new'),('24ccceb4-1e68-4571-96d2-8c3e31392753','Nuru Weetabix 450g','NURU-WEETABIX-450G',NULL,'b8960797-add9-11f1-8a5c-0250f227b463','Weetabix East Africa - Kenya','piece',210.00,280.00,NULL,NULL,38.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:21',0,0,0,0,'Weetabix East Africa',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/nruru weetabix.jpg\"]','new'),('27f5beea-ace5-4e5e-b24b-e2587afedda4','Coca-Cola 500ml','COCA-COLA-500ML',NULL,'b89676f6-add9-11f1-8a5c-0250f227b463','Coca-Cola - Kenya','piece',45.00,60.00,NULL,NULL,26.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:21',0,0,0,0,'Coca-Cola',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/cocacola drink.jpg\"]','new'),('2bd0d49b-73ee-4c80-88cf-5b941bb57a41','Imperial Leather Soap Classic 125g','IMPERIAL-LEATHER-SOA',NULL,'b8968486-add9-11f1-8a5c-0250f227b463','PZ Cussons - Kenya','piece',82.50,110.00,NULL,NULL,57.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:59','2026-09-12 09:04:21',0,0,0,0,'PZ Cussons',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/imperial leather.jpg\"]','new'),('2d5ac23e-4c5b-4b57-99db-22578d3ad587','Coca Cola - 500ml','BEV001','1234567890011','b89676f6-add9-11f1-8a5c-0250f227b463',NULL,'piece',30.00,50.00,45.00,42.50,600.00,10.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 15:11:48','2026-09-12 09:04:21',0,0,0,0,NULL,10,NULL,NULL,NULL,NULL,NULL,50.00,NULL,600,'[\"/img/items/cocacola drink.jpg\"]','new'),('2d715450-8dd4-4693-a0c2-4734f137783f','Rina Cooking Fat 1kg','RINA-COOKING-FAT-1KG',NULL,'b8960797-add9-11f1-8a5c-0250f227b463','Pwani Oil - Kenya','piece',240.00,320.00,NULL,NULL,44.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:21',0,0,0,0,'Pwani Oil',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/rina cooking fat.jpg\"]','new'),('30b571b9-c10d-4811-a2ad-c14b03f9fb55','Cadbury Dairy Milk Chocolate 40g','CADBURY-DAIRY-MILK-C',NULL,'b8960797-add9-11f1-8a5c-0250f227b463','Mondelez - International','piece',82.50,110.00,NULL,NULL,58.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:20',0,0,0,0,'Mondelez',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/cadbury drinking chocolate.jpg\"]','new'),('339aa945-c27e-46cf-bbfe-f72ad8a41b92','Rice - 1kg','GRC001','1234567890001','b8960797-add9-11f1-8a5c-0250f227b463',NULL,'kg',80.00,120.00,108.00,102.00,500.00,10.00,1000.00,50.00,1,1,16.00,0,'c9ac7085-c6bb-4edb-a921-a0de689ff7ef',NULL,NULL,'2026-09-11 15:11:48','2026-09-12 09:04:21',0,0,0,0,NULL,10,NULL,NULL,NULL,NULL,NULL,120.00,NULL,500,'[\"/img/items/daawatrice.jpg\"]','new'),('36f59ea8-da9e-4c30-bddb-475c451187cd','Jik Bleach Regular 500ml','JIK-BLEACH-REGULAR-5',NULL,'b8968249-add9-11f1-8a5c-0250f227b463','Reckitt Bencwiser - Kenya','piece',120.00,160.00,NULL,NULL,60.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:21',0,0,0,0,'Reckitt Bencwiser',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/jik bleaching.jpg\"]','new'),('37f92af0-d5c6-4428-a4fd-3cb518b0ae3e','Fernleaf Milk Powder 400g','FERNLEAF-MILK-POWDER',NULL,'b8967ac2-add9-11f1-8a5c-0250f227b463','Fonterra - New Zealand','piece',487.50,650.00,NULL,NULL,22.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:21',0,0,0,0,'Fonterra',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/brookside fresh milk.jpg\"]','new'),('3877bc73-5388-4a1a-b2fd-0bd1ab420049','Hanifa Toilet Paper 1 Ply 4-Pack','HANIFA-TOILET-PAPER-',NULL,'b8968249-add9-11f1-8a5c-0250f227b463','Chandaria Industries - Kenya','piece',90.00,120.00,NULL,NULL,38.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:59','2026-09-12 09:04:21',0,0,0,0,'Chandaria Industries',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/rossy tissue paper.jpg\"]','new'),('3e60ee60-d053-4416-b5fc-cb2292114ac7','Mortein Doom Insecticide 400ml','MORTEIN-DOOM-INSECTI',NULL,'b8968249-add9-11f1-8a5c-0250f227b463','Reckitt Bencwiser - Kenya','piece',337.50,450.00,NULL,NULL,45.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:59','2026-09-12 09:04:21',0,0,0,0,'Reckitt Bencwiser',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/mortein doom.jpg\"]','new'),('46c222cf-a3c7-4d83-a3da-f7dfe39b4ad1','Tropical Sweets Pack','TROPICAL-SWEETS-PACK',NULL,'b8960797-add9-11f1-8a5c-0250f227b463','Kenafric Industries - Kenya','piece',90.00,120.00,NULL,NULL,21.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:21',0,0,0,0,'Kenafric Industries',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/tropical heat.jpg\"]','new'),('46d26518-b3e0-45d3-9459-58c745b739d5','Elianto Corn Oil 1L','ELIANTO-CORN-OIL-1L',NULL,'b8960797-add9-11f1-8a5c-0250f227b463','Bidco Africa - Kenya','piece',315.00,420.00,NULL,NULL,63.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:59','2026-09-12 09:04:21',0,0,0,0,'Bidco Africa',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/eliantocorn.jpg\"]','new'),('4ee58e6a-1dbf-41e2-822a-c29662292eff','Matchboxes Ship Brand 10-Pack','MATCHBOXES-SHIP-BRAN',NULL,'b8968249-add9-11f1-8a5c-0250f227b463','Match Masters - Kenya','piece',37.50,50.00,NULL,NULL,61.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:59','2026-09-11 16:58:59',0,0,0,0,'Match Masters',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,NULL,'new'),('4f130f64-4f5c-49d5-a1c4-00258447165f','Nivea Men Cool Kick Lotion 400ml','NIVEA-MEN-COOL-KICK-',NULL,'b8968486-add9-11f1-8a5c-0250f227b463','Beiersdorf - Kenya','piece',435.00,580.00,NULL,NULL,69.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:59','2026-09-12 09:04:21',0,0,0,0,'Beiersdorf',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/nivea men.jpg\"]','new'),('528080d1-aded-4075-84dd-1de833d09a86','Stoney Tangawizi 500ml','STONEY-TANGAWIZI-500',NULL,'b89676f6-add9-11f1-8a5c-0250f227b463','Coca-Cola - Kenya','piece',48.75,65.00,NULL,NULL,64.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:21',0,0,0,0,'Coca-Cola',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/stoney tangawizi.jpg\"]','new'),('53bdf440-c1c9-452b-bc62-b486515dc89b','Orange Juice - 1L','BEV003','1234567890013','b89676f6-add9-11f1-8a5c-0250f227b463',NULL,'liter',80.00,120.00,108.00,102.00,150.00,10.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 15:11:48','2026-09-12 09:04:21',0,0,0,0,NULL,10,NULL,NULL,NULL,NULL,NULL,120.00,NULL,150,'[\"/img/items/delmonte juice.jpg\"]','new'),('540d477c-d508-4000-b46b-a4ad6f568f59','Urban Bites Potato Chips 120g','URBAN-BITES-POTATO-C',NULL,'b8960797-add9-11f1-8a5c-0250f227b463','Norda Industries - Kenya','piece',120.00,160.00,NULL,NULL,35.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:21',0,0,0,0,'Norda Industries',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/krustles potato crisps.jpg\"]','new'),('577217e3-72d1-49e7-b48a-fe699b9b7c92','Yogurt - 500ml','DAI002','1234567890022','b8967ac2-add9-11f1-8a5c-0250f227b463',NULL,'piece',50.00,80.00,72.00,68.00,150.00,10.00,1000.00,50.00,1,1,16.00,1,'b03fcc44-ad25-486f-9def-ec268fcad807',NULL,NULL,'2026-09-11 15:11:48','2026-09-11 16:36:48',0,0,0,0,NULL,10,NULL,NULL,NULL,NULL,NULL,80.00,NULL,150,NULL,'new'),('59eff452-a085-4f35-87fe-e629b9603800','Dasani Water 500ml','DASANI-WATER-500ML',NULL,'b89676f6-add9-11f1-8a5c-0250f227b463','Coca-Cola - Kenya','piece',30.00,40.00,NULL,NULL,31.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:21',0,0,0,0,'Coca-Cola',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/dasani water.jpg\"]','new'),('5a026fa8-41fa-43a4-ad66-c673e94093b3','Krustles Potato Crisps 50g','KRUSTLES-POTATO-CRIS',NULL,'b8960797-add9-11f1-8a5c-0250f227b463','Krush Foods - Kenya','piece',52.50,70.00,NULL,NULL,20.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:21',0,0,0,0,'Krush Foods',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/krustles potato crisps.jpg\"]','new'),('5b0f0e2e-76f8-4810-a41e-dae865b3ee36','Ariel Hand Wash Detergent 1kg','ARIEL-HAND-WASH-DETE',NULL,'b8968249-add9-11f1-8a5c-0250f227b463','Procter & Gamble - International','piece',307.50,410.00,NULL,NULL,54.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:20',0,0,0,0,'Procter & Gamble',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/ariel handwash [powder.jpg\"]','new'),('5cadd41a-20f6-491e-bbf4-cb3b5cef2e8e','Mineral Water - 500ml','BEV002','1234567890012','b89676f6-add9-11f1-8a5c-0250f227b463',NULL,'piece',20.00,35.00,31.50,29.75,800.00,10.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 15:11:48','2026-09-12 09:04:21',0,0,0,0,NULL,10,NULL,NULL,NULL,NULL,NULL,35.00,NULL,800,'[\"/img/items/dasani water.jpg\"]','new'),('5d90b2a9-f77d-4e59-90f5-934bed0f5f5f','Sugar - 2kg','GRC002','1234567890002','b8960797-add9-11f1-8a5c-0250f227b463',NULL,'kg',150.00,200.00,180.00,170.00,300.00,10.00,1000.00,50.00,1,1,16.00,0,'c9ac7085-c6bb-4edb-a921-a0de689ff7ef',NULL,NULL,'2026-09-11 15:11:48','2026-09-12 09:04:21',0,0,0,0,NULL,10,NULL,NULL,NULL,NULL,NULL,200.00,NULL,300,'[\"/img/items/kabrassugar.jpg\"]','new'),('5df63f59-64fd-4465-9f78-b186a05b97e8','Safari Pure Tea 250g','SAFARI-PURE-TEA-250G',NULL,'b89676f6-add9-11f1-8a5c-0250f227b463','Ketepa - Kenya','piece',172.50,230.00,NULL,NULL,45.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:21',0,0,0,0,'Ketepa',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/safari pure tea.jpg\"]','new'),('5ef9123b-980e-410b-bfca-81247bb1abb8','Kimbo Premium Cooking Fat 1kg','KIMBO-PREMIUM-COOKIN',NULL,'b8960797-add9-11f1-8a5c-0250f227b463','Bidco Africa - Kenya','piece',270.00,360.00,NULL,NULL,44.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:21',0,0,0,0,'Bidco Africa',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/kimbo cooking fat.jpg\"]','new'),('62900490-9eab-449a-9d0c-05fd820fc4f2','Ndovu Wheat Flour 2kg','NDOVU-WHEAT-FLOUR-2K',NULL,'b8960797-add9-11f1-8a5c-0250f227b463','Mombasa Maize Millers - Kenya','piece',127.50,170.00,NULL,NULL,39.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:21',0,0,0,0,'Mombasa Maize Millers',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/ndovu wheat flour.jpg\"]','new'),('63092a1b-5111-4e65-8b17-e1956fbd30f9','Nzoia Sugar 1kg','NZOIA-SUGAR-1KG',NULL,'b8960797-add9-11f1-8a5c-0250f227b463','Nzoia Sugar Company - Kenya','piece',112.50,150.00,NULL,NULL,33.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:59','2026-09-12 09:04:21',0,0,0,0,'Nzoia Sugar Company',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/nzoia sugar.jpg\"]','new'),('634921cc-0891-4c59-97b8-cc187ae566f3','Velvex Toilet Paper 2 Ply 4-Pack','VELVEX-TOILET-PAPER-',NULL,'b8968249-add9-11f1-8a5c-0250f227b463','Chandaria Industries - Kenya','piece',165.00,220.00,NULL,NULL,53.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:59','2026-09-12 09:04:21',0,0,0,0,'Chandaria Industries',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/velvex.jpg\"]','new'),('658f19c0-f591-4024-88a4-6df5812c4d31','Jogoo Maize Meal 2kg','JOGOO-MAIZE-MEAL-2KG',NULL,'b8960797-add9-11f1-8a5c-0250f227b463','Ungu Limited - Kenya','piece',116.25,155.00,NULL,NULL,46.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:21',0,0,0,0,'Ungu Limited',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/jogoomaizeflour.jpg\"]','new'),('699a58a3-89cc-4842-9743-f81149ddb4a6','KCC Mala 500ml','KCC-MALA-500ML',NULL,'b8960797-add9-11f1-8a5c-0250f227b463','New KCC - Kenya','piece',56.25,75.00,NULL,NULL,68.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:21',0,0,0,0,'New KCC',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/kcc fresh milk.jpg\"]','new'),('6c42682b-0e2a-4f53-8663-cdb3e2865dd5','Sunshine Bar Soap White 800g','SUNSHINE-BAR-SOAP-WH',NULL,'b8968249-add9-11f1-8a5c-0250f227b463','Pwani Oil - Kenya','piece',120.00,160.00,NULL,NULL,50.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:21',0,0,0,0,'Pwani Oil',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/dettol soap.jpg\"]','new'),('6e39944f-2334-4e62-913a-19318945b40b','Topex Bleach Regular 500ml','TOPEX-BLEACH-REGULAR',NULL,'b8968249-add9-11f1-8a5c-0250f227b463','Kapa Oil Refineries - Kenya','piece',90.00,120.00,NULL,NULL,36.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:21',0,0,0,0,'Kapa Oil Refineries',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/jik bleaching.jpg\"]','new'),('6f3967c5-76a7-4bbf-8b54-49fa4f61034b','Detergent - 1kg','HOU002','1234567890042','b8968249-add9-11f1-8a5c-0250f227b463',NULL,'kg',150.00,220.00,198.00,187.00,180.00,10.00,1000.00,50.00,1,1,16.00,0,'c9ac7085-c6bb-4edb-a921-a0de689ff7ef',NULL,NULL,'2026-09-11 15:11:48','2026-09-12 09:04:21',0,0,0,0,NULL,10,NULL,NULL,NULL,NULL,NULL,220.00,NULL,180,'[\"/img/items/toss detergents.jpg\"]','new'),('702cd54d-e94c-4557-a617-632d5724372c','Brookside Fresh Milk 1L','BROOKSIDE-FRESH-MILK',NULL,'b8967ac2-add9-11f1-8a5c-0250f227b463','Brookside Dairy - Kenya','piece',97.50,130.00,NULL,NULL,48.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:20',0,0,0,0,'Brookside Dairy',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/brookside fresh milk.jpg\"]','new'),('70af4bac-135a-4093-864c-ead91421be59','Lifebuoy Total 10 Soap 175g','LIFEBUOY-TOTAL-10-SO',NULL,'b8968486-add9-11f1-8a5c-0250f227b463','Unilever - Kenya','piece',97.50,130.00,NULL,NULL,39.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:59','2026-09-12 09:04:21',0,0,0,0,'Unilever',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/lifebuoy soap.jpg\"]','new'),('70da23a7-fc94-4a99-a34f-8febc2bb02e8','Bio Yoghurt Strawberry 450ml','BIO-YOGHURT-STRAWBER',NULL,'b8967ac2-add9-11f1-8a5c-0250f227b463','Bio Foods - Kenya','piece',120.00,160.00,NULL,NULL,30.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:20',0,0,0,0,'Bio Foods',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/bio yoghurt.jpg\"]','new'),('781206b7-518b-4794-b5f1-d50345671bbd','Ketepa Pride Tea Bags 50s','KETEPA-PRIDE-TEA-BAG',NULL,'b89676f6-add9-11f1-8a5c-0250f227b463','Ketepa - Kenya','piece',1200.00,1600.00,NULL,NULL,55.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:21',0,0,0,0,'Ketepa',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/ketepa.jpg\"]','new'),('78343a8e-011f-4784-a4d1-7197b05ac6a0','Betadine Antiseptic Solution 50ml','BETADINE-ANTISEPTIC-',NULL,'b8968486-add9-11f1-8a5c-0250f227b463','MundiPharma - International','piece',240.00,320.00,NULL,NULL,29.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:59','2026-09-11 16:58:59',0,0,0,0,'MundiPharma',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,NULL,'new'),('7968b791-bbfd-479d-9233-ada9d1a1d3ca','Valon Petroleum Jelly 250g','VALON-PETROLEUM-JELL',NULL,'b8968486-add9-11f1-8a5c-0250f227b463','Haco Industries - Kenya','piece',112.50,150.00,NULL,NULL,39.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:59','2026-09-12 09:04:21',0,0,0,0,'Haco Industries',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/valon lotion.jpg\"]','new'),('7fc81cb5-b6c7-4496-bbfc-de354701776f','Minute Maid Mango 1L','MINUTE-MAID-MANGO-1L',NULL,'b89676f6-add9-11f1-8a5c-0250f227b463','Coca-Cola - Kenya','piece',120.00,160.00,NULL,NULL,20.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:21',0,0,0,0,'Coca-Cola',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/minute maid.jpg\"]','new'),('82577549-f3c0-4cbc-946e-6be127206801','Raid Mosquito Spray 400ml','RAID-MOSQUITO-SPRAY-',NULL,'b8968249-add9-11f1-8a5c-0250f227b463','SC Johnson - International','piece',322.50,430.00,NULL,NULL,27.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:59','2026-09-11 16:58:59',0,0,0,0,'SC Johnson',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,NULL,'new'),('841b1325-ae09-468a-aac6-97ebedee0f7c','Keringet Mineral Water 1L','KERINGET-MINERAL-WAT',NULL,'b89676f6-add9-11f1-8a5c-0250f227b463','Crown Beverages - Kenya','piece',56.25,75.00,NULL,NULL,49.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:21',0,0,0,0,'Crown Beverages',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/keringet drinking wtaer.jpg\"]','new'),('869c97ec-4281-4db6-bff9-be5fa8f1bebe','Kiwi Shoe Polish Black 40ml','KIWI-SHOE-POLISH-BLA',NULL,'b8968249-add9-11f1-8a5c-0250f227b463','SC Johnson - Kenya','piece',67.50,90.00,NULL,NULL,61.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:59','2026-09-12 09:04:21',0,0,0,0,'SC Johnson',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/kiwi shoe polish.jpg\"]','new'),('86e2d3aa-d994-45cb-896f-f940d863bdcf','Nescafé Classic Coffee 100g','NESCAF-CLASSIC-COFFE',NULL,'b89676f6-add9-11f1-8a5c-0250f227b463','Nestlé - International','piece',390.00,520.00,NULL,NULL,56.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:21',0,0,0,0,'Nestlé',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/nescafe coffee.jpg\"]','new'),('8706363d-a659-4599-8383-ddf20fdad19f','Whale Bar Soap 800g','WHALE-BAR-SOAP-800G',NULL,'b8968249-add9-11f1-8a5c-0250f227b463','Bidco Africa - Kenya','piece',112.50,150.00,NULL,NULL,68.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:59','2026-09-12 09:04:21',0,0,0,0,'Bidco Africa',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/dettol soap.jpg\"]','new'),('878c38ad-ae68-4b56-872b-c2acc889a8d5','Exe All Purpose Flour 2kg','EXE-ALL-PURPOSE-FLOU',NULL,'b8960797-add9-11f1-8a5c-0250f227b463','Unga Limited - Kenya','piece',135.00,180.00,NULL,NULL,43.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:21',0,0,0,0,'Unga Limited',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/exeflour.jpg\"]','new'),('87ad7bcc-ac25-4119-a735-e94fbd44d01c','Ilara Milk 500ml','ILARA-MILK-500ML',NULL,'b8967ac2-add9-11f1-8a5c-0250f227b463','Brookside Dairy - Kenya','piece',45.00,60.00,NULL,NULL,35.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:21',0,0,0,0,'Brookside Dairy',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/ilara yoghurt.jpg\"]','new'),('89c45464-66da-4d89-9e23-e2930e708309','Zesta Plum Jam 500g','ZESTA-PLUM-JAM-500G',NULL,'b8960797-add9-11f1-8a5c-0250f227b463','Trufoods Limited - Kenya','piece',180.00,240.00,NULL,NULL,49.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:59','2026-09-12 09:04:21',0,0,0,0,'Trufoods Limited',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/jamaa soap.jpg\"]','new'),('8bfa44d5-6912-47e6-a66a-d5de96885cc4','Royco Mchuzi Mix Chicken 200g','ROYCO-MCHUZI-MIX-CHI',NULL,'b8960797-add9-11f1-8a5c-0250f227b463','Unilever - Kenya','piece',142.50,190.00,NULL,NULL,60.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:59','2026-09-12 09:04:21',0,0,0,0,'Unilever',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/royco mchuzi mix.jpg\"]','new'),('9207853e-2068-4a8b-8585-df32284921d7','Dolio Sunflower Oil 1L','DOLIO-SUNFLOWER-OIL-',NULL,'b8960797-add9-11f1-8a5c-0250f227b463','Bidco Africa - Kenya','piece',262.50,350.00,NULL,NULL,52.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:59','2026-09-12 09:04:21',0,0,0,0,'Bidco Africa',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/salit oil.jpg\"]','new'),('953bd758-63cb-4f81-a230-6c7b9f908813','Flour - 2kg','GRC004','1234567890004','b8960797-add9-11f1-8a5c-0250f227b463',NULL,'kg',100.00,150.00,135.00,127.50,400.00,10.00,1000.00,50.00,1,1,16.00,0,'c9ac7085-c6bb-4edb-a921-a0de689ff7ef',NULL,NULL,'2026-09-11 15:11:48','2026-09-12 09:04:21',0,0,0,0,NULL,10,NULL,NULL,NULL,NULL,NULL,150.00,NULL,400,'[\"/img/items/exeflour.jpg\"]','new'),('993f26cd-4486-45fd-8cf7-a085fc151459','Cereal Mwea Pishori Rice 1kg','CEREAL-MWEA-PISHORI-',NULL,'b8960797-add9-11f1-8a5c-0250f227b463','Local Millers - Kenya','piece',172.50,230.00,NULL,NULL,59.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:21',0,0,0,0,'Local Millers',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/pishorimwearice.jpg\"]','new'),('9a23834b-77da-4b36-9fa1-bec3df2c0091','Unyango Table Salt 500g','UNYANGO-TABLE-SALT-5',NULL,'b8960797-add9-11f1-8a5c-0250f227b463','Kensalt - Kenya','piece',18.75,25.00,NULL,NULL,37.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:59','2026-09-11 16:58:59',0,0,0,0,'Kensalt',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,NULL,'new'),('9a326524-6b0b-46fc-b8d6-c76bce953f78','Daawat Long Grain Rice 2kg','DAAWAT-LONG-GRAIN-RI',NULL,'b8960797-add9-11f1-8a5c-0250f227b463','Mwea / Pearl Rice - Kenya','piece',292.50,390.00,NULL,NULL,54.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:21',0,0,0,0,'Mwea / Pearl Rice',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/daawatrice.jpg\"]','new'),('9aa219ad-83e7-45d2-87b0-4d069a199e47','Vim Scouring Powder 500g','VIM-SCOURING-POWDER-',NULL,'b8968249-add9-11f1-8a5c-0250f227b463','Unilever - Kenya','piece',105.00,140.00,NULL,NULL,33.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:21',0,0,0,0,'Unilever',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/ariel handwash [powder.jpg\"]','new'),('9b12436d-7118-4aa8-9e63-5c1ce9500668','Zesta Tomato Sauce 400g','ZESTA-TOMATO-SAUCE-4',NULL,'b8960797-add9-11f1-8a5c-0250f227b463','Trufoods Limited - Kenya','piece',105.00,140.00,NULL,NULL,56.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:59','2026-09-12 09:04:21',0,0,0,0,'Trufoods Limited',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/peptang tomato sauce.jpg\"]','new'),('9f58e261-deb0-4f7b-a1ff-799d501bbb0a','Softcare Baby Diapers Large 48pcs','SOFTCARE-BABY-DIAPER',NULL,'b8968486-add9-11f1-8a5c-0250f227b463','Chinese Softcare - Kenya','piece',637.50,850.00,NULL,NULL,42.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:59','2026-09-12 09:04:21',0,0,0,0,'Chinese Softcare',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/pampers baby dry.jpg\"]','new'),('a1c8dff2-63fe-426b-a962-b5b33297554a','Colgate Toothpaste Herbal 120g','COLGATE-TOOTHPASTE-H',NULL,'b8968486-add9-11f1-8a5c-0250f227b463','Colgate-Palmolive - International','piece',142.50,190.00,NULL,NULL,69.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:59','2026-09-12 09:04:21',0,0,0,0,'Colgate-Palmolive',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/colgate.jpg\"]','new'),('a48e2e01-67b3-4088-ba44-bb355c46a917','Del Monte Passion Juice 1L','DEL-MONTE-PASSION-JU',NULL,'b89676f6-add9-11f1-8a5c-0250f227b463','Del Monte Kenya - Kenya','piece',157.50,210.00,NULL,NULL,67.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:21',0,0,0,0,'Del Monte Kenya',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/delmonte juice.jpg\"]','new'),('a48fc663-c327-4526-8609-6014787fb36d','Salit Vegetable Oil 1L','SALIT-VEGETABLE-OIL-',NULL,'b8960797-add9-11f1-8a5c-0250f227b463','Pwani Oil - Kenya','piece',217.50,290.00,NULL,NULL,21.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:21',0,0,0,0,'Pwani Oil',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/salit oil.jpg\"]','new'),('a563d044-ea09-4440-b96c-8aa627eb88e9','Nivea Cocoa Butter Lotion 400ml','NIVEA-COCOA-BUTTER-L',NULL,'b8968486-add9-11f1-8a5c-0250f227b463','Beiersdorf - Kenya','piece',412.50,550.00,NULL,NULL,51.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:59','2026-09-12 09:04:21',0,0,0,0,'Beiersdorf',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/nivea men.jpg\"]','new'),('a571bb75-bac6-44ef-b00b-e6148d274b69','Aquafresh Toothpaste 100ml','AQUAFRESH-TOOTHPASTE',NULL,'b8968486-add9-11f1-8a5c-0250f227b463','Haleon - International','piece',131.25,175.00,NULL,NULL,22.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:59','2026-09-12 09:04:20',0,0,0,0,'Haleon',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/aquafresh toothpaste.jpg\"]','new'),('a709b543-bc48-4f0f-9f86-7c3083c078d2','Kericho Gold Green Tea 25s','KERICHO-GOLD-GREEN-T',NULL,'b89676f6-add9-11f1-8a5c-0250f227b463','Gold Crown Beverages - Kenya','piece',180.00,240.00,NULL,NULL,44.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:21',0,0,0,0,'Gold Crown Beverages',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/kericho golden tea.jpg\"]','new'),('b1e9e03e-f85d-4283-bb5d-8e14fdafa11c','Toss Sensitive Detergent 1kg','TOSS-SENSITIVE-DETER',NULL,'b8968249-add9-11f1-8a5c-0250f227b463','Bidco Africa - Kenya','piece',255.00,340.00,NULL,NULL,34.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:21',0,0,0,0,'Bidco Africa',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/toss detergents.jpg\"]','new'),('b684960b-8d4a-40ce-8f14-7795fabed086','Menengai Cream Bar Soap 800g','MENENGAI-CREAM-BAR-S',NULL,'b8968249-add9-11f1-8a5c-0250f227b463','Menengai Soap Factory - Kenya','piece',116.25,155.00,NULL,NULL,69.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:21',0,0,0,0,'Menengai Soap Factory',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/menengai soap.webp\"]','new'),('b9c8b794-edb5-4fd9-91a7-abbcdc7af335','Chapatux Baking Powder 100g','CHAPATUX-BAKING-POWD',NULL,'b8968098-add9-11f1-8a5c-0250f227b463','Local Packers - Kenya','piece',41.25,55.00,NULL,NULL,45.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:59','2026-09-12 09:04:21',0,0,0,0,'Local Packers',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/ariel handwash [powder.jpg\"]','new'),('bef0d1fc-ac98-42b4-8cc3-9994e15c86c7','Sprite 500ml','SPRITE-500ML',NULL,'b89676f6-add9-11f1-8a5c-0250f227b463','Coca-Cola - Kenya','piece',45.00,60.00,NULL,NULL,27.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:21',0,0,0,0,'Coca-Cola',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/cocacola drink.jpg\"]','new'),('bf4af383-00a5-4f05-a67c-a4e838e2d7a5','Soko Maize Meal 2kg','SOKO-MAIZE-MEAL-2KG',NULL,'b8960797-add9-11f1-8a5c-0250f227b463','Thika Cloth Mills / Soko - Kenya','piece',108.75,145.00,NULL,NULL,41.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:21',0,0,0,0,'Thika Cloth Mills / Soko',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/sokomaizeflour.jpg\"]','new'),('c1ba484c-015e-4f72-a421-aa0169ea3652','Axion Dishwashing Paste 400g','AXION-DISHWASHING-PA',NULL,'b8968249-add9-11f1-8a5c-0250f227b463','Colgate-Palmolive - International','piece',165.00,220.00,NULL,NULL,36.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:20',0,0,0,0,'Colgate-Palmolive',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/colgate.jpg\"]','new'),('c85200dd-68c5-428c-904a-33e0e3927750','Pearl Lesorú Rice 5kg','PEARL-LESOR-RICE-5KG',NULL,'b8960797-add9-11f1-8a5c-0250f227b463','Capwell Industries - Kenya','piece',637.50,850.00,NULL,NULL,66.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:21',0,0,0,0,'Capwell Industries',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/pearlrice.jpg\"]','new'),('cba15ccc-199d-4a3b-a13e-2c34696a1392','Doom Mosquito Killer Spray 400ml','DOOM-MOSQUITO-KILLER',NULL,'b8968249-add9-11f1-8a5c-0250f227b463','Tiger Brands - International','piece',315.00,420.00,NULL,NULL,60.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:59','2026-09-12 09:04:21',0,0,0,0,'Tiger Brands',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/mortein doom.jpg\"]','new'),('cc41a4f1-c48e-47cf-a8ad-7f2482b21bf5','Brown Bread','BAK002','1234567890032','b8968098-add9-11f1-8a5c-0250f227b463',NULL,'piece',35.00,60.00,54.00,51.00,150.00,10.00,1000.00,50.00,1,1,16.00,1,'c9ac7085-c6bb-4edb-a921-a0de689ff7ef',NULL,NULL,'2026-09-11 15:11:48','2026-09-11 16:36:48',0,0,0,0,NULL,10,NULL,NULL,NULL,NULL,NULL,60.00,NULL,150,NULL,'new'),('ce7db881-ea19-4fbc-ae56-22729246e382','Huggies Dry Comfort Size 3 58pcs','HUGGIES-DRY-COMFORT-',NULL,'b8968486-add9-11f1-8a5c-0250f227b463','Kim-Fay / Kimberly-Clark - International','piece',862.50,1150.00,NULL,NULL,53.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:59','2026-09-12 09:04:21',0,0,0,0,'Kim-Fay / Kimberly-Clark',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/pampers baby dry.jpg\"]','new'),('d0d85f6f-474d-42f4-b26a-ebaee9cc106b','Fresh Milk - 1L','DAI001','1234567890021','b8967ac2-add9-11f1-8a5c-0250f227b463',NULL,'liter',60.00,90.00,81.00,76.50,200.00,10.00,1000.00,50.00,1,1,16.00,1,'b03fcc44-ad25-486f-9def-ec268fcad807',NULL,NULL,'2026-09-11 15:11:48','2026-09-12 09:04:21',0,0,0,0,NULL,10,NULL,NULL,NULL,NULL,NULL,90.00,NULL,200,'[\"/img/items/aquafresh toothpaste.jpg\"]','new'),('d3ddeb62-d8ac-42b7-add8-8adc08764ba0','Peptang Tomato Sauce 400g','PEPTANG-TOMATO-SAUCE',NULL,'b8960797-add9-11f1-8a5c-0250f227b463','Trufoods Limited - Kenya','piece',120.00,160.00,NULL,NULL,28.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:59','2026-09-12 09:04:21',0,0,0,0,'Trufoods Limited',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/peptang tomato sauce.jpg\"]','new'),('d50541b2-cf11-415d-bbe8-abb8345872d1','Jamaa Cream Bar Soap 1kg','JAMAA-CREAM-BAR-SOAP',NULL,'b8968249-add9-11f1-8a5c-0250f227b463','Bidco Africa - Kenya','piece',138.75,185.00,NULL,NULL,52.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:21',0,0,0,0,'Bidco Africa',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/jamaa soap.jpg\"]','new'),('d54c1a3c-3dfd-4c4d-849a-8f303df44314','Tropical Heat Beef Masala 100g','TROPICAL-HEAT-BEEF-M',NULL,'b8960797-add9-11f1-8a5c-0250f227b463','Deepa Industries - Kenya','piece',105.00,140.00,NULL,NULL,67.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:59','2026-09-12 09:04:21',0,0,0,0,'Deepa Industries',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/tropical heat.jpg\"]','new'),('d57bee19-2b7c-4356-a70c-445f786590b7','Fresh Fri Cooking Oil 2L','FRESH-FRI-COOKING-OI',NULL,'b8960797-add9-11f1-8a5c-0250f227b463','Pwani Oil - Kenya','piece',450.00,600.00,NULL,NULL,20.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:21',0,0,0,0,'Pwani Oil',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/aquafresh toothpaste.jpg\"]','new'),('d88a7e1c-f909-4e83-b3ce-84707d6638a0','Kiwi Shoe Polish Dark Tan 40ml','KIWI-SHOE-POLISH-DAR',NULL,'b8968249-add9-11f1-8a5c-0250f227b463','SC Johnson - Kenya','piece',67.50,90.00,NULL,NULL,49.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:59','2026-09-12 09:04:21',0,0,0,0,'SC Johnson',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/kiwi shoe polish.jpg\"]','new'),('e04d6046-c7b8-4d53-87d6-e6bc2715a1c0','Peptang Tomato Paste 70g','PEPTANG-TOMATO-PASTE',NULL,'b8960797-add9-11f1-8a5c-0250f227b463','Trufoods Limited - Kenya','piece',33.75,45.00,NULL,NULL,26.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:59','2026-09-12 09:04:21',0,0,0,0,'Trufoods Limited',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/peptang tomato sauce.jpg\"]','new'),('e27b6ca5-0160-4585-a144-2be1b417b99c','White Bread','BAK001','1234567890031','b8968098-add9-11f1-8a5c-0250f227b463',NULL,'piece',30.00,55.00,49.50,46.75,200.00,10.00,1000.00,50.00,1,1,16.00,1,'c9ac7085-c6bb-4edb-a921-a0de689ff7ef',NULL,NULL,'2026-09-11 15:11:48','2026-09-11 16:36:48',0,0,0,0,NULL,10,NULL,NULL,NULL,NULL,NULL,55.00,NULL,200,NULL,'new'),('e4d3ae67-8274-4256-a982-6fd0826ac1c9','Fanta Orange 500ml','FANTA-ORANGE-500ML',NULL,'b89676f6-add9-11f1-8a5c-0250f227b463','Coca-Cola - Kenya','piece',45.00,60.00,NULL,NULL,37.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:21',0,0,0,0,'Coca-Cola',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/cocacola drink.jpg\"]','new'),('e59cc6c5-516c-4b82-98e2-51859d6defa3','Chapa Mandashi Baking Powder 50g','CHAPA-MANDASHI-BAKIN',NULL,'b8968098-add9-11f1-8a5c-0250f227b463','Kapa Oil Refineries - Kenya','piece',26.25,35.00,NULL,NULL,59.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:21',0,0,0,0,'Kapa Oil Refineries',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/chapa mandashi.jpg\"]','new'),('e81ff332-1b3e-40f8-adc4-28647594c7ec','Cooking Oil - 1L','GRC003','1234567890003','b8960797-add9-11f1-8a5c-0250f227b463',NULL,'liter',200.00,280.00,252.00,238.00,200.00,10.00,1000.00,50.00,1,1,16.00,0,'c9ac7085-c6bb-4edb-a921-a0de689ff7ef',NULL,NULL,'2026-09-11 15:11:48','2026-09-12 09:04:21',0,0,0,0,NULL,10,NULL,NULL,NULL,NULL,NULL,280.00,NULL,200,'[\"/img/items/cow boy cooking fat.jpg\"]','new'),('e89f3c28-1f06-4c04-bd8e-f57b679fc615','KCC Fresh Milk 500ml','KCC-FRESH-MILK-500ML',NULL,'b8967ac2-add9-11f1-8a5c-0250f227b463','New KCC - Kenya','piece',45.00,60.00,NULL,NULL,21.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:21',0,0,0,0,'New KCC',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/kcc fresh milk.jpg\"]','new'),('e8bb09ed-a2de-4438-9239-e96a9a76d728','Dettol Liquid Antiseptic 250ml','DETTOL-LIQUID-ANTISE',NULL,'b8968486-add9-11f1-8a5c-0250f227b463','Reckitt Bencwiser - Kenya','piece',285.00,380.00,NULL,NULL,40.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:59','2026-09-12 09:04:21',0,0,0,0,'Reckitt Bencwiser',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/dettol soap.jpg\"]','new'),('ec02b99e-031c-4aed-93b8-92237df89d2e','Close-Up Toothpaste Red Hot 120g','CLOSE-UP-TOOTHPASTE-',NULL,'b8968486-add9-11f1-8a5c-0250f227b463','Unilever - Kenya','piece',138.75,185.00,NULL,NULL,24.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:59','2026-09-12 09:04:21',0,0,0,0,'Unilever',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/closeup toothpaste.jpg\"]','new'),('ed740c25-54f6-4fad-b01e-a9ae8fad67a2','Milo Beverage Powder 400g','MILO-BEVERAGE-POWDER',NULL,'b89676f6-add9-11f1-8a5c-0250f227b463','Nestlé - Kenya','piece',360.00,480.00,NULL,NULL,62.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:21',0,0,0,0,'Nestlé',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/milo beversage powder.jpg\"]','new'),('eef3c293-d106-4739-a7ab-378d71e4ff50','Cow Boy Cooking Fat 1kg','COW-BOY-COOKING-FAT-',NULL,'b8960797-add9-11f1-8a5c-0250f227b463','Bidco Africa - Kenya','piece',285.00,380.00,NULL,NULL,39.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:21',0,0,0,0,'Bidco Africa',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/cow boy cooking fat.jpg\"]','new'),('efe4db11-d842-471d-9f2b-4c5ff013f5ba','Body Lotion - 500ml','PER003','1234567890053','b8968486-add9-11f1-8a5c-0250f227b463',NULL,'ml',200.00,320.00,288.00,272.00,120.00,10.00,1000.00,50.00,1,1,16.00,0,'c9ac7085-c6bb-4edb-a921-a0de689ff7ef',NULL,NULL,'2026-09-11 15:11:48','2026-09-12 09:04:20',0,0,0,0,NULL,10,NULL,NULL,NULL,NULL,NULL,320.00,NULL,120,'[\"/img/items/amara lotion.jpg\"]','new'),('effd79f1-4017-4741-987c-3cb4409e38f9','Dettol Bath Soap Original 175g','DETTOL-BATH-SOAP-ORI',NULL,'b8968486-add9-11f1-8a5c-0250f227b463','Reckitt Bencwiser - Kenya','piece',120.00,160.00,NULL,NULL,45.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:21',0,0,0,0,'Reckitt Bencwiser',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/dettol soap.jpg\"]','new'),('f266a9a1-cf16-4eaa-82b1-d5ea62746389','Amara Lotion Cocoa Butter 400ml','AMARA-LOTION-COCOA-B',NULL,'b8968486-add9-11f1-8a5c-0250f227b463','Haco Industries - Kenya','piece',195.00,260.00,NULL,NULL,65.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:59','2026-09-12 09:04:20',0,0,0,0,'Haco Industries',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/amara lotion.jpg\"]','new'),('f3eb2c02-bdad-4830-891d-564a9a68d65c','Shampoo - 400ml','PER002','1234567890052','b8968486-add9-11f1-8a5c-0250f227b463',NULL,'ml',180.00,280.00,252.00,238.00,150.00,10.00,1000.00,50.00,1,1,16.00,0,'c9ac7085-c6bb-4edb-a921-a0de689ff7ef',NULL,NULL,'2026-09-11 15:11:48','2026-09-11 16:36:48',0,0,0,0,NULL,10,NULL,NULL,NULL,NULL,NULL,280.00,NULL,150,NULL,'new'),('f5470c62-4c0c-41e2-b3cc-5b3483cf7d97','Royco Mchuzi Mix Beef 200g','ROYCO-MCHUZI-MIX-BEE',NULL,'b8960797-add9-11f1-8a5c-0250f227b463','Unilever - Kenya','piece',142.50,190.00,NULL,NULL,27.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:59','2026-09-12 09:04:21',0,0,0,0,'Unilever',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/royco mchuzi mix.jpg\"]','new'),('f5772620-97ea-45eb-8dd4-48a4763e5dea','Indomie Instant Noodles Chicken Flavour 70g','INDOMIE-INSTANT-NOOD',NULL,'b8960797-add9-11f1-8a5c-0250f227b463','Indomie Kenya - Kenya','piece',30.00,40.00,NULL,NULL,29.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:21',0,0,0,0,'Indomie Kenya',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/indomie noodles.jpg\"]','new'),('f7015936-73a4-4bf0-a362-0b0e08c87f72','Colgate Toothpaste Triple Action 120g','COLGATE-TOOTHPASTE-T',NULL,'b8968486-add9-11f1-8a5c-0250f227b463','Colgate-Palmolive - International','piece',135.00,180.00,NULL,NULL,49.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:59','2026-09-12 09:04:21',0,0,0,0,'Colgate-Palmolive',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/colgate.jpg\"]','new'),('f8cd2dd2-13c6-48a7-a3de-77271763951d','Ndovu Maize Meal 2kg','NDOVU-MAIZE-MEAL-2KG',NULL,'b8960797-add9-11f1-8a5c-0250f227b463','Mombasa Maize Millers - Kenya','piece',112.50,150.00,NULL,NULL,24.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:59','2026-09-12 09:04:21',0,0,0,0,'Mombasa Maize Millers',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/ndovu wheat flour.jpg\"]','new'),('f994d9af-9c5e-482e-b686-224d214c881d','Toothpaste','PER001','1234567890051','b8968486-add9-11f1-8a5c-0250f227b463',NULL,'piece',80.00,120.00,108.00,102.00,250.00,10.00,1000.00,50.00,1,1,16.00,0,'c9ac7085-c6bb-4edb-a921-a0de689ff7ef',NULL,NULL,'2026-09-11 15:11:48','2026-09-12 09:04:21',0,0,0,0,NULL,10,NULL,NULL,NULL,NULL,NULL,120.00,NULL,250,'[\"/img/items/aquafresh toothpaste.jpg\"]','new'),('fa396986-a4ec-4852-9a0b-a129fdd0a2fc','Del Monte Pineapple Juice 1L','DEL-MONTE-PINEAPPLE-',NULL,'b89676f6-add9-11f1-8a5c-0250f227b463','Del Monte Kenya - Kenya','piece',157.50,210.00,NULL,NULL,45.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:21',0,0,0,0,'Del Monte Kenya',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/delmonte juice.jpg\"]','new'),('fa877981-18f7-4e24-a419-ee327ec9fe6e','Pampers Baby Dry Size 3 64pcs','PAMPERS-BABY-DRY-SIZ',NULL,'b8968486-add9-11f1-8a5c-0250f227b463','Procter & Gamble - International','piece',937.50,1250.00,NULL,NULL,25.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:59','2026-09-12 09:04:21',0,0,0,0,'Procter & Gamble',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/pampers baby dry.jpg\"]','new'),('fb121557-878b-46fc-a03b-325e813aee65','Geisha Bath Soap Aloe Vera 225g','GEISHA-BATH-SOAP-ALO',NULL,'b8968486-add9-11f1-8a5c-0250f227b463','Unilever - Kenya','piece',108.75,145.00,NULL,NULL,41.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:21',0,0,0,0,'Unilever',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/geisha sopa.jpg\"]','new'),('fc97d75f-a3be-4431-ae2a-7d40db6f3ccf','Omo Hand Wash Powder 1kg','OMO-HAND-WASH-POWDER',NULL,'b8968249-add9-11f1-8a5c-0250f227b463','Unilever - Kenya','piece',292.50,390.00,NULL,NULL,38.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:21',0,0,0,0,'Unilever',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/omo handwash powder.jpg\"]','new'),('feba9aed-5c60-4856-9d43-c26c4d04eece','Kabras Sugar 2kg','KABRAS-SUGAR-2KG',NULL,'b8960797-add9-11f1-8a5c-0250f227b463','West Kenya Sugar - Kenya','piece',232.50,310.00,NULL,NULL,34.00,5.00,1000.00,50.00,1,1,16.00,0,'1a13b57c-9ff1-4154-ada6-92f279b06882',NULL,NULL,'2026-09-11 16:58:58','2026-09-12 09:04:21',0,0,0,0,'West Kenya Sugar',10,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,'[\"/img/items/kabrassugar.jpg\"]','new');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_order_items`
--

DROP TABLE IF EXISTS `purchase_order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_order_items` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `purchase_order_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity_ordered` decimal(10,2) NOT NULL,
  `quantity_received` decimal(10,2) DEFAULT '0.00',
  `unit_cost` decimal(10,2) NOT NULL,
  `subtotal` decimal(12,2) NOT NULL,
  `batch_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_po_id` (`purchase_order_id`),
  KEY `idx_product_id` (`product_id`),
  CONSTRAINT `purchase_order_items_ibfk_1` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `purchase_order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_order_items`
--

LOCK TABLES `purchase_order_items` WRITE;
/*!40000 ALTER TABLE `purchase_order_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `purchase_order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_orders`
--

DROP TABLE IF EXISTS `purchase_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_orders` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `po_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `supplier_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_date` date NOT NULL,
  `expected_delivery_date` date DEFAULT NULL,
  `received_date` date DEFAULT NULL,
  `status` enum('draft','sent','partial','received','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'draft',
  `subtotal` decimal(12,2) NOT NULL,
  `tax_amount` decimal(12,2) DEFAULT '0.00',
  `discount_amount` decimal(12,2) DEFAULT '0.00',
  `shipping_cost` decimal(12,2) DEFAULT '0.00',
  `total_amount` decimal(12,2) NOT NULL,
  `payment_status` enum('pending','partial','paid') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `amount_paid` decimal(12,2) DEFAULT '0.00',
  `created_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `received_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `po_number` (`po_number`),
  KEY `created_by` (`created_by`),
  KEY `received_by` (`received_by`),
  KEY `idx_po_number` (`po_number`),
  KEY `idx_supplier_id` (`supplier_id`),
  KEY `idx_status` (`status`),
  KEY `idx_order_date` (`order_date`),
  CONSTRAINT `purchase_orders_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `purchase_orders_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `purchase_orders_ibfk_3` FOREIGN KEY (`received_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_orders`
--

LOCK TABLES `purchase_orders` WRITE;
/*!40000 ALTER TABLE `purchase_orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `purchase_orders` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `before_po_insert` BEFORE INSERT ON `purchase_orders` FOR EACH ROW BEGIN
    IF NEW.po_number IS NULL OR NEW.po_number = '' THEN
        SET NEW.po_number = CONCAT('PO-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(FLOOR(RAND() * 99999), 5, '0'));
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `return_items`
--

DROP TABLE IF EXISTS `return_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `return_items` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `return_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sale_item_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `product_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `refund_amount` decimal(12,2) NOT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci,
  `condition_status` enum('good','damaged','expired') COLLATE utf8mb4_unicode_ci DEFAULT 'good',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `sale_item_id` (`sale_item_id`),
  KEY `product_id` (`product_id`),
  KEY `idx_return_id` (`return_id`),
  CONSTRAINT `return_items_ibfk_1` FOREIGN KEY (`return_id`) REFERENCES `returns` (`id`) ON DELETE CASCADE,
  CONSTRAINT `return_items_ibfk_2` FOREIGN KEY (`sale_item_id`) REFERENCES `sale_items` (`id`) ON DELETE SET NULL,
  CONSTRAINT `return_items_ibfk_3` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `return_items`
--

LOCK TABLES `return_items` WRITE;
/*!40000 ALTER TABLE `return_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `return_items` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `after_return_item_insert` AFTER INSERT ON `return_items` FOR EACH ROW BEGIN
    IF NEW.condition_status = 'good' THEN
        UPDATE products 
        SET current_stock = current_stock + NEW.quantity
        WHERE id = NEW.product_id;
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `returns`
--

DROP TABLE IF EXISTS `returns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `returns` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `return_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_sale_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `return_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `processed_by` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci,
  `refund_method` enum('cash','card','mpesa','store_credit') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_refund_amount` decimal(12,2) NOT NULL,
  `status` enum('pending','approved','rejected','completed') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `return_number` (`return_number`),
  KEY `original_sale_id` (`original_sale_id`),
  KEY `customer_id` (`customer_id`),
  KEY `processed_by` (`processed_by`),
  KEY `idx_return_number` (`return_number`),
  KEY `idx_return_date` (`return_date`),
  CONSTRAINT `returns_ibfk_1` FOREIGN KEY (`original_sale_id`) REFERENCES `sales` (`id`) ON DELETE SET NULL,
  CONSTRAINT `returns_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `returns_ibfk_3` FOREIGN KEY (`processed_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `returns`
--

LOCK TABLES `returns` WRITE;
/*!40000 ALTER TABLE `returns` DISABLE KEYS */;
/*!40000 ALTER TABLE `returns` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reviews` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `product_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rating` tinyint NOT NULL DEFAULT '5',
  `title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `comment` text COLLATE utf8mb4_unicode_ci,
  `is_approved` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_product_id` (`product_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sale_items`
--

DROP TABLE IF EXISTS `sale_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sale_items` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `sale_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sku` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `barcode` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `cost_price` decimal(10,2) NOT NULL,
  `discount_amount` decimal(10,2) DEFAULT '0.00',
  `tax_amount` decimal(10,2) DEFAULT '0.00',
  `subtotal` decimal(12,2) NOT NULL,
  `batch_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `batch_id` (`batch_id`),
  KEY `idx_sale_id` (`sale_id`),
  KEY `idx_product_id` (`product_id`),
  CONSTRAINT `sale_items_ibfk_1` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE,
  CONSTRAINT `sale_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `sale_items_ibfk_3` FOREIGN KEY (`batch_id`) REFERENCES `product_batches` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sale_items`
--

LOCK TABLES `sale_items` WRITE;
/*!40000 ALTER TABLE `sale_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `sale_items` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `after_sale_item_insert` AFTER INSERT ON `sale_items` FOR EACH ROW BEGIN
    UPDATE products 
    SET current_stock = current_stock - NEW.quantity
    WHERE id = NEW.product_id;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `sale_payments`
--

DROP TABLE IF EXISTS `sale_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sale_payments` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `sale_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_method` enum('cash','card','mpesa','bank_transfer','credit') COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `reference_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sale_id` (`sale_id`),
  CONSTRAINT `sale_payments_ibfk_1` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sale_payments`
--

LOCK TABLES `sale_payments` WRITE;
/*!40000 ALTER TABLE `sale_payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `sale_payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales`
--

DROP TABLE IF EXISTS `sales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `sale_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sale_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `cashier_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `terminal_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subtotal` decimal(12,2) NOT NULL,
  `tax_amount` decimal(12,2) DEFAULT '0.00',
  `discount_amount` decimal(12,2) DEFAULT '0.00',
  `total_amount` decimal(12,2) NOT NULL,
  `payment_method` enum('cash','card','mpesa','bank_transfer','credit','mixed') COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount_paid` decimal(12,2) NOT NULL,
  `change_given` decimal(12,2) DEFAULT '0.00',
  `payment_status` enum('pending','paid','partial','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'paid',
  `status` enum('completed','pending','cancelled','refunded') COLLATE utf8mb4_unicode_ci DEFAULT 'completed',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sale_number` (`sale_number`),
  KEY `customer_id` (`customer_id`),
  KEY `idx_sale_number` (`sale_number`),
  KEY `idx_sale_date` (`sale_date`),
  KEY `idx_cashier_id` (`cashier_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `sales_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `sales_ibfk_2` FOREIGN KEY (`cashier_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales`
--

LOCK TABLES `sales` WRITE;
/*!40000 ALTER TABLE `sales` DISABLE KEYS */;
/*!40000 ALTER TABLE `sales` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `before_sale_insert` BEFORE INSERT ON `sales` FOR EACH ROW BEGIN
    IF NEW.sale_number IS NULL OR NEW.sale_number = '' THEN
        SET NEW.sale_number = CONCAT('SAL-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(FLOOR(RAND() * 99999), 5, '0'));
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `stock_adjustments`
--

DROP TABLE IF EXISTS `stock_adjustments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_adjustments` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `product_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `adjustment_type` enum('addition','reduction','damage','loss','return','transfer','recount') COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity_before` decimal(10,2) NOT NULL,
  `quantity_adjusted` decimal(10,2) NOT NULL,
  `quantity_after` decimal(10,2) NOT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci,
  `reference_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `adjusted_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approved_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `adjusted_by` (`adjusted_by`),
  KEY `approved_by` (`approved_by`),
  KEY `idx_product_id` (`product_id`),
  KEY `idx_adjustment_type` (`adjustment_type`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `stock_adjustments_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `stock_adjustments_ibfk_2` FOREIGN KEY (`adjusted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `stock_adjustments_ibfk_3` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_adjustments`
--

LOCK TABLES `stock_adjustments` WRITE;
/*!40000 ALTER TABLE `stock_adjustments` DISABLE KEYS */;
/*!40000 ALTER TABLE `stock_adjustments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `suppliers` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_person` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `tax_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_terms` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `credit_limit` decimal(12,2) DEFAULT '0.00',
  `current_balance` decimal(12,2) DEFAULT '0.00',
  `is_active` tinyint(1) DEFAULT '1',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
INSERT INTO `suppliers` VALUES ('1a13b57c-9ff1-4154-ada6-92f279b06882','Beverage Distributors','Peter Kamau','orders@beveragedist.co.ke','+254734567890','Mombasa, Kenya',NULL,'Net 15',300000.00,0.00,1,NULL,'2026-09-11 15:11:48','2026-09-11 15:11:48'),('b03fcc44-ad25-486f-9def-ec268fcad807','Dairy Producers Kenya','Mary Wanjiru','sales@dairykenya.com','+254723456789','Kiambu, Kenya',NULL,'Cash on Delivery',0.00,0.00,1,NULL,'2026-09-11 15:11:48','2026-09-11 15:11:48'),('c9ac7085-c6bb-4edb-a921-a0de689ff7ef','Fresh Foods Ltd','John Mwangi','info@freshfoods.co.ke','+254712345678','Nairobi, Kenya',NULL,'Net 30',500000.00,0.00,1,NULL,'2026-09-11 15:11:48','2026-09-11 15:11:48');
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_settings`
--

DROP TABLE IF EXISTS `system_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_settings` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `setting_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` text COLLATE utf8mb4_unicode_ci,
  `data_type` enum('string','number','boolean','json') COLLATE utf8mb4_unicode_ci DEFAULT 'string',
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_editable` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`),
  KEY `idx_setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_settings`
--

LOCK TABLES `system_settings` WRITE;
/*!40000 ALTER TABLE `system_settings` DISABLE KEYS */;
INSERT INTO `system_settings` VALUES ('b08b272d-add9-11f1-8a5c-0250f227b463','shop_name','Awesome Supermarket','string','Shop/Business name',1,'2026-09-11 15:09:50','2026-09-11 15:09:50'),('b08b6903-add9-11f1-8a5c-0250f227b463','tax_rate','16.00','number','Default tax/VAT rate percentage',1,'2026-09-11 15:09:50','2026-09-11 15:09:50'),('b08b790f-add9-11f1-8a5c-0250f227b463','currency','KSh','string','Currency symbol',1,'2026-09-11 15:09:50','2026-09-11 15:09:50'),('b08b7b1b-add9-11f1-8a5c-0250f227b463','low_stock_alert','true','boolean','Enable low stock alerts',1,'2026-09-11 15:09:50','2026-09-11 15:09:50'),('b08b7d41-add9-11f1-8a5c-0250f227b463','expiry_alert_days','30','number','Days before expiry to show alert',1,'2026-09-11 15:09:50','2026-09-11 15:09:50'),('b08b8195-add9-11f1-8a5c-0250f227b463','receipt_footer','Thank you for shopping with us!','string','Receipt footer message',1,'2026-09-11 15:09:50','2026-09-11 15:09:50'),('b08b832e-add9-11f1-8a5c-0250f227b463','allow_negative_stock','false','boolean','Allow selling when stock is 0',1,'2026-09-11 15:09:50','2026-09-11 15:09:50');
/*!40000 ALTER TABLE `system_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `top_selling_products`
--

DROP TABLE IF EXISTS `top_selling_products`;
/*!50001 DROP VIEW IF EXISTS `top_selling_products`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `top_selling_products` AS SELECT 
 1 AS `id`,
 1 AS `name`,
 1 AS `sku`,
 1 AS `barcode`,
 1 AS `total_quantity_sold`,
 1 AS `number_of_sales`,
 1 AS `total_revenue`,
 1 AS `total_profit`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `user_sessions`
--

DROP TABLE IF EXISTS `user_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_sessions` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `login_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `logout_time` datetime DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `terminal_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_login_time` (`login_time`),
  CONSTRAINT `user_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_sessions`
--

LOCK TABLES `user_sessions` WRITE;
/*!40000 ALTER TABLE `user_sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('admin','manager','cashier','inventory_clerk','accountant') COLLATE utf8mb4_unicode_ci DEFAULT 'cashier',
  `employee_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `last_login` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `avatar_url` text COLLATE utf8mb4_unicode_ci,
  `google_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email_verified` tinyint(1) DEFAULT '0',
  `reset_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reset_token_expiry` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `employee_id` (`employee_id`),
  KEY `idx_email` (`email`),
  KEY `idx_employee_id` (`employee_id`),
  KEY `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('5dc27c02-df8f-47d4-988d-8078bd339f39','Denla Admin','admin@denladiscount.co.ke','$2a$10$J7S1FMRMBBekUlYgxGqcGuPC1tEziuVUXnehCtMn1yZDqx2zD3TwK',NULL,'admin',NULL,1,'2026-09-12 10:52:35','2026-09-12 10:52:19','2026-09-12 10:52:35',NULL,NULL,0,NULL,NULL),('927ec5cb-05ae-45e9-a5e2-852cb4c2f25a','System Administrator','admin@denla.com','$2a$10$WC6m/BwdDqwb2XY81yfrv.hDN9ACtw7ZGBJlrROHoPfv86NpL3T6K','+254700000000','admin','EMP001',1,'2026-09-12 11:49:41','2026-09-11 15:12:43','2026-09-12 11:49:41',NULL,NULL,0,NULL,NULL),('9526e4bf-4bef-4133-83a8-e5cc92ec93a9','Mary Wanjiku','manager@denla.com','$2a$10$Zeeucu.yIkfBkG7OST2cY.dK6Gebg7scaCEVkD4Z7erTc79bqqO6m','+254722222222','manager','EMP003',1,NULL,'2026-09-11 15:12:43','2026-09-11 15:12:43',NULL,NULL,0,NULL,NULL),('97a72d1e-1100-403e-bc5d-8f76e243d6dc','Peter Omondi','inventory@denla.com','$2a$10$Gx8dWv09any9rJ.DMzIZ.OdQZzrE7t4ZIiMqzA3hZ2gfqQ6pWWwau','+254733333333','inventory_clerk','EMP004',1,NULL,'2026-09-11 15:12:43','2026-09-11 15:12:43',NULL,NULL,0,NULL,NULL),('9fce1250-9799-45b9-9b87-2eadae03155b','AwesomeTech Admin','admin@awesometech.co.ke','$2a$10$naU5Vdt5bfa483J7QTvnc.9aSQW.xPUyzJ0q2eBJlJ7sYHIXn6.dO',NULL,'admin',NULL,1,'2026-09-12 10:52:35','2026-09-12 10:52:19','2026-09-12 10:52:35',NULL,NULL,0,NULL,NULL),('b4a87984-eb38-4ded-ba85-ac2cf69dab9e','Admin User','admin','$2a$10$Opth4g4R/r5ELm/a..pudunpK4mmijDmK7RNpUUVbmwQ1UFeih7Ki',NULL,'admin',NULL,1,'2026-09-12 10:52:35','2026-09-12 10:52:20','2026-09-12 10:52:35',NULL,NULL,0,NULL,NULL),('ce46c292-b404-46e8-99a6-b144b8dd70b2','John Kamau','cashier1@denla.com','$2a$10$racsg02pPJ.4TIFltm586OdZBLFfVZJ7YlXW6dlcd2ralWAlYfhrK','+254711111111','cashier','EMP002',1,NULL,'2026-09-11 15:12:43','2026-09-11 15:12:43',NULL,NULL,0,NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wishlist`
--

DROP TABLE IF EXISTS `wishlist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wishlist` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_wishlist` (`user_id`,`product_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wishlist`
--

LOCK TABLES `wishlist` WRITE;
/*!40000 ALTER TABLE `wishlist` DISABLE KEYS */;
/*!40000 ALTER TABLE `wishlist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'denla'
--

--
-- Dumping routines for database 'denla'
--

--
-- Current Database: `denla`
--

USE `denla`;

--
-- Final view structure for view `daily_sales_report`
--

/*!50001 DROP VIEW IF EXISTS `daily_sales_report`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = cp850 */;
/*!50001 SET character_set_results     = cp850 */;
/*!50001 SET collation_connection      = cp850_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `daily_sales_report` AS select cast(`sales`.`sale_date` as date) AS `date`,count(0) AS `transactions_count`,sum(`sales`.`total_amount`) AS `total_sales`,sum(`sales`.`subtotal`) AS `subtotal`,sum(`sales`.`tax_amount`) AS `total_tax`,sum(`sales`.`discount_amount`) AS `total_discount`,avg(`sales`.`total_amount`) AS `average_sale`,sum((case when (`sales`.`payment_method` = 'cash') then `sales`.`total_amount` else 0 end)) AS `cash_sales`,sum((case when (`sales`.`payment_method` = 'card') then `sales`.`total_amount` else 0 end)) AS `card_sales`,sum((case when (`sales`.`payment_method` = 'mpesa') then `sales`.`total_amount` else 0 end)) AS `mpesa_sales` from `sales` where (`sales`.`status` = 'completed') group by cast(`sales`.`sale_date` as date) order by `date` desc */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `expiring_products`
--

/*!50001 DROP VIEW IF EXISTS `expiring_products`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = cp850 */;
/*!50001 SET character_set_results     = cp850 */;
/*!50001 SET collation_connection      = cp850_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `expiring_products` AS select `pb`.`id` AS `batch_id`,`p`.`name` AS `product_name`,`p`.`sku` AS `sku`,`pb`.`batch_number` AS `batch_number`,`pb`.`expiry_date` AS `expiry_date`,`pb`.`quantity` AS `quantity`,(to_days(`pb`.`expiry_date`) - to_days(curdate())) AS `days_to_expiry` from (`product_batches` `pb` join `products` `p` on((`pb`.`product_id` = `p`.`id`))) where ((`pb`.`expiry_date` <= (curdate() + interval 30 day)) and (`pb`.`is_active` = true) and (`pb`.`quantity` > 0)) order by `pb`.`expiry_date` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `low_stock_products`
--

/*!50001 DROP VIEW IF EXISTS `low_stock_products`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = cp850 */;
/*!50001 SET character_set_results     = cp850 */;
/*!50001 SET collation_connection      = cp850_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `low_stock_products` AS select `p`.`id` AS `id`,`p`.`name` AS `name`,`p`.`sku` AS `sku`,`p`.`barcode` AS `barcode`,`p`.`current_stock` AS `current_stock`,`p`.`minimum_stock` AS `minimum_stock`,`p`.`reorder_quantity` AS `reorder_quantity`,`c`.`name` AS `category_name`,`s`.`name` AS `supplier_name` from ((`products` `p` left join `categories` `c` on((`p`.`category_id` = `c`.`id`))) left join `suppliers` `s` on((`p`.`default_supplier_id` = `s`.`id`))) where ((`p`.`current_stock` <= `p`.`minimum_stock`) and (`p`.`is_active` = true)) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `top_selling_products`
--

/*!50001 DROP VIEW IF EXISTS `top_selling_products`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = cp850 */;
/*!50001 SET character_set_results     = cp850 */;
/*!50001 SET collation_connection      = cp850_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `top_selling_products` AS select `p`.`id` AS `id`,`p`.`name` AS `name`,`p`.`sku` AS `sku`,`p`.`barcode` AS `barcode`,sum(`si`.`quantity`) AS `total_quantity_sold`,count(distinct `si`.`sale_id`) AS `number_of_sales`,sum(`si`.`subtotal`) AS `total_revenue`,sum((`si`.`subtotal` - (`si`.`quantity` * `si`.`cost_price`))) AS `total_profit` from ((`sale_items` `si` join `products` `p` on((`si`.`product_id` = `p`.`id`))) join `sales` `s` on((`si`.`sale_id` = `s`.`id`))) where ((`s`.`status` = 'completed') and (`s`.`sale_date` >= (curdate() - interval 30 day))) group by `p`.`id`,`p`.`name`,`p`.`sku`,`p`.`barcode` order by `total_quantity_sold` desc */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-12 19:46:32
