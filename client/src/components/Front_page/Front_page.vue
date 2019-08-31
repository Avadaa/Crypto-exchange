
<template>
  <div id="front_page-root">
    <login />
  </div>
</template>

<script>
import login from "./components/login.vue";

export default {
  name: "Front_page",
  components: {
    login
  }
};
</script>

<style scoped lang="scss">
body {
  background: #2f3d45;
}

#front_page-root {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  text-align: center;
  color: white;
  margin-top: -10px;
}
</style>

