# SBB Medicare Order & Delivery Management System

## Project Overview

A comprehensive order and delivery management system for SBB Medicare, enabling efficient coordination between store staff, delivery personnel, and administrators.

## Completed Components

### ✅ 1. Backend API (`sbb-medicare-backend/`)

**Status: Fully Implemented**

**Tech Stack:**
- Node.js + Express.js
- PostgreSQL database
- JWT authentication
- Multer for file uploads
- Winston logging

**Features:**
- User authentication (Admin, Store Staff, Delivery Boys)
- Customer management (CRUD operations)
- Order management with status tracking
- Payment processing (Cash, Bank, Split Bill)
- Receipt image uploads
- Role-based access control
- Order history and audit trail

**API Endpoints:**
- `/api/auth/*` - Authentication & profile management
- `/api/users/*` - User and delivery boy management
- `/api/customers/*` - Customer CRUD operations
- `/api/orders/*` - Order creation, assignment, status updates
- `/api/payments/*` - Payment recording and statistics

**Database Schema:**
- `users` - All system users with roles
- `customers` - Customer information
- `orders` - Order details with status flow
- `payments` - Payment records with receipts
- `order_status_history` - Complete audit trail

**Order Status Flow:**
1. `new` → Order created
2. `assigned` → Assigned to delivery boy
3. `picked_up` → Order picked up
4. `in_transit` → On the way to customer
5. `delivered` → Successfully delivered
6. `cancelled` → Order cancelled

### ✅ 2. Admin Dashboard (`sbb-medicare-admin/`)

**Status: Fully Implemented**

**Tech Stack:**
- React 19.1.1
- Vite 7.1.7
- Tailwind CSS 4.1.16
- React Router 7.9.5
- Recharts for analytics
- Lucide React icons

**Pages:**
1. **Login Page** - Admin authentication
2. **Dashboard** - Statistics, charts, order analytics
3. **Delivery Boys Management** - Approve/reject requests, manage personnel
4. **Orders View** - View all orders with filtering
5. **Customers View** - Read-only customer information

**Features:**
- Delivery boy approval workflow
- Order statistics with date filtering
- Payment analytics (Cash vs Bank breakdown)
- Visual charts for order trends
- Real-time status updates
- Responsive design for mobile/tablet/desktop

**Default Admin Credentials:**
- Email: admin@sbbmedicare.com
- Password: admin123 (CHANGE IN PRODUCTION!)

## Components In Progress

### ⏳ 3. Store Dashboard (`sbb-medicare-store/`)

**Status: Structure Created, Implementation Needed**

**Purpose:**
Store staff interface for daily operations

**Key Features (To Be Implemented):**
- Customer management (full CRUD)
- Order creation interface
- Order assignment to delivery boys
- View delivery boys (read-only)
- Order status tracking
- Search and filter capabilities

**Differences from Admin:**
- Can manage customers (Add, Edit, Delete)
- Can create and assign orders
- Cannot approve/reject delivery boys
- Cannot access system-wide analytics
- Limited to operational tasks

### 📱 4. Mobile App (`sbb-medicare-mobile/`)

**Status: Not Started**

**Recommended Tech Stack:**
- React Native + Expo
- React Navigation
- Axios for API calls
- React Native Maps (Google Maps)
- React Native Image Picker
- AsyncStorage for local data

**Required Features:**
1. **Registration & Login**
   - Delivery boy registration form
   - Profile management
   - Photo upload

2. **Order Management**
   - View assigned orders
   - Accept/reject orders
   - Update order status
   - Order history

3. **Delivery Process**
   - Start delivery
   - Real-time GPS tracking
   - Navigate to customer (Google Maps)
   - Mark as picked up/in transit/delivered

4. **Payment Collection**
   - Select payment mode (Cash/Bank/Split)
   - Capture payment receipt photo
   - Record transaction reference
   - Submit payment confirmation

5. **Customer Updates**
   - Update customer address
   - Add location coordinates
   - Add landmarks

**API Integration:**
- All backend endpoints ready
- File upload configured for receipts
- Location tracking support in database

**Google Maps Setup:**
- Get Google Maps API key
- Enable Maps SDK for React Native
- Configure in app.json for Expo
- Implement navigation to customer location

## Installation & Setup

### Backend Setup

```bash
cd sbb-medicare-backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Setup database
createdb sbb_medicare
psql -d sbb_medicare -f database/schema.sql

# Start server
npm run dev  # Development
npm start    # Production
```

Server runs on: http://localhost:5000

### Admin Dashboard Setup

```bash
cd sbb-medicare-admin

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# VITE_API_URL=http://localhost:5000/api

# Start dev server
npm run dev
```

Admin dashboard runs on: http://localhost:3000

### Store Dashboard Setup (When Implemented)

```bash
cd sbb-medicare-store
npm install
npm run dev  # Runs on port 3001
```

### Mobile App Setup (To Be Implemented)

```bash
cd sbb-medicare-mobile

# Install dependencies
npm install

# Start Expo
npx expo start

# Run on device
# Scan QR code with Expo Go app (iOS/Android)
```

## Environment Variables

