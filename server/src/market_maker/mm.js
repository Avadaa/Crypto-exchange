const db = require('../dbQueries');
const trade = require('../pages/trade')
const mmConf = require('../../config/mm')
const sleep = require('util').promisify(setTimeout)

let binance;
//https://www.npmjs.com/package/node-binance-api

let public;
let private;

let index;
let bids = [];
let asks = [];

let current1mOpen = 0;
let currentHeavy = ''

let marketBought = 0;
let marketSold = 0;

let bidAbsorb = 0;
let askAbsorb = 0;


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

    // Buying other traders' limit asks
    if (trade.orderBook[1][0].price <= asks[0] - mmConf.SPREAD) {

        let indexToOrderSpread = index - trade.orderBook[1][0].price;
        if (indexToOrderSpread > mmConf.TAKERFEE * index) {

            let amountToBuy = Math.pow(indexToOrderSpread, mmConf.MARKETPOW) * mmConf.MARKETMULTIPLY - marketBought;

            if (trade.orderBook[1][0].amount < amountToBuy)
                amountToBuy = trade.orderBook[1][0].amount;

            if (amountToBuy > 0 && trade.orderBook[1][0].id != mmConf.ID) {
                marketBought += amountToBuy;
                let obj = createOrderObj('marketOrder', amountToBuy, trade.orderBook[1][0].price, 0);
                mmQue.push(obj);
            }
        }
    }
    else {
        marketBought = 0;
        bidAbsorb = 0;
        askAbsorb = 0;

        let askPrice = asks[4] + mmConf.SPREADBETWEEN;
        let bidPrice = asks[0] - mmConf.SPREAD;

        asksUp(askPrice)
        bidsUp(bidPrice)

        pushTrade();
        weighBooks()
    }
}

function moveDown() {

    // Market selling into other users' bids
    if (trade.orderBook[0][0].price >= bids[0] + mmConf.SPREAD) {

        let indexToOrderSpread = trade.orderBook[0][0].price - index;
        if (indexToOrderSpread > mmConf.TAKERFEE * index) {

            let amountToSell = Math.pow(indexToOrderSpread, mmConf.MARKETPOW) * mmConf.MARKETMULTIPLY - marketSold;

            if (trade.orderBook[0][0].amount < amountToSell)
                amountToSell = trade.orderBook[0][0].amount;

            if (amountToSell > 0 && trade.orderBook[0][0].id != mmConf.ID) {
                marketSold += amountToSell;
                let obj = createOrderObj('marketOrder', amountToSell, trade.orderBook[0][0].price, 1);
                mmQue.push(obj);
            }
        }
    }
    else {
        marketSold = 0;
        bidAbsorb = 0;
        askAbsorb = 0;

        let bidPrice = bids[4] - mmConf.SPREADBETWEEN;
        let askPrice = bids[0] + mmConf.SPREAD;

        bidsDown(bidPrice)
        asksDown(askPrice)

        pushTrade();
        weighBooks()
    }
}

async function absorbUp() {
    askAbsorb = 0;

    let askPrice = asks[4] + mmConf.SPREADBETWEEN;
    asksUp(askPrice)

    pushTrade()
    weighBooks()


    await sleep(mmConf.SLEEPAFTERABSORB)


    askPrice = asks[0] - mmConf.SPREADBETWEEN;
    asksDown(askPrice)

    pushTrade();
    weighBooks()
}

async function absorbDown() {
    bidAbsorb = 0;

    let bidPrice = bids[4] - mmConf.SPREADBETWEEN;
    bidsDown(bidPrice)

    pushTrade()
    weighBooks()


    await sleep(mmConf.SLEEPAFTERABSORB)

    bidPrice = bids[0] + mmConf.SPREADBETWEEN
    bidsUp(bidPrice)

    pushTrade()
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



// Just linking the bidAbsorb and askAbsorb didn't work
function getBidAbsorb() {
    return bidAbsorb;
}
function getAskAbsorb() {
    return askAbsorb;
}
function setBidAbsorb(x) {
    bidAbsorb += x;
}
function setAskAbsorb(x) {
    askAbsorb += x;
}


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

    },
    getBidAbsorb,
    getAskAbsorb,
    setBidAbsorb,
    setAskAbsorb,
    absorbDown,
    absorbUp
}

function asksUp(price) {
    let obj = createOrderObj('removeOrder', 0, asks[0], 1);
    mmQue.push(obj);

    asks.shift();
    asks[4] = price;

    obj = createOrderObj('addOrder', 0, price, 1);
    mmQue.push(obj)
}

function asksDown(price) {
    obj = createOrderObj('removeOrder', 0, asks[4], 1);
    mmQue.push(obj);

    asks.pop();

    obj = createOrderObj('addOrder', 0, price, 1)
    mmQue.push(obj);

    asks.unshift(price);
}

function bidsUp(price) {
    obj = createOrderObj('removeOrder', 0, bids[4], 0);
    mmQue.push(obj);

    bids.pop();

    obj = createOrderObj('addOrder', 0, price, 0)
    mmQue.push(obj);

    bids.unshift(price);
}

function bidsDown(price) {
    let obj = createOrderObj('removeOrder', 0, bids[0], 0);
    mmQue.push(obj);

    bids.shift();
    bids[4] = price;

    obj = createOrderObj('addOrder', 0, price, 0);
    mmQue.push(obj)
}