# SBB Medicare Backend

A RESTful API system for managing medical order deliveries built with Node.js, Express.js, and PostgreSQL.

## Features

- JWT-based authentication with refresh tokens
- Role-based access control (Admin, Store Manager, Delivery Boy)
- Order management with status tracking
- Payment collection (cash, bank transfer, split payment)
- Customer management
- Delivery boy management and approval workflow
- Location tracking for orders
- OTP-based authentication

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: BCrypt
- **Validation**: express-validator

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd sbb-medicare-backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` file with your configuration:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/sbb_medicare
JWT_SECRET=your-strong-secret-key-minimum-256-bits
```

4. Create PostgreSQL database:
```bash
createdb sbb_medicare
```

Or using psql:
```sql
CREATE DATABASE sbb_medicare;
```

5. Initialize database schema:
```bash
npm run init-db
```

This will create all necessary tables, indexes, and functions.

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000` (or the port specified in `.env`).

## API Endpoints

### Base URL
- Development: `http://localhost:5000/api`
- Production: `https://api.sbbmedicare.com/api`

### Authentication Endpoints

- `POST /api/auth/register` - Register delivery boy
- `POST /api/auth/login` - Login user
- `POST /api/auth/otp/send` - Send OTP
- `POST /api/auth/otp/verify` - Verify OTP and login
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/change-password` - Change password
- `GET /api/auth/verify` - Verify token
- `POST /api/auth/logout` - Logout

### Order Endpoints

- `GET /api/orders` - Get all orders (with pagination)
- `GET /api/orders/today` - Get today's orders
- `GET /api/orders/ongoing` - Get ongoing orders
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create order
- `POST /api/orders/:id/assign` - Assign order to delivery boy
- `PUT /api/orders/:id/status` - Update order status
- `POST /api/orders/:id/location` - Update order location
- `GET /api/orders/customer/:mobile` - Get orders by customer mobile

### Customer Endpoints

- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get customer by ID
- `GET /api/customers/mobile/:mobile` - Get customer by mobile
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer
- `GET /api/customers/:id/orders` - Get customer orders

### Payment Endpoints

- `POST /api/payments/collect` - Collect payment
- `POST /api/payments/split` - Split payment
- `GET /api/payments/order/:orderId` - Get payment by order

### Delivery Boy Endpoints

- `GET /api/delivery-boys` - Get all delivery boys
- `GET /api/delivery-boys/approved` - Get approved delivery boys
- `GET /api/delivery-boys/:id` - Get delivery boy by ID
- `POST /api/delivery-boys` - Create delivery boy
- `PUT /api/delivery-boys/:id` - Update delivery boy
- `DELETE /api/delivery-boys/:id` - Delete delivery boy
- `PATCH /api/delivery-boys/:id/approve` - Approve delivery boy
- `PATCH /api/delivery-boys/:id/toggle-active` - Toggle active status

### Access Control Endpoints (Admin Only)

- `GET /api/access-control` - Get all store managers
- `POST /api/access-control` - Create store manager
- `PUT /api/access-control/:id` - Update store manager
- `DELETE /api/access-control/:id` - Delete store manager
- `PATCH /api/access-control/:id/toggle-active` - Toggle active status

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Role-Based Access Control

- **Admin**: Full access to all resources
- **Store Manager**: Can manage customers, orders, and delivery boys for their store only
- **Delivery Boy**: Can update order status and location for assigned orders only

## Database Schema

The database includes the following main tables:
- `users` - Admin and Store Managers
- `delivery_boys` - Delivery boys
- `customers` - Customers
- `orders` - Orders
- `order_items` - Order items
- `payments` - Payments
- `location_updates` - Location tracking
- `otp_verifications` - OTP records
- `refresh_tokens` - Refresh tokens
- `order_status_history` - Order status audit trail

## Development

### Project Structure
```
src/
├── config/          # Configuration files
├── controllers/     # Request handlers
├── middleware/      # Middleware functions
├── models/          # Database models
├── routes/          # Route definitions
├── services/        # Business logic
└── utils/           # Utility functions
```

### Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run init-db` - Initialize database schema
- `npm test` - Run tests

## Security Considerations

1. Change `JWT_SECRET` in production
2. Use strong passwords for database
3. Enable SSL for database connections in production
4. Implement rate limiting
5. Validate and sanitize all inputs
6. Use HTTPS in production

## License

ISC
