const bcrypt = require('bcryptjs');

// The bcrypt hash you provided (concatenated - it appears to have been split across lines)
const hash = '$2a$10$HtLuIFuLUOp/epG1Y0K/Nuxp6U799TvTSWI3DxJaTAHStWiBpzanO';

// Get password from command line argument or test common passwords
const passwordToTest = process.argv[2];

if (!passwordToTest) {
    console.log('Usage: node scripts/verify-password.js <password>');
    console.log('\nExample: node scripts/verify-password.js "your-password"');
    console.log('\nThis script will verify if the provided password matches the hash.');
    process.exit(1);
}

async function verifyPassword(password, hash) {
    try {
        const isValid = await bcrypt.compare(password, hash);
        if (isValid) {
            console.log(`✓ Password "${password}" MATCHES the hash!`);
            return true;
        } else {
            console.log(`✗ Password "${password}" does NOT match the hash.`);
            return false;
        }
    } catch (error) {
        console.error('Error verifying password:', error.message);
        return false;
    }
}

// Verify the password
verifyPassword(passwordToTest, hash).then(match => {
    process.exit(match ? 0 : 1);
});

