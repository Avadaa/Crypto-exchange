const Register = require('../pages/register.js')
const Login = require('../pages/login.js')
const db = require('../dbQueries');




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
    }
}