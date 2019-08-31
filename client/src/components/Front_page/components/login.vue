<template>
  <div>
    <form method="post" action="/">
      <label for="username">Username</label>
      <input type="text" name="username" />
      <br />
      <br />
      <label for="password">Password</label>
      <input type="password" name="password" />
      <br />
      <br />
      <button
        type="submit"
        v-on:click="this.form.submit(); this.disabled=true; this.value='Sending...';"
        @mouseenter="e => e.target.classList.toggle('largerBorder')"
        @mouseleave="e => e.target.classList.toggle('largerBorder')"
      >Log in</button>
    </form>
  </div>
</template>

<script>
export default {
  name: "login",
  components: {},
  data() {
    return {
      //orders: Array,
      //errors: []
    };
  },

  created: function() {},

  methods: {}
};
</script>

<style scoped lang="scss">
form {
  font-size: 30px;

  label {
    margin-right: 10px;
  }
  input {
    border-radius: 5px;
    border: 0;
    font-size: 30px;

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
}

.largerBorder {
  border: 3px solid rgb(148, 250, 148);
}
</style>
