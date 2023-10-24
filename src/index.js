const express = require('express');
const app = express();
const session = require('express-session');
const path = require('path');
const hbs = require('hbs');
const bcrypt = require('bcrypt');
const mysql_connect = require('./mysql_connect'); // Require the database module

const templatePath = path.join(__dirname, '../templates');
app.use(express.static('public'));
app.use(express.static('templates'));

app.use(express.json());
app.set('view engine', 'hbs');
app.set('views', templatePath);
app.use(express.urlencoded({ extended: false }));

app.use(
    session({
        secret: 'secret',
        resave: false,
        saveUninitialized: true,
    })
);

app.get('/', (req, res) => {
    // Check if the user is authenticated
    if (req.session.isAuthenticated) {
        res.render('home');
    } else {
        res.redirect('/login');
    }
});

app.get('/signup', (req, res) => {
    res.render('signup');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/signup', async (req, res) => {
    const name = req.body.name;
    const password = req.body.password;

    // Generate a salt to add to the password
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);

    // Hash the password with the salt
    const hashedPassword = await bcrypt.hash(password, salt);

    // Store the salt and hashed password in MySQL
    const insertUserQuery = 'INSERT INTO users (name, password) VALUES (?, ?)';
    const values = [name, hashedPassword];

    mysql_connect.query(insertUserQuery, values, (err) => {
        if (err) {
            console.error('Error creating user:', err);
            res.send('Error creating user.');
        } else {
            req.session.isAuthenticated = true;
            res.render('home');
        }
    });
});

app.post('/login', async (req, res) => {
    const name = req.body.name;
    const password = req.body.password;

    // Retrieve the user's salt and hashed password from MySQL
    const selectUserQuery = 'SELECT * FROM users WHERE name = ?';
    mysql_connect.query(selectUserQuery, [name], async (err, results) => {
        if (err) {
            console.error('Error retrieving user:', err);
            res.render('login', { errorMessage: 'An error occurred' });
        } else if (results.length > 0) {
            const user = results[0];

            // Verify the password
            const passwordMatch = await bcrypt.compare(password, user.password);

            if (passwordMatch) {
                req.session.isAuthenticated = true;
                // Passwords match, allow login
                res.render('home');
            } else {
                // Passwords do not match
                res.render('login', { errorMessage: 'Wrong Password' });
            }
        } else {
            // User not found
            res.render('login', { errorMessage: 'User not found' });
        }
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// home pages stuff

app.get('/profile', (req, res) => {
    res.render('profile');

});

app.listen(3000, () => {
    console.log('Example app listening at http://localhost:3000');
});
