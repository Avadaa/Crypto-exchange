import Vue from 'vue'
import Router from 'vue-router'
import Front_page from '@/components/Front_page/Front_page.vue'
import Register from '@/components/Register/Register.vue'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Front_page',
      component: Front_page
    },
    {
      path: '/register',
      name: 'Register',
      component: Register
    },
  ]
})
