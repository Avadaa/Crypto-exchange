<template>
  <div id="withdraw">
    <div id="withdraw-input">
      <div>
        <p>Available funds: {{this.$store.state.user.balanceETH - this.$store.state.user.reservedETH}} ETH</p>
        <label for="address">Address</label>
        <input type="text" name="address" v-model="address" autocomplete="off" />
        <br />
        <label for="amount">Amount</label>
        <input type="number" name="amount" v-model="amount" autocomplete="off" />
        <br />
        <ul id="msg-ul">
          <li v-for="message in messages">{{message}}</li>
        </ul>
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
import auth from "../../../services/AuthenticationService";

export default {
  name: "withdraw",
  components: {},
  data() {
    return {
      amount: "",
      address: "",
      messages: []
    };
  },

  methods: {
    async withdraw() {
      const res = await auth.withdraw({
        userId: this.$store.state.user.userId,
        amount: this.amount,
        address: this.address
      });
      //document.getElementById("msg-ul").innerHTML = "";
      document.getElementById("msg-ul").style.color = "rgb(255, 196, 196)";

      this.messages = res.data.messages;

      if (res.data.success) {
        document.getElementById("msg-ul").style.color = "rgb(182, 255, 188)";

        delete res.data["success"];
        delete res.data["messages"];
        this.$store.dispatch("setBalance", res.data);
      }
    }
  },
  async created() {}
};
</script>

<style scoped lang="scss">
#withdraw {
  display: none;
  justify-content: space-around;
  height: 350px;

  #withdraw-input {
    width: 500px;
    margin-left: -50px;

    ul {
      margin-top: 60px;
      color: rgb(255, 196, 196);

      li {
        list-style: none;
      }
    }
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
