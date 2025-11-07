# SBB Medicare Order & Delivery Management - Backend API

This is the backend API for SBB Medicare's order and delivery management system. It provides RESTful endpoints for managing customers, orders, delivery personnel, and payments.

## Features

- **User Management**: Admin, Store Staff, and Delivery Boy roles
- **Customer Management**: CRUD operations for customer data
- **Order Management**: Create, assign, and track orders
- **Delivery Tracking**: Real-time order status updates with location
- **Payment Processing**: Multiple payment modes (Cash, Bank, Split Bill)
- **Receipt Management**: File upload for payment receipts
- **Authentication**: JWT-based authentication
- **Role-Based Access Control**: Different permissions for different user roles

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (jsonwebtoken)
- **File Upload**: Multer
- **Security**: Helmet, bcryptjs, CORS
- **Logging**: Winston, Morgan
- **Validation**: express-validator

## Prerequisites

- Node.js 14+ and npm
- PostgreSQL 12+
- Git

## Installation

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd tourpay-monorepo/sbb-medicare-backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and configure:
   - `DATABASE_URL`: PostgreSQL connection string
   - `JWT_SECRET`: Secret key for JWT tokens
   - `PORT`: Server port (default: 5000)
   - `ALLOWED_ORIGINS`: CORS allowed origins

4. **Set up the database**:
   ```bash
   # Create database
   createdb sbb_medicare

   # Run schema
   psql -d sbb_medicare -f database/schema.sql
   ```

5. **Start the server**:
   ```bash
   # Development mode (with auto-reload)
   npm run dev

   # Production mode
   npm start
   ```

The API will be available at `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new delivery boy
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Users (Admin/Store Staff)
- `GET /api/users` - Get all users
- `GET /api/users/delivery-boys` - Get all delivery boys
- `GET /api/users/pending-requests` - Get pending delivery boy requests (Admin)
- `POST /api/users` - Create user (Admin)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user (Admin)
- `DELETE /api/users/:id` - Delete user (Admin)
- `PATCH /api/users/:id/status` - Approve/reject delivery boy (Admin)

### Customers
- `GET /api/customers` - Get all customers
- `GET /api/customers/search?query=<term>` - Search customers
- `GET /api/customers/:id` - Get customer by ID
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer (Store Staff)

### Orders
- `GET /api/orders` - Get all orders
- `GET /api/orders/my-orders` - Get orders for current delivery boy
- `GET /api/orders/statistics?date_from=<date>&date_to=<date>` - Get order statistics
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create order (Store Staff)
- `PATCH /api/orders/:id/assign` - Assign order to delivery boy (Store Staff)
- `PATCH /api/orders/:id/status` - Update order status
- `GET /api/orders/:id/history` - Get order status history
- `DELETE /api/orders/:id` - Delete order (Store Staff, only new orders)

### Payments
- `GET /api/payments` - Get all payments (Admin/Store Staff)
- `GET /api/payments/my-payments` - Get payments for current delivery boy
- `GET /api/payments/statistics?date_from=<date>&date_to=<date>` - Get payment statistics
- `GET /api/payments/order/:orderId` - Get payment by order ID
- `POST /api/payments` - Create payment with receipt (Delivery Boy)

## User Roles & Permissions

### Admin
- Full access to all features
- Manage users (create, update, delete)
- Approve/reject delivery boy requests
- View all orders and payments
- Access statistics and reports

### Store Staff
- Manage customers (CRUD)
- Create and manage orders
- Assign orders to delivery boys
- View delivery boys (read-only)
- View payment reports

### Delivery Boy
- Register and manage own profile
- View assigned orders
- Update order status
- Collect payments
- Upload payment receipts
- Update customer details

## Database Schema

### Tables
1. **users** - All system users (admin, store_staff, delivery_boy)
2. **customers** - Customer information
3. **orders** - Order details with status tracking
4. **payments** - Payment records with receipts
5. **order_status_history** - Audit trail for order status changes

## Order Status Flow

1. `new` - Order created by store staff
2. `assigned` - Order assigned to delivery boy
3. `picked_up` - Delivery boy picked up the order
4. `in_transit` - Order is being delivered
5. `delivered` - Order delivered to customer
6. `cancelled` - Order cancelled

## Payment Modes

1. **Cash** - Full payment in cash
2. **Bank** - Full payment via UPI/Card (requires receipt upload)
3. **Split Bill** - Partial cash + partial bank payment

## File Uploads

Receipt images are uploaded to `/uploads` directory and served via `/uploads/:filename`.

Supported formats: JPEG, PNG, PDF
Max file size: 5MB (configurable)

## Error Handling

All API errors follow this format:
```json
{
  "error": "Error message description"
}
```

HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

## Security Features

- JWT authentication with token expiration
- Password hashing with bcrypt
- Role-based access control
- CORS protection
- Helmet security headers
- Input validation
- SQL injection prevention (parameterized queries)

## Logging

Logs are stored in:
- `logs/error.log` - Error logs only
- `logs/combined.log` - All logs

In development mode, logs also output to console.

## Development

### Running Tests
```bash
npm test
```

### Database Migrations
To reset the database:
```bash
psql -d sbb_medicare -f database/schema.sql
```

## Default Admin Account

After running the schema, a default admin account is created:

- **Email**: admin@sbbmedicare.com
- **Password**: admin123 (⚠️ **CHANGE THIS IMMEDIATELY**)

```bash
POST /api/auth/login
{
  "email": "admin@sbbmedicare.com",
  "password": "admin123"
}
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use strong `JWT_SECRET`
3. Enable HTTPS
4. Set up database backups
5. Configure proper CORS origins
6. Set up reverse proxy (nginx)
7. Use process manager (PM2)
8. Configure log rotation

## API Testing with cURL

### Register Delivery Boy
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "delivery@example.com",
    "password": "password123",
    "full_name": "John Doe",
    "mobile_number": "+1234567890",
    "address": "123 Main St"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@sbbmedicare.com",
    "password": "admin123"
  }'
```

### Create Customer (requires auth token)
```bash
curl -X POST http://localhost:5000/api/customers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "full_name": "Jane Smith",
    "mobile_number": "+1234567891",
    "address": "456 Oak Ave",
    "latitude": 40.7128,
    "longitude": -74.0060
  }'
```

## Support

For issues or questions, please contact the development team or create an issue in the repository.

## License

ISC
