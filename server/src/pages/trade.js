const server = require('../server');
const db = require('../dbQueries');
let mm = require('../market_maker/mm')
let mmConf = require('../../config/mm')

// Didn't get socket IO to work on client side without an 
// additional http connection on a different port
const http = require('http').Server(server.express)
http.listen(3001, () => {
    console.log('IO server runningg')
})

const socketIo = require('socket.io');

const io = socketIo(http);

// [[Bids],                [Asks]]
// [[{price, amount, id, orderId, originalAmount}], [{price, amount, id, orderId, originalAmount}]]
let orderBook = [[], []];

let currentPrice = 0;

// To process trades in the right order, every request must go through a que
let que = [];

let processing = false;
let executing = false;



io.on('connect', async (socket) => {


    setTimeout(() => {
        socket.emit('transmitOB', { OB: orderBook, currentPrice });
    }, 200);

    socket.on('order', (data) => {
        push(data);
    });

})

function push(data) {
    que.push(data);
    if (!executing)
        executeTasks();
}

async function executeTasks() {
    executing = true;

    while (que.length > 0) {
        if (!processing) {
            await processQue(que[0]);

            que.shift();
        }

    }

    executing = false;
}

async function processQue(data) {
    if (data.task == 'addOrder')
        await addOrder(data);

    if (data.task == 'removeOrder')
        await removeOrder(data);

    if (data.task == 'marketOrder')
        await marketOrder(data);

    if (data.task == 'changeOrder')
        await changeOrder(data);
}

// Adding a new order (bid or ask) to the books
// 1. Check if storing or loading order book
// 2. Confirm balance
// 3. Add a new entry to server side OB
// 4. Update 'reserved' amount in database
// 5. Create an entry to history table in database
//      The market maker doesn't store history. The algo is constantly changing order amounts, so
//      that'd require constant DB calls and it'd be a mess. Not worth the load either.
// 6. Emit to client side
async function addOrder(data) {
    processing = true;

    data.price = round(data.price);
    data.amount = round(data.amount);


    let OBobject = { price: data.price, amount: data.amount, id: Number(data.user.userId) };
    let orderType = data.orderType; // 0 = bid, 1 = ask

    let index = findIndex('server', orderType, OBobject.price);
    let serverIndex = index;


    //--------------------------------1--------------------------------
    // Secret inputs to save and load order books to and from the database
    // Negative impact: an unexpected system shutdown would not save the books
    if (OBobject.amount == 420) {
        if (OBobject.price == 1336) {
            console.log(orderBook)
            let saveQuery = `UPDATE order_book SET "date" = '${new Date()}', "data" = '${JSON.stringify(orderBook)}', "currentPrice" = '${currentPrice}' WHERE "id" = '1'`;
            db.query(saveQuery);
            console.log('Order books saved.');
            //console.log(await db.query(`INSERT INTO order_book("id", "date", "data", "currentPrice") VALUES('1', '${new Date()}', '${JSON.stringify(orderBook)}', '${currentPrice}')`));
        }

        if (OBobject.price == 1338) {

            let loadQuery = 'SELECT * FROM order_book'; // Always only one entry
            let results = await db.query(loadQuery);
            results = results[0];
            orderBook = results.data;
            currentPrice = results.currentPrice;
            console.log('Order books loaded');
        }
    }

    else {

        let emitType = orderType == 0 ? 'bid' : 'ask';
        let reserved = orderType == 0 ? 'reservedUSD' : 'reservedETH';


        // If a bid is set, resrve 'amount * price' worth of dollars
        // If an ask is set, reserve 'amount' worth of ETH
        let change = orderType == 0 ? round(OBobject.amount * OBobject.price) : round(OBobject.amount);


        //--------------------------------2-------------------------------- 
        // Do another test to check that the user has sufficient balance for the order
        let userinfo = await db.query(`SELECT * FROM users WHERE "id" = ${OBobject.id}`);

        // If adding a bid, availableUSD >= change
        // If adding an ask, available ETH >= change
        let userHasBalance = emitType == 'bid' ? userinfo[0].balanceUSD - userinfo[0].reservedUSD >= change : userinfo[0].balanceETH - userinfo[0].reservedETH >= change;



        if (userHasBalance) {


            //--------------------------------3-------------------------------- 
            // Add a new entry to the server-side order book
            orderBook[orderType].splice(index, 0, OBobject);


            index = findIndex('client', orderType, OBobject.price);

            if (orderType == 0)
                index -= 1;
            if (orderType == 1) {
                index = compactOB()[1].length - index;
            }


            //--------------------------------4--------------------------------        
            // Update 'reserved' amount in database
            let updateUserBalance = `UPDATE users SET "${reserved}" = "${reserved}" + ${change} WHERE "id" = ${OBobject.id}`;
            await db.query(updateUserBalance);


            if (OBobject.id != mmConf.ID)
                console.log(emitType + ' SET at ' + OBobject.price + ' for ' + OBobject.amount + ' by ' + OBobject.id);

            //--------------------------------5--------------------------------
            let historyId = [{ id: null }];
            let timeStamp = null;
            if (mmConf.ID != OBobject.id) {

                let time = new Date();
                timeStamp = `${time.getDate()}/${time.getMonth()}/${time.getFullYear()} ${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}`;

                let buySell = emitType == 'bid' ? 'buy' : 'sell';
                let historyQuery = `INSERT INTO history("userId", "filled", "time", "side", "type", "status", "price", "amount") VALUES('${OBobject.id}', '0','${timeStamp}', '${buySell}', 'limit', 'untouched', '${OBobject.price}', '${OBobject.amount}') RETURNING id`;
                historyId = null;
                historyId = await db.query(historyQuery);


                // Adding an order id and to the books 
                // Helps quite a lot when handling the front-end side regarding user's trade history
                orderBook[orderType][serverIndex].orderId = historyId[0].id;
            }


            // Adding original size to help keep track of the total filled amount
            orderBook[orderType][serverIndex].originalAmount = OBobject.amount;

            //--------------------------------6--------------------------------    
            io.emit('addOrder', {
                order: {
                    price: OBobject.price,
                    amount: OBobject.amount
                },
                index: index,
                type: emitType,
                OB: orderBook,
                userID: OBobject.id,
                timeStamp,
                historyId: historyId[0].id
            });
        }
    }




    processing = false;
}





