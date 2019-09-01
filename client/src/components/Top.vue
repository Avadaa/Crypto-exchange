<template>
  <div id="top">
    <div style="display: flex; align-items: center;">
      <img src="../pics/logo.png" height="50" width="50" />
      <div v-if="!$store.state.isUserLoggedIn">EzGains Exchange</div>
      <div v-if="$store.state.isUserLoggedIn">
        <p class="user">{{$store.state.user.username}}</p>
        <p class="user">ETH: {{$store.state.user.balanceETH - $store.state.user.reservedETH}}</p>
        <p class="user">USD: {{$store.state.user.balanceUSD - $store.state.user.reservedUSD}}</p>
      </div>
    </div>

    <div id="button-holder">
      <div class="buttons" v-if="!$store.state.isUserLoggedIn">
        <div>
          <router-link to="register">
            <button>Create Account</button>
          </router-link>
        </div>

        <div>
          <router-link to="/">
            <button>Log in</button>
          </router-link>
        </div>
      </div>

      <div class="buttons" v-if="$store.state.isUserLoggedIn">
        <div>
          <router-link to="trade">
            <button>Trade</button>
          </router-link>
        </div>

        <div>
          <router-link to="account">
            <button>Account</button>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "top",
  components: {},
  data() {
    return {};
  },

  created: function() {},

  methods: {}
};
</script>

<style scoped lang="scss">
#top {
  background: #1b2931;
  color: white;
  min-width: 700px;
  width: 100vw;
  margin-left: -8px;

  display: flex;
  justify-content: space-around;
  align-items: center;

  img {
    margin-right: 10px;
  }

  a {
    text-decoration: none;
    color: inherit;
  }

  .user {
    font-size: 13px;
    margin: 5px 0;
  }

  .buttons {
    display: flex;
    justify-content: space-around;
    width: 450px;

    button {
      font-size: 20px;
      color: rgb(255, 255, 255);

      height: 50px;
      width: 200px;
      background: rgb(78, 196, 78);
      border: 1px solid white;

      &:hover {
        border: 3px solid rgb(148, 250, 148);
      }
    }
  }
}

@media (max-width: 807px) {
  #top {
    width: 807px;
  }
}
</style>
