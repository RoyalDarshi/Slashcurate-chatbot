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
      },
      {
        name: "payments",
        columns: [
          { name: "id", type: "integer" },
          { name: "invoice_id", type: "integer" },
          { name: "amount", type: "decimal" },
          { name: "payment_date", type: "date" },
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
      },
    ],
  },
];