### Backend (.env)
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@localhost:5432/sbb_medicare
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
```

### Admin Dashboard (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

### Store Dashboard (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

### Mobile App (To Be Added)
```env
API_URL=http://your-server-ip:5000/api
GOOGLE_MAPS_API_KEY=your-google-maps-key
```

## User Roles & Permissions

### Admin
- ✅ Full system access
- ✅ Manage all users
- ✅ Approve/reject delivery boys
- ✅ View all orders and statistics
- ✅ Access analytics and reports
- ❌ Cannot create orders (store staff only)

### Store Staff
- ✅ Manage customers (CRUD)
- ✅ Create orders
- ✅ Assign orders to delivery boys
- ✅ View delivery boys (read-only)
- ✅ Track order status
- ❌ Cannot approve/reject delivery boys
- ❌ Cannot access system admin features

### Delivery Boy
- ✅ Register and manage profile
- ✅ View assigned orders
- ✅ Update order status
- ✅ Collect and record payments
- ✅ Upload receipt photos
- ✅ Update customer details
- ❌ Cannot create orders
- ❌ Cannot assign orders

## Testing the System

### 1. Test Backend API

```bash
# Login as admin
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sbbmedicare.com","password":"admin123"}'

# Save the token from response, then:

# Create a customer
curl -X POST http://localhost:5000/api/customers \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Doe",
    "mobile_number": "+1234567890",
    "address": "123 Main St",
    "latitude": 40.7128,
    "longitude": -74.0060
  }'
```

### 2. Test Admin Dashboard

1. Open http://localhost:3000
2. Login with default credentials
3. Navigate to Delivery Boys → Check pending requests
4. Go to Dashboard → View statistics
5. Check Orders → Filter by date

### 3. Test Store Dashboard (When Ready)

1. Open http://localhost:3001
2. Login as store staff
3. Add a new customer
4. Create an order
5. Assign to delivery boy

### 4. Test Mobile App (When Ready)

1. Register as delivery boy
2. Wait for admin approval
3. Login to mobile app
4. Accept assigned order
5. Navigate to customer
6. Mark as delivered
7. Collect payment
8. Upload receipt

## Deployment Guide

### Backend Deployment

**Option 1: VPS (Ubuntu)**
```bash
# Install Node.js, PostgreSQL
# Clone repository
# Set up database
# Configure environment variables
# Use PM2 for process management
pm2 start src/server.js --name sbb-medicare-api
pm2 save
pm2 startup
```

**Option 2: Docker**
```dockerfile
# Create Dockerfile in sbb-medicare-backend/
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### Frontend Deployment

**Admin Dashboard:**
```bash
# Build
npm run build

# Deploy to Netlify/Vercel/AWS S3
# Update VITE_API_URL to production API
```

**Mobile App:**
```bash
# Build Android APK
eas build --platform android

# Build iOS (requires Apple Developer account)
eas build --platform ios

# Or use Expo Go for testing
npx expo start --tunnel
```

## Production Checklist

### Security
- [ ] Change default admin password
- [ ] Use strong JWT_SECRET
- [ ] Enable HTTPS (SSL certificate)
- [ ] Configure proper CORS origins
- [ ] Set up rate limiting
- [ ] Enable database backups
- [ ] Sanitize all user inputs
- [ ] Implement proper error handling

### Performance
- [ ] Set up database indexes
- [ ] Configure connection pooling
- [ ] Enable gzip compression
- [ ] Set up CDN for static assets
- [ ] Optimize images and uploads
- [ ] Monitor API response times

### Monitoring
- [ ] Set up logging (Winston)
- [ ] Configure error tracking (Sentry)
- [ ] Monitor server health
- [ ] Track API usage
- [ ] Set up alerts for failures

## Future Enhancements

### Phase 2 Features
- SMS notifications for customers
- Push notifications for delivery boys
- Real-time order tracking on map
- Customer app for order placement
- Rating system for delivery boys
- Automated report generation
- Inventory management integration
- Multi-store support

### Technical Improvements
- WebSocket for real-time updates
- Redis caching for better performance
- Docker Compose for easy deployment
- CI/CD pipeline (GitHub Actions)
- Unit and integration tests
- API documentation (Swagger)
- Database migrations (Sequelize)

## Troubleshooting

### Backend Issues

**Database connection failed:**
- Check DATABASE_URL in .env
- Ensure PostgreSQL is running
- Verify database exists

**Port already in use:**
- Change PORT in .env
- Kill process on port 5000

### Frontend Issues

**API calls failing:**
- Check VITE_API_URL
- Ensure backend is running
- Check browser console for errors

**Build errors:**
- Clear node_modules and reinstall
- Check Node.js version (18+)

### Mobile App Issues (Future)

**Expo not starting:**
- Clear cache: `npx expo start -c`
- Reinstall dependencies

**Maps not showing:**
- Check Google Maps API key
- Enable required APIs in Google Console

## Support & Documentation

### API Documentation
Full API documentation available in:
- `sbb-medicare-backend/README.md`

### Frontend Documentation
- `sbb-medicare-admin/README.md`
- `sbb-medicare-store/README.md` (when completed)

### Database Schema
See: `sbb-medicare-backend/database/schema.sql`

## Project Status Summary

| Component | Status | Completion |
|-----------|--------|------------|
| Backend API | ✅ Complete | 100% |
| Database Schema | ✅ Complete | 100% |
| Admin Dashboard | ✅ Complete | 100% |
| Store Dashboard | ⏳ In Progress | 30% |
| Mobile App | 📋 Planned | 0% |
| Documentation | ✅ Complete | 90% |

## Development Team Notes

### Completed
- Full backend API with all features
- Admin dashboard with complete functionality
- Database schema with proper relationships
- Authentication and authorization
- File upload for receipts
- Order management workflow
- Comprehensive documentation

### Next Steps
1. Complete Store Dashboard implementation
2. Build Mobile App with React Native
3. Integrate Google Maps for navigation
4. Implement receipt camera functionality
5. Add real-time notifications
6. Deploy to production servers

## License

ISC

---

**Built with ❤️ for SBB Medicare**
