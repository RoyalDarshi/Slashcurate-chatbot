export default [
  {
    name: "public",
    tables: [
      {
        name: "users",
        columns: [
          { name: "id", type: "integer" },
          { name: "name", type: "varchar" },
          { name: "email", type: "varchar" },
          { name: "created_at", type: "timestamp" },
        ],
        sampleData: [
          {
            id: 1,
            name: "John Doe",
            email: "john@example.com",
            created_at: "2023-01-01 10:00:00",
          },
          {
            id: 2,
            name: "Jane Smith",
            email: "jane@example.com",
            created_at: "2023-01-02 11:00:00",
          },
          {
            id: 3,
            name: "Alice Johnson",
            email: "alice@example.com",
            created_at: "2023-01-03 12:00:00",
          },
        ],
      },
      {
        name: "products",
        columns: [
          { name: "id", type: "integer" },
          { name: "name", type: "varchar" },
          { name: "price", type: "decimal" },
          { name: "stock", type: "integer" },
        ],
        sampleData: [
          { id: 101, name: "Wireless Mouse", price: 29.99, stock: 150 },
          { id: 102, name: "Mechanical Keyboard", price: 89.99, stock: 75 },
          { id: 103, name: "USB-C Hub", price: 45.50, stock: 200 },
        ],
      },
      {
        name: "orders",
        columns: [
          { name: "id", type: "integer" },
          { name: "user_id", type: "integer" },
          { name: "product_id", type: "integer" },
          { name: "quantity", type: "integer" },
          { name: "order_date", type: "date" },
        ],
        sampleData: [
          {
            id: 1001,
            user_id: 1,
            product_id: 101,
            quantity: 2,
            order_date: "2023-01-05",
          },
          {
            id: 1002,
            user_id: 2,
            product_id: 102,
            quantity: 1,
            order_date: "2023-01-06",
          },
          {
            id: 1003,
            user_id: 3,
            product_id: 101,
            quantity: 5,
            order_date: "2023-01-07",
          },
        ],
      },
    ],
  },
  {
    name: "sales",
    tables: [
      {
        name: "customers",
        columns: [
          { name: "id", type: "integer" },
          { name: "name", type: "varchar" },
          { name: "address", type: "text" },
          { name: "phone", type: "varchar" },
        ],
        sampleData: [
          {
            id: 1,
            name: "Acme Corp",
            address: "123 Main St, City",
            phone: "555-1234",
          },
          {
            id: 2,
            name: "Beta LLC",
            address: "456 Elm St, Town",
            phone: "555-5678",
          },
          {
            id: 3,
            name: "Gamma Inc",
            address: "789 Oak St, Village",
            phone: null,
          },
        ],
      },
      {
        name: "invoices",
        columns: [
          { name: "id", type: "integer" },
          { name: "customer_id", type: "integer" },
          { name: "amount", type: "decimal" },
          { name: "due_date", type: "date" },
        ],
        sampleData: [
          { id: 5001, customer_id: 1, amount: 1500.00, due_date: "2023-02-15" },
          { id: 5002, customer_id: 2, amount: 450.50, due_date: "2023-02-28" },
        ],
      },
      {
        name: "payments",
        columns: [
          { name: "id", type: "integer" },
          { name: "invoice_id", type: "integer" },
          { name: "amount", type: "decimal" },
          { name: "payment_date", type: "date" },
        ],
        sampleData: [
          { id: 9001, invoice_id: 5001, amount: 1500.00, payment_date: "2023-02-10" },
          { id: 9002, invoice_id: 5002, amount: 450.50, payment_date: "2023-02-27" },
        ],
      },
    ],
  },
  {
    name: "system",
    tables: [
      {
        name: "logs",
        columns: [
          { name: "id", type: "integer" },
          { name: "timestamp", type: "timestamp" },
          { name: "level", type: "varchar" },
          { name: "message", type: "text" },
          { name: "user_id", type: "integer" },
          { name: "ip_address", type: "varchar" },
          { name: "request_id", type: "varchar" },
          { name: "status_code", type: "integer" },
        ],
        sampleData: [
          {
            id: 1,
            timestamp: "2026-05-29 12:00:00",
            level: "INFO",
            message: "User logged in successfully",
            user_id: 101,
            ip_address: "192.168.1.50",
            request_id: "req-98f21a8d",
            status_code: 200,
          },
          {
            id: 2,
            timestamp: "2026-05-29 12:05:12",
            level: "WARN",
            message: "Failed login attempt",
            user_id: null,
            ip_address: "203.0.113.195",
            request_id: "req-34bc77ea",
            status_code: 401,
          },
          {
            id: 3,
            timestamp: "2026-05-29 12:10:45",
            level: "ERROR",
            message: "Database connection timeout",
            user_id: 102,
            ip_address: "192.168.1.51",
            request_id: "req-e356c9a0",
            status_code: 504,
          },
        ],
      },
    ],
  },
];