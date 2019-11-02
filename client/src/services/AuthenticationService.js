import Api from '@/services/Api'

export default {
    register(credentials) {
        return Api().post('register', credentials);
    },
    login(credentials) {
        return Api().post('login', credentials);

    },
    user(userId) {
        return Api().post('api/user', userId);
    },
    withdraw(withdrawInfo) {
        return Api().post('eth/withdraw', withdrawInfo);
    },
    deposit(userId) {
        return Api().post('eth/deposit', userId);
    },
    depositHistory(userId) {
        return Api().post('api/user/deposithistory', userId);
    },
    withdrawHistory(userId) {
        return Api().post('api/user/withdrawhistory', userId);
    },
    obInfo() {
        return Api().post('api/obinfo');
    },
    uploadAvatar(avatarInfo) {
        return Api().post('upload/avatar', avatarInfo);
    },
    getAvatar(userId) {
        return Api().post('api/avatar', userId);
    },
    history(userId) {
        return Api().post('api/user/history', userId);
    },
    changeName(userInfo) {
        return Api().post('api/user/changename', userInfo);
    },
    changePw(userInfo) {
        return Api().post('api/user/changepw', userInfo);
    }

}
