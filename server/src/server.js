const express = require('express');
const app = express();












// Setting up db
const db = require('knex')(require('../config/database'));

// Cookies
const session = require('express-session');

// Set Body Parser ready for use
let bodyParser = require('body-parser');

/*
bodyParser = {
    json: { limit: '50mb', extended: true },
    urlencoded: { limit: '50mb', extended: true }
};
*/


app.use(bodyParser.json({ limit: '50mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: '5mb', extended: false }));
//app.use(bodyParser.json());


// CORS middleware
const allowCrossDomain = function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', '*');
    res.header('Access-Control-Allow-Headers', '*');
    next();
}

app.use(allowCrossDomain)




let server = app.listen(process.env.PORT || 3000, () => {
    console.log('server running');

});





require('./routes')(app)

// Exporting the server-object for Socket.IO usage in trading-file
module.exports = {
    express: express,
    app: app
};


