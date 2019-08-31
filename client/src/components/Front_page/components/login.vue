<template>
  <div id="login">
    <div id="form">
      <label for="username">Username</label>
      <input type="text" name="username" v-model="username" autocomplete="off" />
      <br />
      <br />
      <label for="password">Password</label>
      <input type="password" name="password" v-model="password" @keyup.enter.native="login" />
      <br />
      <br />
      <ul id="error-ul">
        <li v-if="error.length > 0">{{error}}</li>
      </ul>
      <button v-on:click="login();" id="login-button">Log in</button>
    </div>
  </div>
</template>

<script>
import auth from "../../../services/AuthenticationService.js";
import router from "../../../router/index";

export default {
  name: "login",
  components: {},
  data() {
    return {
      username: "",
      password: "",
      error: []
    };
  },

  created: function() {},

  methods: {
    async login() {
      const res = await auth.login({
        username: this.username,
        password: this.password
      });
      console.log(res.data);

      if (res.data.errors.length > 0) this.error = res.data.errors[0];
      else {
        this.$store.dispatch("setToken", res.data.token);
        this.$store.dispatch("setUser", res.data.user);
        router.push("trade");
      }
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

  li {
    list-style: none;
    color: rgb(255, 196, 196);
  }
  button {
    font-size: 30px;
    color: rgb(255, 255, 255);

    height: 50px;
    width: 100px;
    background: rgb(78, 196, 78);
    border: 1px solid white;

    &:hover {
      border: 3px solid rgb(148, 250, 148);
    }
  }
}
</style>
