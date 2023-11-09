// database.js
const mysql2 = require('mysql2');

// Create a connection to the MySQL database
const db = mysql2.createConnection({
    host: 'localhost', // Replace with your MySQL host
    user: 'root', // Replace with your MySQL username
    password: 'qwerty', // Replace with your MySQL password
    database: 'fileshare', // Replace with your MySQL database name
});

// Connect to the database
db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Define a schema for your 'users' table
const loginSchema = `
    CREATE TABLE IF NOT EXISTS users (
                                         id INT AUTO_INCREMENT PRIMARY KEY,
                                         name VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        picture LONGBLOB,
        bio varchar(255)
        )`;

const logSchema = `
CREATE TABLE IF NOT EXISTS app_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATETIME NOT NULL,
  text TEXT NOT NULL
)`;


// Create the 'users' table if it doesn't exist
db.query(loginSchema, (err) => {
    if (err) {
        console.error('Error creating table:', err);
    } else {
        console.log('Table "users" created or already exists');
    }
});

db.query(logSchema, (err) => {
    if (err) {
        console.error('Error creating table:', err);
    } else {
        console.log('Table "app_log" created or already exists');
    }
});

// Export the MySQL connection
module.exports = db;