// Delete all instances on the same price made by the same user
// 1. Calculate how much the user has as orders on the same price
// 2. Deduct from 'reserved balance' in database
// 3. Edit history -rows in database
// 4. Emit changes to client side
async function removeOrder(data) {
    //--------------------------------1--------------------------------
    let amountRemoved = 0;
    let removedOrderIds = [];

    let side = data.side == 'bid' ? 0 : 1;
    for (let i = 0; i < orderBook[side].length; i++) {
        let obRow = orderBook[side][i];
        if (obRow.price == data.price && obRow.id == data.user.id) {
            amountRemoved += obRow.amount;
            removedOrderIds.push(obRow.orderId);
            orderBook[side].splice(i, 1);
            i--;

            // Break if there is no next order on the book, or
            //      the next order isn't at the price we are interested in
            if (i + 1 == orderBook[side].length || orderBook[side][i + 1].price != data.price)
                break;
        }
    }

    // If a bid is set, resrve 'amount * price' worth of dollars
    // If an ask is set, reserve 'amount' worth of ETH
    let change = side == 0 ? amountRemoved * data.price : amountRemoved;

    let reserved = side == 0 ? 'reservedUSD' : 'reservedETH';

    //--------------------------------2--------------------------------
    let updateUserBalance = `UPDATE users SET "${reserved}" = "${reserved}" - ${round(change)} WHERE "id" = ${data.user.id}`;
    await db.query(updateUserBalance);


    //--------------------------------3--------------------------------
    let isMM = true;
    if (data.user.id != mmConf.ID) {
        isMM = false;
        for (let i = 0; i < removedOrderIds.length; i++) {
            let updateHistoryQuery = `UPDATE history SET "status" = 'cancelled' WHERE "id" = ${removedOrderIds[i]}`
            await db.query(updateHistoryQuery);
        }
    }

    //--------------------------------4--------------------------------
    let removeFully = true;
    let userClicked = true;
    io.emit('removeOrder', {
        price: data.price,
        amount: amountRemoved,
        OB: orderBook, side, id:
            data.user.id,
        removeFully,
        userClicked,
        orderIds: removedOrderIds,
        isMM
    })
    if (data.user.id != mmConf.ID)
        console.log(data.side + ' DEL at ' + data.price + ' for ' + amountRemoved + ' by ' + data.user.id)
}

