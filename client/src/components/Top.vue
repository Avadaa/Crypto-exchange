<template>
  <div id="top">
    <div style="display: flex; align-items: center;">
      <div class="logo" v-if="!this.$store.state.isUserLoggedIn">
        <img src="../assets/pics/logo.png" height="50" width="50" />
        EzGains Exchange
      </div>
      <div class="logo" id="userInfo" v-if="this.$store.state.isUserLoggedIn" @click="openNclose()">
        <img id="settingsIcon" src="../assets/pics/settings.png" height="30" width="30" />
        <img id="avatar-img" src="../assets/pics/logo.png" height="50" width="50" draggable="false" />
        <div>
          <p class="user" id="username-p">{{$store.state.user.username}}</p>
          <p class="user" id="ethAvailable"></p>
          <p class="user" id="usdAvailable"></p>
        </div>
        <Settings id="settings" />
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

        <div>
          <button id="logout" @click="logout()">Log out</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import router from "../router/index";
import auth from "../services/AuthenticationService";
import Settings from "./Settings/Settings";
import { async } from "q";

global.jQuery = require("jquery");
let $ = global.jQuery;
window.$ = $;

export default {
  name: "top",
  components: { Settings },
  data() {
    return {};
  },

  methods: {
    logout() {
      this.$store.dispatch("setToken");

      localStorage.clear();

      this.$router.push("/");
    },
    openNclose() {
      if (
        ($(event.target).is("#settings") &&
          !$("#settings").hasClass("hidden")) ||
        (!$(event.target).is("#userInfo") &&
          !$("#settings").hasClass("visible"))
      ) {
        document.getElementById("settings").classList.toggle("hidden");
        document.getElementById("settings").classList.toggle("visible");
      }
    }
  },
  mounted() {
    if (
      this.$store.state.isUserLoggedIn &&
      localStorage.getItem("avatar") != "null" &&
      localStorage.getItem("avatar") != null
    ) {
      document.getElementById("avatar-img").src = localStorage.getItem(
        "avatar"
      );
      document.getElementById("user-avatar-preview").src = localStorage.getItem(
        "avatar"
      );
    }
  }
};
</script>

<style scoped lang="scss">
#top,
.logo,
#userInfo {
  display: flex;
  justify-content: space-around;
  align-items: center;
}
#top {
  background: #1b2931;
  color: white;
  min-width: 800px;
  width: 99.3vw;
  margin-left: -8px;

  #userInfo {
    #settingsIcon {
      position: absolute;
      display: none;
    }

    &:hover {
      #settingsIcon {
        display: initial;
      }

      *:not(#settingsIcon) {
        *:not(#settings) {
          filter: blur(1px);
        }
        user-select: none;
      }
    }
  }

  img {
    margin-right: 10px;
    border-radius: 20px;
  }

  .user {
    text-align: left;
    font-size: 13px;

    margin: 5px 0;
  }

  .buttons {
    display: flex;
    justify-content: space-around;
    width: 600px;

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

    #logout {
      background: rgb(255, 100, 100);
      height: 50px;
      width: 100px;

      &:hover {
        border: 3px solid rgb(255, 134, 134);
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



/*
if (
  !$(event.target).is("#userInfo") &&
  !$("#settings").hasClass("visible")
) {
  console.log("open");

  document.getElementById("settings").classList.toggle("hidden");
  document.getElementById("settings").classList.toggle("visible");
}

if (
  $(event.target).is("#settings") &&
  !$("#settings").hasClass("hidden")
) {
  console.log("close");
  document.getElementById("settings").classList.toggle("hidden");
  document.getElementById("settings").classList.toggle("visible");
}
*/