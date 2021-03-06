import io from "socket.io-client";
import { stringify } from "querystring";
var script = document.createElement('script');
script.src = 'http://code.jquery.com/jquery-1.11.0.min.js';
script.type = 'text/javascript';
document.getElementsByTagName('head')[0].appendChild(script);

//let socket = io("http://localhost:3001");
let socket = io("http://ezgains-backend.eu-west-1.elasticbeanstalk.com:3001/", { transports: ['websocket', 'polling', 'flashsocket'] });

let OB;
let user;
let currentPrice

socket.on('transmitOB', (data) => {
    OB = data.OB;
    currentPrice = data.currentPrice;
    findOwnOrders();

});

// Initiated order
// Decides whether we're emitting an 'add order', 'market order', or maybe both with appropriate amounts
export function order(action, amount, price, market) {

    amount = round(amount);

    let orderType = action == 'buy' ? 0 : 1;


    if (!market && amount > 0 && price > 0)
        if (action == 'buy' &&
            (price * amount <= user.availableUSD) ||
            ((action == 'sell' && amount <= user.availableETH))) {

            //Limit order as a market order (trying to set a limit bid above the current lowest ask, for example)
            if (action == 'buy' && OB[1].length > 0 && price >= OB[1][0].price ||
                action == 'sell' && OB[0].length > 0 && price <= OB[0][0].price)

                limitAsMarket(amount, price, orderType);
            else
                socket.emit('order', { task: 'addOrder', amount, price, user, orderType });

        }
    if (market &&
        amount > 0 &&
        ((OB[1][0] && action == 'buy') || (OB[0][0] && action == 'sell')))

        if (action == 'buy' &&
            (OB[1][0].price * amount <= user.availableUSD) || (action == 'sell' && amount <= user.availableETH)) {
            socket.emit('order', { task: 'marketOrder', amount, price: -1, user, orderType });
        }
}

socket.on('updateIndex', async (data) => {
    $('#index').text(`Index: ${data.index}`);
})

// Client side stuff for adding an order
socket.on('addOrder', async (data) => {
    let matchingPriceAmount = matchingPrices(data.type, data.order.price);

    // Update user balances on client side
    if (user && data.userID && user.id && data.type) {
        if (data.userID == user.id && data.type == 'bid') {
            user.availableUSD -= data.order.price * data.order.amount;
            document.getElementById('usdAvailable').innerText = `USD: ${round(user.availableUSD)}`
        }

        if (data.userID == user.id && data.type == 'ask') {
            user.availableETH -= data.order.amount;
            document.getElementById('ethAvailable').innerText = `ETH: ${round(user.availableETH)}`
        }
    }

    // Add an entry to the books IF there wasn't an order at that spesific price already
    if (matchingPriceAmount == false) {
        let html = `<tr><td class="order-price">${data.order.price}</td><td class="order-amount">${data.order.amount}</td><td class="order-remove-invisible">X</td></tr>`
        $(`#${data.type} tbody > tr:eq(${data.index})`).after(html)
    }
    else {
        let children = $(`#${data.type} tbody`).children();
        $(children[matchingPriceAmount.index]).children()[1].innerText = round((Number(matchingPriceAmount.amount) + Number(data.order.amount)));
    }

    OB = data.OB;
    findOwnOrders();
    if (data.historyId != null && data.userID == user.id)
        addHistory({ price: data.order.price, amount: data.order.amount, side: data.type, timeStamp: data.timeStamp, historyId: data.historyId, type: 'Limit' });
});

// Client side stuff when an order has been removed
socket.on('removeOrder', async (data) => {
    OB = data.OB;
    let side = data.side == 0 ? 'bid' : 'ask';
    let rows = $($(`#${side}`).children()[0]).children()

    for (let i = 1; i < rows.length; i++) {
        let rowPrice = $(rows[i]).children()[0].innerText;
        if (rowPrice == data.price) {

            // Hide 'removal' -button from client side, if needed
            if (user && data && user.id == data.id && data.removeFully) {
                $($(rows[i]).children()[2]).removeClass('order-remove-visible').addClass('order-remove-invisible');
                findOwnOrders();
            }

            // If a certain price has multiple orders from multiple users, just update the amount
            if (Number($(rows[i]).children()[1].innerText) > data.amount) {

                $(rows[i]).children()[1].innerText = round((Number($(rows[i]).children()[1].innerText) - data.amount));
                if (Number($(rows[i]).children()[1].innerText < 0.000001)) // If the price has $0 to offer, remove the row from the books
                    $(rows[i]).remove();
            }

            // If not, remove the whole row-element
            else
                $(rows[i]).remove()

            break;
        }
    }

    if (data && user && data.id == user.id) {
        if (!data.isMM && data.userClicked)
            cancelInHistory({ orderIds: data.orderIds });

        if (data.userClicked && side == 'bid') {
            user.availableUSD += data.price * data.amount;

            document.getElementById('usdAvailable').innerText = `USD: ${round(user.availableUSD)}`
        }
        if (data.userClicked && side == 'ask') {
            user.availableETH += data.amount;
            document.getElementById('ethAvailable').innerText = `ETH: ${round(user.availableETH)}`
        }
    }
});

