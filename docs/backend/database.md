# Database Documentation

Complete guide for the PostgreSQL database schema and management in the Gemini CRM system.

## 🗄️ Database Overview

The Gemini CRM uses PostgreSQL with Sequelize ORM for:
- **Data Persistence**: Customer, product, order, and user data
- **Relationships**: Complex relationships between entities
- **Migrations**: Version-controlled schema changes
- **Transactions**: ACID compliance for data integrity
- **Performance**: Optimized queries and indexing

## 📊 Database Schema

### Core Tables

#### Users Table
```sql
CREATE TABLE "Users" (
  "id" SERIAL PRIMARY KEY,
  "firstName" VARCHAR(255) NOT NULL,
  "lastName" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "password" VARCHAR(255) NOT NULL,
  "role" VARCHAR(255) DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX "users_email_idx" ON "Users" ("email");
CREATE INDEX "users_role_idx" ON "Users" ("role");
```

#### Customers Table
```sql
CREATE TABLE "Customers" (
  "id" SERIAL PRIMARY KEY,
  "firstName" VARCHAR(255),
  "lastName" VARCHAR(255),
  "email" VARCHAR(255),
  "phone" VARCHAR(255),
  "address" TEXT,
  "totalPurchases" DECIMAL(10,2) DEFAULT 0.00,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX "customers_email_idx" ON "Customers" ("email");
CREATE INDEX "customers_phone_idx" ON "Customers" ("phone");
CREATE INDEX "customers_name_idx" ON "Customers" ("firstName", "lastName");
```

#### Products Table
```sql
CREATE TABLE "Products" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "price" DECIMAL(10,2) NOT NULL,
  "stock" INTEGER DEFAULT 0,
  "category" VARCHAR(255),
  "image" VARCHAR(255),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX "products_name_idx" ON "Products" ("name");
CREATE INDEX "products_category_idx" ON "Products" ("category");
CREATE INDEX "products_stock_idx" ON "Products" ("stock");
```

#### Orders Table
```sql
CREATE TABLE "Orders" (
  "id" SERIAL PRIMARY KEY,
  "customerId" INTEGER REFERENCES "Customers"("id") ON DELETE SET NULL,
  "createdBy" INTEGER REFERENCES "Users"("id") ON DELETE SET NULL,
  "status" VARCHAR(255) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  "total" DECIMAL(10,2) NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX "orders_customer_idx" ON "Orders" ("customerId");
CREATE INDEX "orders_status_idx" ON "Orders" ("status");
CREATE INDEX "orders_created_by_idx" ON "Orders" ("createdBy");
CREATE INDEX "orders_date_idx" ON "Orders" ("createdAt");
```

#### OrderItems Table
```sql
CREATE TABLE "OrderItems" (
  "id" SERIAL PRIMARY KEY,
  "orderId" INTEGER REFERENCES "Orders"("id") ON DELETE CASCADE,
  "productId" INTEGER REFERENCES "Products"("id") ON DELETE SET NULL,
  "quantity" INTEGER NOT NULL,
  "price" DECIMAL(10,2) NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX "order_items_order_idx" ON "OrderItems" ("orderId");
CREATE INDEX "order_items_product_idx" ON "OrderItems" ("productId");
```

### Notification System Tables

#### Notifications Table
```sql
CREATE TABLE "Notifications" (
  "id" SERIAL PRIMARY KEY,
  "type" VARCHAR(255) NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "message" TEXT NOT NULL,
  "data" JSONB,
  "priority" VARCHAR(255) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  "createdBy" INTEGER REFERENCES "Users"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX "notifications_type_idx" ON "Notifications" ("type");
CREATE INDEX "notifications_priority_idx" ON "Notifications" ("priority");
CREATE INDEX "notifications_created_at_idx" ON "Notifications" ("createdAt");
```

#### UserNotifications Table (Many-to-Many)
```sql
CREATE TABLE "UserNotifications" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER REFERENCES "Users"("id") ON DELETE CASCADE,
  "notificationId" INTEGER REFERENCES "Notifications"("id") ON DELETE CASCADE,
  "isRead" BOOLEAN DEFAULT FALSE,
  "readAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE UNIQUE INDEX "user_notifications_unique_idx" ON "UserNotifications" ("userId", "notificationId");
CREATE INDEX "user_notifications_user_idx" ON "UserNotifications" ("userId");
CREATE INDEX "user_notifications_read_idx" ON "UserNotifications" ("isRead");
```

