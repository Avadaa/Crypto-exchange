const Register = require('../pages/register.js')
const Login = require('../pages/login.js')
const db = require('../dbQueries');




module.exports = {
    async register(req, res) {
        Register.register(req, res);
    },

    async login(req, res) {
        Login.login(req, res)
    }
}