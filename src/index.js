const express = require('express');
const app = express();
const session = require('express-session');
const path = require('path');
const hbs = require('hbs');
const bcrypt = require('bcrypt');
const mysql_connect = require('./mysql_connect'); // Require the database module
const multer = require('multer');
const storage = multer.memoryStorage(); // Use memory storage for file handling
const sharp = require('sharp');


const upload = multer({storage: storage});
const methodOverride = require('method-override');


const templatePath = path.join(__dirname, '../templates');
app.use(express.static('public'));
app.use(express.static('templates'));

app.use(express.json());
app.set('view engine', 'hbs');
app.set('views', templatePath);
app.use(express.urlencoded({extended: false}));
app.use(methodOverride('_method'));



app.use(
    session({
        secret: 'secret',
        resave: false,
        saveUninitialized: true,
    })
);

function isAuthenticated(req, res, next) {
    if (req.session.isAuthenticated) {
        // User is authenticated, proceed to the route handler
        next();
    } else {
        // User is not authenticated, redirect to the login page or handle it accordingly
        res.redirect('/login');
    }
}

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
            res.render('login', {errorMessage: 'An error occurred'});
        } else if (results.length > 0) {
            const user = results[0];

            // Verify the password
            const passwordMatch = await bcrypt.compare(password, user.password);

            if (passwordMatch) {
                req.session.isAuthenticated = true;
                req.session.userId = user.id;

                // Passwords match, allow login
                res.render('home');
            } else {
                // Passwords do not match
                res.render('login', {errorMessage: 'Wrong Password'});
            }
        } else {
            // User not found
            res.render('login', {errorMessage: 'User not found'});
        }
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// home pages stuff


app.get('/profile', (req, res) => {
    if (req.session.isAuthenticated) {
        // Assuming you have the user's ID stored in the session
        const userId = req.session.userId;

        console.log('User ID from session:', userId);

        // Fetch the user's profile data from the database
        const selectUserProfileQuery = 'SELECT * FROM users WHERE id = ?';

        mysql_connect.query(selectUserProfileQuery, [userId], (err, results) => {
            if (err) {
                console.error('Error retrieving user profile:', err);
                res.status(500).send('Error retrieving user profile.');
            } else if (results.length > 0) {
                const userProfile = results[0];

                if (userProfile.picture) {
                    const pictureBase64 = userProfile.picture.toString('base64');
                    res.render('profile', { userProfile: { ...userProfile, picture: pictureBase64 } });
                } else {
                    // Handle the case when there's no picture available
                    res.render('profile', { userProfile });
                }
            } else {
                res.status(404).send('User not found');
            }
        });
    } else {
        res.redirect('/login');
    }
});



// bio stuff

app.get('/profile/bio', isAuthenticated, (req, res) => {
    const userId = req.session.userId;

    // Retrieve the user's bio from the database based on their ID
    const selectUserBioQuery = 'SELECT bio FROM users WHERE id = ?';

    mysql_connect.query(selectUserBioQuery, [userId], (err, results) => {
        if (err) {
            console.error('Error retrieving user bio:', err);
            res.status(500).send('Error retrieving user bio.');
        } else if (results.length > 0) {
            const userBio = results[0].bio;
            res.json({bio: userBio});
        } else {
            res.status(404).send('User not found');
        }
    });
});

app.post('/profile/bio', isAuthenticated, (req, res) => {
    const userId = req.session.userId;
    const newBio = req.body.bio; // Assuming the bio is sent in the request body

    // Update the user's bio in the database
    const updateBioQuery = 'UPDATE users SET bio = ? WHERE id = ?';

    mysql_connect.query(updateBioQuery, [newBio, userId], (err) => {
        if (err) {
            console.error('Error updating user bio:', err);
            res.status(500).send('Error updating user bio.');
        } else {
            // Redirect the user back to their profile page
            res.redirect('/profile');
        }
    });
});

app.put('/profile/bio', isAuthenticated, (req, res) => {
    const userId = req.session.userId;
    const newBio = req.body.bio; // Assuming you send the new bio in the request body

    // Update the user's bio in the database
    const updateBioQuery = 'UPDATE users SET bio = ? WHERE id = ?';

    mysql_connect.query(updateBioQuery, [newBio, userId], (err) => {
        if (err) {
            console.error('Error updating user bio:', err);
            res.status(500).send('Error updating user bio.');
        } else {
            res.status(200).send('Bio updated successfully');
        }
    });
});

app.delete('/profile/bio', isAuthenticated, (req, res) => {
    const userId = req.session.userId;

    // Remove the user's bio in the database
    const deleteBioQuery = 'UPDATE users SET bio = NULL WHERE id = ?';

    mysql_connect.query(deleteBioQuery, [userId], (err) => {
        if (err) {
            console.error('Error deleting user bio:', err);
            res.status(500).send('Error deleting user bio.');
        } else {
            res.status(204).send(); // A status of 204 indicates success with no content
        }
    });
});

// picture stuff

app.post('/profile/picture', isAuthenticated, upload.single('profilePicture'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('Please select a valid image file.');
    }

    const userId = req.session.userId;
    const profilePictureData = req.file.buffer;

    // Resize the image to 128x128 pixels
    sharp(profilePictureData)
        .resize(128, 128)
        .toBuffer()
        .then((resizedData) => {
            // Update the user's profile picture in the database
            const updatePictureQuery = 'UPDATE users SET picture = ? WHERE id = ?';

            mysql_connect.query(updatePictureQuery, [resizedData, userId], (err) => {
                if (err) {
                    console.error('Error updating user picture:', err);
                    return res.status(500).send('Failed to update profile picture.');
                }

                res.status(200).send('Profile picture updated successfully.');
            });
        })
        .catch((err) => {
            console.error('Error resizing image:', err);
            return res.status(500).send('Failed to resize profile picture.');
        });
});
app.post('/profile/picture/delete', isAuthenticated, (req, res) => {
    const userId = req.session.userId;
    console.log('kasutaja ' + userId)
    // Remove the user's profile picture in the database
    const deletePictureQuery = 'UPDATE users SET picture = NULL WHERE id = ?';

    mysql_connect.query(deletePictureQuery, [userId], (err) => {
        if (err) {
            console.error('Error deleting user picture:', err);
            return res.status(500).send('Failed to remove profile picture.');
        }

        res.status(200).send('Profile picture removed successfully.');
    });
});

app.listen(3000, () => {
    console.log('Example app listening at http://localhost:3000');
});
