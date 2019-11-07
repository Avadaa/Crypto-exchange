
<template>
  <div id="history">
    <div>
      <table>
        <tbody id="user-history">
          <tr>
            <th class="title">Time</th>
            <th class="title">Fill Price</th>
            <th class="title">Filled</th>
            <th class="title">Amount</th>
            <th class="title">Type</th>
            <th class="title">Status</th>
          </tr>
          <tr></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import auth from "../../../services/AuthenticationService.js";
import { drawHistory } from "../trade";

export default {
  name: "History",
  components: {},
  data() {
    return {
      trade: null
    };
  },
  methods: {},
  async created() {
    this.trade = require("../trade");
    setTimeout(async () => {
      if (this.$store.state.isUserLoggedIn) {
        let orderHistory = await auth.history({
          userId: this.$store.state.user.userId
        });
        this.trade.drawHistory(orderHistory.data);
      }
    }, 300);
  },
  async mounted() {}
};
</script>

<style scoped lang="scss">
#history {
  width: 965px;
  min-width: 300px;
  height: 200px;
  border: 2px solid white;

  margin-left: 460px;
  margin-top: 20px;

  & > div {
    text-align: center;

    overflow: auto;
    .title {
      position: sticky;
      width: 965px;
      font-weight: 200;
      top: 0;
      font-size: 70%;
      background: #2f3d45;
    }
  }
}

@media (max-width: 1400px) {
  #history {
    width: auto;
  }
}
</style>
