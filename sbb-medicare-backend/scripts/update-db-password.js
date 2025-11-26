const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const envPath = path.join(__dirname, '..', '.env');

function updateDatabaseUrl(password) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const updatedContent = envContent.replace(
        /DATABASE_URL=postgresql:\/\/postgres:.*@localhost:5432\/sbb_medicare/,
        `DATABASE_URL=postgresql://postgres:${password}@localhost:5432/sbb_medicare`
    );
    fs.writeFileSync(envPath, updatedContent);
    console.log('✓ DATABASE_URL updated in .env file');
}

rl.question('Enter your PostgreSQL password for user "postgres": ', (password) => {
    if (password.trim()) {
        updateDatabaseUrl(password.trim());
    } else {
        console.log('No password provided. Please update DATABASE_URL in .env file manually.');
    }
    rl.close();
});