// Making an actual trade (market order)
async function marketOrder(data) {


    //console.log('Order ' + data.orderID + ' processing started');
    processing = true;
    // OBside = 0 --> selling to bids(orderBook[0])
    // Obside = 1 --> buying to asks (orderBook[1])
    let OBside = data.orderType == 0 ? 1 : 0;

    let thickness = OBthickness();

    if ((OBside == 0 && thickness[0] >= data.amount) || (OBside == 1 && thickness[1] >= data.amount)) {
        let OBrow = orderBook[OBside][0];
        OBrow.price = round(OBrow.price);
        OBrow.amount = round(OBrow.amount);


        // The amount that changed hands in this transaction
        let change = OBrow.amount > data.amount ? data.amount : OBrow.amount;

        // Do another test to check that the user has sufficient balance for the order
        let userinfo = await db.query(`SELECT * FROM users WHERE "id" = ${data.user.id}`);


        // If the user has enough balance to pull the trigger, but the next order in the books is too expensive, still fill as much as possible
        // EG: ask side:(price, amount)
        //                100 ,   1
        //                 50 ,   1
        //                 30 ,   1
        //
        // A user with $110 balance tries to buy three full coins --> only the two first ones get filled, and he is left with $30 and two coins
        // If buying, availableUSD >= amount * price
        // If selling, available ETH >= amount
        let userHasBalance = OBside == 1 ? userinfo[0].balanceUSD - userinfo[0].reservedUSD >= change * OBrow.price :
            userinfo[0].balanceETH - userinfo[0].reservedETH >= change;


        if (userHasBalance) {


            let amountAvailable = OBrow.amount;

            // Remove (some of) the bid/ask that is the counterpart in this trade
            let removeOrderChange = OBside == 0 ? change * OBrow.price : change;
            let reserved = OBside == 0 ? 'reservedUSD' : 'reservedETH';

            let updateUserReserved = `UPDATE users SET "${reserved}" = "${reserved}" - ${round(removeOrderChange)} WHERE "id" = ${OBrow.id}`;
            await db.query(updateUserReserved);

            let removeFully = change >= OBrow.amount;
            let userClicked = false;
            io.emit('removeOrder', {
                price: OBrow.price,
                amount: change,
                OB: orderBook,
                side: OBside,
                id: OBrow.id,
                removeFully,
                userClicked,
            });

            // Reduce from the order in the books
            OBrow.amount = OBrow.amount - data.amount;

            // If the first order in the books wasn't enough, remove it
            if (OBrow.amount <= 0) {
                orderBook[OBside].splice(0, 1);
                data.amount = data.amount - round(amountAvailable);

            }

            // If it was, the market order is fully filled.
            else
                data.amount = 0;


            // Updating the user's info who initiated the market order
            let marketTakeBalanceSide = OBside == 0 ? 'balanceETH' : 'balanceUSD';
            let marketTakeChange = OBside == 0 ? change : change * OBrow.price;
            let updateTakeMarketSide = `UPDATE users SET "${marketTakeBalanceSide}" = "${marketTakeBalanceSide}" - ${round(marketTakeChange)} WHERE "id" = ${data.user.id}`
            await db.query(updateTakeMarketSide);

            let marketAddBalanceSide = OBside == 0 ? 'balanceUSD' : 'balanceETH';
            let marketAddChange = OBside == 0 ? change * OBrow.price : change;
            let updateAddMarketSide = `UPDATE users SET "${marketAddBalanceSide}" = "${marketAddBalanceSide}" + ${round(marketAddChange)} WHERE "id" = ${data.user.id}`
            await db.query(updateAddMarketSide);


            // Update the user's info who was on the limit side
            let limitTakeBalanceSide = OBside == 0 ? 'balanceUSD' : 'balanceETH';
            let limitTakeChange = OBside == 0 ? change * OBrow.price : change;
            let updateTakeLimittSide = `UPDATE users SET "${limitTakeBalanceSide}" = "${limitTakeBalanceSide}" - ${round(limitTakeChange)} WHERE "id" = ${OBrow.id}`
            await db.query(updateTakeLimittSide);

            let limitAddBalanceSide = OBside == 0 ? 'balanceETH' : 'balanceUSD';
            let limitAddChange = OBside == 0 ? change : change * OBrow.price;
            let updateAddLimitSide = `UPDATE users SET "${limitAddBalanceSide}" = "${limitAddBalanceSide}" + ${round(limitAddChange)} WHERE "id" = ${OBrow.id}`
            await db.query(updateAddLimitSide);

            let marketSide = await db.query(`SELECT * FROM users WHERE "id" = ${data.user.id}`);
            marketSide = marketSide[0];
            let limitSide = await db.query(`SELECT * FROM users WHERE "id" = ${OBrow.id}`);
            limitSide = limitSide[0];


            // Update the changed limit order in  history-table in db
            let orderStatus = null;
            let amountFilled = null;
            if (mmConf.ID != OBrow.id) {
                orderStatus = OBrow.amount < 0.000001 ? 'Filled' : 'Partially filled'
                amountFilled = OBrow.amount < 0 ? OBrow.originalAmount : OBrow.originalAmount - OBrow.amount;
                let makerHistoryQuery = `UPDATE history SET "filled" = ${amountFilled}, "status" = '${orderStatus}' WHERE "id" = ${OBrow.orderId}`
                await db.query(makerHistoryQuery);

            }


            // Add an entry for the taker-side user in db
            let buySell = null;
            let timeStamp = null;
            let marketSideOrderId = [{ id: null }];
            if (data.user.id != mmConf.ID) {
                let time = new Date();
                let hours = (time.getHours() < 10 ? '0' : '') + time.getHours();
                let minutes = (time.getMinutes() < 10 ? '0' : '') + time.getMinutes();
                let seconds = (time.getSeconds() < 10 ? '0' : '') + time.getSeconds();
                timeStamp = `${time.getDate()}/${time.getMonth()}/${time.getFullYear()} ${hours}:${minutes}:${seconds}`;

                buySell = OBside == 0 ? 'sell' : 'buy';
                let takerHistoryQuery = `INSERT INTO history("userId", "filled", "time", "side", "type", "status", "price", "amount") VALUES('${data.user.id}', '${change}','${timeStamp}', '${buySell}', 'Market', 'Filled', '${OBrow.price}', '${change}') RETURNING id`;
                marketSideOrderId = null;
                marketSideOrderId = await db.query(takerHistoryQuery);

                // For front end colors to be right in the order history
                buySell = buySell == 'sell' ? 'ask' : 'bid';
            }




            currentPrice = OBrow.price;

            // Update balance on client's screens
            io.emit('marketOrder', {
                type: "market",
                balanceETH: marketSide.balanceETH,
                reservedETH: marketSide.reservedETH,
                balanceUSD: marketSide.balanceUSD,
                reservedUSD: marketSide.reservedUSD,
                id: marketSide.id,
                currentPrice,
                OB: orderBook,
                amount: change,
                orderId: marketSideOrderId[0].id,
                side: buySell,
                timeStamp


            });
            io.emit('marketOrder', {
                type: "limit",
                balanceETH: limitSide.balanceETH,
                reservedETH: limitSide.reservedETH,
                balanceUSD: limitSide.balanceUSD,
                reservedUSD: limitSide.reservedUSD,
                id: limitSide.id,
                currentPrice,
                OB: orderBook,
                filled: amountFilled,
                orderId: OBrow.orderId,
                orderStatus

            });

            io.emit('historyInfo', {
                amount: change,
                price: currentPrice,
                side: OBside
            })



            let sellOrBuy = OBside == 0 ? 'sell' : 'buy';
            console.log(sellOrBuy + ' MARKET at ' + OBrow.price + ' for ' + round(change) + ' by ' + data.user.id);


            // If the market order didn't get filled, repeat the process
            if (data.amount > 0)
                marketOrder(data);

        }
    }

    processing = false;
}

