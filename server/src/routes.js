const AuthenticationController = require('./controllers/AuthenticationController')

const AuthenticationControllerPolicy = require('./policies/AuthenticationControllerPolicy')


module.exports = (app) => {

    app.post('/register',
        AuthenticationControllerPolicy.register,
        AuthenticationController.register);


    app.post('/login', AuthenticationController.login);

    app.post('/api/user', AuthenticationController.user);

    app.post('/eth/withdraw',
        AuthenticationControllerPolicy.withdraw,
        AuthenticationController.withdraw);

    app.post('/eth/deposit', AuthenticationController.deposit);

    app.post('/api/user/deposithistory', AuthenticationController.depositHistory);
    app.post('/api/user/withdrawhistory', AuthenticationController.withdrawHistory);
    app.post('/api/obinfo', AuthenticationController.obInfo);


}