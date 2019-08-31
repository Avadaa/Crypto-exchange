<template>
  <div id="app">
    <Top />
    <router-view />
  </div>
</template>

<script>
import Top from "./components/Top.vue";

export default {
  name: "App",
  components: {
    Top
  },
  methods: {}
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

input:focus {
  outline: none !important;
}
button:focus {
  outline: 0 !important;
}
</style>
