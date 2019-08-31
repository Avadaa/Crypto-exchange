
<template>
  <div id="register">
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
      <button
        v-on:click="register();"
        @mouseenter="e => e.target.classList.toggle('largerBorder')"
        @mouseleave="e => e.target.classList.toggle('largerBorder')"
      >Log in</button>
    </div>
  </div>
</template>

<script>
import auth from "../../services/AuthenticationService.js";

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

      let errorList = res.data.errors;

      // Marking error-field borders as red.
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
    }
  }
};
</script>

<style scoped lang="scss">
#register {
  display: flex;
  justify-content: space-around;
  min-width: 800px;
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
    width: 100px;
    background: rgb(78, 196, 78);
    border: 1px solid white;
  }

  .largerBorder {
    border: 3px solid rgb(148, 250, 148);
  }

  .redBorder {
    border: 2px solid rgb(255, 66, 66);
  }
}
</style>