// Client side stuff when there has been a market order
// Changing the available balances for user and editing histories
socket.on('marketOrder', async (data) => {
    document.getElementById('currentPrice').innerText = `${data.currentPrice}`;
    OB = data.OB;
    if (data.id == user.id) {

        user.balanceUSD = data.balanceUSD;
        user.availableUSD = data.balanceUSD - data.reservedUSD;
        document.getElementById('usdAvailable').innerText = `USD: ${round(user.availableUSD)}`


        user.balanceETH = data.balanceETH;
        user.availableETH = data.balanceETH - data.reservedETH;
        document.getElementById('ethAvailable').innerText = `ETH: ${round(user.availableETH)}`
        if (data.type == 'limit')
            editLimitSideHistory({ orderId: data.orderId, filled: data.filled, orderStatus: data.orderStatus });

        if (data.type == 'market')
            addHistory({ price: data.currentPrice, amount: data.amount, side: data.side, timeStamp: data.timeStamp, historyId: data.orderId, type: 'Market' });
    }
});

// Client-side stuff when an order has been modified
socket.on('changeOrder', (data) => {
    OB = data.OB
    let rows = $($(`#${data.emitType}`).children()[0]).children()

    // Loop through the visible order book
    for (let i = 1; i < rows.length; i++) {
        let rowPrice = $(rows[i]).children()[0].innerText;

        if (rowPrice == data.price) {
            let current = Number($(rows[i]).children()[1].innerText);

            // Modifying orders is not supported for other clients than the market maker (algorithm), so 
            //    displaying the changes in the client-side is not needed
          
            //if (user && data && user.id == data.userID)
            //    document.getElementById('ethAvailable').innerText = `ETH: ${round(Number(document.getElementById('ethAvailable').innerText) + round(data.change))}`

            // Change the values which are no longer valid after some orders have been modified
            current = round(round(current) + round(data.change));
            $(rows[i]).children()[1].innerText = round(current);
            //validateBooks()
        }
    }
})

/*
// Not tested //
function validateBooks() {
    let rows = $($(`#ask`).children()[0]).children()
    let row;
    for (let i = 1; i < rows.length; i++)
        if ($(rows[i]).children()[0].innerText != '0') {
            row = $(rows[i])
            break;
        }

    for (let i = 0; i < OB[1].length; i++)
        if (OB[1][i].price == row.children()[0].innerText) {
            if (OB[1][i].amount != row.children()[1].innerText)
                redrawBooks()

            break;
        }
}

function redrawBooks() {
    console.log('redrawing')
    $('#ask tbody').not(':first').remove();
    $('#bid tbody').not(':first').remove();

    for (let i = 0; i < 2; i++) {
        for (let j = 0; j < OB[i].length; j++) {
            let rowE = document.createElement("tr");

            let priceE = document.createElement('td');
            priceE.innerText = OB[i][j].price;

            let amountE = document.createElement('td');
            amountE.innerText = OB[i][j].amount;

            let removeE = document.createElement('td');
            removeE.classList.add("order-remove-invisible");
            removeE.innerText = "X";

            rowE.append(priceE)
            rowE.append(amountE)
            rowE.append(removeE)

            if (i == 0) $('#bid tbody').append(rowE);
            if (i == 1) $('#ask tbody').append(rowE);
        }
    }
}
*/

// Add new entry to local history
socket.on('historyInfo', (data) => {
    data.amount = round(data.amount);
    if (data.amount > 0) {

        let classSide = data.side == 0 ? 'color: rgb(255, 164, 164);' : 'color: rgb(164, 255, 164);';
        let time = new Date();
        let hours = (time.getHours() < 10 ? '0' : '') + time.getHours();
        let minutes = (time.getMinutes() < 10 ? '0' : '') + time.getMinutes();
        let seconds = (time.getSeconds() < 10 ? '0' : '') + time.getSeconds();

        let timeStamp = `${hours}:${minutes}:${seconds}`;
        let html = `<tr style="${classSide} font-size: 0.75em;"><td>${timeStamp}</td><td>${data.price}</td><td>${data.amount}</td></tr>`
        $(`#historyTbody tr:first`).after(html);

        var scrollLocker = document.querySelector('#history');
        scrollLocker.scrollTop = scrollLocker.scrollHeight - scrollLocker.clientHeight;
    }
})

