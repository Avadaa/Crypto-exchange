
<template>
  <div id="trade">
    <div id="inputs">
      <label for="amount">Amount</label>
      <input type="number" name="amount" v-model="amount" autocomplete="off" id="amount" />
      <br />
      <label for="price">Price</label>
      <input type="number" name="price" v-model="price" autocomplete="off" id="price" />
      <br />
      <label for="market">Market</label>
      <input type="checkbox" name="market" id="market-limit" v-model="market" autocomplete="off" />
      <br />

      <button v-on:click="order('buy');" id="buy">Buy</button>
      <button v-on:click="order('sell');" id="sell">Sell</button>
    </div>

    <div id="orderbooks">
      <div id="askDiv" class="sides">
        <table id="ask">
          <tbody>
            <tr>
              <th class="title">Price</th>
              <th class="title">Amount</th>
              <th class="title"></th>
            </tr>
          </tbody>
        </table>
      </div>
      <span id="price">123</span>
      <div id="bidDiv" class="sides">
        <table id="bid">
          <tbody>
            <tr>
              <th class="title">Price</th>
              <th class="title">Amount</th>
              <th class="title"></th>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import auth from "../../services/AuthenticationService.js";

export default {
  name: "Trade",
  components: {},
  data() {
    return {
      amount: "",
      price: "",
      market: false,
      trade: null,
      orderBook: []
    };
  },

  methods: {
    order(action) {
      let amount = Number(document.getElementById("amount").value);
      let price = Number(document.getElementById("price").value);
      let market = document.getElementById("market-limit").checked;

      this.trade.order(action, amount, price, market);
    }
  },

  async created() {
    this.trade = require("./trade");
    this.trade.receiveUserInfo(this.$store.state.user);
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

      &#market-limit {
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

    #askDiv {
      border: 2px solid rgb(255, 164, 164);
    }
    #bidDiv {
      border: 2px solid rgb(164, 255, 164);
    }

    table {
      overflow: auto;
      display: block;
      border: 1px solid #2f3d45;

      margin: 0px 0px 0px 20px;

      th {
        background: #2f3d45;
        font-weight: 200;
        padding: 5px 10px;
      }
    }

    .title {
      position: sticky;
      top: 0;
      background: rgb(82, 82, 82);
    }
  }
  .sides {
    height: 200px;
  }

  .order-remove-visible {
    -webkit-user-select: none; /* Safari */
    -moz-user-select: none; /* Firefox */
    -ms-user-select: none; /* IE10+/Edge */
    user-select: none; /* Standard */
    color: rgb(255, 142, 142);
    font-weight: 900;
  }

  .order-remove-invisible {
    display: none;
  }
}
</style>