// Currently for MM algorithm only. 
// Minimal error processing, because users don't have access.
async function changeOrder(data) {
    processing = true;

    let balanceQuery = `SELECT * FROM users WHERE id = ${mmConf.ID}`;
    let balances = await db.query(balanceQuery);

    let originalAmount;

    let reserved = '';
    for (let order of orderBook[data.orderType]) {
        if (order.price == data.price) {

            originalAmount = order.amount;
            let change = round(data.amount - order.amount);
            data.change = change;

            change = data.orderType == 0 ? round(change * data.price) : change;

            let hasMoney = false;

            if (data.orderType == 0 && balances[0].balanceUSD - balances[0].reservedUSD > change) {
                hasMoney = true;
                reserved = 'reservedUSD';

            }
            if (data.orderType == 1 && balances[0].balanceETH - balances[0].reservedETH > change) {
                hasMoney = true;
                reserved = 'reservedETH';
            }

            if (hasMoney) {
                order.amount = data.amount;
                order.originalAmount = data.amount;

                // Update 'reserved' amount in database
                let updateUserBalance = `UPDATE users SET "${reserved}" = "${reserved}" + ${change} WHERE "id" = ${mmConf.ID}`;
                await db.query(updateUserBalance);

                let emitType = data.orderType == 0 ? 'bid' : 'ask';
                //console.log(emitType + ' UPDATED at ' + data.price + ' from ' + originalAmount + ' to ' + data.amount + ' by ' + data.user.id);

                io.emit('changeOrder', { change: data.change, price: data.price, emitType, OB: orderBook });
            }

            break;
        }
    }



    processing = false;
}


