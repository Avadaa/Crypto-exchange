const Register = require('../pages/register.js')
const Login = require('../pages/login.js')
const db = require('../dbQueries');



module.exports = {
    register(req, res) {
        const { userId } = req.session;


        console.log(req.session)


        Register.register(req);
    },

    login(req, res) {

        const { userId } = req.session;


        Login.login(req, res);



    }


}