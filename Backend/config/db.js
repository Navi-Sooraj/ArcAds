import mysql from 'mysql2'

export const db = mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'myaxl',
    database:process.env.DB_NAME
})

export default db