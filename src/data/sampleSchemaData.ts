export default [
  {
    "name": "public",
    "tables": [
      {
        "name": "users",
        "columns": ["id", "username", "email", "first_name", "last_name", "phone_number", "address", "city", "country", "created_at"],
        "sampleData": [
          { "id": 1, "username": "john_doe", "email": "john.doe@example.com", "first_name": "John", "last_name": "Doe", "phone_number": "123-456-7890", "address": "123 Main St", "city": "Anytown", "country": "USA", "created_at": "2024-03-15T10:30:00Z" },
          { "id": 2, "username": "jane_smith", "email": "jane.smith@example.org", "first_name": "Jane", "last_name": "Smith", "phone_number": "987-654-3210", "address": "456 Oak Ave", "city": "Springfield", "country": "USA", "created_at": "2024-04-01T14:00:00Z" },
          { "id": 3, "username": "peter_jones", "email": "peterj@sample.net", "first_name": "Peter", "last_name": "Jones", "phone_number": "555-123-4567", "address": "789 Pine Ln", "city": "Hilldale", "country": "USA", "created_at": "2024-04-10T09:15:00Z" },
          { "id": 4, "username": "lisa_brown", "email": "lisa.b@work.com", "first_name": "Lisa", "last_name": "Brown", "phone_number": "111-222-3333", "address": "101 Elm Rd", "city": "Riverview", "country": "USA", "created_at": "2024-04-22T18:45:00Z" },
          { "id": 5, "username": "david_wilson", "email": "davidw@personal.info", "first_name": "David", "last_name": "Wilson", "phone_number": "444-555-6666", "address": "222 Willow Dr", "city": "Lakewood", "country": "USA", "created_at": "2024-05-01T11:20:00Z" },
          { "id": 6, "username": "sarah_miller", "email": "sarahm@email.co.uk", "first_name": "Sarah", "last_name": "Miller", "phone_number": "+44 7700 900000", "address": "Flat 5, 7 London Rd", "city": "London", "country": "UK", "created_at": "2024-05-05T16:00:00Z" },
          { "id": 7, "username": "kevin_davis", "email": "kevind@domain.com", "first_name": "Kevin", "last_name": "Davis", "phone_number": "212-555-1212", "address": "PO Box 345", "city": "New York", "country": "USA", "created_at": "2024-05-08T08:00:00Z" },
          { "id": 8, "username": "amy_garcia", "email": "amy.g@sample.org", "first_name": "Amy", "last_name": "Garcia", "phone_number": "305-111-2222", "address": "78 SW 1st St", "city": "Miami", "country": "USA", "created_at": "2024-05-12T13:30:00Z" },
          { "id": 9, "username": "ryan_rodriguez", "email": "ryanr@workplace.net", "first_name": "Ryan", "last_name": "Rodriguez", "phone_number": "617-999-8888", "address": "100 Beacon St", "city": "Boston", "country": "USA", "created_at": "2024-05-18T17:45:00Z" },
          { "id": 10, "username": "laura_martinez", "email": "lauram@home.info", "first_name": "Laura", "last_name": "Martinez", "phone_number": "773-444-3333", "address": "456 N Clark St", "city": "Chicago", "country": "USA", "created_at": "2024-05-22T09:00:00Z" },
          { "id": 11, "username": "brandon_lopez", "email": "brandonl@email.com", "first_name": "Brandon", "last_name": "Lopez", "phone_number": "213-777-6666", "address": "123 S Figueroa St", "city": "Los Angeles", "country": "USA", "created_at": "2024-05-28T11:15:00Z" },
          { "id": 12, "username": "nicole_harris", "email": "nicoleh@domain.co.uk", "first_name": "Nicole", "last_name": "Harris", "phone_number": "+44 20 7946 0000", "address": "22 Baker St", "city": "London", "country": "UK", "created_at": "2024-06-01T15:00:00Z" },
          { "id": 13, "username": "joseph_clark", "email": "josephc@sample.net", "first_name": "Joseph", "last_name": "Clark", "phone_number": "415-555-9999", "address": "567 Geary St", "city": "San Francisco", "country": "USA", "created_at": "2024-06-05T19:30:00Z" },
          { "id": 14, "username": "chelsea_lewis", "email": "chelseal@work.org", "first_name": "Chelsea", "last_name": "Lewis", "phone_number": "832-222-1111", "address": "789 Main St", "city": "Houston", "country": "USA", "created_at": "2024-06-10T08:45:00Z" },
          { "id": 15, "username": "patrick_young", "email": "patricky@personal.info", "first_name": "Patrick", "last_name": "Young", "phone_number": "602-333-4444", "address": "101 N Central Ave", "city": "Phoenix", "country": "USA", "created_at": "2024-06-14T12:00:00Z" }
        ]
      },
      {
        "name": "orders",
        "columns": ["id", "user_id", "order_number", "order_date", "shipping_address", "total_amount", "payment_method", "order_status", "delivery_date", "tracking_number"],
        "sampleData": [
          { "id": 101, "user_id": 1, "order_number": "ORD-20240316-001", "order_date": "2024-03-16T12:00:00Z", "shipping_address": "123 Main St, Anytown, USA", "total_amount": 38.97, "payment_method": "Credit Card", "order_status": "Shipped", "delivery_date": "2024-03-20T10:00:00Z", "tracking_number": "TRACK12345" },
          { "id": 102, "user_id": 2, "order_number": "ORD-20240402-002", "order_date": "2024-04-02T15:30:00Z", "shipping_address": "456 Oak Ave, Springfield, USA", "total_amount": 15.49, "payment_method": "PayPal", "order_status": "Delivered", "delivery_date": "2024-04-05T14:00:00Z", "tracking_number": "TRACK67890" },
          { "id": 103, "user_id": 1, "order_number": "ORD-20240405-003", "order_date": "2024-04-05T11:45:00Z", "shipping_address": "123 Main St, Anytown, USA", "total_amount": 21.98, "payment_method": "Credit Card", "order_status": "Processing", "delivery_date": null, "tracking_number": null },
          { "id": 104, "user_id": 3, "order_number": "ORD-20240411-004", "order_date": "2024-04-11T17:00:00Z", "shipping_address": "789 Pine Ln, Hilldale, USA", "total_amount": 35.75, "payment_method": "Apple Pay", "order_status": "Shipped", "delivery_date": "2024-04-15T11:30:00Z", "tracking_number": "TRACK11223" },
          { "id": 105, "user_id": 4, "order_number": "ORD-20240423-005", "order_date": "2024-04-23T09:00:00Z", "shipping_address": "101 Elm Rd, Riverview, USA", "total_amount": 119.00, "payment_method": "Credit Card", "order_status": "Delivered", "delivery_date": "2024-04-27T16:00:00Z", "tracking_number": "TRACK44556" },
          { "id": 106, "user_id": 2, "order_number": "ORD-20240428-006", "order_date": "2024-04-28T14:45:00Z", "shipping_address": "456 Oak Ave, Springfield, USA", "total_amount": 51.00, "payment_method": "PayPal", "order_status": "Processing", "delivery_date": null, "tracking_number": null },
          { "id": 107, "user_id": 5, "order_number": "ORD-20240502-007", "order_date": "2024-05-02T19:15:00Z", "shipping_address": "222 Willow Dr, Lakewood, USA", "total_amount": 89.95, "payment_method": "Google Pay", "order_status": "Shipped", "delivery_date": "2024-05-06T13:45:00Z", "tracking_number": "TRACK77889" },
          { "id": 108, "user_id": 1, "order_number": "ORD-20240506-008", "order_date": "2024-05-06T10:00:00Z", "shipping_address": "123 Main St, Anytown, USA", "total_amount": 30.98, "payment_method": "Credit Card", "order_status": "Delivered", "delivery_date": "2024-05-09T17:00:00Z", "tracking_number": "TRACK99001" },
          { "id": 109, "user_id": 6, "order_number": "ORD-20240507-009", "order_date": "2024-05-07T16:30:00Z", "shipping_address": "Flat 5, 7 London Rd, London, UK", "total_amount": 79.00, "payment_method": "Credit Card", "order_status": "Processing", "delivery_date": null, "tracking_number": null },
          { "id": 110, "user_id": 3, "order_number": "ORD-20240510-010", "order_date": "2024-05-10T08:00:00Z", "shipping_address": "789 Pine Ln, Hilldale, USA", "total_amount": 12.00, "payment_method": "PayPal", "order_status": "Shipped", "delivery_date": "2024-05-14T09:30:00Z", "tracking_number": "TRACK22334" },
          { "id": 111, "user_id": 7, "order_number": "ORD-20240515-011", "order_date": "2024-05-15T13:15:00Z", "shipping_address": "PO Box 345, New York, USA", "total_amount": 25.50, "payment_method": "Apple Pay", "order_status": "Delivered", "delivery_date": "2024-05-18T15:00:00Z", "tracking_number": "TRACK55667" },
          { "id": 112, "user_id": 4, "order_number": "ORD-20240519-012", "order_date": "2024-05-19T18:30:00Z", "shipping_address": "101 Elm Rd, Riverview, USA", "total_amount": 199.99, "payment_method": "Credit Card", "order_status": "Processing", "delivery_date": null, "tracking_number": null },
          { "id": 113, "user_id": 8, "order_number": "ORD-20240523-013", "order_date": "2024-05-23T10:45:00Z", "shipping_address": "78 SW 1st St, Miami, USA", "total_amount": 65.25, "payment_method": "Google Pay", "order_status": "Shipped", "delivery_date": "2024-05-27T11:00:00Z", "tracking_number": "TRACK88990" },
          { "id": 114, "user_id": 5, "order_number": "ORD-20240527-014", "order_date": "2024-05-27T16:00:00Z", "shipping_address": "222 Willow Dr, Lakewood, USA", "total_amount": 19.99, "payment_method": "PayPal", "order_status": "Delivered", "delivery_date": "2024-05-30T16:45:00Z", "tracking_number": "TRACK00112" },
          { "id": 115, "user_id": 9, "order_number": "ORD-20240530-015", "order_date": "2024-05-30T11:30:00Z", "shipping_address": "100 Beacon St, Boston, USA", "total_amount": 1299.99, "payment_method": "Credit Card", "order_status": "Processing", "delivery_date": null, "tracking_number": null }
        ]
      }
    ]
  },
  {
    "name": "sales",
    "tables": [
      {
        "name": "products",
        "columns": ["id", "name", "description", "price", "category", "stock_quantity", "supplier_id", "weight_kg", "dimensions_cm", "sku"],
        "sampleData": [
          { "id": 201, "name": "Laptop Pro", "description": "High-performance professional laptop", "price": 1299.99, "category": "Electronics", "stock_quantity": 55, "supplier_id": 1001, "weight_kg": 1.5, "dimensions_cm": "30x20x2", "sku": "LAP-PRO-001" },
          { "id": 202, "name": "Wireless Mouse", "description": "Comfortable ergonomic wireless mouse", "price": 25.50, "category": "Electronics", "stock_quantity": 150, "supplier_id": 1002, "weight_kg": 0.15, "dimensions_cm": "12x7x4", "sku": "MOU-WIRE-002" },
          { "id": 203, "name": "Ergonomic Keyboard", "description": "Full-size ergonomic keyboard with wrist rest", "price": 79.00, "category": "Electronics", "stock_quantity": 80, "supplier_id": 1002, "weight_kg": 0.8, "dimensions_cm": "45x15x3", "sku": "KEY-ERGO-003" },
          { "id": 204, "name": "Office Chair", "description": "Adjustable office chair with lumbar support", "price": 199.99, "category": "Furniture", "stock_quantity": 30, "supplier_id": 1003, "weight_kg": 15.0, "dimensions_cm": "60x60x100", "sku": "CHR-OFFI-004" },
          { "id": 205, "name": "Desk Lamp", "description": "Modern LED desk lamp with adjustable brightness", "price": 35.75, "category": "Furniture", "stock_quantity": 120, "supplier_id": 1004, "weight_kg": 0.9, "dimensions_cm": "20x20x40", "sku": "LMP-DESK-005" },
          { "id": 301, "name": "T-Shirt (Blue)", "description": "Cotton blue t-shirt, various sizes", "price": 19.99, "category": "Apparel", "stock_quantity": 200, "supplier_id": 1005, "weight_kg": 0.2, "dimensions_cm": "30x25x1", "sku": "TSH-BLUE-006" },
          { "id": 302, "name": "Jeans (Slim Fit)", "description": "Slim fit denim jeans for men", "price": 59.50, "category": "Apparel", "stock_quantity": 90, "supplier_id": 1005, "weight_kg": 0.6, "dimensions_cm": "40x30x2", "sku": "JNS-SLIM-007" },
          { "id": 303, "name": "Coffee Maker", "description": "Automatic drip coffee maker, 12-cup capacity", "price": 45.00, "category": "Appliances", "stock_quantity": 70, "supplier_id": 1006, "weight_kg": 2.5, "dimensions_cm": "25x20x35", "sku": "CFM-AUTO-008" },
          { "id": 304, "name": "Toaster Oven", "description": "Compact toaster oven with multiple settings", "price": 65.25, "category": "Appliances", "stock_quantity": 45, "supplier_id": 1006, "weight_kg": 4.0, "dimensions_cm": "35x30x25", "sku": "TOV-COMP-009" },
          { "id": 305, "name": "Running Shoes", "description": "Lightweight running shoes for athletes", "price": 89.95, "category": "Footwear", "stock_quantity": 110, "supplier_id": 1007, "weight_kg": 0.7, "dimensions_cm": "30x20x12", "sku": "SHOE-RUN-010" },
          { "id": 310, "name": "Book: The Great Novel", "description": "A critically acclaimed fiction novel", "price": 12.00, "category": "Books", "stock_quantity": 300, "supplier_id": 1008, "weight_kg": 0.4, "dimensions_cm": "20x15x3", "sku": "BOOK-GRT-011" },
          { "id": 315, "name": "Smartphone X", "description": "Latest generation smartphone with advanced features", "price": 799.00, "category": "Electronics", "stock_quantity": 60, "supplier_id": 1001, "weight_kg": 0.2, "dimensions_cm": "15x7x1", "sku": "PHN-SMX-012" },
          { "id": 316, "name": "Gaming Headset", "description": "Over-ear gaming headset with microphone", "price": 55.00, "category": "Electronics", "stock_quantity": 95, "supplier_id": 1002, "weight_kg": 0.35, "dimensions_cm": "22x18x10", "sku": "HED-GAM-013" },
          { "id": 317, "name": "Wooden Coffee Table", "description": "Solid wood coffee table for living room", "price": 149.50, "category": "Furniture", "stock_quantity": 40, "supplier_id": 1003, "weight_kg": 12.0, "dimensions_cm": "100x60x45", "sku": "TBL-COF-014" },
          { "id": 318, "name": "Floor Lamp", "description": "Standing floor lamp with adjustable arm", "price": 75.99, "category": "Furniture", "stock_quantity": 75, "supplier_id": 1004, "weight_kg": 3.0, "dimensions_cm": "30x30x150", "sku": "LMP-FLR-015" }
        ]
      },
      {
        "name": "transactions",
        "columns": ["id", "product_id", "transaction_type", "quantity", "amount", "transaction_date", "customer_id", "payment_status", "shipping_cost", "discount_applied"],
        "sampleData": [
          { "id": 201, "product_id": 201, "transaction_type": "sale", "quantity": 1, "amount": 1299.99, "transaction_date": "2025-05-01T12:05:00Z", "customer_id": 1, "payment_status": "paid", "shipping_cost": 10.00, "discount_applied": 0.00 },
          { "id": 202, "product_id": 205, "transaction_type": "sale", "quantity": 3, "amount": 107.25, "transaction_date": "2025-05-01T12:10:00Z", "customer_id": 1, "payment_status": "paid", "shipping_cost": 5.00, "discount_applied": 0.05 },
          { "id": 203, "product_id": 310, "transaction_type": "sale", "quantity": 1, "amount": 12.00, "transaction_date": "2025-05-02T15:35:00Z", "customer_id": 2, "payment_status": "paid", "shipping_cost": 3.00, "discount_applied": 0.00 },
          { "id": 204, "product_id": 201, "transaction_type": "sale", "quantity": 2, "amount": 2599.98, "transaction_date": "2025-05-03T11:50:00Z", "customer_id": 3, "payment_status": "paid", "shipping_cost": 12.00, "discount_applied": 0.10 },
          { "id": 205, "product_id": 205, "transaction_type": "return", "quantity": 1, "amount": 35.75, "transaction_date": "2025-05-03T17:05:00Z", "customer_id": 4, "payment_status": "refunded", "shipping_cost": 0.00, "discount_applied": 0.00 },
          { "id": 206, "product_id": 302, "transaction_type": "sale", "quantity": 4, "amount": 238.00, "transaction_date": "2025-05-04T09:05:00Z", "customer_id": 2, "payment_status": "paid", "shipping_cost": 8.00, "discount_applied": 0.00 },
          { "id": 207, "product_id": 215, "transaction_type": "sale", "quantity": 2, "amount": 1598.00, "transaction_date": "2025-05-05T14:50:00Z", "customer_id": 5, "payment_status": "paid", "shipping_cost": 15.00, "discount_applied": 0.05 },
          { "id": 208, "product_id": 305, "transaction_type": "sale", "quantity": 1, "amount": 89.95, "transaction_date": "2025-05-06T19:20:00Z", "customer_id": 6, "payment_status": "paid", "shipping_cost": 7.00, "discount_applied": 0.00 },
          { "id": 209, "product_id": 310, "transaction_type": "sale", "quantity": 2, "amount": 24.00, "transaction_date": "2025-05-07T10:05:00Z", "customer_id": 1, "payment_status": "paid", "shipping_cost": 3.00, "discount_applied": 0.10 },
          { "id": 210, "product_id": 203, "transaction_type": "sale", "quantity": 1, "amount": 79.00, "transaction_date": "2025-05-07T16:35:00Z", "customer_id": 7, "payment_status": "paid", "shipping_cost": 6.00, "discount_applied": 0.00 },
          { "id": 211, "product_id": 316, "transaction_type": "sale", "quantity": 1, "amount": 55.00, "transaction_date": "2025-05-08T08:15:00Z", "customer_id": 8, "payment_status": "paid", "shipping_cost": 4.00, "discount_applied": 0.00 },
          { "id": 212, "product_id": 202, "transaction_type": "sale", "quantity": 2, "amount": 51.00, "transaction_date": "2025-05-08T13:00:00Z", "customer_id": 9, "payment_status": "paid", "shipping_cost": 3.50, "discount_applied": 0.05 },
          { "id": 213, "product_id": 301, "transaction_type": "sale", "quantity": 3, "amount": 59.97, "transaction_date": "2025-05-08T17:40:00Z", "customer_id": 10, "payment_status": "paid", "shipping_cost": 6.50, "discount_applied": 0.00 },
          { "id": 214, "product_id": 204, "transaction_type": "sale", "quantity": 1, "amount": 199.99, "transaction_date": "2025-05-08T19:55:00Z", "customer_id": 11, "payment_status": "pending", "shipping_cost": 18.00, "discount_applied": 0.00 },
          { "id": 215, "product_id": 317, "transaction_type": "sale", "quantity": 1, "amount": 149.50, "transaction_date": "2025-05-08T20:30:00Z", "customer_id": 12, "payment_status": "paid", "shipping_cost": 14.00, "discount_applied": 0.00 }
        ]
      }
    ]
  },
  {
    "name": "inventory",
    "tables": [
      {
        "name": "stock_levels",
        "columns": ["product_id", "warehouse_id", "quantity_in_stock", "last_stock_update", "reorder_level", "reorder_quantity", "unit_cost", "shelf_location", "is_active", "notes"],
        "sampleData": [
          { "product_id": 201, "warehouse_id": 1, "quantity_in_stock": 50, "last_stock_update": "2025-05-07T09:00:00Z", "reorder_level": 20, "reorder_quantity": 30, "unit_cost": 650.00, "shelf_location": "A1-05", "is_active": true, "notes": null },
          { "product_id": 202, "warehouse_id": 1, "quantity_in_stock": 120, "last_stock_update": "2025-05-06T14:30:00Z", "reorder_level": 50, "reorder_quantity": 100, "unit_cost": 12.50, "shelf_location": "B2-12", "is_active": true, "notes": null },
          { "product_id": 203, "warehouse_id": 2, "quantity_in_stock": 70, "last_stock_update": "2025-05-08T10:15:00Z", "reorder_level": 30, "reorder_quantity": 50, "unit_cost": 38.00, "shelf_location": "C3-01", "is_active": true, "notes": null },
          { "product_id": 204, "warehouse_id": 2, "quantity_in_stock": 25, "last_stock_update": "2025-05-05T16:45:00Z", "reorder_level": 10, "reorder_quantity": 20, "unit_cost": 100.00, "shelf_location": "D4-08", "is_active": true, "notes": null },
          { "product_id": 205, "warehouse_id": 1, "quantity_in_stock": 100, "last_stock_update": "2025-05-07T11:00:00Z", "reorder_level": 40, "reorder_quantity": 80, "unit_cost": 18.00, "shelf_location": "A1-08", "is_active": true, "notes": null },
          { "product_id": 301, "warehouse_id": 3, "quantity_in_stock": 180, "last_stock_update": "2025-05-06T09:30:00Z", "reorder_level": 80, "reorder_quantity": 150, "unit_cost": 9.50, "shelf_location": "E5-03", "is_active": true, "notes": null },
          { "product_id": 302, "warehouse_id": 3, "quantity_in_stock": 75, "last_stock_update": "2025-05-08T12:45:00Z", "reorder_level": 35, "reorder_quantity": 60, "unit_cost": 29.75, "shelf_location": "F6-11", "is_active": true, "notes": null },
          { "product_id": 303, "warehouse_id": 1, "quantity_in_stock": 60, "last_stock_update": "2025-05-05T14:00:00Z", "reorder_level": 25, "reorder_quantity": 50, "unit_cost": 22.50, "shelf_location": "B2-05", "is_active": true, "notes": null },
          { "product_id": 304, "warehouse_id": 2, "quantity_in_stock": 35, "last_stock_update": "2025-05-07T17:15:00Z", "reorder_level": 15, "reorder_quantity": 30, "unit_cost": 32.63, "shelf_location": "C3-10", "is_active": true, "notes": null },
          { "product_id": 305, "warehouse_id": 3, "quantity_in_stock": 90, "last_stock_update": "2025-05-06T10:45:00Z", "reorder_level": 45, "reorder_quantity": 90, "unit_cost": 45.00, "shelf_location": "E5-15", "is_active": true, "notes": null },
          { "product_id": 310, "warehouse_id": 1, "quantity_in_stock": 250, "last_stock_update": "2025-05-08T08:30:00Z", "reorder_level": 100, "reorder_quantity": 200, "unit_cost": 6.00, "shelf_location": "A1-12", "is_active": true, "notes": null },
          { "product_id": 315, "warehouse_id": 2, "quantity_in_stock": 50, "last_stock_update": "2025-05-07T13:00:00Z", "reorder_level": 20, "reorder_quantity": 40, "unit_cost": 400.00, "shelf_location": "D4-02", "is_active": true, "notes": null },
          { "product_id": 316, "warehouse_id": 3, "quantity_in_stock": 80, "last_stock_update": "2025-05-06T16:15:00Z", "reorder_level": 30, "reorder_quantity": 60, "unit_cost": 27.50, "shelf_location": "F6-05", "is_active": true, "notes": null },
          { "product_id": 317, "warehouse_id": 1, "quantity_in_stock": 30, "last_stock_update": "2025-05-08T14:45:00Z", "reorder_level": 15, "reorder_quantity": 25, "unit_cost": 75.00, "shelf_location": "B2-18", "is_active": true, "notes": null },
          { "product_id": 318, "warehouse_id": 2, "quantity_in_stock": 60, "last_stock_update": "2025-05-05T10:00:00Z", "reorder_level": 25, "reorder_quantity": 50, "unit_cost": 38.00, "shelf_location": "C3-15", "is_active": true, "notes": null }
        ]
      }
    ]
  },
  {
    "name": "logistics",
    "tables": [
      {
        "name": "shipments",
        "columns": ["shipment_id", "order_id", "carrier", "tracking_number", "ship_date", "estimated_delivery", "actual_delivery", "shipping_address", "shipping_city", "shipping_country"],
        "sampleData": [
          { "shipment_id": 501, "order_id": 101, "carrier": "FedEx", "tracking_number": "FDX123456", "ship_date": "2025-03-17T08:00:00Z", "estimated_delivery": "2025-03-20T10:00:00Z", "actual_delivery": "2025-03-20T09:45:00Z", "shipping_address": "123 Main St", "shipping_city": "Anytown", "shipping_country": "USA" },
          { "shipment_id": 502, "order_id": 102, "carrier": "UPS", "tracking_number": "UPS987654", "ship_date": "2025-04-03T11:00:00Z", "estimated_delivery": "2025-04-05T14:00:00Z", "actual_delivery": "2025-04-05T13:30:00Z", "shipping_address": "456 Oak Ave", "shipping_city": "Springfield", "shipping_country": "USA" },
          { "shipment_id": 503, "order_id": 104, "carrier": "DHL", "tracking_number": "DHL555111", "ship_date": "2025-04-12T09:30:00Z", "estimated_delivery": "2025-04-15T11:30:00Z", "actual_delivery": "2025-04-15T11:00:00Z", "shipping_address": "789 Pine Ln", "shipping_city": "Hilldale", "shipping_country": "USA" },
          { "shipment_id": 504, "order_id": 105, "carrier": "USPS", "tracking_number": "USP222333", "ship_date": "2025-04-24T14:00:00Z", "estimated_delivery": "2025-04-27T16:00:00Z", "actual_delivery": "2025-04-27T15:15:00Z", "shipping_address": "101 Elm Rd", "shipping_city": "Riverview", "shipping_country": "USA" },
          { "shipment_id": 505, "order_id": 107, "carrier": "FedEx", "tracking_number": "FDX444555", "ship_date": "2025-05-03T16:00:00Z", "estimated_delivery": "2025-05-06T13:45:00Z", "actual_delivery": "2025-05-06T13:00:00Z", "shipping_address": "222 Willow Dr", "shipping_city": "Lakewood", "shipping_country": "USA" },
          { "shipment_id": 506, "order_id": 108, "carrier": "UPS", "tracking_number": "UPS666777", "ship_date": "2025-05-07T10:30:00Z", "estimated_delivery": "2025-05-09T17:00:00Z", "actual_delivery": "2025-05-09T16:45:00Z", "shipping_address": "123 Main St", "shipping_city": "Anytown", "shipping_country": "USA" },
          { "shipment_id": 507, "order_id": 110, "carrier": "DHL", "tracking_number": "DHL888999", "ship_date": "2025-05-11T12:00:00Z", "estimated_delivery": "2025-05-14T09:30:00Z", "actual_delivery": "2025-05-14T09:00:00Z", "shipping_address": "789 Pine Ln", "shipping_city": "Hilldale", "shipping_country": "USA" },
          { "shipment_id": 508, "order_id": 111, "carrier": "USPS", "tracking_number": "USP000111", "ship_date": "2025-05-16T17:00:00Z", "estimated_delivery": "2025-05-18T15:00:00Z", "actual_delivery": "2025-05-18T14:30:00Z", "shipping_address": "PO Box 345", "shipping_city": "New York", "shipping_country": "USA" },
          { "shipment_id": 509, "order_id": 113, "carrier": "FedEx", "tracking_number": "FDX222333", "ship_date": "2025-05-24T09:00:00Z", "estimated_delivery": "2025-05-27T11:00:00Z", "actual_delivery": "2025-05-27T10:15:00Z", "shipping_address": "78 SW 1st St", "shipping_city": "Miami", "shipping_country": "USA" },
          { "shipment_id": 510, "order_id": 114, "carrier": "UPS", "tracking_number": "UPS444555", "ship_date": "2025-05-28T13:00:00Z", "estimated_delivery": "2025-05-30T16:45:00Z", "actual_delivery": "2025-05-30T16:15:00Z", "shipping_address": "222 Willow Dr", "shipping_city": "Lakewood", "shipping_country": "USA" },
          { "shipment_id": 511, "order_id": 115, "carrier": "DHL", "tracking_number": "DHL666777", "ship_date": "2025-05-31T15:00:00Z", "estimated_delivery": "2025-06-03T18:00:00Z", "actual_delivery": null, "shipping_address": "100 Beacon St", "shipping_city": "Boston", "shipping_country": "USA" },
          { "shipment_id": 512, "order_id": 103, "carrier": "USPS", "tracking_number": "USP888999", "ship_date": "2025-04-06T10:00:00Z", "estimated_delivery": "2025-04-09T12:00:00Z", "actual_delivery": "2025-04-09T11:30:00Z", "shipping_address": "123 Main St", "shipping_city": "Anytown", "shipping_country": "USA" },
          { "shipment_id": 513, "order_id": 106, "carrier": "FedEx", "tracking_number": "FDX000111", "ship_date": "2025-04-29T16:00:00Z", "estimated_delivery": "2025-05-02T18:00:00Z", "actual_delivery": null, "shipping_address": "456 Oak Ave", "shipping_city": "Springfield", "shipping_country": "USA" },
          { "shipment_id": 514, "order_id": 109, "carrier": "UPS", "tracking_number": "UPS222333", "ship_date": "2025-05-08T11:30:00Z", "estimated_delivery": "2025-05-10T14:00:00Z", "actual_delivery": null, "shipping_address": "Flat 5, 7 London Rd", "shipping_city": "London", "shipping_country": "UK" },
          { "shipment_id": 515, "order_id": 112, "carrier": "DHL", "tracking_number": "DHL444555", "ship_date": "2025-05-20T13:00:00Z", "estimated_delivery": "2025-05-23T15:00:00Z", "actual_delivery": null, "shipping_address": "101 Elm Rd", "shipping_city": "Riverview", "shipping_country": "USA" }
        ]
      }
    ]
  },
  {
    "name": "finance",
    "tables": [
      {
        "name": "invoices",
        "columns": ["invoice_id", "order_id", "invoice_date", "due_date", "total_amount", "payment_status", "payment_date", "billing_address", "billing_city", "billing_country"],
        "sampleData": [
          { "invoice_id": 301, "order_id": 101, "invoice_date": "2025-03-16T14:00:00Z", "due_date": "2025-03-30T14:00:00Z", "total_amount": 38.97, "payment_status": "paid", "payment_date": "2025-03-28T10:00:00Z", "billing_address": "123 Main St", "billing_city": "Anytown", "billing_country": "USA" },
          { "invoice_id": 302, "order_id": 102, "invoice_date": "2025-04-02T17:00:00Z", "due_date": "2025-04-16T17:00:00Z", "total_amount": 15.49, "payment_status": "paid", "payment_date": "2025-04-10T15:30:00Z", "billing_address": "456 Oak Ave", "billing_city": "Springfield", "billing_country": "USA" },
          { "invoice_id": 303, "order_id": 103, "invoice_date": "2025-04-05T13:00:00Z", "due_date": "2025-04-19T13:00:00Z", "total_amount": 21.98, "payment_status": "unpaid", "payment_date": null, "billing_address": "123 Main St", "billing_city": "Anytown", "billing_country": "USA" },
          { "invoice_id": 304, "order_id": 104, "invoice_date": "2025-04-11T18:30:00Z", "due_date": "2025-04-25T18:30:00Z", "total_amount": 35.75, "payment_status": "paid", "payment_date": "2025-04-22T11:30:00Z", "billing_address": "789 Pine Ln", "billing_city": "Hilldale", "billing_country": "USA" },
          { "invoice_id": 305, "order_id": 105, "invoice_date": "2025-04-23T10:30:00Z", "due_date": "2025-05-07T10:30:00Z", "total_amount": 119.00, "payment_status": "paid", "payment_date": "2025-05-05T16:00:00Z", "billing_address": "101 Elm Rd", "billing_city": "Riverview", "billing_country": "USA" },
          { "invoice_id": 306, "order_id": 106, "invoice_date": "2025-04-28T16:00:00Z", "due_date": "2025-05-12T16:00:00Z", "total_amount": 51.00, "payment_status": "unpaid", "payment_date": null, "billing_address": "456 Oak Ave", "billing_city": "Springfield", "billing_country": "USA" },
          { "invoice_id": 307, "order_id": 107, "invoice_date": "2025-05-02T20:30:00Z", "due_date": "2025-05-16T20:30:00Z", "total_amount": 89.95, "payment_status": "paid", "payment_date": "2025-05-10T13:45:00Z", "billing_address": "222 Willow Dr", "billing_city": "Lakewood", "billing_country": "USA" },
          { "invoice_id": 308, "order_id": 108, "invoice_date": "2025-05-06T11:30:00Z", "due_date": "2025-05-20T11:30:00Z", "total_amount": 30.98, "payment_status": "paid", "payment_date": "2025-05-15T17:00:00Z", "billing_address": "123 Main St", "billing_city": "Anytown", "billing_country": "USA" },
          { "invoice_id": 309, "order_id": 109, "invoice_date": "2025-05-07T18:00:00Z", "due_date": "2025-05-21T18:00:00Z", "total_amount": 79.00, "payment_status": "unpaid", "payment_date": null, "billing_address": "Flat 5, 7 London Rd", "billing_city": "London", "billing_country": "UK" },
          { "invoice_id": 310, "order_id": 110, "invoice_date": "2025-05-10T09:30:00Z", "due_date": "2025-05-24T09:30:00Z", "total_amount": 12.00, "payment_status": "paid", "payment_date": "2025-05-18T09:30:00Z", "billing_address": "789 Pine Ln", "billing_city": "Hilldale", "billing_country": "USA" },
          { "invoice_id": 311, "order_id": 111, "invoice_date": "2025-05-15T14:30:00Z", "due_date": "2025-05-29T14:30:00Z", "total_amount": 25.50, "payment_status": "paid", "payment_date": "2025-05-22T15:00:00Z", "billing_address": "PO Box 345", "billing_city": "New York", "billing_country": "USA" },
          { "invoice_id": 312, "order_id": 112, "invoice_date": "2025-05-19T20:00:00Z", "due_date": "2025-06-02T20:00:00Z", "total_amount": 199.99, "payment_status": "unpaid", "payment_date": null, "billing_address": "101 Elm Rd", "billing_city": "Riverview", "billing_country": "USA" },
          { "invoice_id": 313, "order_id": 113, "invoice_date": "2025-05-23T12:00:00Z", "due_date": "2025-06-06T12:00:00Z", "total_amount": 65.25, "payment_status": "paid", "payment_date": "2025-05-30T11:00:00Z", "billing_address": "78 SW 1st St", "billing_city": "Miami", "billing_country": "USA" },
          { "invoice_id": 314, "order_id": 114, "invoice_date": "2025-05-27T17:30:00Z", "due_date": "2025-06-10T17:30:00Z", "total_amount": 19.99, "payment_status": "paid", "payment_date": "2025-06-04T16:45:00Z", "billing_address": "222 Willow Dr", "billing_city": "Lakewood", "billing_country": "USA" },
          { "invoice_id": 315, "order_id": 115, "invoice_date": "2025-05-30T13:00:00Z", "due_date": "2025-06-13T13:00:00Z", "total_amount": 1299.99, "payment_status": "unpaid", "payment_date": null, "billing_address": "100 Beacon St", "billing_city": "Boston", "billing_country": "USA" }
        ]
      }
    ]
  },
  {
    "name": "marketing",
    "tables": [
      {
        "name": "campaigns",
        "columns": ["campaign_id", "campaign_name", "start_date", "end_date", "budget", "target_audience", "status", "channel", "objective", "created_by"],
        "sampleData": [
          { "campaign_id": 1001, "campaign_name": "Summer Sale 2025", "start_date": "2025-06-01", "end_date": "2025-06-30", "budget": 5000.00, "target_audience": "All customers", "status": "active", "channel": "Email, Website Banner", "objective": "Increase Sales", "created_by": "marketing_team" },
          { "campaign_id": 1002, "campaign_name": "New Electronics Launch", "start_date": "2025-05-15", "end_date": "2025-06-15", "budget": 3000.00, "target_audience": "Tech Enthusiasts", "status": "completed", "channel": "Social Media, Blog", "objective": "Product Awareness", "created_by": "product_manager" },
          { "campaign_id": 1003, "campaign_name": "Loyalty Program Promotion", "start_date": "2025-05-01", "end_date": "2025-07-31", "budget": 2000.00, "target_audience": "Loyalty Members", "status": "active", "channel": "Email, Mobile App", "objective": "Increase Engagement", "created_by": "crm_manager" },
          { "campaign_id": 1004, "campaign_name": "Back to School Discount", "start_date": "2025-08-01", "end_date": "2025-08-31", "budget": 4000.00, "target_audience": "Students, Parents", "status": "planned", "channel": "Social Media, Website", "objective": "Increase Sales", "created_by": "marketing_team" },
          { "campaign_id": 1005, "campaign_name": "First Purchase Offer", "start_date": "2025-03-01", "end_date": "2025-12-31", "budget": 1500.00, "target_audience": "New Customers", "status": "active", "channel": "Website Pop-up, Email", "objective": "Customer Acquisition", "created_by": "online_sales" },
          { "campaign_id": 1006, "campaign_name": "Furniture Sale", "start_date": "2025-04-15", "end_date": "2025-05-31", "budget": 2500.00, "target_audience": "Home Owners", "status": "completed", "channel": "Website Banner, Print Ads", "objective": "Increase Sales", "created_by": "marketing_team" },
          { "campaign_id": 1007, "campaign_name": "Apparel Clearance", "start_date": "2025-07-01", "end_date": "2025-07-31", "budget": 1800.00, "target_audience": "Fashion Enthusiasts", "status": "planned", "channel": "Social Media, Email", "objective": "Inventory Clearance", "created_by": "merchandising" },
          { "campaign_id": 1008, "campaign_name": "Holiday Season Promotion", "start_date": "2025-11-15", "end_date": "2025-12-31", "budget": 7000.00, "target_audience": "All customers", "status": "planned", "channel": "Email, Website, Social Media", "objective": "Increase Sales", "created_by": "marketing_team" },
          { "campaign_id": 1009, "campaign_name": "Book Club Discount", "start_date": "2025-02-01", "end_date": "2025-12-31", "budget": 1000.00, "target_audience": "Book Lovers", "status": "active", "channel": "Email, Blog", "objective": "Increase Engagement", "created_by": "content_team" },
          { "campaign_id": 1010, "campaign_name": "New Appliance Arrivals", "start_date": "2025-09-01", "end_date": "2025-09-30", "budget": 2200.00, "target_audience": "Home Makers", "status": "planned", "channel": "Website Banner, Social Media", "objective": "Product Awareness", "created_by": "product_manager" },
          { "campaign_id": 1011, "campaign_name": "Footwear Flash Sale", "start_date": "2025-03-10", "end_date": "2025-03-15", "budget": 800.00, "target_audience": "Active Lifestyle", "status": "completed", "channel": "Social Media", "objective": "Increase Sales", "created_by": "marketing_team" },
          { "campaign_id": 1012, "campaign_name": "Electronics Trade-in", "start_date": "2025-06-15", "end_date": "2025-07-15", "budget": 1200.00, "target_audience": "Existing Customers", "status": "active", "channel": "Email, Website", "objective": "Customer Retention", "created_by": "customer_service" },
          { "campaign_id": 1013, "campaign_name": "Home Decor Refresh", "start_date": "2025-04-01", "end_date": "2025-04-30", "budget": 1600.00, "target_audience": "Home Decorators", "status": "completed", "channel": "Social Media, Blog", "objective": "Increase Sales", "created_by": "marketing_team" },
          { "campaign_id": 1014, "campaign_name": "Summer Reading List", "start_date": "2025-05-20", "end_date": "2025-06-30", "budget": 500.00, "target_audience": "Book Lovers", "status": "active", "channel": "Blog, Social Media", "objective": "Increase Engagement", "created_by": "content_team" },
          { "campaign_id": 1015, "campaign_name": "Kitchen Appliance Event", "start_date": "2025-10-01", "end_date": "2025-10-31", "budget": 2800.00, "target_audience": "Home Makers", "status": "planned", "channel": "Website, Email", "objective": "Increase Sales", "created_by": "marketing_team" }
        ]
      }
    ]
  },
  {
    "name": "suppliers",
    "tables": [
      {
        "name": "suppliers_info",
        "columns": ["supplier_id", "supplier_name", "contact_person", "email", "phone_number", "address", "city", "country", "website", "notes"],
        "sampleData": [
          { "supplier_id": 1001, "supplier_name": "Tech Solutions Inc.", "contact_person": "Alice Johnson", "email": "alice.j@techsol.com", "phone_number": "987-654-3211", "address": "789 Tech Park", "city": "Silicon Valley", "country": "USA", "website": "www.techsol.com", "notes": "Primary electronics supplier" },
          { "supplier_id": 1002, "supplier_name": "Global Electronics Ltd.", "contact_person": "Bob Williams", "email": "bob.w@globalelec.net", "phone_number": "+44 20 1234 5678", "address": "10 Downing St", "city": "London", "country": "UK", "website": "www.globalelec.net", "notes": "Secondary electronics supplier" },
          { "supplier_id": 1003, "supplier_name": "Furniture First Co.", "contact_person": "Catherine Davis", "email": "catherine.d@furniture1st.com", "phone_number": "555-987-6543", "address": "456 Industrial Ave", "city": "Grand Rapids", "country": "USA", "website": "www.furniture1st.com", "notes": "Main furniture supplier" },
          { "supplier_id": 1004, "supplier_name": "Home Lighting Group", "contact_person": "David Garcia", "email": "david.g@homelight.org", "phone_number": "111-222-3333", "address": "222 Bright Ln", "city": "Philadelphia", "country": "USA", "website": "www.homelight.org", "notes": "Lighting and decor supplier" },
          { "supplier_id": 1005, "supplier_name": "Apparel Source Inc.", "contact_person": "Eve Rodriguez", "email": "eve.r@apparelsource.com", "phone_number": "333-444-5555", "address": "555 Fashion Blvd", "city": "Los Angeles", "country": "USA", "website": "www.apparelsource.com", "notes": "Clothing supplier" },
          { "supplier_id": 1006, "supplier_name": "Kitchen Appliances Co.", "contact_person": "Frank Martinez", "email": "frank.m@kitchenapp.net", "phone_number": "444-555-6666", "address": "888 Home St", "city": "Chicago", "country": "USA", "website": "www.kitchenapp.net", "notes": "Appliance supplier" },
          { "supplier_id": 1007, "supplier_name": "Footwear Fashion Ltd.", "contact_person": "Grace Wilson", "email": "grace.w@footwearfashion.co.uk", "phone_number": "+44 11 9876 5432", "address": "33 Shoe Lane", "city": "Liverpool", "country": "UK", "website": "www.footwearfashion.co.uk", "notes": "Shoes and accessories" },
          { "supplier_id": 1008, "supplier_name": "Literary World Publishers", "contact_person": "Henry Clark", "email": "henry.c@literaryworld.com", "phone_number": "222-333-4444", "address": "123 Book St", "city": "New York", "country": "USA", "website": "www.literaryworld.com", "notes": "Book supplier" },
          { "supplier_id": 1009, "supplier_name": "Gaming Gear Corp.", "contact_person": "Ivy Lewis", "email": "ivy.l@gaminggear.org", "phone_number": "777-888-9999", "address": "99 Game Rd", "city": "Seattle", "country": "USA", "website": "www.gaminggear.org", "notes": "Gaming accessories" },
          { "supplier_id": 1010, "supplier_name": "Outdoor Equipment Inc.", "contact_person": "Jack Young", "email": "jack.y@outdoorequip.com", "phone_number": "888-999-0000", "address": "444 Trail Ave", "city": "Denver", "country": "USA", "website": "www.outdoorequip.com", "notes": "Sports and outdoor gear" },
          { "supplier_id": 1011, "supplier_name": "Cosmetics & Beauty Ltd.", "contact_person": "Kelly Hall", "email": "kelly.h@cosmeticsbeauty.co.uk", "phone_number": "+44 16 5432 1098", "address": "66 Beauty Lane", "city": "Manchester", "country": "UK", "website": "www.cosmeticsbeauty.co.uk", "notes": "Beauty product supplier" },
          { "supplier_id": 1012, "supplier_name": "Pet Supplies Co.", "contact_person": "Liam Green", "email": "liam.g@petsupplies.net", "phone_number": "666-777-8888", "address": "77 Pet Rd", "city": "Dallas", "country": "USA", "website": "www.petsupplies.net", "notes": "Pet product supplier" },
          { "supplier_id": 1013, "supplier_name": "Toy World Inc.", "contact_person": "Mia Adams", "email": "mia.a@toyworld.com", "phone_number": "555-666-7777", "address": "111 Play St", "city": "Orlando", "country": "USA", "website": "www.toyworld.com", "notes": "Toy supplier" },
          { "supplier_id": 1014, "supplier_name": "Art Supplies Ltd.", "contact_person": "Noah Baker", "email": "noah.b@artsupplies.org", "phone_number": "999-000-1111", "address": "222 Creative Ave", "city": "Portland", "country": "USA", "website": "www.artsupplies.org", "notes": "Art material supplier" },
          { "supplier_id": 1015, "supplier_name": "Music Instruments Co.", "contact_person": "Olivia Carter", "email": "olivia.c@musicinst.net", "phone_number": "111-999-2222", "address": "333 Melody Ln", "city": "Nashville", "country": "USA", "website": "www.musicinst.net", "notes": "Musical instrument supplier" }
        ]
      }
    ]
  },
  {
    "name": "customers",
    "tables": [
      {
        "name": "customer_details",
        "columns": ["customer_id", "first_name", "last_name", "email", "phone_number", "shipping_address", "billing_address", "city", "country", "registration_date"],
        "sampleData": [
          { "customer_id": 1, "first_name": "John", "last_name": "Doe", "email": "john.doe@email.com", "phone_number": "123-456-7890", "shipping_address": "123 Main St, Anytown", "billing_address": "123 Main St, Anytown", "city": "Anytown", "country": "USA", "registration_date": "2024-01-15" },
          { "customer_id": 2, "first_name": "Jane", "last_name": "Smith", "email": "jane.smith@email.org", "phone_number": "987-654-3210", "shipping_address": "456 Oak Ave, Springfield", "billing_address": "456 Oak Ave, Springfield", "city": "Springfield", "country": "USA", "registration_date": "2024-02-01" },
          { "customer_id": 3, "first_name": "Peter", "last_name": "Jones", "email": "peter.jones@email.net", "phone_number": "555-123-4567", "shipping_address": "789 Pine Ln, Hilldale", "billing_address": "789 Pine Ln, Hilldale", "city": "Hilldale", "country": "USA", "registration_date": "2024-03-10" },
          { "customer_id": 4, "first_name": "Lisa", "last_name": "Brown", "email": "lisa.brown@email.co.uk", "phone_number": "+44 7700 900000", "shipping_address": "Flat 5, 7 London Rd, London", "billing_address": "PO Box 123, London", "city": "London", "country": "UK", "registration_date": "2024-04-05" },
          { "customer_id": 5, "first_name": "David", "last_name": "Wilson", "email": "david.wilson@email.info", "phone_number": "111-222-3333", "shipping_address": "101 Elm Rd, Riverview", "billing_address": "101 Elm Rd, Riverview", "city": "Riverview", "country": "USA", "registration_date": "2024-05-20" },
          { "customer_id": 6, "first_name": "Sarah", "last_name": "Miller", "email": "sarah.miller@email.com", "phone_number": "222-333-4444", "shipping_address": "222 Willow Dr, Lakewood", "billing_address": "222 Willow Dr, Lakewood", "city": "Lakewood", "country": "USA", "registration_date": "2024-06-12" },
          { "customer_id": 7, "first_name": "Kevin", "last_name": "Davis", "email": "kevin.davis@email.org", "phone_number": "333-444-5555", "shipping_address": "333 Oak St, Anytown", "billing_address": "333 Oak St, Anytown", "city": "Anytown", "country": "USA", "registration_date": "2024-07-01" },
          { "customer_id": 8, "first_name": "Amy", "last_name": "Garcia", "email": "amy.garcia@email.net", "phone_number": "444-555-6666", "shipping_address": "444 Pine Ave, Springfield", "billing_address": "444 Pine Ave, Springfield", "city": "Springfield", "country": "USA", "registration_date": "2024-08-18" },
          { "customer_id": 9, "first_name": "Ryan", "last_name": "Rodriguez", "email": "ryan.rodriguez@email.co.uk", "phone_number": "+44 20 7946 0000", "shipping_address": "10 Downing St, London", "billing_address": "Apt 1, 5 Baker St, London", "city": "London", "country": "UK", "registration_date": "2024-09-25" },
          { "customer_id": 10, "first_name": "Laura", "last_name": "Martinez", "email": "laura.martinez@email.info", "phone_number": "555-666-7777", "shipping_address": "555 Elm Rd, Riverview", "billing_address": "555 Elm Rd, Riverview", "city": "Riverview", "country": "USA", "registration_date": "2024-10-30" },
          { "customer_id": 11, "first_name": "Brandon", "last_name": "Lopez", "email": "brandon.lopez@email.com", "phone_number": "666-777-8888", "shipping_address": "666 Willow Dr, Lakewood", "billing_address": "666 Willow Dr, Lakewood", "city": "Lakewood", "country": "USA", "registration_date": "2024-11-15" },
          { "customer_id": 12, "first_name": "Nicole", "last_name": "Harris", "email": "nicole.harris@email.org", "phone_number": "777-888-9999", "shipping_address": "777 Oak St, Anytown", "billing_address": "777 Oak St, Anytown", "city": "Anytown", "country": "USA", "registration_date": "2024-12-22" },
          { "customer_id": 13, "first_name": "Joseph", "last_name": "Clark", "email": "joseph.clark@email.net", "phone_number": "888-999-0000", "shipping_address": "888 Pine Ave, Springfield", "billing_address": "888 Pine Ave, Springfield", "city": "Springfield", "country": "USA", "registration_date": "2025-01-08" },
          { "customer_id": 14, "first_name": "Chelsea", "last_name": "Lewis", "email": "chelsea.lewis@email.co.uk", "phone_number": "+44 11 1234 5678", "shipping_address": "Flat 10, 15 Oxford St, London", "billing_address": "PO Box 456, London", "city": "London", "country": "UK", "registration_date": "2025-02-14" },
          { "customer_id": 15, "first_name": "Patrick", "last_name": "Young", "email": "patrick.young@email.info", "phone_number": "999-000-1111", "shipping_address": "999 Elm Rd, Riverview", "billing_address": "999 Elm Rd, Riverview", "city": "Riverview", "country": "USA", "registration_date": "2025-03-21" }
        ]
      }
    ]
  },
  {
    "name": "website",
    "tables": [
      {
        "name": "page_views",
        "columns": ["view_id", "user_id", "page_url", "view_timestamp", "session_id", "device_type", "referrer_url", "entry_page", "exit_page", "duration_seconds"],
        "sampleData": [
          { "view_id": 10001, "user_id": 1, "page_url": "/products/laptop-pro", "view_timestamp": "2025-05-08T10:00:00Z", "session_id": "SESS-123", "device_type": "desktop", "referrer_url": "www.google.com", "entry_page": true, "exit_page": false, "duration_seconds": 120 },
          { "view_id": 10002, "user_id": 2, "page_url": "/products/wireless-mouse", "view_timestamp": "2025-05-08T10:05:00Z", "session_id": "SESS-456", "device_type": "mobile", "referrer_url": "www.facebook.com", "entry_page": true, "exit_page": false, "duration_seconds": 60 },
          { "view_id": 10003, "user_id": 1, "page_url": "/cart", "view_timestamp": "2025-05-08T10:07:00Z", "session_id": "SESS-123", "device_type": "desktop", "referrer_url": "/products/laptop-pro", "entry_page": false, "exit_page": false, "duration_seconds": 300 },
          { "view_id": 10004, "user_id": 3, "page_url": "/products/ergonomic-keyboard", "view_timestamp": "2025-05-08T10:10:00Z", "session_id": "SESS-789", "device_type": "desktop", "referrer_url": "www.bing.com", "entry_page": true, "exit_page": false, "duration_seconds": 90 },
          { "view_id": 10005, "user_id": 2, "page_url": "/checkout", "view_timestamp": "2025-05-08T10:12:00Z", "session_id": "SESS-456", "device_type": "mobile", "referrer_url": "/cart", "entry_page": false, "exit_page": true, "duration_seconds": 180 },
          { "view_id": 10006, "user_id": 4, "page_url": "/products/office-chair", "view_timestamp": "2025-05-08T10:15:00Z", "session_id": "SESS-101", "device_type": "desktop", "referrer_url": "www.google.com", "entry_page": true, "exit_page": false, "duration_seconds": 150 },
          { "view_id": 10007, "user_id": 1, "page_url": "/order-confirmation", "view_timestamp": "2025-05-08T10:00Z", "session_id": "SESS-123", "device_type": "desktop", "referrer_url": "/checkout", "entry_page": false, "exit_page": true, "duration_seconds": 30 },
          { "view_id": 10008, "user_id": 5, "page_url": "/products/desk-lamp", "view_timestamp": "2025-05-08T10:25:00Z", "session_id": "SESS-202", "device_type": "mobile", "referrer_url": "www.instagram.com", "entry_page": true, "exit_page": false, "duration_seconds": 100 },
          { "view_id": 10009, "user_id": 3, "page_url": "/contact-us", "view_timestamp": "2025-05-08T10:30:00Z", "session_id": "SESS-789", "device_type": "desktop", "referrer_url": "/products/ergonomic-keyboard", "entry_page": false, "exit_page": true, "duration_seconds": 240 },
          { "view_id": 10010, "user_id": 6, "page_url": "/products/t-shirt-blue", "view_timestamp": "2025-05-08T10:35:00Z", "session_id": "SESS-303", "device_type": "mobile", "referrer_url": "www.google.com", "entry_page": true, "exit_page": false, "duration_seconds": 75 },
          { "view_id": 10011, "user_id": 4, "page_url": "/products/jeans-slim-fit", "view_timestamp": "2025-05-08T10:40:00Z", "session_id": "SESS-101", "device_type": "desktop", "referrer_url": "/products/office-chair", "entry_page": false, "exit_page": false, "duration_seconds": 180 },
          { "view_id": 10012, "user_id": 7, "page_url": "/products/coffee-maker", "view_timestamp": "2025-05-08T10:45:00Z", "session_id": "SESS-404", "device_type": "desktop", "referrer_url": "www.email-provider.com", "entry_page": true, "exit_page": false, "duration_seconds": 130 },
          { "view_id": 10013, "user_id": 5, "page_url": "/products/toaster-oven", "view_timestamp": "2025-05-08T10:50:00Z", "session_id": "SESS-202", "device_type": "mobile", "referrer_url": "/products/desk-lamp", "entry_page": false, "exit_page": true, "duration_seconds": 90 },
          { "view_id": 10014, "user_id": 8, "page_url": "/products/running-shoes", "view_timestamp": "2025-05-08T10:55:00Z", "session_id": "SESS-505", "device_type": "mobile", "referrer_url": "www.facebook.com", "entry_page": true, "exit_page": false, "duration_seconds": 110 },
          { "view_id": 10015, "user_id": 6, "page_url": "/products/book-the-great-novel", "view_timestamp": "2025-05-08T11:00:00Z", "session_id": "SESS-303", "device_type": "mobile", "referrer_url": "/products/t-shirt-blue", "entry_page": false, "exit_page": true, "duration_seconds": 200 }
        ]
      }
    ]
  },
  {
    "name": "support",
    "tables": [
      {
        "name": "tickets",
        "columns": ["ticket_id", "user_id", "subject", "description", "status", "priority", "created_at", "updated_at", "assigned_to", "resolution"],
        "sampleData": [
          { "ticket_id": 2001, "user_id": 1, "subject": "Order not received", "description": "My order ORD-20240316-001 has not arrived yet.", "status": "closed", "priority": "high", "created_at": "2025-03-25T09:00:00Z", "updated_at": "2025-03-28T17:00:00Z", "assigned_to": "support_agent_1", "resolution": "Customer contacted, issue resolved, refund issued." },
          { "ticket_id": 2002, "user_id": 2, "subject": "Product defect", "description": "Wireless mouse is not working correctly.", "status": "open", "priority": "medium", "created_at": "2025-04-05T11:30:00Z", "updated_at": "2025-04-06T14:00:00Z", "assigned_to": "support_agent_2", "resolution": null },
          { "ticket_id": 2003, "user_id": 3, "subject": "Account access issue", "description": "Unable to log in to my account.", "status": "pending", "priority": "high", "created_at": "2025-04-12T15:00:00Z", "updated_at": "2025-04-13T10:00:00Z", "assigned_to": "support_agent_1", "resolution": null },
          { "ticket_id": 2004, "user_id": 4, "subject": "Shipping address change", "description": "Need to update the shipping address for order ORD-20240423-005.", "status": "closed", "priority": "low", "created_at": "2025-04-20T08:00:00Z", "updated_at": "2025-04-21T16:00:00Z", "assigned_to": "support_agent_3", "resolution": "Address updated successfully." },
          { "ticket_id": 2005, "user_id": 5, "subject": "Return request", "description": " хочу вернуть Desk Lamp (ID: 205).", "status": "processing", "priority": "medium", "created_at": "2025-05-01T19:00:00Z", "updated_at": "2025-05-02T11:00:00Z", "assigned_to": "support_agent_2", "resolution": null },
          { "ticket_id": 2006, "user_id": 6, "subject": "Payment declined", "description": "My payment for order ORD-20240507-009 was declined.", "status": "closed", "priority": "high", "created_at": "2025-05-07T17:30:00Z", "updated_at": "2025-05-08T09:00:00Z", "assigned_to": "support_agent_1", "resolution": "Customer advised to try a different payment method." },
          { "ticket_id": 2007, "user_id": 7, "subject": "Product inquiry", "description": "Details about the 'Coffee Maker' specifications.", "status": "open", "priority": "low", "created_at": "2025-05-10T10:00:00Z", "updated_at": null, "assigned_to": "support_agent_3", "resolution": null },
          { "ticket_id": 2008, "user_id": 8, "subject": "Damaged item received", "description": "The Office Chair arrived with a broken armrest.", "status": "pending", "priority": "high", "created_at": "2025-05-15T14:00:00Z", "updated_at": null, "assigned_to": "support_agent_2", "resolution": null },
          { "ticket_id": 2009, "user_id": 9, "subject": "Discount code not working", "description": "The discount code 'SUMMER20' is not applying.", "status": "closed", "priority": "medium", "created_at": "2025-05-20T11:00:00Z", "updated_at": "2025-05-21T18:00:00Z", "assigned_to": "support_agent_1", "resolution": "Code was expired, new code provided." },
          { "ticket_id": 2010, "user_id": 10, "subject": "Order tracking", "description": "Need an update on the tracking for order ORD-20240527-014.", "status": "closed", "priority": "low", "created_at": "2025-05-28T09:30:00Z", "updated_at": "2025-05-29T15:00:00Z", "assigned_to": "support_agent_3", "resolution": "Tracking information provided." },
          { "ticket_id": 2011, "user_id": 11, "subject": "Incorrect item shipped", "description": "Received a different model of Laptop Pro than ordered.", "status": "open", "priority": "high", "created_at": "2025-06-01T16:00:00Z", "updated_at": null, "assigned_to": "support_agent_2", "resolution": null },
          { "ticket_id": 2012, "user_id": 12, "subject": "Billing query", "description": "Question about an item on my last invoice.", "status": "pending", "priority": "medium", "created_at": "2025-06-05T12:00:00Z", "updated_at": null, "assigned_to": "support_agent_1", "resolution": null },
          { "ticket_id": 2013, "user_id": 13, "subject": "Website issue", "description": "The product page for 'Ergonomic Keyboard' is not loading.", "status": "closed", "priority": "medium", "created_at": "2025-03-10T14:30:00Z", "updated_at": "2025-03-11T11:00:00Z", "assigned_to": "tech_support", "resolution": "Website issue resolved, cache cleared." },
          { "ticket_id": 2014, "user_id": 14, "subject": "Loyalty points", "description": "Inquiry about my current loyalty points balance.", "status": "closed", "priority": "low", "created_at": "2025-04-18T10:00:00Z", "updated_at": "2025-04-19T17:00:00Z", "assigned_to": "crm_support", "resolution": "Loyalty points balance provided." },
          { "ticket_id": 2015, "user_id": 15, "subject": "Pre-order question", "description": "Question about the release date of 'Smartphone X'.", "status": "open", "priority": "low", "created_at": "2025-05-25T08:00:00Z", "updated_at": null, "assigned_to": "product_support", "resolution": null }
        ]
      }
    ]
  },
  {
    "name": "reviews",
    "tables": [
      {
        "name": "product_reviews",
        "columns": ["review_id", "product_id", "user_id", "rating", "review_text", "review_date", "helpful_count", "reported_count", "is_featured", "moderation_status"],
        "sampleData": [
          { "review_id": 3001, "product_id": 201, "user_id": 1, "rating": 5, "review_text": "Excellent laptop! Fast and reliable.", "review_date": "2025-03-20T10:00:00Z", "helpful_count": 12, "reported_count": 0, "is_featured": true, "moderation_status": "approved" },
          { "review_id": 3002, "product_id": 202, "user_id": 2, "rating": 4, "review_text": "Good wireless mouse for the price.", "review_date": "2025-04-05T14:30:00Z", "helpful_count": 5, "reported_count": 0, "is_featured": false, "moderation_status": "approved" },
          { "review_id": 3003, "product_id": 201, "user_id": 3, "rating": 3, "review_text": "A bit expensive, but does the job.", "review_date": "2025-04-15T11:00:00Z", "helpful_count": 2, "reported_count": 1, "is_featured": false, "moderation_status": "approved" },
          { "review_id": 3004, "product_id": 204, "user_id": 4, "rating": 5, "review_text": "Very comfortable office chair for long hours.", "review_date": "2025-04-28T16:00:00Z", "helpful_count": 18, "reported_count": 0, "is_featured": true, "moderation_status": "approved" },
          { "review_id": 3005, "product_id": 205, "user_id": 5, "rating": 4, "review_text": "Nice desk lamp with adjustable brightness.", "review_date": "2025-05-05T19:30:00Z", "helpful_count": 7, "reported_count": 0, "is_featured": false, "moderation_status": "approved" },
          { "review_id": 3006, "product_id": 301, "user_id": 6, "rating": 5, "review_text": "Great quality blue t-shirt.", "review_date": "2025-05-12T10:00:00Z", "helpful_count": 9, "reported_count": 0, "is_featured": true, "moderation_status": "approved" },
          { "review_id": 3007, "product_id": 202, "user_id": 7, "rating": 3, "review_text": "Battery life could be better.", "review_date": "2025-05-18T15:00:00Z", "helpful_count": 3, "reported_count": 0, "is_featured": false, "moderation_status": "approved" },
          { "review_id": 3008, "product_id": 203, "user_id": 8, "rating": 4, "review_text": "Ergonomic design is very comfortable.", "review_date": "2025-05-25T09:00:00Z", "helpful_count": 11, "reported_count": 0, "is_featured": true, "moderation_status": "approved" },
          { "review_id": 3009, "product_id": 204, "user_id": 9, "rating": 2, "review_text": "Assembly was difficult and instructions unclear.", "review_date": "2025-06-01T17:00:00Z", "helpful_count": 6, "reported_count": 2, "is_featured": false, "moderation_status": "approved" },
          { "review_id": 3010, "product_id": 302, "user_id": 10, "rating": 5, "review_text": "Perfect slim fit jeans, great style.", "review_date": "2025-06-08T11:30:00Z", "helpful_count": 15, "reported_count": 0, "is_featured": true, "moderation_status": "approved" },
          { "review_id": 3011, "product_id": 205, "user_id": 11, "rating": 3, "review_text": "Decent lamp, but not as bright as expected.", "review_date": "2025-03-01T14:00:00Z", "helpful_count": 1, "reported_count": 0, "is_featured": false, "moderation_status": "approved" },
          { "review_id": 3012, "product_id": 303, "user_id": 12, "rating": 4, "review_text": "Makes great coffee, easy to use.", "review_date": "2025-04-10T09:00:00Z", "helpful_count": 8, "reported_count": 0, "is_featured": true, "moderation_status": "approved" },
          { "review_id": 3013, "product_id": 304, "user_id": 13, "rating": 2, "review_text": "Toaster oven is too small.", "review_date": "2025-05-15T16:30:00Z", "helpful_count": 4, "reported_count": 1, "is_featured": false, "moderation_status": "approved" },
          { "review_id": 3014, "product_id": 305, "user_id": 14, "rating": 5, "review_text": "Very comfortable running shoes, good support.", "review_date": "2025-05-22T12:00:00Z", "helpful_count": 20, "reported_count": 0, "is_featured": true, "moderation_status": "approved" },
          { "review_id": 3015, "product_id": 310, "user_id": 15, "rating": 4, "review_text": "A captivating novel, highly recommend.", "review_date": "2025-05-29T18:00:00Z", "helpful_count": 10, "reported_count": 0, "is_featured": false, "moderation_status": "approved" }
        ]
      }
    ]
  },
  {
    "name": "analytics",
    "tables": [
      {
        "name": "website_traffic",
        "columns": ["traffic_id", "session_id", "user_id", "visit_start", "visit_end", "page_views", "total_duration_seconds", "source", "medium", "campaign"],
        "sampleData": [
          { "traffic_id": 4001, "session_id": "SESS-123", "user_id": 1, "visit_start": "2025-05-08T10:00:00Z", "visit_end": "2025-05-08T10:15:00Z", "page_views": 3, "total_duration_seconds": 450, "source": "google", "medium": "organic", "campaign": null },
          { "traffic_id": 4002, "session_id": "SESS-456", "user_id": 2, "visit_start": "2025-05-08T10:05:00Z", "visit_end": "2025-05-08T10:15:00Z", "page_views": 2, "total_duration_seconds": 240, "source": "facebook", "medium": "social", "campaign": "New Electronics Launch" },
          { "traffic_id": 4003, "session_id": "SESS-789", "user_id": 3, "visit_start": "2025-05-08T10:10:00Z", "visit_end": "2025-05-08T10:34:00Z", "page_views": 4, "total_duration_seconds": 1440, "source": "bing", "medium": "organic", "campaign": null },
          { "traffic_id": 4004, "session_id": "SESS-101", "user_id": 4, "visit_start": "2025-05-08T10:15:00Z", "visit_end": "2025-05-08T10:43:00Z", "page_views": 5, "total_duration_seconds": 1680, "source": "google", "medium": "cpc", "campaign": "Office Furniture Sale" },
          { "traffic_id": 4005, "session_id": "SESS-202", "user_id": 5, "visit_start": "2025-05-08T10:25:00Z", "visit_end": "2025-05-08T10:52:00Z", "page_views": 3, "total_duration_seconds": 1620, "source": "instagram", "medium": "social", "campaign": "Summer Sale 2025" },
          { "traffic_id": 4006, "session_id": "SESS-303", "user_id": 6, "visit_start": "2025-05-08T10:35:00Z", "visit_end": "2025-05-08T11:05:00Z", "page_views": 4, "total_duration_seconds": 1800, "source": "email", "medium": "email", "campaign": "Loyalty Program Promotion" },
          { "traffic_id": 4007, "session_id": "SESS-404", "user_id": 7, "visit_start": "2025-05-08T10:45:00Z", "visit_end": "2025-05-08T11:10:00Z", "page_views": 2, "total_duration_seconds": 1500, "source": "direct", "medium": "none", "campaign": null },
          { "traffic_id": 4008, "session_id": "SESS-505", "user_id": 8, "visit_start": "2025-05-08T10:55:00Z", "visit_end": "2025-05-08T11:20:00Z", "page_views": 3, "total_duration_seconds": 1500, "source": "facebook", "medium": "social", "campaign": "Footwear Flash Sale" },
          { "traffic_id": 4009, "session_id": "SESS-606", "user_id": 9, "visit_start": "2025-05-08T11:05:00Z", "visit_end": "2025-05-08T11:30:00Z", "page_views": 2, "total_duration_seconds": 1500, "source": "google", "medium": "organic", "campaign": null },
          { "traffic_id": 4010, "session_id": "SESS-707", "user_id": 10, "visit_start": "2025-05-08T11:15:00Z", "visit_end": "2025-05-08T11:40:00Z", "page_views": 3, "total_duration_seconds": 1500, "source": "email", "medium": "email", "campaign": "Book Club Discount" },
          { "traffic_id": 4011, "session_id": "SESS-808", "user_id": 11, "visit_start": "2025-05-08T11:25:00Z", "visit_end": "2025-05-08T11:50:00Z", "page_views": 4, "total_duration_seconds": 1500, "source": "bing", "medium": "organic", "campaign": null },
          { "traffic_id": 4012, "session_id": "SESS-909", "user_id": 12, "visit_start": "2025-05-08T11:35:00Z", "visit_end": "2025-05-08T12:00:00Z", "page_views": 2, "total_duration_seconds": 1500, "source": "direct", "medium": "none", "campaign": null },
          { "traffic_id": 4013, "session_id": "SESS-010", "user_id": 13, "visit_start": "2025-05-08T11:45:00Z", "visit_end": "2025-05-08T12:10:00Z", "page_views": 3, "total_duration_seconds": 1500, "source": "instagram", "medium": "social", "campaign": "Home Decor Refresh" },
          { "traffic_id": 4014, "session_id": "SESS-111", "user_id": 14, "visit_start": "2025-05-08T11:55:00Z", "visit_end": "2025-05-08T12:20:00Z", "page_views": 2, "total_duration_seconds": 1500, "source": "google", "medium": "cpc", "campaign": "Summer Reading List" },
          { "traffic_id": 4015, "session_id": "SESS-222", "user_id": 15, "visit_start": "2025-05-08T12:05:00Z", "visit_end": "2025-05-08T12:30:00Z", "page_views": 3, "total_duration_seconds": 1500, "source": "email", "medium": "email", "campaign": "New Appliance Arrivals" }
        ]
      }
    ]
  },
  {
    "name": "content",
    "tables": [
      {
        "name": "blog_posts",
        "columns": ["post_id", "title", "slug", "author_id", "publish_date", "content", "category", "tags", "view_count", "comment_count"],
        "sampleData": [
          { "post_id": 5001, "title": "The Ultimate Guide to Choosing a Laptop", "slug": "ultimate-guide-laptop", "author_id": 101, "publish_date": "2025-03-15", "content": "...", "category": "Electronics", "tags": "laptop, buying guide, tech", "view_count": 1500, "comment_count": 25 },
          { "post_id": 5002, "title": "Top 5 Ergonomic Keyboards for Home Office", "slug": "top-5-ergonomic-keyboards", "author_id": 102, "publish_date": "2025-04-01", "content": "...", "category": "Electronics", "tags": "keyboard, ergonomic, office", "view_count": 1200, "comment_count": 18 },
          { "post_id": 5003, "title": "Creating a Productive Home Workspace", "slug": "productive-home-workspace", "author_id": 103, "publish_date": "2025-04-10", "content": "...", "category": "Furniture", "tags": "home office, workspace, productivity", "view_count": 950, "comment_count": 12 },
          { "post_id": 5004, "title": "Summer Fashion Trends for 2025", "slug": "summer-fashion-trends-2025", "author_id": 104, "publish_date": "2025-05-01", "content": "...", "category": "Apparel", "tags": "fashion, summer, trends", "view_count": 1800, "comment_count": 30 },
          { "post_id": 5005, "title": "Must-Read Books for Your Summer Vacation", "slug": "must-read-summer-books", "author_id": 105, "publish_date": "2025-05-15", "content": "...", "category": "Books", "tags": "books, reading, summer", "view_count": 1100, "comment_count": 20 },
          { "post_id": 5006, "title": "The Benefits of a Good Office Chair", "slug": "benefits-good-office-chair", "author_id": 102, "publish_date": "2025-03-20", "content": "...", "category": "Furniture", "tags": "office chair, health, ergonomics", "view_count": 800, "comment_count": 10 },
          { "post_id": 5007, "title": "Upgrade Your Kitchen with These Appliances", "slug": "upgrade-kitchen-appliances", "author_id": 101, "publish_date": "2025-04-25", "content": "...", "category": "Appliances", "tags": "kitchen, appliances, home", "view_count": 1300, "comment_count": 22 },
          { "post_id": 5008, "title": "Choosing the Right Running Shoes", "slug": "choosing-right-running-shoes", "author_id": 104, "publish_date": "2025-05-10", "content": "...", "category": "Footwear", "tags": "running shoes, fitness, sports", "view_count": 1600, "comment_count": 28 },
          { "post_id": 5009, "title": "Top 10 Tech Gadgets of 2025", "slug": "top-10-tech-gadgets-2025", "author_id": 103, "publish_date": "2025-03-01", "content": "...", "category": "Electronics", "tags": "tech, gadgets, innovation", "view_count": 2000, "comment_count": 35 },
          { "post_id": 5010, "title": "Decorating Your Living Room on a Budget", "slug": "decorating-living-room-budget", "author_id": 105, "publish_date": "2025-04-15", "content": "...", "category": "Furniture", "tags": "home decor, living room, budget", "view_count": 700, "comment_count": 8 },
          { "post_id": 5011, "title": "The History of Denim Jeans", "slug": "history-denim-jeans", "author_id": 104, "publish_date": "2025-05-20", "content": "...", "category": "Apparel", "tags": "jeans, denim, fashion history", "view_count": 1150, "comment_count": 15 },
          { "post_id": 5012, "title": "Best Coffee Makers for Home Use", "slug": "best-coffee-makers-home", "author_id": 101, "publish_date": "2025-03-25", "content": "...", "category": "Appliances", "tags": "coffee maker, kitchen, home", "view_count": 1000, "comment_count": 16 },
          { "post_id": 5013, "title": "Essential Gear for Trail Running", "slug": "essential-trail-running-gear", "author_id": 102, "publish_date": "2025-04-30", "content": "...", "category": "Footwear", "tags": "running, trail, gear", "view_count": 1400, "comment_count": 23 },
          { "post_id": 5014, "title": "5 Books That Will Inspire You", "slug": "books-that-will-inspire", "author_id": 105, "publish_date": "2025-05-25", "content": "...", "category": "Books", "tags": "books, inspiration, reading list", "view_count": 900, "comment_count": 11 },
          { "post_id": 5015, "title": "Smart Home Devices to Automate Your Life", "slug": "smart-home-automation", "author_id": 103, "publish_date": "2025-03-05", "content": "...", "category": "Electronics", "tags": "smart home, automation, tech", "view_count": 1700, "comment_count": 31 }
        ]
      }
    ]
  },
  {
    "name": "hr",
    "tables": [
      {
        "name": "employees",
        "columns": ["employee_id", "first_name", "last_name", "email", "phone_number", "hire_date", "job_title", "department", "salary", "manager_id"],
        "sampleData": [
          { "employee_id": 101, "first_name": "Alice", "last_name": "Smith", "email": "alice.s@company.com", "phone_number": "123-987-6540", "hire_date": "2023-08-15", "job_title": "Marketing Manager", "department": "Marketing", "salary": 75000, "manager_id": null },
          { "employee_id": 102, "first_name": "Bob", "last_name": "Johnson", "email": "bob.j@company.com", "phone_number": "987-123-4567", "hire_date": "2024-01-20", "job_title": "Sales Representative", "department": "Sales", "salary": 60000, "manager_id": 103 },
          { "employee_id": 103, "first_name": "Catherine", "last_name": "Williams", "email": "catherine.w@company.com", "phone_number": "555-789-1234", "hire_date": "2022-05-10", "job_title": "Sales Manager", "department": "Sales", "salary": 80000, "manager_id": 101 },
          { "employee_id": 104, "first_name": "David", "last_name": "Brown", "email": "david.b@company.com", "phone_number": "111-555-9999", "hire_date": "2023-11-01", "job_title": "Support Specialist", "department": "Support", "salary": 55000, "manager_id": 105 },
          { "employee_id": 105, "first_name": "Eve", "last_name": "Davis", "email": "eve.d@company.com", "phone_number": "222-888-3333", "hire_date": "2021-07-01", "job_title": "Support Manager", "department": "Support", "salary": 70000, "manager_id": 101 },
          { "employee_id": 106, "first_name": "Frank", "last_name": "Miller", "email": "frank.m@company.com", "phone_number": "333-222-1111", "hire_date": "2024-03-15", "job_title": "Web Developer", "department": "IT", "salary": 78000, "manager_id": 107 },
          { "employee_id": 107, "first_name": "Grace", "last_name": "Wilson", "email": "grace.w@company.com", "phone_number": "444-666-0000", "hire_date": "2020-09-01", "job_title": "IT Manager", "department": "IT", "salary": 90000, "manager_id": 101 },
          { "employee_id": 108, "first_name": "Henry", "last_name": "Moore", "email": "henry.m@company.com", "phone_number": "666-444-9999", "hire_date": "2024-05-01", "job_title": "Data Analyst", "department": "Analytics", "salary": 72000, "manager_id": 109 },
          { "employee_id": 109, "first_name": "Ivy", "last_name": "Taylor", "email": "ivy.t@company.com", "phone_number": "777-111-8888", "hire_date": "2022-11-15", "job_title": "Analytics Manager", "department": "Analytics", "salary": 85000, "manager_id": 101 },
          { "employee_id": 110, "first_name": "Jack", "last_name": "Clark", "email": "jack.c@company.com", "phone_number": "888-777-2222", "hire_date": "2023-02-10", "job_title": "Accountant", "department": "Finance", "salary": 65000, "manager_id": 111 },
          { "employee_id": 111, "first_name": "Kelly", "last_name": "Lewis", "email": "kelly.l@company.com", "phone_number": "999-333-7777", "hire_date": "2021-04-01", "job_title": "Finance Manager", "department": "Finance", "salary": 88000, "manager_id": 101 },
          { "employee_id": 112, "first_name": "Liam", "last_name": "Walker", "email": "liam.w@company.com", "phone_number": "555-444-8888", "hire_date": "2024-07-01", "job_title": "HR Specialist", "department": "HR", "salary": 68000, "manager_id": 113 },
          { "employee_id": 113, "first_name": "Mia", "last_name": "Young", "email": "mia.y@company.com", "phone_number": "111-999-4444", "hire_date": "2022-09-01", "job_title": "HR Manager", "department": "HR", "salary": 82000, "manager_id": 101 },
          { "employee_id": 114, "first_name": "Noah", "last_name": "Allen", "email": "noah.a@company.com", "phone_number": "777-222-9999", "hire_date": "2023-05-15", "job_title": "Content Writer", "department": "Marketing", "salary": 62000, "manager_id": 101 },
          { "employee_id": 115, "first_name": "Olivia", "last_name": "Harris", "email": "olivia.h@company.com", "phone_number": "333-888-1111", "hire_date": "2024-09-01", "job_title": "UX Designer", "department": "IT", "salary": 80000, "manager_id": 107 }
        ]
      }
    ]
  }
]
