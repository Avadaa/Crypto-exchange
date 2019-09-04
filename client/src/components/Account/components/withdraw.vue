<template>
  <div id="withdraw">
    <div id="withdraw-input">
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
    <div id="withdraw-list">
      <p>Withdraw history:</p>
      <div id="withdraw-table-div">
        <table id="withdraw-table">
          <tr v-for="withdrawal in withdrawHistory">
            <td width="300">{{withdrawal.date}}</td>
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
  async created() {
    const withdrawHistory = await auth.withdrawHistory({
      userId: this.$store.state.user.userId
    });

    for (let i = 0; i < withdrawHistory.data.length; i++)
      withdrawHistory.data[i].date = withdrawHistory.data[i].date.slice(0, 31);

    withdrawHistory.data.reverse();

    withdrawHistory.data.unshift({
      date: "Date and time",
      amount: "Amount"
    });

    this.withdrawHistory = withdrawHistory.data;
  },
  mounted() {
    // Add classes to the table
    let rows = document.getElementsByTagName("tr");
    console.log(rows);
    setTimeout(() => {
      rows.item(0).classList.add("title");
      for (let i = 0; i < rows.length; i++)
        if (i > 0 && i % 2 == 0) rows.item(i).classList.add("even");
    }, 400);
  }
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

        .title {
          font-weight: bold;
          background: #212a2e;
          position: sticky;
          top: 0;
        }
        .even {
          background: #2f3b41;
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
