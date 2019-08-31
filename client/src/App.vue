<template>
  <div id="app">
    <Top />
    <p v-on:click="asd">asd</p>

    <router-view />
  </div>
</template>

<script>
import auth from "./services/AuthenticationService.js";
import Top from "./components/Top.vue";

export default {
  name: "App",
  components: {
    Top
  },
  methods: {
    asd: function() {
      auth.register({
        email: "2test",
        password: "hunter"
      });
    }
  }
};
</script>

<style lang="scss">
#top {
  height: 80px;
  margin-bottom: 50px;
}

body {
  background: #2f3d45;
}

#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  margin-top: -10px;
}
</style>