#### NotificationPreferences Table
```sql
CREATE TABLE "NotificationPreferences" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER REFERENCES "Users"("id") ON DELETE CASCADE,
  "notificationType" VARCHAR(255) NOT NULL,
  "enabled" BOOLEAN DEFAULT TRUE,
  "emailEnabled" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE UNIQUE INDEX "notification_preferences_unique_idx" ON "NotificationPreferences" ("userId", "notificationType");
```

## 🔗 Relationships

### Entity Relationship Diagram
```
Users (1) -----> (N) Orders
Users (1) -----> (N) Notifications
Users (1) -----> (N) NotificationPreferences
Users (N) <----> (N) Notifications (via UserNotifications)

Customers (1) -----> (N) Orders

Orders (1) -----> (N) OrderItems
Products (1) -----> (N) OrderItems
```

### Sequelize Model Associations
```javascript
// models/associations.js

// User associations
User.hasMany(Order, { foreignKey: 'createdBy', as: 'createdOrders' });
User.hasMany(Notification, { foreignKey: 'createdBy', as: 'createdNotifications' });
User.hasMany(NotificationPreference, { foreignKey: 'userId' });
User.belongsToMany(Notification, { 
  through: UserNotification, 
  foreignKey: 'userId',
  as: 'notifications'
});

// Customer associations
Customer.hasMany(Order, { foreignKey: 'customerId' });

// Order associations
Order.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Order.belongsTo(Customer, { foreignKey: 'customerId' });
Order.hasMany(OrderItem, { foreignKey: 'orderId' });

// Product associations
Product.hasMany(OrderItem, { foreignKey: 'productId' });

// OrderItem associations
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });
OrderItem.belongsTo(Product, { foreignKey: 'productId' });

// Notification associations
Notification.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Notification.belongsToMany(User, { 
  through: UserNotification, 
  foreignKey: 'notificationId',
  as: 'recipients'
});

// UserNotification associations
UserNotification.belongsTo(User, { foreignKey: 'userId' });
UserNotification.belongsTo(Notification, { foreignKey: 'notificationId' });

// NotificationPreference associations
NotificationPreference.belongsTo(User, { foreignKey: 'userId' });
```

## 🚀 Database Migrations

### Migration Structure
```
backend/migrations/
├── 20250101000001-create-users.js
├── 20250101000002-create-customers.js
├── 20250101000003-create-products.js
├── 20250101000004-create-orders.js
├── 20250101000005-create-order-items.js
├── 20250101000006-create-notifications.js
├── 20250101000007-create-user-notifications.js
└── 20250101000008-create-notification-preferences.js
```

### Example Migration
```javascript
// migrations/20250101000001-create-users.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      role: {
        type: Sequelize.ENUM('admin', 'staff'),
        defaultValue: 'staff'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add indexes
    await queryInterface.addIndex('Users', ['email']);
    await queryInterface.addIndex('Users', ['role']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Users');
  }
};
```

### Running Migrations
```bash
# Run all pending migrations
npm run db:migrate

# Undo last migration
npm run db:migrate:undo

# Undo all migrations
npm run db:migrate:undo:all

# Check migration status
npm run db:migrate:status
```

## 🌱 Database Seeding

### Seeder Structure
```
backend/seeders/
├── 20250101000001-admin-user.js
├── 20250101000002-sample-customers.js
├── 20250101000003-sample-products.js
└── 20250101000004-sample-orders.js
```

### Example Seeder
```javascript
// seeders/20250101000001-admin-user.js
'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await queryInterface.bulkInsert('Users', [
      {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@geminicrm.com',
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        firstName: 'Staff',
        lastName: 'User',
        email: 'staff@geminicrm.com',
        password: hashedPassword,
        role: 'staff',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', null, {});
  }
};
```

### Running Seeders
```bash
# Run all seeders
npm run db:seed

# Run specific seeder
npx sequelize-cli db:seed --seed 20250101000001-admin-user.js

# Undo all seeders
npm run db:seed:undo:all
```

