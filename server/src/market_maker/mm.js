const db = require('../dbQueries');
const trade = require('../pages/trade')

let binance;

let public;
let private;

let price;

setTimeout(() => {
    console.log('Streaming BTCUSDT from BINANCE')
    binance.websockets.trades(['BTCUSDT'], (trades) => {
        price = Number(trades.p);


        updateIndex(price)
    });
}, 1000);

function updateIndex(price) {

    trade.io.emit('updateIndex', ({ price }))
}
//https://www.npmjs.com/package/node-binance-api

module.exports = {
    async initiate() {
        let keyQuery = 'SELECT * FROM mm_keys';
        let keys = await db.query(keyQuery)

        public = keys[0].public;
        private = keys[0].private;

        binance = require('node-binance-api')().options({
            APIKEY: public,
            APISECRET: private,
            userServerTime: false
        });


    },

}