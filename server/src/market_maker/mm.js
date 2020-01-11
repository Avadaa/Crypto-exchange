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
let absorbedUp = 0;
let absorbedDown = 0;


let mmQue = [];
function pushTrade() {
    while (mmQue.length > 0)
        if (!trade.processing)
            trade.push(mmQue.shift());
}


setTimeout(() => {
    console.log('Streaming ETHUSDT from BINANCE')
    binance.websockets.trades(['ETHUSDT'], (trades) => {
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

// Does all the preliminary work before moving mm's orders up a notch
function moveUp() {

    // Buying other traders' limit asks
    if (trade.orderBook[1][0].price <= asks[0] - mmConf.SPREAD) {

        let indexToOrderSpread = round(index - trade.orderBook[1][0].price);
        if (indexToOrderSpread > mmConf.TAKERFEE * index) {

            let amountToBuy = round(Math.pow(indexToOrderSpread, mmConf.MARKETPOW) * mmConf.MARKETMULTIPLY - marketBought);

            if (trade.orderBook[1][0].amount < amountToBuy)
                amountToBuy = trade.orderBook[1][0].amount;

            if (amountToBuy > 0 && trade.orderBook[1][0].id != mmConf.ID) {
                marketBought = round(marketBought + amountToBuy);
                let obj = createOrderObj('marketOrder', amountToBuy, trade.orderBook[1][0].price, 0);
                mmQue.push(obj);
            }
        }
    }
    else {
        marketBought = 0;
        bidAbsorb = 0;
        askAbsorb = 0;

        let askPrice = round(asks[mmConf.ORDERAMOUNT - 1] + mmConf.SPREADBETWEEN + random());
        let bidPrice = round(asks[0] - mmConf.SPREAD - random());

        asksUp(askPrice)
        bidsUp(bidPrice)

        pushTrade();
        weighBooks()
    }
}

// Does all the preliminary work before moving mm's orders down a notch
function moveDown() {

    // Market selling into other users' bids
    if (trade.orderBook[0][0].price >= bids[0] + mmConf.SPREAD) {

        let indexToOrderSpread = round(trade.orderBook[0][0].price - index);
        if (indexToOrderSpread > mmConf.TAKERFEE * index) {

            let amountToSell = round(Math.pow(indexToOrderSpread, mmConf.MARKETPOW) * mmConf.MARKETMULTIPLY - marketSold);

            if (trade.orderBook[0][0].amount < amountToSell)
                amountToSell = trade.orderBook[0][0].amount;

            if (amountToSell > 0 && trade.orderBook[0][0].id != mmConf.ID) {
                marketSold = round(marketSold + amountToSell);
                let obj = createOrderObj('marketOrder', amountToSell, trade.orderBook[0][0].price, 1);
                mmQue.push(obj);
            }
        }
    }
    else {
        marketSold = 0;
        bidAbsorb = 0;
        askAbsorb = 0;

        let bidPrice = round(bids[mmConf.ORDERAMOUNT - 1] - mmConf.SPREADBETWEEN - random());
        let askPrice = round(bids[0] + mmConf.SPREAD + random());

        bidsDown(bidPrice)
        asksDown(askPrice)

        pushTrade();
        weighBooks()
    }
}

// If a large amount (can be set in conf) is bought into mm's orders, raise the spread for a short period of time
async function absorbUp() {
    askAbsorb = 0;

    if (trade.orderBook[1].length > 0) {
        await sleep(500)
        let askPrice = round(asks[mmConf.ORDERAMOUNT - 1] + mmConf.SPREADBETWEEN + random());
        if (askPrice > bids[0] + mmConf.SPREAD / 2 && askPrice > trade.orderBook[0][0].price) {

            asksUp(askPrice)

            pushTrade()
            weighBooks()
        }

        absorbedUp++;
        await sleep(mmConf.SLEEPAFTERABSORB)
        absorbedUp--;


        askPrice = round(asks[0] - mmConf.SPREADBETWEEN + random());
        if (askPrice > bids[0] + mmConf.SPREAD / 2 && askPrice > trade.orderBook[0][0].price) {
            asksDown(askPrice)

            pushTrade();
            weighBooks()
        }
    }
}

// If a large amount (can be set in conf) is sold into mm's orders, raise the spread for a short period of time
async function absorbDown() {
    bidAbsorb = 0;

    if (trade.orderBook[0].length > 0) {
        let bidPrice = round(bids[mmConf.ORDERAMOUNT - 1] - mmConf.SPREADBETWEEN - random());
        await sleep(500)

        if (bidPrice < asks[0] - mmConf.SPREAD / 2 && bidPrice < trade.orderBook[1][0].price) {
            bidsDown(bidPrice)

            pushTrade()
            weighBooks()
        }

        absorbedDown++;
        await sleep(mmConf.SLEEPAFTERABSORB)
        absorbDown--;

        bidPrice = round(bids[0] + mmConf.SPREADBETWEEN - random());
        if (bidPrice < asks[0] - mmConf.SPREAD / 2 && bidPrice < trade.orderBook[1][0].price) {
            bidsUp(bidPrice)

            pushTrade()
            weighBooks()
        }
    }
}

// Swap the books' weight
// before:
//   [asks] index [bids]
//   10 8 6 currentPrice 10 8 6
//
// after:
//   [asks] index [bids]
//   6 8 10 currentPRice 6 8 10
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

// Fill the books when starting the server
function fillSide(side) {
    for (let i = 0; i < mmConf.ORDERAMOUNT; i++) {

        let price;
        if (side == 'bids')
            price = round(index - (mmConf.SPREAD) - i * mmConf.SPREADBETWEEN - random());
        if (side == 'asks')
            price = round(index + (mmConf.SPREAD) + i * mmConf.SPREADBETWEEN + random());

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


// Checks if the spread is acceptable. If not, lower it little by little
function checkSpread() {
    let spread = asks[0] - bids[0];
    if (spread > mmConf.REALSPREAD) {
        moveAsks = asks[0] - index > index - bids[0] ? true : false;
        if (moveAsks)
            asksDown(Number((asks[0] - mmConf.SPREAD / 5).toFixed(2)));
        else
            bidsUp(Number((bids[0] + mmConf.SPREAD / 5).toFixed(2)));

        pushTrade();
        weighBooks();
    }
}


function resetOrders() {
    for (let i = 0; i < mmConf.ORDERAMOUNT; i++) {
        mmQue.push(createOrderObj('changeOrder', 0, bids[i], 0));
        mmQue.push(obj);

        mmQue.push(createOrderObj('changeOrder', 0, asks[i], 1));
        mmQue.push(obj);
    }

    setTimeout(() => {
        db.query(`UPDATE users SET "reservedUSD" = 0 WHERE "id" = ${mmConf.ID}`);
        db.query(`UPDATE users SET "reservedETH" = 0 WHERE "id" = ${mmConf.ID}`);
    }, 500);

    pushTrade();
    setTimeout(() => {
        for (let i = 0; i < mmConf.ORDERAMOUNT; i++) {
            mmQue.push(createOrderObj('changeOrder', round((i + 1) * mmConf.FIRSTAMOUNT), bids[i], 0));
            mmQue.push(obj);

            mmQue.push(createOrderObj('changeOrder', round((mmConf.ORDERAMOUNT - i) * mmConf.FIRSTAMOUNT), asks[i], 1));
            mmQue.push(obj);
        }

    }, 1000);
}



// Fetch the current 1min candle opening price every 2s after the last minute has closed
// The delay to allows the ping to the server to be 3000ms at max. Can be changed if needed.
let minute = 60 * 1000;
let fiveSeconds = 5 * 1000;
let hour = 60 * minute;
const DELAY = 3000 // ms
function get1mOpen() {
    setTimeout(() => {
        binance.candlesticks("BTCUSDT", "1m", (error, ticks, symbol) => {
            current1mOpen = Number(ticks[0][1]);
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
repeatEvery(checkSpread, fiveSeconds)
repeatEvery(resetOrders, hour)


// Just linking the bidAbsorb and askAbsorb didn't work
function getBidAbsorb() {
    return bidAbsorb;
}
function getAskAbsorb() {
    return askAbsorb;
}
function setBidAbsorb(x) {
    bidAbsorb = round(bidAbsorb + x)
}
function setAskAbsorb(x) {
    askAbsorb = round(askAbsorb + x)
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


        binance.prices('ETHUSDT', async (err, ticker) => {
            if (err) console.log('ERROR geting Binance price')
            index = Number(ticker.ETHUSDT)
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

// Moving the orders up or down
function asksUp(price) {
    let obj = createOrderObj('removeOrder', 0, asks[0], 1);
    mmQue.push(obj);

    asks.shift();
    asks[mmConf.ORDERAMOUNT - 1] = price;

    obj = createOrderObj('addOrder', 0, price, 1);
    mmQue.push(obj)
}

function asksDown(price) {
    if (trade.orderBook[0][0].price < price) {
        obj = createOrderObj('removeOrder', 0, asks[mmConf.ORDERAMOUNT - 1], 1);
        mmQue.push(obj);

        asks.pop();

        obj = createOrderObj('addOrder', 0, price, 1)
        mmQue.push(obj);

        asks.unshift(price);
    }
}

function bidsUp(price) {
    if (trade.orderBook[1][0].price > price) {
        obj = createOrderObj('removeOrder', 0, bids[mmConf.ORDERAMOUNT - 1], 0);
        mmQue.push(obj);

        bids.pop();

        obj = createOrderObj('addOrder', 0, price, 0)
        mmQue.push(obj);

        bids.unshift(price);
    }
}

function bidsDown(price) {
    let obj = createOrderObj('removeOrder', 0, bids[0], 0);
    mmQue.push(obj);

    bids.shift();
    bids[mmConf.ORDERAMOUNT - 1] = price;

    obj = createOrderObj('addOrder', 0, price, 0);
    mmQue.push(obj)
}

function random() {
    //return Number((Math.random() / 10).toFixed(2))
    return 0;
}

