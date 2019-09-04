<template>
  <div id="deposit">
    <div id="address">
      <div>
        <p>Your personal deposit address</p>
        <img
          src="https://chart.googleapis.com/chart?cht=qr&chl=0xef99ec41d04fbB041eDFEDf83bcBBdEB32cF4366&chs=180x180&choe=UTF-8&chld=L|2"
          alt="Deposit address QR code"
        />
        <p>
          <a
            id="address"
            v-bind:href="'https://etherscan.io/address/' + this.$store.state.user.address"
            target="_blank"
          >{{this.$store.state.user.address}}</a>
        </p>
      </div>
    </div>
    <div id="deposit-list">
      <p>Deposit history:</p>

      <div id="deposit-table-div">
        <table id="deposit-table">
          <tr v-for="deposit in depositHistory">
            <td width="300">{{deposit.date}}</td>
            <td width="180">{{deposit.amount}}</td>
          </tr>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import auth from "../../../services/AuthenticationService.js";

export default {
  name: "deposit",
  components: {},
  data() {
    return { depositHistory: [] };
  },
  methods: {},
  async created() {
    const depositHistory = await auth.depositHistory({
      userId: this.$store.state.user.userId
    });

    for (let i = 0; i < depositHistory.data.length; i++)
      depositHistory.data[i].date = depositHistory.data[i].date.slice(0, 31);

    depositHistory.data.reverse();

    depositHistory.data.unshift({
      date: "Date and time",
      amount: "Amount"
    });

    this.depositHistory = depositHistory.data;
  },
  mounted() {
    // Add classes to the table
    let rows = document.getElementsByTagName("tr");

    setTimeout(() => {
      rows.item(0).classList.add("title");
      for (let i = 0; i < rows.length; i++)
        if (i > 0 && i % 2 == 0) rows.item(i).classList.add("even");
    }, 400);
  }
};
</script>

<style scoped lang="scss">
#deposit {
  display: flex;
  justify-content: space-around;
  height: 500px;

  #address {
    div {
      p,
      img {
        margin-left: 70px;
      }
    }
  }
  #deposit-list {
    color: white;
    margin-left: 70px;

    #deposit-table-div {
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
  a {
    text-decoration: none;
    color: inherit;
  }
  #address {
    font-size: 15px;
  }
  p {
    font-size: 20px;
  }
}
@media (max-width: 950px) {
  #deposit {
    flex-direction: column;
    justify-content: center;
  }
  #address,
  #deposit-list {
    width: 100vw;
  }
  #address {
    margin-top: 300px;
  }
  #deposit-table-div {
    display: flex;
    justify-content: center;
  }
}
</style>
