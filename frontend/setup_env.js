const fs = require('fs');
const content = `REACT_APP_API_URL=https://notemaker-6199.onrender.com/api/notes`;

fs.writeFileSync('.env', content);
console.log('Frontend .env file updated successfully');
