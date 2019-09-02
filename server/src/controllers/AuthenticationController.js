const Register = require('../pages/register.js')
const Login = require('../pages/login.js')
const db = require('../dbQueries');
const ethereum = require('../Ethereum/ethereum')




module.exports = {
    register(req, res) {
        Register.register(req, res);
    },

    login(req, res) {
        Login.login(req, res)
    },

    async user(req, res) {
        let userInfoQuery = `SELECT * FROM users WHERE id = '${req.body.userId}'`
        let userWalletInfo = await db.query(userInfoQuery)

        res.send({
            balanceETH: userWalletInfo[0].balanceETH,
            balanceUSD: userWalletInfo[0].balanceUSD,
            reservedETH: userWalletInfo[0].reservedETH,
            reservedUSD: userWalletInfo[0].reservedUSD,
        })
    },

    async withdraw(req, res) {
        console.log('asd')


        let error = await ethereum.sendCustomAddress(
            req.body.userId,
            req.body.address,
            req.body.amount
        );

        if (error)
            res.send({
                messages: [error],
                success: false
            })
        else {

            // Quick workaround for await not actually waiting for the new balance when withdrawing
            setTimeout(async () => {
                let userInfoQuery = `SELECT * FROM users WHERE id = '${req.body.userId}'`;
                let userInfo = await db.query(userInfoQuery);

                res.send({
                    messages: [`Withdraw processed. Amount: ${req.body.amount}`],
                    success: true,
                    balanceETH: userInfo[0].balanceETH,
                    balanceUSD: userInfo[0].balanceUSD,
                    reservedETH: userInfo[0].reservedETH,
                    reservedUSD: userInfo[0].reservedUSD,
                })

            }, 1000);


        }



    }
}