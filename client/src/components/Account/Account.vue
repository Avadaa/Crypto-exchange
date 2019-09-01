
<template>
  <div id="account"></div>
</template>

<script>
import auth from "../../services/AuthenticationService.js";

export default {
  name: "Account",
  components: {},
  data() {
    return {};
  },

  methods: {},
  async created() {
    if (
      this.$store.state.isUserLoggedIn &&
      this.$store.state.user.userId != null
    ) {
      // Load user's wallet balance info from database
      // (balanceETH, balanceUSD, reservedETH, reservedUSD)
      const userInfo = await auth.user({
        userId: this.$store.state.user.userId,
        username: this.$store.state.user.username
      });
      this.$store.dispatch("setBalance", userInfo.data);
    }
  }
};
</script>

<style scoped lang="scss">
</style>
