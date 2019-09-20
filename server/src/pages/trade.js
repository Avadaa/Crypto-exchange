const server = require('../server');



// Didn't get socket IO to work on client side without an 
// additional http connection on a different port
const http = require('http').Server(server.express)
http.listen(3001, () => {
    console.log('IO server runningg')
})

const socketIo = require('socket.io');


const io = socketIo(http);

let amount = 0;


io.on('connect', async (socket) => {

    console.log(io.engine.clientsCount)
    socket.emit('dd', { asd: 'dd' });

})