// The server side order book shows every single user's submissions, but the client side one 
//      shows total orders on every individual price. Thus the book has to be compressed
//      before being sent to the client.
// Server:
//          price: 2, amount: 3, user_id: 88
//          price: 2, amount: 2, user_id: 85
//          price: 4, amount: 5, user_id: 88
// Client:
//          price: 2, amount: 5
//          price: 4, amount: 5
function compactOB() {
    let OB = [[], []];

    for (let i = 0; i < 2; i++) {
        for (let j = 0; j < orderBook[i].length; j++) {
            if (OB[i].length == 0 || OB[i][OB[i].length - 1].price != orderBook[i][j].price)

                OB[i].push({
                    price: orderBook[i][j].price,
                    amount: orderBook[i][j].amount
                });

            else
                OB[i][OB[i].length - 1].amount += orderBook[i][j].amount;
        }
    }

    return OB;
}


function findIndex(type, side, inputPrice) {
    let OB;

    if (type == 'server') OB = orderBook;
    if (type == 'client') OB = compactOB();


    // No entries, the first entry is going to be at index 0
    if (OB[side].length == 0) return 0;

    for (let i = 0; i < OB[side].length; i++) {

        if (side == 1 && Number(inputPrice) < Number(OB[side][i].price)) {
            return i;

        }
        if (side == 0 && Number(inputPrice) > Number(OB[side][i].price))
            return i;
    }

    return OB[side].length;
}

function OBthickness() {

    let thickness = [0, 0];

    for (let i = 0; i < 2; i++)
        for (let j = 0; j < orderBook[i].length; j++)
            thickness[i] += orderBook[i][j].amount;

    return thickness;
}


function round(num) {
    return Math.round(num * 10000000) / 10000000;
}

module.exports = {
    obInfo() {
        return ({ OB: orderBook, OBcompressed: compactOB(), currentPrice });
    },
    // For 'mm.js' to use
    io,
    que,
    executing,
    executeTasks,
    orderBook,
    changeOrder,
    processing,
    push,
    orderBook

}