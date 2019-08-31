<template>
  <div id="top">
    <div style="display: flex; align-items: center;">
      <img src="../pics/logo.png" height="50" width="50" /> EzGains Exchange
    </div>

    <p>
      <router-link to="trade">
        <p>asd</p>
      </router-link>
    </p>

    <div id="buttons">
      <div id="register">
        <router-link to="register">
          <button>Create Account</button>
        </router-link>
      </div>

      <div id="login">
        <router-link to="/">
          <button>Log in</button>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "top",
  components: {},
  data() {
    return {};
  },

  created: function() {},

  methods: {}
};
</script>

<style scoped lang="scss">
#top {
  background: #293841;
  color: white;
  min-width: 700px;

  display: flex;
  justify-content: space-around;
  align-items: center;

  img {
    margin-right: 10px;
  }

  a {
    text-decoration: none;
    color: inherit;
  }

  #buttons {
    display: flex;
    justify-content: space-around;
    width: 450px;

    button {
      font-size: 20px;
      color: rgb(255, 255, 255);

      height: 50px;
      width: 200px;
      background: rgb(78, 196, 78);
      border: 1px solid white;

      &:hover {
        border: 3px solid rgb(148, 250, 148);
      }
    }
  }
}
</style>
