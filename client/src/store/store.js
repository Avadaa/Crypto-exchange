import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex);

export default new Vuex.Store({
    strict: true,
    state: {
        token: null,
        user: null,
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
            state.user = user;
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
            localStorage.setItem('user', User);

            commit('setUser', User);
        },
        getLocalUser({ commit }) {
            commit('setUser', localStorage.getItem('user'));

        }
    },
    getters: {
        isUserLoggedIn: (state) => {
            return state.isUserLoggedIn;
        }
    }

})