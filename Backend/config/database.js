/**
 * Sequelize configuration and MySQL connection.
 * Uses environment variables with fallbacks for local development.
 * Exports a Sequelize instance and sync helper.
 */
import 'dotenv/config';
import { Sequelize } from 'sequelize';

const dbName = process.env.DB_NAME ;
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || 'myaxl';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || 3306;

const useSSL = process.env.DB_SSL === 'true';

export const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: dbPort,
  dialect: 'mysql',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: false,
    freezeTableName: true,
  },
  ...(useSSL && {
    dialectOptions: {
      ssl: {
        rejectUnauthorized: false,
      },
    },
  }),
});

export async function connectDatabase() {
  try {
    await sequelize.authenticate();
    console.log('MySQL connection has been established successfully.');
    return sequelize;
  } catch (error) {
    console.error('Unable to connect to MySQL:', error.message);
    throw error;
  }
}

export default sequelize;
