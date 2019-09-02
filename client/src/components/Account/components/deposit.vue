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
      <ul></ul>
    </div>
  </div>
</template>

<script>
export default {
  name: "deposit",
  components: {},
  data() {
    return {};
  },

  methods: {},
  async created() {}
};
</script>

<style scoped lang="scss">
#deposit {
  display: flex;
  justify-content: space-around;
  height: 350px;
  #address {
    width: 500px;

    div {
      p,
      img {
        margin-left: -90px;
      }
    }
  }
  #deposit-list {
    width: 300px;
    p {
      margin-left: -95px;
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
</style>
