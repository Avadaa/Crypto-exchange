
<template>
  <div id="account">
    <div id="tabs">
      <button class="active" id="depositTab" @click="toggleTabs()">Deposit</button>
      <button class="inactive" id="withdrawTab" @click="toggleTabs()">Withdraw</button>
    </div>
    <deposit />
    <withdraw />
  </div>
</template>

<script>
import auth from "../../services/AuthenticationService.js";
import deposit from "./components/deposit";
import withdraw from "./components/withdraw";

export default {
  name: "Account",
  components: {
    deposit,
    withdraw
  },
  data() {
    return {};
  },
  methods: {
    toggleTabs() {
      if (!event.target.classList.contains("active")) {
        document.getElementById("depositTab").classList.toggle("active");
        document.getElementById("depositTab").classList.toggle("inactive");
        document.getElementById("withdrawTab").classList.toggle("active");
        document.getElementById("withdrawTab").classList.toggle("inactive");

        if (event.target.id == "depositTab") {
          document.getElementById("withdraw").style.display = "none";
          document.getElementById("deposit").style.display = "flex";
        }
        if (event.target.id == "withdrawTab") {
          document.getElementById("withdraw").style.display = "flex";
          document.getElementById("deposit").style.display = "none";
        }
      }
    }
  },

  async mounted() {
    const res = await auth.deposit({
      userId: this.$store.state.user.userId
    });

    if (res.data.success) {
      delete res.data["success"];
      document.getElementById("ethAvailable").innerText =
        res.data.balanceETH - res.data.reservedETH;
      document.getElementById("usdAvailable").innerText =
        res.data.balanceUSD - res.data.reservedUSD;
    }
  }
};
</script>

<style scoped lang="scss">
#tabs {
  display: flex;

  button {
    font-size: 40px;
    color: rgb(255, 255, 255);

    height: 65px;
    width: 50vw;

    border: 1px solid white;
  }

  .active {
    background: rgba(78, 196, 78, 0.589);
  }

  .inactive {
    background: #455a66;

    &:hover {
      background: #567080;
    }
  }
}
</style>
