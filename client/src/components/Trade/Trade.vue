
<template>
  <div id="trade">
    <div id="inputs">
      <label for="amount">Amount</label>
      <input type="number" name="amount" v-model="amount" autocomplete="off" />
      <br />
      <label for="price">Price</label>
      <input type="number" name="price" v-model="amount" autocomplete="off" />
      <br />
      <label for="market">Market</label>
      <input type="checkbox" name="market" id="market" v-model="market" autocomplete="off" />
      <br />

      <button v-on:click="order();" id="buy">Buy</button>
      <button v-on:click="order();" id="sell">Sell</button>
    </div>

    <div id="orderbooks">
      <div id="ask" class="sides"></div>
      <span id="price">123</span>
      <div id="bid" class="sides"></div>
    </div>
  </div>
</template>

<script>
import auth from "../../services/AuthenticationService.js";
let trade = require("./trade");

export default {
  name: "Trade",
  components: {},
  data() {
    return {
      amount: "",
      price: "",
      market: false
    };
  },

  methods: {
    order() {
      trade.asd();
    }
  }
};
</script>

<style scoped lang="scss">
#trade {
  display: flex;
  //justify-content: space-around;

  text-align: left;
  font-size: 30px;
  color: white;

  #inputs {
    margin-left: 60px;
    margin-top: 20px;
    min-width: 300px;

    label {
      margin-right: 10px;
      margin-top: -4px;
      float: left;
      width: 110px;
    }

    input {
      border-radius: 5px;
      border: 0;
      float: left;

      padding: 5px;

      &#market {
        transform: scale(2);
        margin: 8px;
        margin-left: 5px;
        color: white;
        background: white;
      }
    }
    button {
      font-size: 30px;
      color: rgb(255, 255, 255);

      height: 50px;
      width: 130px;

      background: rgb(78, 196, 78);
      border: 1px solid white;
      border-radius: 5px;

      &#sell {
        margin-left: 30px;
        background: rgb(255, 100, 100);
      }

      &:hover {
        border: 2px solid white;
      }
    }
  }

  #orderbooks {
    width: 500px;
    border: 2px solid white;
    margin-left: 100px;
    margin-top: 20px;
    text-align: center;

    #ask {
      border: 2px solid rgb(255, 164, 164);
    }
    #bid {
      border: 2px solid rgb(164, 255, 164);
    }
  }
  .sides {
    height: 200px;
  }
}
</style>
