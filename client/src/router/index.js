import Vue from 'vue'
import Router from 'vue-router'
import Front_page from '@/components/Front_page/Front_page.vue'
import Register from '@/components/Register/Register.vue'
import Trade from '@/components/Trade/Trade.vue'
import Account from '@/components/Account/Account.vue'

const store = require('../store/store');

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Front_page',
      component: Front_page,
      beforeEnter(to, from, next) {
        let logged = store.default.getters.isUserLoggedIn;
        if (logged) {
          next('trade')
        }
        else {
          next()
        }
      }
    },
    {
      path: '/register',
      name: 'Register',
      component: Register,
      beforeEnter(to, from, next) {
        let logged = store.default.getters.isUserLoggedIn;
        if (logged) {
          next('trade')
        }
        else {
          next()
        }
      }
    },
    {
      path: '/trade',
      name: 'Trade',
      component: Trade,
      beforeEnter(to, from, next) {
        let logged = store.default.getters.isUserLoggedIn;
        if (!logged) {
          next('/')
        }
        else {
          next()
        }
      }
    },

    {
      path: '/account',
      name: 'Account',
      component: Account,
      beforeEnter(to, from, next) {
        let logged = store.default.getters.isUserLoggedIn;
        if (!logged) {
          next('/')
        }
        else {
          next()
        }
      }
    }

  ]
})
