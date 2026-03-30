const fs = require('fs');
const path = require('path');

const envExample = `PORT=5000
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/pharmapay
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pharmapay
DB_USER=postgres
DB_PASSWORD=password

# JWT Configuration
JWT_SECRET=changeme-in-production-use-strong-secret-key-minimum-256-bits
JWT_ACCESS_TOKEN_EXPIRY=24h
JWT_REFRESH_TOKEN_EXPIRY=7d

# OTP Configuration
OTP_EXPIRY=600
OTP_LENGTH=6

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:9000

# File Upload
UPLOAD_MAX_SIZE=5242880
UPLOAD_PATH=./uploads
ALLOWED_FILE_TYPES=image/jpeg,image/jpg,image/png

# Logging
LOG_LEVEL=info
`;

const envPath = path.join(__dirname, '..', '.env');

if (fs.existsSync(envPath)) {
    console.log('✓ .env file already exists');
} else {
    fs.writeFileSync(envPath, envExample);
    console.log('✓ .env file created');
    console.log('⚠️  Please update DATABASE_URL and JWT_SECRET in .env file');
}

