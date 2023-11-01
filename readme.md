## Installation

• Run `npm install` to install the dependencies.

• Run this SQL script in the terminal to create the database and table:Create the 'fileshare' database

```sql
CREATE DATABASE IF NOT EXISTS fileshare; USE fileshare;
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    picture LONGBLOB,
    bio varchar(255)
    )
```
• Run `npm start` to start the server.

• Follow the URL `http://localhost:3000/` to access the site.

## Usage

Once you have the main page of the site open, you can create an account by clicking the "Sign Up or log in here" button. Once you have created your account, you can access the main view by following the URL `http://localhost:3000/main`.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

- [Express](https://expressjs.com/) for the web framework.
- [Node.js](https://nodejs.org/en/) for the JavaScript runtime.
- [NPM](https://www.npmjs.com/) for the package manager.
- [Dotenv](https://www.npmjs.com/package/dotenv) for the environment variables.
- [Bcrypt](https://www.npmjs.com/package/bcrypt) for the password hashing.