import io from "socket.io-client";
var script = document.createElement('script');
script.src = 'http://code.jquery.com/jquery-1.11.0.min.js';
script.type = 'text/javascript';
document.getElementsByTagName('head')[0].appendChild(script);

let socket = io("http://localhost:3001");


let OB;
let OBcompressed;
let user;

socket.on('transmitOB', (data) => {
    OB = data.OB;
    OBcompressed = data.OBcompressed;


    for (let i = 0; i < OBcompressed[0].length; i++)
        addRow({ price: OBcompressed[0][i].price, amount: OBcompressed[0][i].amount, side: 0 })

    for (let i = OBcompressed[1].length - 1; i >= 0; i--)
        addRow({ price: OBcompressed[1][i].price, amount: OBcompressed[1][i].amount, side: 1 })

    findOwnOrders();


});

function addRow(rowData) {

    let html = `
            <td class="order-price">${rowData.price}</td>
            <td class="order-amount">${rowData.amount}</td>
            <td class="order-remove-invisible">X</td>
            `

    let tr = document.createElement('tr');
    tr.innerHTML = html;
    if (rowData.side == 0)
        $('#bid tbody').append(tr);
    if (rowData.side == 1) {
        $('#ask tbody').append(tr);
    }

}


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
}


socket.on('addOrder', (data) => {
    let matchingPriceAmount = matchingPrices(data.type, data.order.price);

    if (data.type == 'bid') {
        if (data.userID == user.id) {
            user.availableUSD -= data.order.price * data.order.amount;
            document.getElementById('usdAvailable').innerText = `USD available: ${user.availableUSD}`
        }


    }
    if (data.userID == user.id && data.type == 'ask') {
        user.availableETH -= data.order.amount;
        document.getElementById('ethAvailable').innerText = `ETH available: ${user.availableETH}`
    }

    if (matchingPriceAmount == false) {
        let html = `<tr><td class="order-price">${data.order.price}</td><td class="order-amount">${data.order.amount}</td><td class="order-remove-invisible">X</td></tr>`
        $(`#${data.type} tbody > tr:eq(${data.index})`).after(html)
    }
    else {
        let children = $(`#${data.type} tbody`).children();
        $(children[matchingPriceAmount.index]).children()[1].innerText = Number(matchingPriceAmount.amount) + Number(data.order.amount);

    }

    OB = data.OB;
    findOwnOrders();

});


function matchingPrices(side, price) {
    let children = $(`#${side} tbody`).children();
    for (let i = 1; i < children.length; i++) {
        if ($(children[i]).children()[0].innerText == price)
            return { index: i, amount: $(children[i]).children()[1].innerText };

    }
    return false;
}

function findOwnOrders() {

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


export function receiveUserInfo(data) {

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