## 🔍 Query Optimization

### Common Query Patterns
```javascript
// Efficient customer orders query with pagination
const getCustomerOrders = async (customerId, page = 1, limit = 10) => {
  return await Order.findAndCountAll({
    where: { customerId },
    include: [
      {
        model: OrderItem,
        include: [Product]
      },
      {
        model: User,
        as: 'creator',
        attributes: ['firstName', 'lastName']
      }
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset: (page - 1) * limit
  });
};

// Efficient product search with stock filtering
const searchProducts = async (searchTerm, inStock = false) => {
  const whereClause = {
    name: {
      [Op.iLike]: `%${searchTerm}%`
    }
  };
  
  if (inStock) {
    whereClause.stock = {
      [Op.gt]: 0
    };
  }
  
  return await Product.findAll({
    where: whereClause,
    order: [['name', 'ASC']]
  });
};
```

### Database Indexes
```sql
-- Performance indexes
CREATE INDEX CONCURRENTLY "orders_customer_date_idx" ON "Orders" ("customerId", "createdAt");
CREATE INDEX CONCURRENTLY "products_name_trgm_idx" ON "Products" USING gin ("name" gin_trgm_ops);
CREATE INDEX CONCURRENTLY "customers_name_trgm_idx" ON "Customers" USING gin (("firstName" || ' ' || "lastName") gin_trgm_ops);

-- Partial indexes for common queries
CREATE INDEX CONCURRENTLY "orders_pending_idx" ON "Orders" ("createdAt") WHERE "status" = 'pending';
CREATE INDEX CONCURRENTLY "products_low_stock_idx" ON "Products" ("stock") WHERE "stock" < 10;
```

## 🔒 Database Security

### User Permissions
```sql
-- Create database user with limited permissions
CREATE USER crm_app WITH PASSWORD 'secure_password';

-- Grant necessary permissions
GRANT CONNECT ON DATABASE gemini_crm TO crm_app;
GRANT USAGE ON SCHEMA public TO crm_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO crm_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO crm_app;

-- Revoke dangerous permissions
REVOKE CREATE ON SCHEMA public FROM crm_app;
REVOKE ALL ON SCHEMA information_schema FROM crm_app;
```

### Connection Security
```javascript
// config/database.js
module.exports = {
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    logging: false
  }
};
```

## 💾 Backup and Recovery

### Automated Backup Script
```bash
#!/bin/bash
# scripts/database-backup.sh

DB_NAME="gemini_crm"
DB_USER="crm_user"
BACKUP_DIR="/var/backups/gemini-crm"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Create database backup
pg_dump -h localhost -U $DB_USER -d $DB_NAME -f $BACKUP_DIR/backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/backup_$DATE.sql

# Remove backups older than 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: backup_$DATE.sql.gz"
```

### Recovery Procedure
```bash
#!/bin/bash
# scripts/database-restore.sh

DB_NAME="gemini_crm"
DB_USER="crm_user"
BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

# Stop application
sudo systemctl stop gemini-crm

# Drop and recreate database
dropdb -h localhost -U $DB_USER $DB_NAME
createdb -h localhost -U $DB_USER $DB_NAME

# Restore from backup
if [[ $BACKUP_FILE == *.gz ]]; then
    gunzip -c $BACKUP_FILE | psql -h localhost -U $DB_USER -d $DB_NAME
else
    psql -h localhost -U $DB_USER -d $DB_NAME < $BACKUP_FILE
fi

# Start application
sudo systemctl start gemini-crm

echo "Database restored from $BACKUP_FILE"
```

## 📊 Monitoring and Maintenance

### Database Health Checks
```sql
-- Check database size
SELECT 
    pg_database.datname,
    pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database;

-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check slow queries
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

### Maintenance Tasks
```sql
-- Update table statistics
ANALYZE;

-- Rebuild indexes
REINDEX DATABASE gemini_crm;

-- Clean up dead tuples
VACUUM ANALYZE;

-- Check for unused indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE idx_scan = 0;
```

---

**Last Updated**: July 2025  
**PostgreSQL Version**: 12+  
**Sequelize Version**: 6.x
