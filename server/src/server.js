const express = require('express');
const app = express();
const path = require('path');

// Setting up db
const db = require('knex')(require('../config/database'));

// Cookies
const session = require('express-session');
const KnexSessionStore = require('connect-session-knex')(session);

// Set Body Parser ready for use
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// CORS middleware
const allowCrossDomain = function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', '*');
    res.header('Access-Control-Allow-Headers', '*');
    next();
}

app.use(allowCrossDomain)

// Cookies
const store = new KnexSessionStore({
    knex: db,
    tablename: 'cookies'
});

app.use(session({
    name: 'sid',
    store: store,
    secret: 'hunter2',
    resave: false,
    saveUninitialized: false,


    cookie: {
        secure: false,
        sameSite: true,
        maxAge: 1000 * 60 * 60 * 6
    }
}));




let server = app.listen(process.env.PORT || 3000, () => {
    console.log('server running');

});


require('./routes')(app)

// Exporting the server-object for Socket.IO usage in trading-file
module.exports = { server: server };
