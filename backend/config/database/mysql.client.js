require('dotenv').config({path: '../../.env'})

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.BDD_HOST || 'localhost',
  user: process.env.BDD_USER || 'root',
  password: process.env.BDD_PASSWORD ||  'mdp',
  database: 'secure_scann',
  waitForConnections: true,
  connectionLimit: 10,
});


module.exports = pool