-- Fix auto-increment sequences for all tables
-- This ensures that the sequences are set to the correct next value

-- Fix orders sequence
SELECT setval('orders_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM orders));

-- Fix customers sequence (just in case)
SELECT setval('customers_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM customers));

-- Fix products sequence (just in case)
SELECT setval('products_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM products));

-- Fix order_items sequence (just in case)
SELECT setval('order_items_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM order_items));

-- Fix users sequence (just in case)
SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM users));
