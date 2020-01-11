const express = require('express');
const app = express();
const server = require('http').createServer(app);

// CORS middleware
const allowCrossDomain = function (req, res, next) {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Methods', '*');
    res.header('Access-Control-Allow-Headers', '*');
    next();
}


app.use(allowCrossDomain)


// Exporting the server-object for Socket.IO usage in trading-file
module.exports = {
    express: express,
    app: app,
    server: server
};


// Set Body Parser ready for use
let bodyParser = require('body-parser');
app.use(bodyParser.json({ limit: '50mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: '5mb', extended: false }));

server.listen(process.env.PORT || 3000)
console.log('server running');

require('./market_maker/mm').initiate();
require('./routes')(app)