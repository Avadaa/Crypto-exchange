import io from "socket.io-client";
var script = document.createElement('script');
script.src = 'http://code.jquery.com/jquery-1.11.0.min.js';
script.type = 'text/javascript';
document.getElementsByTagName('head')[0].appendChild(script);

let socket = io("http://localhost:3001");


let OB;
let currentPrice

let user;

socket.on('transmitOB', (data) => {
    OB = data.OB;
    currentPrice = data.currentPrice;
    findOwnOrders();

});




export function order(action, amount, price, market) {


    let orderType = action == 'buy' ? 0 : 1;


    if (!market && amount > 0 && price > 0)
        if (action == 'buy' && (price * amount <= user.availableUSD) || ((action == 'sell' && amount <= user.availableETH || (amount == 420 && (price == 1336 || price == 1338))))) {
            // Limit order as a market order (trying to set a limit bid above the current lowest ask)
            //if(action == 'buy' && OB[1].length > 0 &&  price >= OB[1][0].price || action == 'sell' && OB[0].length > 0 && price <= OB[0][0].price)
            //    limitAsMarket(amount, price, orderType);
            //else

            socket.emit('order', { task: 'addOrder', amount, price, user, orderType });

        }

    if (market && amount > 0 && (OB[1][0] && action == 'buy') || (OB[0][0] && action == 'sell'))
        if (action == 'buy' && (OB[1][0].price * amount <= user.availableUSD) || (action == 'sell' && amount <= user.availableETH))
            socket.emit('order', { task: 'marketOrder', amount, price: -1, user, orderType });


}


socket.on('addOrder', async (data) => {
    let matchingPriceAmount = matchingPrices(data.type, data.order.price);

    if (data.type == 'bid') {
        if (data.userID == user.id) {
            user.availableUSD -= data.order.price * data.order.amount;
            document.getElementById('usdAvailable').innerText = `USD: ${Math.round(user.availableUSD * 10000000) / 10000000}`
        }


    }
    if (data.userID == user.id && data.type == 'ask') {

        user.availableETH -= data.order.amount;
        document.getElementById('ethAvailable').innerText = `ETH: ${Math.round(user.availableETH * 10000000) / 10000000}`
    }

    if (matchingPriceAmount == false) {
        let html = `<tr><td class="order-price">${data.order.price}</td><td class="order-amount">${data.order.amount}</td><td class="order-remove-invisible">X</td></tr>`
        $(`#${data.type} tbody > tr:eq(${data.index})`).after(html)
    }
    else {
        let children = $(`#${data.type} tbody`).children();
        $(children[matchingPriceAmount.index]).children()[1].innerText = Math.round((Number(matchingPriceAmount.amount) + Number(data.order.amount)) * 10000000) / 10000000;

    }


    OB = data.OB;
    findOwnOrders();

});

socket.on('removeOrder', async (data) => {

    OB = data.OB;
    let side = data.side == 0 ? 'bid' : 'ask';
    let rows = $($(`#${side}`).children()[0]).children()

    for (let i = 1; i < rows.length; i++) {
        let rowPrice = $(rows[i]).children()[0].innerText;
        if (rowPrice == data.price) {

            // Hide 'removal' -button from client side, if needed
            if (user.id == data.id && data.removeFully) {
                $($(rows[i]).children()[2]).removeClass('order-remove-visible').addClass('order-remove-invisible');
                findOwnOrders();
            }

            // If a certain price has multiple orders from multiple users, just update the amount
            if (Number($(rows[i]).children()[1].innerText) > data.amount)
                $(rows[i]).children()[1].innerText = Math.round((Number($(rows[i]).children()[1].innerText) - data.amount) * 10000000) / 10000000;

            // If not, remove the whole row-element
            else
                $(rows[i]).remove()

            break;
        }
    }

    if (data.userClicked && data.id == user.id && side == 'bid') {
        user.availableUSD += data.price * data.amount;

        document.getElementById('usdAvailable').innerText = `USD: ${Math.round(user.availableUSD * 10000000) / 10000000}`

    }
    if (data.userClicked && data.id == user.id && side == 'ask') {
        user.availableETH += data.amount;
        document.getElementById('ethAvailable').innerText = `ETH: ${Math.round(user.availableETH * 10000000) / 10000000}`
    }


});

socket.on('marketOrder', async (data) => {
    document.getElementById('currentPrice').innerText = `${data.currentPrice}`;
    OB = data.OB;

    if (data.id == user.id) {

        user.balanceUSD = data.balanceUSD;
        user.availableUSD = data.balanceUSD - data.reservedUSD;
        document.getElementById('usdAvailable').innerText = `USD: ${user.availableUSD}`


        user.balanceETH = data.balanceETH;
        user.availableETH = data.balanceETH - data.reservedETH;
        document.getElementById('ethAvailable').innerText = `ETH: ${user.availableETH}`


    }


});


document.addEventListener('click', () => {
    if (event.target.classList[0] == 'order-remove-visible') {
        let clickedRow = $(event.target.parentNode);
        let price = Number(clickedRow.children()[0].innerText);
        let side = $(clickedRow.parent()).parent().attr('id');


        socket.emit('order', { task: 'removeOrder', price, side, user })
    }


    // Disable 'price' -input field if 'market' orders are chosen
    if (event.target.id == 'market-limit') {
        //document.getElementById('price').disabled = document.getElementById('price').disabled ? false : true;
        document.getElementById('price').classList.toggle('disabled');

    }
})





































function matchingPrices(side, price) {
    let children = $(`#${side} tbody`).children();
    for (let i = 1; i < children.length; i++) {
        if ($(children[i]).children()[0].innerText == price)
            return { index: i, amount: $(children[i]).children()[1].innerText };

    }
    return false;
}

export function findOwnOrders() {

    let prices = [[], []];

    for (let i = 0; i < 2; i++)
        for (let j = 0; j < OB[i].length; j++)
            if (OB[i][j].id == user.id && !prices[i].includes(OB[i][j].price))
                prices[i].push(OB[i][j].price);

    let bookEles = [$($('#bid').children()[0]).children(), $($('#ask').children()[0]).children()]

    for (let i = 0; i < 2; i++)
        for (let j = 1; j < bookEles[i].length; j++) {

            let price = Number($(bookEles[i][j]).children()[0].innerText);
            if (prices[i].includes(price))
                $($(bookEles[i][j]).children()[2]).removeClass('order-remove-invisible').addClass('order-remove-visible');
        }


}


export async function receiveUserInfo(data) {


    user = data;

    user.id = user.userId
    user.availableUSD = user.balanceUSD - user.reservedUSD;
    user.availableETH = user.balanceETH - user.reservedETH;



}








/*
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

*/