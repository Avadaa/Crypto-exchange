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
currentHeavy = ''





let mmQue = [];
function pushTrade() {
    while (mmQue.length > 0)
        if (!trade.processing)
            trade.push(mmQue.shift());
}

/*
index = 9000;
current1mOpen = 9010;
fillBooks();


if (index < current1mOpen)
    currentHeavy = 'ask'

else
    currentHeavy = 'bid'

weighBooks();

setTimeout(() => {
    index = 8995;
    if (index > asks[0])
        moveUp();
    if (index < bids[0])
        moveDown();
}, 5000);
*/



setTimeout(() => {
    console.log('Streaming BTCUSDT from BINANCE')
    binance.websockets.trades(['BTCUSDT'], (trades) => {
        index = Number(trades.p);



        if (index > asks[0])
            moveUp();
        if (index < bids[0])
            moveDown();

        if (index < current1mOpen && currentHeavy == 'bid')
            weighBooks();
        if (index > current1mOpen && currentHeavy == 'ask')
            weighBooks();

        updateIndex()

    });
}, 1000);


function updateIndex() {
    trade.io.emit('updateIndex', ({ index }))
}

function moveUp() {


    let obj = createOrderObj('removeOrder', 0, asks[0], 1);
    mmQue.push(obj);

    let askPrice = asks[4] + mmConf.SPREADBETWEEN;
    let bidPrice = asks[0] - mmConf.SPREAD;


    asks.shift();
    asks[4] = askPrice;

    obj = createOrderObj('addOrder', 0, askPrice, 1);
    mmQue.push(obj)



    obj = createOrderObj('removeOrder', 0, bids[4], 0);
    mmQue.push(obj);
    bids.pop();

    obj = createOrderObj('addOrder', 0, bidPrice, 0)
    mmQue.push(obj);


    bids.unshift(bidPrice);

    pushTrade();

    weighBooks()
}

function moveDown() {


    let obj = createOrderObj('removeOrder', 0, bids[0], 0);
    mmQue.push(obj);

    let bidPrice = bids[4] - mmConf.SPREADBETWEEN;
    let askPrice = bids[0] + mmConf.SPREAD;


    bids.shift();
    bids[4] = bidPrice;

    obj = createOrderObj('addOrder', 0, bidPrice, 0);
    mmQue.push(obj)



    obj = createOrderObj('removeOrder', 0, asks[4], 1);
    mmQue.push(obj);
    asks.pop();

    obj = createOrderObj('addOrder', 0, askPrice, 1)
    mmQue.push(obj);


    asks.unshift(askPrice);

    pushTrade();

    weighBooks()
}

function weighBooks() {
    if (currentHeavy == 'bid') {
        for (let i = 0; i < mmConf.ORDERAMOUNT; i++) {
            mmQue.push(createOrderObj('changeOrder', round((mmConf.ORDERAMOUNT - i) * mmConf.FIRSTAMOUNT), asks[i], 1));
            mmQue.push(createOrderObj('changeOrder', round((i + 1) * mmConf.FIRSTAMOUNT), bids[i], 0));
        }
        currentHeavy = 'ask';
    }


    else if (currentHeavy == 'ask') {
        for (let i = 0; i < mmConf.ORDERAMOUNT; i++) {
            mmQue.push(createOrderObj('changeOrder', round((i + 1) * mmConf.FIRSTAMOUNT), asks[i], 1));
            mmQue.push(createOrderObj('changeOrder', round((mmConf.ORDERAMOUNT - i) * mmConf.FIRSTAMOUNT), bids[i], 0));
        }
        currentHeavy = 'bid';
    }

    pushTrade()
}




function fillBooks() {

    fillSide('bids')
    fillSide('asks')

    pushTrade();
}

function fillSide(side) {
    for (let i = 0; i < mmConf.ORDERAMOUNT; i++) {

        let price;
        if (side == 'bids')
            price = round(index - (mmConf.SPREAD) - i * mmConf.SPREADBETWEEN);
        if (side == 'asks')
            price = round(index + (mmConf.SPREAD) + i * mmConf.SPREADBETWEEN);

        if (side == 'bids')
            bids[i] = price;
        if (side == 'asks')
            asks[i] = price;

        let amount = 0;

        let orderType = side == 'bids' ? 0 : 1;

        let obj = createOrderObj('addOrder', amount, price, orderType);
        mmQue.push(obj);
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
        orderType,
        side: orderType == 0 ? 'bid' : 'ask'
    }
}

function round(num) {
    return Math.round(num * 10000000) / 10000000;
}



// Fetch the current 1min candle opening price every 2s after the last minute has closed
// The delay to allows the ping to be 2000ms at max. Can be changed if needed.

let minute = 60 * 1000;
const DELAY = 3000 // ms
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


        binance.prices('BTCUSDT', async (err, ticker) => {
            if (err) console.log('ERROR geting Binance price')
            index = Number(ticker.BTCUSDT)
            fillBooks();

            get1mOpen()

            setTimeout(() => {
                if (index < current1mOpen)
                    currentHeavy = 'ask'

                else
                    currentHeavy = 'bid'

                weighBooks();

            }, 1000);
        });

    }
}
