import mysql from 'mysql2/promise';

async function createDb() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'myaxl'
    });
    await connection.query('CREATE DATABASE IF NOT EXISTS arcads;');
    console.log('Database arcads created or already exists.');
    await connection.end();
  } catch (err) {
    console.error('Error creating database:', err);
  }
}

createDb();
