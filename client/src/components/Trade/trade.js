import io from "socket.io-client";


let socket = io("http://localhost:3001");


let OB;
let user;

socket.on('transmitOB', (data) => {
    OB = data;
    console.log('received ordewr boook')
    //findOwnOrders();

});


export function order(action, amount, price, market) {

    let orderType = action == 'buy' ? 0 : 1;


    if (!market && amount > 0 && price > 0)
        if (action == 'buy' && (price * amount <= user.availableUSD) || ((action == 'sell' && amount <= user.availableETH))) {
            // Limit order as a market order (trying to set a limit bid above the current lowest ask)
            //if(action == 'buy' && OB[1].length > 0 &&  price >= OB[1][0].price || action == 'sell' && OB[0].length > 0 && price <= OB[0][0].price)
            //    limitAsMarket(amount, price, orderType);
            //else

            socket.emit('order', { task: 'addOrder', amount, price, user, orderType });

        }




}

export function receiveUserInfo(data) {

    user = data;
    user.availableUSD = user.balanceUSD - user.reservedUSD;
    user.availableETH = user.balanceETH - user.reservedETH;

}