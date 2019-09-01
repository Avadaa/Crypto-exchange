import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex);

export default new Vuex.Store({
    strict: true,
    state: {
        user: {
            username: null,
            userId: null,
            address: null,
            balanceETH: null,
            balanceUSD: null,
            reservedETH: null,
            reservedUSD: null,
        },
        token: null,
        isUserLoggedIn: false
    },
    mutations: {
        setToken(state, token) {
            state.token = token;
            if (token) {
                state.isUserLoggedIn = true;
            } else {
                state.isUserLoggedIn = false;
            }
        },
        setUser(state, user) {

            state.user.username = user.username;
            state.user.userId = user.userId;
            state.user.address = user.address;
            state.user.balanceETH = user.balanceETH,
                state.user.balanceUSD = user.balanceUSD,
                state.user.reservedETH = user.reservedETH,
                state.user.reservedUSD = user.reservedUSD
        },
        setBalance(state, balance) {
            state.user.balanceETH = balance.balanceETH,
                state.user.balanceUSD = balance.balanceUSD,
                state.user.reservedETH = balance.reservedETH,
                state.user.reservedUSD = balance.reservedUSD
        }

    },
    actions: {
        // Store token information to browser storage and to state variable
        setToken({ commit }, token) {
            localStorage.setItem('token', token);
            commit('setToken', token);
        },
        // Load token from browser storage to state variable
        getLocalToken({ commit }) {
            commit('setToken', localStorage.getItem('token'));
        },
        // Store user information to browser storage and to state variable
        setUser({ commit }, User) {
            localStorage.setItem('userId', User.userId);
            localStorage.setItem('username', User.username);
            localStorage.setItem('address', User.address);
            localStorage.setItem('balanceETH', User.balanceETH);
            localStorage.setItem('balanceUSD', User.balanceUSD);
            localStorage.setItem('reservedETH', User.reservedETH);
            localStorage.setItem('reservedUSD', User.reservedUSD);

            commit('setUser', User);
        },
        setBalance({ commit }, localStorageUser) {
            localStorage.setItem('balanceETH', localStorageUser.balanceETH);
            localStorage.setItem('balanceUSD', localStorageUser.balanceUSD);
            localStorage.setItem('reservedETH', localStorageUser.reservedETH);
            localStorage.setItem('reservedUSD', localStorageUser.reservedUSD);

            commit('setBalance', localStorageUser);
        },
        // Fetch user information from browser's storage and store it to state variable
        getLocalUser({ commit }) {
            let localStorageUser = {
                username: localStorage.getItem('username'),
                userId: localStorage.getItem('userId'),
                address: localStorage.getItem('address'),
                balanceETH: localStorage.getItem('balanceETH'),
                balanceUSD: localStorage.getItem('balanceUSD'),
                reservedETH: localStorage.getItem('reservedETH'),
                reservedUSD: localStorage.getItem('reservedUSD')
            }
            commit('setUser', localStorageUser);
        }
        /*
        getLocalBalance({ commit }) {
            let localStorageBalance = {
                balanceETH: localStorage.getItem('balanceETH'),
                balanceUSD: localStorage.getItem('balanceUSD'),
                reservedETH: localStorage.getItem('reservedETH'),
                reservedUSD: localStorage.getItem('reservedUSD')
            }
            commit('setBalance', localStorageBalance);
        }
        */
    },
    getters: {
        // Get logged state
        isUserLoggedIn: (state) => {
            return state.isUserLoggedIn;
        }
    }

})