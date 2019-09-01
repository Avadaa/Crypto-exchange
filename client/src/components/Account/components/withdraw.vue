<template>
  <div id="withdraw">
    <div id="withdraw-input">
      <div>
        <p>Available funds to withdraw: {{this.$store.state.user.balanceETH - this.$store.state.user.reservedETH}} ETH</p>
        <label for="address">Address</label>
        <input type="text" name="address" v-model="address" autocomplete="off" />
        <br />
        <label for="amount">Amount</label>
        <input type="text" name="amount" v-model="amount" autocomplete="off" />
        <br />
        <button v-on:click="withdraw();">Withdraw</button>
      </div>
    </div>
    <div id="withdraw-list">
      <p>Withdraw history:</p>
      <ul></ul>
    </div>
  </div>
</template>

<script>
export default {
  name: "withdraw",
  components: {},
  data() {
    return {
      address: null,
      amount: null
    };
  },

  methods: {},
  async created() {}
};
</script>

<style scoped lang="scss">
#withdraw {
  display: none;
  justify-content: space-around;

  #withdraw-input {
    width: 500px;
    margin-left: -50px;
  }

  #withdraw-list {
    width: 300px;
    p {
      margin-left: -65px;
    }
  }
  p,
  label {
    font-size: 20px;
  }

  label {
    margin-right: 10px;
    float: left;
    width: 150px;
  }
  input {
    border-radius: 5px;
    border: 0;
    font-size: 20px;
    float: left;
    margin-bottom: 15px;

    padding: 5px;
  }
  button {
    font-size: 30px;
    color: rgb(255, 255, 255);

    margin-top: 20px;
    height: 50px;
    width: 150px;

    background: rgb(78, 196, 78);
    border: 1px solid white;
  }
}
</style>
