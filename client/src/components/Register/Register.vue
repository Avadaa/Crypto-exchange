
<template>
  <div id="register" @keyup.enter="register">
    <div id="form">
      <label for="username">Username</label>
      <input type="text" name="username" v-model="username" autocomplete="off" id="username" />
      <br />
      <br />
      <label for="password">Password</label>
      <input type="password" name="password" v-model="password" id="password" />
      <br />
      <br />
      <label for="password-retype">Retype password</label>
      <input type="password" name="password-retype" v-model="password_retype" id="password_retype" />
      <br />
      <br />
      <ul id="error-ul">
        <li v-for="error in errors">{{error}}</li>
      </ul>
      <button v-on:click="register();">Register</button>
    </div>
  </div>
</template>

<script>
import auth from "../../services/AuthenticationService.js";
import router from "../../router/index";

export default {
  name: "Register",
  components: {},
  data() {
    return {
      username: "",
      password: "",
      password_retype: "",

      errors: []
    };
  },

  methods: {
    async register() {
      const res = await auth.register({
        username: this.username,
        password: this.password,
        password_retype: this.password_retype
      });

      //Highlight inputs which contain errors
      if (res.data.errors.length > 0) {
        let errorList = res.data.errors;

        let names = ["username", "password", "password_retype"];
        for (let i = 0; i < names.length; i++) {
          let ele = document.getElementById(names[i]);

          let hasError = false;

          for (let j = 0; j < errorList.length; j++)
            if (errorList[j][1] == i) hasError = true;

          if (hasError)
            if (!ele.classList.contains("redBorder"))
              ele.classList.toggle("redBorder");

          if (!hasError)
            if (ele.classList.contains("redBorder"))
              ele.classList.toggle("redBorder");
        }

        for (let i = 0; i < errorList.length; i++)
          this.errors.push(errorList[i][0]);

        document.getElementById("error-ul").innerHTML = "";
      } else {
        this.$store.dispatch("setToken", res.data.token);
        this.$store.dispatch("setUser", res.data.user);
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
#register {
  display: flex;
  justify-content: space-around;
}

#form {
  font-size: 30px;
  color: white;
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
    width: 150px;
    background: rgb(78, 196, 78);
    border: 1px solid white;

    &:hover {
      border: 3px solid rgb(148, 250, 148);
    }
  }

  .redBorder {
    border: 2px solid rgb(253, 135, 135);
  }
}
</style>
