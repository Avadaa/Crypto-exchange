<template>
  <div id="withdraw">
    <div id="withdraw-input">
      <p id="availableFunds">Available funds:</p>
      <p id="availableFunds-ETH"></p>
      <p id="availableFunds-USD"></p>
      <div id="label-div">
        <p id="withdraw-eth-label">ETH</p>
        <p>USD</p>
      </div>

      <input type="range" min="0" max="1" value="0" class="slider" id="withdraw-slider" />
      <br />
      <br />
      <br />
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
    <div id="withdraw-list">
      <p>Withdraw history:</p>
      <div id="withdraw-table-div">
        <table id="withdraw-table">
          <tr
            v-for="(withdrawal, index) in withdrawHistory"
            :class="[{'title': index === 0}, {'even': index % 2 == 0}]"
          >
            <td width="300">{{withdrawal.date}}</td>
            <td width="50">{{withdrawal.currency}}</td>
            <td width="180">{{withdrawal.amount}}</td>
          </tr>
        </table>
      </div>
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
      messages: [],
      withdrawHistory: []
    };
  },

  methods: {
    async withdraw() {
      let currency = $("#withdraw-slider").val() == 0 ? "ETH" : "USD";
      if (this.amount > 0) {
        const res = await auth.withdraw({
          userId: this.$store.state.user.userId,
          amount: this.amount,
          address: this.address,
          currency
        });
        document.getElementById("msg-ul").style.color = "rgb(255, 196, 196)";

        this.messages = res.data.messages;

        if (res.data.success) {
          document.getElementById("msg-ul").style.color = "rgb(182, 255, 188)";

          document.getElementById("ethAvailable").innerText =
            "ETH: " + (res.data.balanceETH - res.data.reservedETH);
          document.getElementById("usdAvailable").innerText =
            "USD: " + (res.data.balanceUSD - res.data.reservedUSD);

          document.getElementById("availableFunds-ETH").innerText = `${res.data
            .balanceETH - res.data.reservedETH} ETH`;
          document.getElementById("availableFunds-USD").innerText = `${res.data
            .balanceUSD - res.data.reservedUSD} USD`;
        }
      }
    }
  },
  // Fetch and display the user's withdraw history
  async created() {
    const withdrawHistory = await auth.withdrawHistory({
      userId: this.$store.state.user.userId
    });

    for (let i = 0; i < withdrawHistory.data.length; i++)
      withdrawHistory.data[i].date = withdrawHistory.data[i].date.slice(0, 31);

    withdrawHistory.data.reverse();

    withdrawHistory.data.unshift({
      date: "Date and time",
      currency: "Currency",
      amount: "Amount"
    });
    this.withdrawHistory = withdrawHistory.data;

    let userWallets = await auth.user({
      userId: this.$store.state.user.userId,
      username: this.$store.state.user.username
    });
    userWallets = userWallets.data.balance;
    try {
      document.getElementById(
        "availableFunds-ETH"
      ).innerText = `${userWallets.balanceETH - userWallets.reservedETH} ETH`;
      document.getElementById(
        "availableFunds-USD"
      ).innerText = `${userWallets.balanceUSD - userWallets.reservedUSD} USD`;
    } catch (e) {}
  },
  mounted() {}
};
</script>

<style scoped lang="scss">
#withdraw {
  display: none;
  justify-content: space-around;
  height: 500px;

  #withdraw-input {
    width: 500px;
    //margin-left: -50px;

    ul {
      margin-top: 60px;
      color: rgb(255, 196, 196);

      li {
        list-style: none;
      }
    }
    input {
      position: relative;
      left: 10px;
    }

    #availableFunds-USD,
    #availableFunds-ETH {
      position: relative;
      right: 5px;
    }

    #label-div {
      position: relative;
      display: flex;
      flex-direction: row;
      left: 170px;
      #withdraw-eth-label {
        padding-right: 65px;
      }
      margin-bottom: -20px;
    }

    #withdraw-slider {
      position: relative;
      left: 170px;

      -webkit-appearance: none;
    }

    #withdraw-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 25px;
      height: 25px;
      background: #4caf50;
    }
    button {
      position: relative;
      right: 5px;
    }
  }

  #withdraw-list {
    color: white;

    #withdraw-table-div {
      overflow: auto;
      height: 400px;

      table {
        background: #3c4e58;
        border-collapse: collapse;
        border: 2px solid #2f3b41;

        .even {
          background: #2f3b41;
        }

        .title {
          font-weight: bold;
          background: #212a2e;
          position: sticky;
          top: 0;
        }

        tr {
          height: 30px;
        }
      }
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

@media (max-width: 950px) {
  #withdraw {
    flex-direction: column;
  }
  #withdraw-list {
    margin-top: 50px;
  }

  #withdraw-input {
    width: 50%;
    margin: 0 auto;
    margin-top: 300px;
  }
  #withdraw-table-div {
    display: flex;
    justify-content: center;
  }
}
</style>
