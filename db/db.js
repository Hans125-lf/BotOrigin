require('dotenv').config();
const dotenv = require('dotenv');
const { Sequelize } = require('sequelize')

dotenv.config({ path: '.env' });

const dbConnect = new Sequelize({
    dialect: 'mysql',
    host: process.env.HOSTDB,
    username: process.env.USERDB,
    password: process.env.PASSWORDDB,
    database: process.env.DATABASEDB,
    port: 3306,
    logging: false,
    dialectOptions: process.env.NODE_ENV === 'production'? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {},
  });
  module.exports = {dbConnect}
  
