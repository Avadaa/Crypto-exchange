const server = require('../server');
const db = require('../dbQueries');

// Didn't get socket IO to work on client side without an 
// additional http connection on a different port
const http = require('http').Server(server.express)
http.listen(3001, () => {
    console.log('IO server runningg')
})

const socketIo = require('socket.io');

const io = socketIo(http);

// [[Bids],                [Asks]]
// [[{price, amount, id}], [{price, amount, id}]]
let orderBook = [[], []];

let currentPrice = 0;

// To process trades in the right order, every request must go through a que
let que = [];

let processing = false;
let executing = false;

io.on('connect', async (socket) => {
    console.log(io.engine.clientsCount)


    setTimeout(() => {
        socket.emit('transmitOB', { OB: orderBook, currentPrice });

    }, 200);



    socket.on('order', (data) => {

        que.push(data);


        if (!executing)
            executeTasks();
    });

})

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

    //if (data.task == 'marketOrder')
    //    await marketOrder(data);
}

// Adding a new order (bid or ask) to the books
// 1. Check if storing or loading order book
// 2. Confirm balance
// 3. Add a new entry to server side OB
// 4. Update 'reserved' amount in database
// 5. Emit to client side
async function addOrder(data) {
    //console.log('Order ' + data.orderID + ' processing started');

    processing = true;


    let OBobject = { price: data.price, amount: data.amount, id: Number(data.user.userId) };
    let orderType = data.orderType; // 0 = bid, 1 = ask

    let index = findIndex('server', orderType, OBobject.price);


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
        let change = orderType == 0 ? OBobject.amount * OBobject.price : OBobject.amount;


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
            console.log(emitType + ' SET at ' + OBobject.price + ' for ' + OBobject.amount + ' by ' + OBobject.id);

            //--------------------------------5--------------------------------         
            io.emit('addOrder', {
                order: {
                    price: OBobject.price,
                    amount: OBobject.amount
                },
                index: index,
                type: emitType,
                OB: orderBook,
                userID: OBobject.id
            });

        }

    }


    processing = false;
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


// Delete all instances on the same price made by the same user
// 1. Calculate how much the user has as orders on the same price
// 2. Deduct from 'reserved balance' in database
// 3. Emit changes to client side
async function removeOrder(data) {

    //--------------------------------1--------------------------------
    let amountRemoved = 0;

    let side = data.side == 'bid' ? 0 : 1;
    for (let i = 0; i < orderBook[side].length; i++) {
        let obRow = orderBook[side][i];
        if (obRow.price == data.price && obRow.id == data.user.id) {
            amountRemoved += obRow.amount;
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
    let updateUserBalance = `UPDATE users SET "${reserved}" = "${reserved}" - ${change} WHERE "id" = ${data.user.id}`;
    await db.query(updateUserBalance);

    //--------------------------------3--------------------------------
    let removeFully = true;
    let userClicked = true;
    io.emit('removeOrder', { price: data.price, amount: amountRemoved, OB: orderBook, side, id: data.user.id, removeFully, userClicked })
    console.log(data.side + ' DEL at ' + data.price + ' for ' + amountRemoved + ' by ' + data.user.id)
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










module.exports = {
    obInfo() {
        return ({ OB: orderBook, OBcompressed: compactOB(), currentPrice });
    }
}











