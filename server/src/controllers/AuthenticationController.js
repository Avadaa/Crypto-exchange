const Register = require('../pages/register.js')



module.exports = {
    register(req, res) {
        console.log('reg post')


        try {
            Register.register(req);

        }
        catch (e) {

        }
    },

    login(req, res) {
        console.log('logina post')
        res.send({
            msg: `${req.body.email}`
        })
    }

}