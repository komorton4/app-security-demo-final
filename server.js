'use strict';

const port = 3000;
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const sqlite = require('sqlite3');
const urlencoded = bodyParser.urlencoded;
const staticServer = express.static;

const db = new sqlite.Database(':memory:');
db.run('CREATE TABLE comments(ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP, comment TEXT)');

const users = {
    'user1': 'password1',
    'user2': 'password2'
}

const data = {
    'user1': 'This is the data for user1',
    'user2': 'This is the data for user2',
}


const app = express();
app.use(urlencoded({ extended: true }));
app.use('/', staticServer('./static/'));

app.post('/login', function(req, res) {
    // We trust our users, every login will be successful!
    const username = req.body.username;
    const password = req.body.password;

    // Enterprise-grade logging :) :)!
    console.log(`${username} logged in with the password: ${password}.`);
    res.end('Logged in with the honor system');
});

app.post('/session', function(req, res) {
    const username = req.body.username;
    const password = req.body.password;

    if (users[username] === password) {
        req.session.loggedIn = true;
        res.writeHead(302, {
            'Location': `data?username=${username}`
        });
        res.end();
    } else {
        res.status(401).end('wrong username or password');
    }
});

app.get('/data', function(req, res) {
    if (!req.session || !req.session.loggedIn) {
        res.status(403).end('not logged in');
    } else {
        const username = req.query.username;
        res.end(data[username]);
    }
});
app.get('/xss', function (req, res) {
    db.all('SELECT comment FROM comments ORDER BY ts DESC', [], function(err, rows) {
        const comments = rows.map(r => r.comment).join('<br/>');
        const body =
            `<html lang="en">
                <body>
                How is Travelers EDP Training so far?<br/>
                <form action="/xss" method="post">
                    <input name="comment" type="text">&nbsp;<input type="submit">
                </form>
                <br/>
                Here's what others are saying:<br/>
                ${comments}
                </body>
            </html>`;
        res.send(body);
    });
});

app.post('/xss', function (req, res) {
    db.run('INSERT INTO comments(comment) VALUES (?)',
        [req.body.comment],
        function (err) {
            if (err) {
                return console.log(err.message);
            }
        });
    res.writeHead(302, {
        'Location': 'xss'
    });
	console.log(req.body.comment);
    res.end();
});


app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));