const mysql = require("mysql2");
require("dotenv").config();

const isLocal= process.env.ENV == 'local'
const localDB = {
  
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  dateStrings: true,
  timezone: '+07:00'
}

const railway =  {
  uri: process.env.DB_URI,
  dateStrings: true,
  timezone: '+07:00'
}
const db = mysql.createPool(
  isLocal ? localDB : railway
);

module.exports = db.promise();