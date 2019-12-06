const nodeEth = require('node-eth-address');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/v3/0d86b1f81dba4e6c999d80d8ae860ec0"));
const db = require('../dbQueries');
const Tx = require('ethereumjs-tx');

const ethConfig = require('../../config/ethereum');

let USDTtoken = "0xdac17f958d2ee523a2206206994597c13d831ec7";
const coldWalletAddress = '0x18dbB4B44a5a65eeABf44372C22c4cc708dfb16F';

function round(num) {
    return Math.round(num * 10000000) / 10000000;
}

module.exports = {

    getAddress: (pw) => {
        return nodeEth.getDefaultAddress(pw);
    },

    getBalanceETH: async (address) => {
        let balance
        await web3.eth.getBalance(address).then(res => {
            balance = web3.utils.fromWei(res, 'ether');
        })
        return balance;
    },

    getBalanceUSDT: async (address) => {
        let minABI = [
            {
                "constant": true,
                "inputs": [{ "name": "_owner", "type": "address" }],
                "name": "balanceOf",
                "outputs": [{ "name": "balance", "type": "uint256" }],
                "type": "function"
            },
            {
                "constant": true,
                "inputs": [],
                "name": "decimals",
                "outputs": [{ "name": "", "type": "uint8" }],
                "type": "function"
            }
        ];
        let contract = new web3.eth.Contract(minABI, USDTtoken);
        let balance;
        await contract.methods.balanceOf(address).call().then(res => {
            balance = res / 1000000;
        })
        return balance;


    },

    sendToColdWalletUSDT: async (userId, fromPk, fromAddress, balance) => {
        // To deal with pending transactions, only allow a deposit every two minutes.
        // Deposit hash and TIME is inserted into a database table, and the timestamp is fetched every time the function is called.
        let deposits = await db.query(`SELECT * FROM deposits WHERE "userId" = '${userId}'`);
        let cooldownPlusOne = ethConfig.cooldown + 1;
        let timeDifference = deposits.length > 0 ? new Date() - Date.parse(deposits[deposits.length - 1].date) : cooldownPlusOne;


        if (timeDifference > ethConfig.cooldown) {

            let gasLimit = ethConfig.gasLimit;
            let pk = Buffer.from(fromPk.slice(2, fromPk.length), 'hex');
            let amount = balance * 1e6;

            let contractABI = [
                {
                    'constant': false,
                    'inputs': [
                        {
                            'name': '_to',
                            'type': 'address'
                        },
                        {
                            'name': '_value',
                            'type': 'uint256'
                        }
                    ],
                    'name': 'transfer',
                    'outputs': [
                        {
                            'name': '',
                            'type': 'bool'
                        }
                    ],
                    'type': 'function'
                }
            ]

            let contract = new web3.eth.Contract(contractABI, USDTtoken, { from: fromAddress })
            amount = web3.utils.toHex(amount)

            web3.eth.getTransactionCount(fromAddress)
                .then((count) => {
                    let rawTx = {
                        'from': fromAddress,
                        'gasPrice': web3.utils.toHex(ethConfig.gwei * 1e9),
                        'gasLimit': web3.utils.toHex(gasLimit),
                        'to': USDTtoken,
                        'value': 0x0,
                        'data': contract.methods.transfer(coldWalletAddress, amount).encodeABI(),
                        'nonce': web3.utils.toHex(count)
                    }
                    try {
                        let tx = new Tx.Transaction(rawTx);
                        tx.sign(pk)
                        web3.eth.sendSignedTransaction('0x' + tx.serialize().toString('hex'), async (err, hash) => {
                            if (!err) {

                                let updateBalanceQuery = `UPDATE users SET "balanceUSD" = "balanceUSD" + ${balance} WHERE "id" = ${userId}`;

                                db.query(updateBalanceQuery);

                                console.log('User ' + userId + ' has deposited ' + balance + ' USD');

                                await db.query(`INSERT INTO deposits("userId", "hash", "date", "amount", "currency") VALUES('${userId}', '${hash}', '${new Date}', ${parseInt(amount, 16) / 1000000}, 'USD')`);
                                return true;


                            }
                            else {
                                console.log(err)
                                return err;
                            }
                        })
                    }
                    catch (error) {
                        console.log("An error occured during a deposit: " + error);
                        return error;
                    }

                })

        }

    },


    sendCustomAddressETH: async (userId, toAddress, amount) => {
        // To deal with pending transactions, only allow a withdraws every two minutes.
        // Withdraw hash and TIME is inserted into a database table, and the timestamp is fetched every time the function is called.
        let withdraws = await db.query(`SELECT * FROM withdraws WHERE "userId" = '${userId}'`);
        let cooldownPlusOne = ethConfig.cooldown + 1;
        let timeDifference = withdraws.length > 0 ? new Date() - Date.parse(withdraws[withdraws.length - 1].date) : cooldownPlusOne;

        if (timeDifference > ethConfig.cooldown) {

            let pkQuery = "SELECT * FROM coldwallet";
            let coldWalletPk = (await db.query(pkQuery))[0].pk;

            let amountWei = web3.utils.toWei(amount, 'ether');
            let gasLimit = ethConfig.gasLimit;
            let gWei = ethConfig.gwei;
            let pk = Buffer.from(coldWalletPk.slice(2, coldWalletPk.length), 'hex');

            web3.eth.getTransactionCount(coldWalletAddress)
                .then((count) => {
                    let rawTx = {
                        'from': coldWalletAddress,
                        'gasPrice': web3.utils.toHex(ethConfig.gwei * 1e9),
                        'gasLimit': web3.utils.toHex(gasLimit),
                        'to': toAddress,
                        'value': web3.utils.toHex(amountWei),
                        'data': '0x7f7465737432000000000000000000000000000000000000000000000000000000600057',
                        'nonce': web3.utils.toHex(count)
                    }
                    try {
                        let tx = new Tx.Transaction(rawTx);
                        tx.sign(pk)
                        web3.eth.sendSignedTransaction('0x' + tx.serialize().toString('hex'), async (err, hash) => {
                            if (!err) {

                                let updateBalanceQuery = `UPDATE users SET "balanceETH" = "balanceETH" - ${round(amount)} WHERE "id" = ${userId}`;
                                await db.query(updateBalanceQuery);

                                console.log('User ' + userId + ' has withdrawn ' + amount + ' ETH');

                                await db.query(`INSERT INTO withdraws("userId", "hash", "date", "amount", "currency") VALUES('${userId}', '${hash}', '${new Date}', ${round(amount)}, 'ETH')`);

                                return null;
                            }
                            else {
                                console.log(err)
                                return 'An error has occured. Please verify your inputs.';

                            }
                        })
                    }
                    catch (error) {
                        console.log("An error occured during a deposit: " + error);
                        return error;
                    }

                })

        }
        else
            return 'You can request a withdrawal every two minutes. Please wait before sending a new request.';
    },

    sendToColdWalletETH: async (userId, fromPk, fromAddress, balance) => {

        // To deal with pending transactions, only allow a deposit every two minutes.
        // Deposit hash and TIME is inserted into a database table, and the timestamp is fetched every time the function is called.
        let deposits = await db.query(`SELECT * FROM deposits WHERE "userId" = '${userId}'`);
        let cooldownPlusOne = ethConfig.cooldown + 1;
        let timeDifference = deposits.length > 0 ? new Date() - Date.parse(deposits[deposits.length - 1].date) : cooldownPlusOne;

        if (timeDifference > ethConfig.cooldown) {

            let balanceWei = web3.utils.toWei((balance).toString(), 'ether');
            let gasLimit = ethConfig.gasLimit;
            let gWei = ethConfig.gwei;
            let pk = Buffer.from(fromPk.slice(2, fromPk.length), 'hex');

            web3.eth.getTransactionCount(fromAddress)
                .then((count) => {
                    let rawTx = {
                        'from': fromAddress,
                        'gasPrice': web3.utils.toHex(ethConfig.gwei * 1e9),
                        'gasLimit': web3.utils.toHex(gasLimit),
                        'to': coldWalletAddress,
                        'value': web3.utils.toHex(balanceWei),
                        'data': '0x7f7465737432000000000000000000000000000000000000000000000000000000600057',
                        'nonce': web3.utils.toHex(count)
                    }
                    try {
                        let tx = new Tx.Transaction(rawTx);
                        tx.sign(pk)
                        web3.eth.sendSignedTransaction('0x' + tx.serialize().toString('hex'), async (err, hash) => {
                            if (!err) {

                                //let amount = web3.utils.fromWei((balanceWei - gasLimit * web3.utils.toWei(gWei.toString(), 'gwei')).toString(), 'ether');
                                let amount = balance;
                                let updateBalanceQuery = `UPDATE users SET "balanceETH" = "balanceETH" + ${amount} WHERE "id" = ${userId}`;
                                db.query(updateBalanceQuery);

                                console.log('User ' + userId + ' has deposited ' + amount + ' ETH');

                                await db.query(`INSERT INTO deposits("userId", "hash", "date", "amount", "currency") VALUES('${userId}', '${hash}', '${new Date}', ${amount}, 'ETH')`);

                                return true;
                            }
                            else {
                                console.log(err)
                                return err;
                            }
                        });
                    }
                    catch (error) {
                        console.log("An error occured during a deposit: " + error);
                        return error;
                    }
                })


        }
    }
};