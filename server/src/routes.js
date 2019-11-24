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
    app.post('/upload/avatar', AuthenticationController.uploadAvatar);
    app.post('/api/avatar', AuthenticationController.getAvatar);
    app.post('/api/user/history', AuthenticationController.getHistory);
    app.post('/api/user/changename', AuthenticationController.changeName);
    app.post('/api/user/changepw', AuthenticationControllerPolicy.changePw,
        AuthenticationController.changePw);
    app.post('/api/user/checktoken', AuthenticationController.checkToken);
    app.post('/api/user/twofastate', AuthenticationController.twoFaState);
    app.post('/api/user/twofaqr', AuthenticationController.twoFaQR);
    app.post('/api/user/checktwofa', AuthenticationController.checkTwoFa);
    app.post('/api/user/disabletwofa', AuthenticationController.disableTwoFa);

}