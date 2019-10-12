
<template>
  <div id="trade">
    <div>
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
              <tr v-for="(line) in orderBook[1]">
                <td>{{line.price}}</td>
                <td>{{Math.round(line.amount * 10000000) / 10000000}}</td>

                <td class="order-remove-invisible">X</td>
              </tr>
            </tbody>
          </table>
        </div>
        <span id="currentPrice">0</span>
        <div id="bidDiv" class="sides">
          <table id="bid">
            <tbody>
              <tr>
                <th class="title">Price</th>
                <th class="title">Amount</th>
                <th class="title"></th>
              </tr>
              <tr v-for="(line) in orderBook[0]">
                <td>{{line.price}}</td>
                <td>{{Math.round(line.amount * 10000000) / 10000000}}</td>
                <td class="order-remove-invisible">X</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div id="localHistory">
        <table>
          <tbody id="historyTbody">
            <tr>
              <th class="title">Time</th>
              <th class="title">Price</th>
              <th class="title">Amount</th>
            </tr>
            <tr></tr>
          </tbody>
        </table>
      </div>
    </div>
    <history />
  </div>
</template>

<script>
import auth from "../../services/AuthenticationService.js";
import { renderOrderBook, findOwnOrders } from "./trade";
import history from "./components/History.vue";

export default {
  name: "Trade",
  components: { history },
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
      let amount =
        Math.round(Number(document.getElementById("amount").value) * 10000000) /
        10000000;
      let price =
        Math.round(Number(document.getElementById("price").value) * 100) / 100;
      let market = document.getElementById("market-limit").checked;

      this.trade.order(action, amount, price, market);
    }
  },

  async created() {
    this.trade = require("./trade");

    let userWallets = await auth.user({
      userId: this.$store.state.user.userId,
      username: this.$store.state.user.username
    });
    userWallets = userWallets.data.balance;

    let user = this.$store.state.user;
    user = {
      address: user.address,
      userId: user.userId,
      username: user.username,
      balanceUSD: userWallets.balanceUSD,
      balanceETH: userWallets.balanceETH,
      reservedUSD: userWallets.reservedUSD,
      reservedETH: userWallets.reservedETH
    };

    this.trade.receiveUserInfo(user);

    // Set user's balance on page load after logging in
    if (this.$store.state.isUserLoggedIn && this.$store.state.user.userId > 0) {
      document.getElementById(
        "ethAvailable"
      ).innerText = `ETH: ${userWallets.balanceETH - userWallets.reservedETH}`;
      document.getElementById(
        "usdAvailable"
      ).innerText = `USD: ${userWallets.balanceUSD - userWallets.reservedUSD}`;
    }
  },
  async mounted() {
    const obInfo = await auth.obInfo();
    this.orderBook = obInfo.data.OBcompressed;
    this.orderBook[1] = this.orderBook[1].reverse(); // So it renders in the right order

    document.getElementById("currentPrice").innerText =
      obInfo.data.currentPrice;

    setTimeout(() => {
      findOwnOrders();
    }, 300);
  }
};
</script>

<style scoped lang="scss">
#trade {
  display: flex;
  flex-flow: column;
}
#trade > div {
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

  #orderbooks,
  #localHistory {
    width: 400px;
    border: 2px solid white;
    margin-left: 100px;
    margin-top: 20px;
    text-align: center;

    table {
      tbody {
        th {
          width: 400px;
          font-weight: 200;
          padding: 0;
        }
      }
    }

    .title {
      position: sticky;
      top: 0;
      font-size: 70%;
      background: #2f3d45;
    }
  }

  #orderbooks {
    #askDiv {
      overflow: auto;

      border: 2px solid rgb(255, 164, 164);
    }
    #bidDiv {
      overflow: auto;

      border: 2px solid rgb(164, 255, 164);
    }
  }

  #localHistory {
    height: calc(30vh + 30vh + 42px);
    overflow: auto;
  }

  .sides {
    height: 30vh;
  }

  .disabled {
    pointer-events: none;
    background: rgb(151, 151, 151);
  }
}
</style>
