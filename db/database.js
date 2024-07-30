const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

const pool1 = mysql.createPool({
  host: process.env.HOSTDB,
  user: process.env.USERDB,
  password: process.env.PASSWORDDB,
  database: process.env.DATABASEDB,
  connectionLimit: 10,
});

async function executeQuery(query, params = []) {
  let connection;
  try {
    connection = await pool1.getConnection();
    const [rows, fields] = await connection.execute(query, params);
    return rows;
  } catch (error) {
    console.error('Error de conexión:', error);
    await new Promise(resolve => setTimeout(resolve, 5000));
    return executeQuery(query, params);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

const pool2 = mysql.createPool({
  host: process.env.HOSTAMI,
  user: process.env.USERDB,
  password: process.env.PASSWORDDB,
  database: process.env.DATABASEDB2,
  connectionLimit: 10,
});

async function executeQuery2(query, params = []) {
  let connection;
  try {
    connection = await pool2.getConnection();
    const [rows, fields] = await connection.execute(query, params);
    return rows;
  } catch (error) {
    console.error('Error de conexión:', error);
    await new Promise(resolve => setTimeout(resolve, 5000));
    return executeQuery2(query, params);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

module.exports = { executeQuery, executeQuery2 };