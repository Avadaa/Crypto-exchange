import io from "socket.io-client";



let socket = io("http://localhost:3001");

console.log(socket)

socket.on('dd', (data) => {
    console.log('ddd')
})
