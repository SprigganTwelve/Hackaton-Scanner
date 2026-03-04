const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Thibault1',
  database: 'secure_scann',
  waitForConnections: true,
  connectionLimit: 10,
});


module.exports = pool