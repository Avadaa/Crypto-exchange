<template>
  <div id="login" @keyup.enter="login">
    <div id="login-area">
      <div id="form">
        <label for="username">Username</label>
        <input type="text" name="username" v-model="username" autocomplete="off" />
        <br />
        <br />
        <label for="password">Password</label>
        <input type="password" name="password" v-model="password" />
        <br />
        <br />
        <label for="twoFaCode">
          Authentication
          <br />(if enabled)
        </label>
        <input type="text" name="twoFaCode" v-model="twoFaCode" />
        <br />
        <br />
        <ul id="error-ul">
          <li v-if="error.length > 0">{{error}}</li>
        </ul>
        <button v-on:click="login();" id="login-button">Log in</button>
      </div>
    </div>
    <div id="legal-info">
      EVEN THOUGH THE SITE CAN HANDLE REAL WORLD MONEY, IT IS NOT MEANT FOR REAL CUSTOMERS. THE PROJECT IS MADE FOR EDUCATIONAL PURPOSES, AND SHOULD
      <u>NEVER</u> BE USED FOR ACTUAL TRADING
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
      twoFaCode: "",
      error: []
    };
  },

  methods: {
    async login() {
      const res = await auth.login({
        username: this.username,
        password: this.password,
        twoFaCode: this.twoFaCode
      });

      if (res.data.errors.length > 0) this.error = res.data.errors[0];
      else {
        this.$store.dispatch("setToken", res.data.token);
        this.$store.dispatch("setUser", res.data.user);

        let avatarGet = await auth.getAvatar({
          userId: this.$store.state.user.userId
        });
        if (avatarGet.data[0].avatar != null) {
          document.getElementById("avatar-img").src = avatarGet.data[0].avatar;
          localStorage.setItem("avatar", avatarGet.data[0].avatar);
        }

        router.push("trade");
      }
    }
  },

  created() {
    if (
      this.$store.state.isUserLoggedIn &&
      this.$store.state.user.userId != null
    ) {
      router.push("trade");
    }
  }
};
</script>

<style scoped lang="scss">
#login-area {
  display: flex;
  justify-content: space-around;
}

#legal-info {
  margin-top: 100px;
  color: rgb(255, 196, 196);
  width: 400px;
  position: relative;
  left: calc(50vw - 200px);
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
