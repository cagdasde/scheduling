// db.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Render env değişkeninden al
  ssl: {
    rejectUnauthorized: false, // Render PostgreSQL için gerekli
  },
});

module.exports = pool;