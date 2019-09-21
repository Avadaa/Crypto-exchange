const server = require('../server');

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
        socket.emit('transmitOB', orderBook);

    }, 200);



    socket.on('order', (data) => {

        //que.push(data);
        //console.log('Order ' + data.orderID + ' received');


        //if (!executing)
        //    executeTasks();
        console.log(data);
        console.log('asd');
    });

})




module.exports = {
    connect() {



    }
}



