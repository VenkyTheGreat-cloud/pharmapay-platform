# PharmaPay - Admin Dashboard

Admin dashboard for managing delivery boys, viewing orders, and monitoring the PharmaPay order and delivery management system.

## Features

- **Dashboard**: Overview with statistics and charts
- **Delivery Boys Management**: View, approve, reject, and manage delivery personnel
- **Orders View**: View all orders with filtering by status and date
- **Customers View**: Read-only access to customer information

## Tech Stack

- React 19.1.1
- Vite 7.1.7
- Tailwind CSS 4.1.16
- React Router 7.9.5
- Axios (API client)
- Recharts (Charts)
- Lucide React (Icons)

## Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set:
   - `VITE_API_URL`: Backend API URL (default: http://localhost:5000/api)

3. **Start development server**:
   ```bash
   npm run dev
   ```

   The app will be available at http://localhost:3000

4. **Build for production**:
   ```bash
   npm run build
   ```

## Default Login

- **Email**: admin@pharmapay.swinkpay-fintech.com
- **Password**: admin123 (change this immediately after first login)

## Pages

### Dashboard
- Order statistics and trends
- Payment analytics
- Date range filtering
- Visual charts for orders overview

### Delivery Boys
- View all delivery personnel
- Approve/reject pending registrations
- Activate/deactivate delivery boys
- Delete delivery boys
- Tabs: All, Active, Pending

### Orders
- View all orders with details
- Filter by status and date range
- View order details in modal
- Order statuses: New, Assigned, Picked Up, In Transit, Delivered, Cancelled

### Customers
- View all customers (read-only)
- Search by name, mobile, or address
- View customer details
- See order count per customer

## API Integration

The admin dashboard connects to the PharmaPay backend API. Make sure the backend is running before starting the admin dashboard.

API endpoints used:
- `/api/auth/login` - Admin login
- `/api/users/*` - Delivery boys management
- `/api/orders/*` - Orders viewing
- `/api/customers/*` - Customers viewing
- `/api/payments/*` - Payment statistics

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## License

ISC
