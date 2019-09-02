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
    }
}
