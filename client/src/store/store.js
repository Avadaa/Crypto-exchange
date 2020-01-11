import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex);

export default new Vuex.Store({
    strict: true,
    state: {
        user: {
            username: null,
            userId: null,
            address: null
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
        }

    },
    actions: {
        setToken({ commit }, token) {
            localStorage.setItem('token', token);
            commit('setToken', token);
        },
        getLocalToken({ commit }) {
            commit('setToken', localStorage.getItem('token'));
        },
        setUser({ commit }, User) {
            localStorage.setItem('userId', User.userId);
            localStorage.setItem('username', User.username);
            localStorage.setItem('address', User.address);

            commit('setUser', User);
        },
        getLocalUser({ commit }) {
            let localStorageUser = {
                username: localStorage.getItem('username'),
                userId: localStorage.getItem('userId'),
                address: localStorage.getItem('address'),
            }
            commit('setUser', localStorageUser);
        }
    },
    getters: {
        isUserLoggedIn: (state) => {
            return state.isUserLoggedIn;
        }
    }

})