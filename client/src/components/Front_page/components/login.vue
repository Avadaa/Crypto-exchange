<template>
  <div id="login">
    <div id="form">
      <label for="username">Username</label>
      <input type="text" name="username" v-model="username" autocomplete="off" />
      <br />
      <br />
      <label for="password">Password</label>
      <input type="password" name="password" v-model="password" />
      <br />
      <br />
      <button
        v-on:click="login();"
        @mouseenter="e => e.target.classList.toggle('largerBorder')"
        @mouseleave="e => e.target.classList.toggle('largerBorder')"
      >Log in</button>
    </div>
  </div>
</template>

<script>
import auth from "../../../services/AuthenticationService.js";

export default {
  name: "login",
  components: {},
  data() {
    return {
      username: "",
      password: ""
    };
  },

  created: function() {},

  methods: {
    async login() {
      const res = await auth.login({
        username: this.username,
        password: this.password
      });
    }
  }
};
</script>

<style scoped lang="scss">
#login {
  display: flex;
  justify-content: space-around;
  min-width: 800px;
}

#form {
  font-size: 30px;
  width: 800px;

  label {
    margin-right: 10px;
    float: left;
    width: 250px;
  }
  input {
    border-radius: 5px;
    border: 0;
    font-size: 30px;
    float: left;

    padding: 5px;
  }
  button {
    font-size: 30px;
    color: rgb(255, 255, 255);

    height: 50px;
    width: 100px;
    background: rgb(78, 196, 78);
    border: 1px solid white;
  }
  .largerBorder {
    border: 3px solid rgb(148, 250, 148);
  }
}
</style>
