import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'BloodBank',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

export const pool = mysql.createPool(dbConfig);

/**
 * Execute SQL query with parameters using MySQL connection pool
 */
export async function query(sql, params = []) {
  try {
    const sanitizedParams = params.map((p) => (p === undefined ? null : p));
    const [rows, fields] = await pool.execute(sql, sanitizedParams);
    return rows;
  } catch (err) {
    console.error('MySQL Query Error:', err.message, '\nQuery was:', sql, '\nParams:', params);
    throw err;
  }
}

/**
 * Test MySQL connection
 */
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT 1 + 1 AS solution, DATABASE() as activeDb');
    connection.release();
    return {
      connected: true,
      activeDatabase: rows[0].activeDb,
      host: dbConfig.host,
      user: dbConfig.user
    };
  } catch (err) {
    console.error('MySQL Connection Test Failed:', err.message);
    return {
      connected: false,
      error: err.message
    };
  }
}

export default {
  pool,
  query,
  testConnection
};
