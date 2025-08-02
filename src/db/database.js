// src/db/database.js

const { Pool } = require('pg');

const pool = new Pool({
  user: 'matheuznsilva', // Seu usuário do PostgreSQL
  host: 'localhost',
  database: 'casamento_jp',
  password: '073119', // Substitua pela sua senha
  port: 5432,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};