//Order book ask side (price, amount):
//                       5       1
//                       4       1
//                       3       1
//
// If a user places a bid at $4 for 3 coins, that would result in
//      a market order of 2 coins and push the price upwards to $4
//      after that a 1 coin limit bid would be placed at $4
function limitAsMarket(amount, price, orderType) {
    let OBside = orderType == 0 ? 1 : 0;

    let amountBetween = 0; // How big the market-order is going to be
    let marketPrice = price;

    for (let i = 0; i < OB[OBside].length; i++) {
        if (OBside == 1 && OB[OBside][i].price > price)
            break;

        if (OBside == 0 && OB[OBside][i].price < price)
            break;


        marketPrice = OB[OBside][i].price;
        amountBetween += OB[OBside][i].amount;
    }

    // If we are gonna need a market order and a limit after that
    if (amount - amountBetween > 0) {

        // Market
        if (orderType == 0 && (marketPrice * amountBetween <= user.availableUSD) || orderType == 1 && amountBetween <= user.availableETH) {
            socket.emit('order', { task: 'marketOrder', amount: amountBetween, price: -1, user, orderType });
        }

        // Limit (bid or ask)
        if (orderType == 0 && (price * amount <= user.availableUSD))
            socket.emit('order', { task: 'addOrder', amount: amount - amountBetween, price, user, orderType });

        if (orderType == 1 && amount <= user.availableETH)
            socket.emit('order', { task: 'addOrder', amount: amount - amountBetween, price, user, orderType });
    }

    // If only a market order is needed
    if (amount - amountBetween <= 0)
        socket.emit('order', { task: 'marketOrder', amount, price: -1, user, orderType });
}


// Clicking an order-removal -button or the market-order checkbox 
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

// Find how much is there in the books on a specific price
function matchingPrices(side, price) {
    let children = $(`#${side} tbody`).children();
    for (let i = 1; i < children.length; i++) {
        if ($(children[i]).children()[0].innerText == price)
            return { index: i, amount: $(children[i]).children()[1].innerText };

    }
    return false;
}

// Goes through the order book and checks which prices the user has orders at
// All the prices that apply, get an x-button to make it possible to remove those orders
export function findOwnOrders() {
    let prices = [[], []];
    if (OB && user) {
        for (let i = 0; i < 2; i++)
            for (let j = 0; j < OB[i].length; j++)
                if (OB && user && OB[i][j].id == user.id && !prices[i].includes(OB[i][j].price))
                    prices[i].push(OB[i][j].price);

        let bookEles = [$($('#bid').children()[0]).children(), $($('#ask').children()[0]).children()]

        for (let i = 0; i < 2; i++)
            for (let j = 1; j < bookEles[i].length; j++) {

                let price = Number($(bookEles[i][j]).children()[0].innerText);
                if (prices[i].includes(price))
                    $($(bookEles[i][j]).children()[2]).removeClass('order-remove-invisible').addClass('order-remove-visible');
            }
    }
}

export async function receiveUserInfo(data) {
    user = data;

    user.id = user.userId
    user.availableUSD = user.balanceUSD - user.reservedUSD;
    user.availableETH = user.balanceETH - user.reservedETH;
}


// Add one entry to user's trading history
function addHistory(data) {
    data.amount = round(data.amount);
    if (data.amount > 0) {
        let classSide;
        classSide = data.side == 'ask' ? 'color: rgb(255, 164, 164);' : 'color: rgb(164, 255, 164);';

        let status = data.type == 'Limit' ? 'Untouched' : 'Filled';
        let filled = data.type == 'Limit' ? '-' : 'Market';


        let html = `<tr id="history-${data.historyId}" style="font-size: 0.55em;"><td>${data.timeStamp}</td><td>${data.price}</td><td>${filled}</td><td>${data.amount}</td><td style="${classSide}">${data.type}</td><td>${status}</td>`
        $(`#user-history tr:first`).after(html);
    }
}


function editLimitSideHistory(data) {

    $(`#history-${data.orderId}`).children()[5].innerText = data.orderStatus;
    $(`#history-${data.orderId}`).children()[2].innerText = data.filled;
}


function cancelInHistory(data) {
    for (let i = 0; i < data.orderIds.length; i++)
        $(`#history-${data.orderIds[i]}`).children()[5].innerText = 'Cancelled';

}

function round(num) {
    return Math.round(num * 10000000) / 10000000;
}

// Renders user's trading history
export function drawHistory(data) {

    data.forEach((e) => {
        let filled = '';
        if (e.type == 'Market')
            filled = 'Market'
        else
            filled = e.filled == 0 ? '-' : e.filled;

        let classSide = e.side == 'sell' ? 'color: rgb(255, 164, 164);' : 'color: rgb(164, 255, 164);';
        e.status = e.status.charAt(0).toUpperCase() + e.status.slice(1);
        e.type = e.type.charAt(0).toUpperCase() + e.type.slice(1);


        let html = `<tr id="history-${e.id}" style="font-size: 0.55em;"><td>${e.time}</td><td>${e.price}</td><td>${filled}</td><td>${e.amount}</td><td style="${classSide}">${e.type}</td><td>${e.status}</td>`;

        $(`#user-history tr:first`).after(html);
    })
}

