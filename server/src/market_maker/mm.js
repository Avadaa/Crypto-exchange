const db = require('../dbQueries');
const trade = require('../pages/trade')
const mmConf = require('../../config/mm')

let binance;
//https://www.npmjs.com/package/node-binance-api

let public;
let private;

let index;
let bids = [];
let asks = [];

current1mOpen = 0;

setTimeout(() => {
    console.log('Streaming BTCUSDT from BINANCE')
    /*binance.websockets.trades(['BTCUSDT'], (trades) => {
        index = Number(trades.p);


        //if (index > asks[0])
        //    moveUp();

        updateIndex()

    });*/



}, 1000);


function updateIndex() {
    trade.io.emit('updateIndex', ({ index }))
}

function moveUp(index) {

    /*
    let amountToBuy = 0;

    for (let i = 0; i < trade.orderBook[1].length; i++) {
        if (trade.orderBook[1][i].price > asks[0])
            break;
        amountToBuy = round(amountToBuy + trade.orderBook[1][i].amount);
    }
    let marketObj = createOrderObj('marketOrder', amountToBuy, -1, 0);
    trade.que.push(marketObj);


    trade.executeTasks();
    */


}


function fillBooks() {

    fillSide('bids')
    fillSide('asks')

    trade.executeTasks();

    setTimeout(() => {
        trade.que.push(createOrderObj('changeOrder', 20, bids[0], 0))
        trade.que.push(createOrderObj('changeOrder', 30, bids[0], 0))

        trade.que.push(createOrderObj('changeOrder', 25, asks[2], 1))

        trade.executeTasks();
    }, 3000);

}

function fillSide(side) {
    for (let i = 0; i < mmConf.ORDERAMOUNT; i++) {

        let price;
        if (side == 'bids')
            price = round(index - (mmConf.SPREAD / 2) - i * mmConf.SPREADBETWEEN);
        if (side == 'asks')
            price = round(index + (mmConf.SPREAD / 2) + i * mmConf.SPREADBETWEEN);

        if (side == 'bids')
            bids[i] = price;
        if (side == 'asks')
            asks[i] = price;

        let amount = round(mmConf.FIRSTAMOUNT * Math.pow(mmConf.MULTIPLIER, i));

        let orderType = side == 'bids' ? 0 : 1;

        let obj = createOrderObj('addOrder', amount, price, orderType);
        trade.que.push(obj);
    }
}

//addOder
//marketOrder
//removeOrder
//task, price, side('ask'), user

function createOrderObj(task, amount, price, orderType) {
    return {
        task,
        amount,
        price,
        user: {
            id: mmConf.ID,
            userId: mmConf.ID
        },
        orderType
    }
}

function round(num) {
    return Math.round(num * 10000000) / 10000000;
}



// Fetch the current 1min candle opening price every 2s after the last minute has closed
// The delay to allows the ping to be 2000ms at max. Can be changed if needed.
let minute = 60 * 1000;
const DELAY = 1200 // ms
function get1mOpen() {
    setTimeout(() => {
        binance.candlesticks("BTCUSDT", "1m", (error, ticks, symbol) => {
            current1mOpen = Number(ticks[0][1]);
            console.log(current1mOpen)
        }, { limit: 1, endTime: Date.time = function () { return new Date().toUnixTime(); } });

    }, DELAY);
}

function repeatEvery(func, interval) {
    let now = new Date(),
        delay = interval - now % interval;

    function start() {
        func();
        setInterval(func, interval);
    }

    setTimeout(start, delay);
}
repeatEvery(get1mOpen, minute)













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


        binance.prices('BTCUSDT', (err, ticker) => {
            if (err) console.log('ERROR geting Binance price')
            index = Number(ticker.BTCUSDT)
            fillBooks();
        });

        get1mOpen()
    },
}