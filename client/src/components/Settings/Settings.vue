<template>
  <div id="settings" class="hidden">
    <div id="container">
      <div id="tabs">
        <button id="tab" @click="toggleTabs()">To account settings</button>
        <div class="tabSquare" id="tabSquare1"></div>
        <div class="tabSquare" id="tabSquare2"></div>
        <div class="tabSquare" id="tabSquare3"></div>
      </div>
      <div id="avatar">
        <img id="user-avatar-preview" src="../../assets/pics/logo.png" height="150" width="150" />
        <div id="upload">
          <p>Upload your new avatar</p>
          <vue-dropzone ref="myVueDropzone" id="dropzone" :options="dropzoneOptions"></vue-dropzone>
          <br />
          <button id="upload-btn" v-on:click="sendAvatar();">Upload</button>
          <p>Maximum file size 2MB</p>
        </div>
        <div></div>
      </div>
      <div id="accountInfo">
        <div id="nameDiv">
          <label for="change-username">New username</label>
          <input type="text" name="change-username" v-model="newUsername" autocomplete="off" />
          <br />
          <p id="username-res-msg">msg</p>
          <button v-on:click="changeName();">Change name</button>
        </div>
        <div id="pwDiv">
          <div>
            <label for="pw-current">Current password</label>
            <input type="password" name="pw-current" v-model="pwCurr" autocomplete="off" />
          </div>
          <div>
            <label for="pw-new">New password</label>
            <input type="password" name="pw-new" v-model="pwNew" autocomplete="off" />
          </div>
          <div>
            <label for="pw-new-confirm">Confirm new password</label>
            <input type="password" name="pw-new-confirm" v-model="pwNewConfirm" autocomplete="off" />
          </div>
          <button v-on:click="changePw();">Change password</button>
          <p id="pwChangeErrors">Err</p>
        </div>
      </div>
      <div id="twoFaDiv">
        <p id="twoFaText">Your two factor authentication is currently</p>

        <div id="twoFaInfoEnabled">
          <p id="twoFaStateEnabled">Enabled</p>
          <p
            id="twoFaWarning"
          >Warning: By disabling 2fa your account will be more prone to malicious attacks</p>
          <div class="twoFaButtonDiv">
            <button v-on:click="twoFaDisable();">Confirm</button>
          </div>
          <label
            for="twoFaInput"
            class="twoFaInputLabel"
          >Input a code from your device to disable 2fa</label>
        </div>
        <div id="twoFaInfoDisabled">
          <p id="twoFaStateDisabled">Disabled</p>
          <div>
            <img id="twoFaScanQR" width="180" height="180" />
            <div class="twoFaButtonDiv">
              <button v-on:click="twoFaConfirm();">Confirm</button>
            </div>
          </div>
          <label
            for="twoFaInput"
            class="twoFaInputLabel"
          >Scan the QR and input a code from your device</label>
        </div>
        <div id="twoFaErrorDiv">
          <p id="twoFaError">Verification failed</p>
        </div>
        <div>
          <br />
          <input type="text" name="twoFaInput" v-model="twoFaCode" autocomplete="off" maxlength="6" />
          <br />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import vue2Dropzone from "vue2-dropzone";
import "vue2-dropzone/dist/vue2Dropzone.min.css";
import auth from "../../services/AuthenticationService.js";

export default {
  name: "settings",
  components: {
    vueDropzone: vue2Dropzone
  },
  data() {
    return {
      dropzoneOptions: {
        url: "https://httpbin.org/post",
        acceptedFiles: "image/*",
        thumbnailWidth: 150,
        thumbnailHeight: 150,
        thumbnailMethod: "crop",
        resizeWidth: 50,
        resizeHeight: 50,
        resizeMethod: "contain",
        maxFilesize: 2,
        maxfiles: 1,
        addRemoveLinks: true,
        init: function() {
          this.on("addedfile", function(file) {
            if (this.files.length > 1) {
              this.removeFile(this.files[0]);
            }
          });
        },
        headers: {
          "Cache-Control": ""
        }
      },
      newUsername: "",
      pwCurr: "",
      pwNew: "",
      pwNewConfirm: "",

      twoFaEnabled: false,
      twoFaCode: ""
    };
  },

  methods: {
    async sendAvatar() {
      let file = $("#dropzone")
        .get(0)
        .dropzone.getAcceptedFiles();

      if (file.length > 0) {
        let avatarPost = await auth.uploadAvatar({
          userId: this.$store.state.user.userId,
          avatar: file[0].dataURL
        });
        localStorage.setItem("avatar", file[0].dataURL);
        document.getElementById("user-avatar-preview").src = file[0].dataURL;
        document.getElementById("avatar-img").src = file[0].dataURL;
      }
    },
    // Toggling between tabs on settings menu
    async toggleTabs() {
      if ($("#avatar").css("display") == "block") {
        $("#avatar").css("display", "none");
        $("#accountInfo").css("display", "flex");
        $("#tab").text("To two-factor authentication");
        $("#tabSquare1").css("display", "none");
        $("#tabSquare2").css("display", "block");
      } else if ($("#accountInfo").css("display") == "flex") {
        let twoFaEnabled = await auth.getTwoFaState({
          userId: this.$store.state.user.userId
        });
        this.twoFaEnabled = twoFaEnabled.data;

        $("#accountInfo").css("display", "none");
        $("#tab").text("To avatar settings");
        $("#tabSquare2").css("display", "none");
        $("#tabSquare3").css("display", "block");
        $("#twoFaDiv").css("display", "flex");

        if (this.twoFaEnabled == true) {
          $("#twoFaInputLabel").text(
            "Input a code from your device to disable 2fa"
          );
          $("#twoFaInfoEnabled").css("display", "flex");
          $("#twoFaInfoDisabled").css("display", "none");
        } else {
          this.getTwoFaQR();

          $("#twoFaInfoEnabled").css("display", "none");
          $("#twoFaInfoDisabled").css("display", "flex");
        }
      } else if ($("#twoFaDiv").css("display") == "flex") {
        $("#avatar").css("display", "block");
        $("#twoFaDiv").css("display", "none");
        $("#twoFaError").css("display", "none");
        $("#tab").text("To account settings");
        $("#tabSquare3").css("display", "none");
        $("#tabSquare1").css("display", "block");
      }
    },

    async changeName() {
      if (this.newUsername.length < 3) {
        $("#username-res-msg").text("Username too short");
        $("#username-res-msg").css("color", "rgb(255, 163, 163)");
      } else {
        let usernameRes = await auth.changeName({
          newName: this.newUsername,
          userId: this.$store.state.user.userId
        });

        $("#username-res-msg").text(usernameRes.data.msg);

        if (usernameRes.data.success) {
          $("#username-p").text(usernameRes.data.username);
          $("#username-res-msg").css("color", "rgb(170, 255, 170)");

          localStorage.setItem("username", usernameRes.data.username);
        } else $("#username-res-msg").css("color", "rgb(255, 163, 163)");
      }
    },

    async changePw() {
      let pwRes = await auth.changePw({
        pwCurr: this.pwCurr,
        pwNew: this.pwNew,
        pwNewConfirm: this.pwNewConfirm,
        userId: this.$store.state.user.userId
      });

      $("#pwChangeErrors").html(pwRes.data.msg.join("<br/>"));
      if (pwRes.data.success) {
        $("#pwChangeErrors").css("color", "rgb(170, 255, 170)");
        $("#pwChangeErrors").css("font-size", "0.75em");
      } else {
        $("#pwChangeErrors").css("color", "rgb(255, 163, 163)");
        $("#pwChangeErrors").css("font-size", "0.5em");
      }
    },

    async twoFaConfirm() {
      let result = await auth.checkTwoFa({
        userId: this.$store.state.user.userId,
        input: this.twoFaCode
      });

      if (!result.data) $("#twoFaError").css("display", "block");
      else {
        $("#twoFaInfoDisabled").css("display", "none");
        $("#twoFaError").css("display", "none");
        $("#twoFaInfoEnabled").css("display", "flex");
        $("#twoFaDiv input").val("");
        this.twoFaCode = "";
      }
    },
    async twoFaDisable() {
      let result = await auth.checkTwoFa({
        userId: this.$store.state.user.userId,
        input: this.twoFaCode
      });
      if (!result.data) $("#twoFaError").css("display", "block");
      else {
        await auth.disableTwoFa({
          userId: this.$store.state.user.userId
        });
        this.getTwoFaQR();
        $("#twoFaInfoEnabled").css("display", "none");
        $("#twoFaError").css("display", "none");
        $("#twoFaInfoDisabled").css("display", "flex");
        $("#twoFaDiv input").val("");
        this.twoFaCode = "";
      }
    },
    async getTwoFaQR() {
      let qrData = await auth.getTwoFaQR({
        userId: this.$store.state.user.userId,
        username: this.$store.state.user.username
      });
      $("#twoFaScanQR").attr("src", qrData.data);
    }
  },
  mounted() {
    setTimeout(() => {
      if (
        localStorage.getItem("avatar") != "null" &&
        localStorage.getItem("avatar") != null
      )
        document.getElementById(
          "user-avatar-preview"
        ).src = localStorage.getItem("avatar");
    }, 200);
  }
};
</script>

<style scoped lang="scss">
#settings,
#container {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  margin: auto;
}

#settings:not(#container) {
  width: 100vw;
  height: 100vh;

  z-index: 1;
  background: rgba(116, 116, 116, 0.7);
}
#container {
  background: rgb(41, 41, 41);
  border: 2px solid white;
  border-radius: 5px;
  width: 800px;
  height: 700px;

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

#tabs {
  position: absolute;
  left: 525px;
  top: 30px;
  #tab {
    height: 65px;
    width: 200px;
  }

  .tabSquare {
    position: absolute;
    top: 65px;

    height: 3px;
    width: 66.666px;
    background: white;
  }

  #tabSquare2 {
    left: 66.666px;
    display: none;
  }
  #tabSquare3 {
    left: 133.333px;
    display: none;
  }
}

#avatar {
  #img {
    margin-left: 100px;
    margin-top: 50px;
  }

  #upload {
    p {
      font-size: 1.6em;
      margin-left: 200px;
      margin-right: 200px;
    }
    button {
      height: 50px;
      width: 350px;
    }
  }
}

#accountInfo {
  display: none;

  flex-direction: column;
  align-items: center;
  width: 796px;
  height: 700px;
  font-size: 2em;

  #nameDiv,
  #pwDiv {
    button {
      position: relative;
      margin-left: 435px;
      width: 210px;
      font-size: 0.7em;
    }
    p {
      color: rgb(41, 41, 41);
    }
  }

  #nameDiv {
    height: 130px;
    position: relative;
    top: 140px;
    margin-bottom: 200px;

    button {
      top: -55px;
    }
    p {
      position: relative;
      top: 5px;
      width: 300px;

      font-size: 0.75em;
      text-align: left;
    }
  }

  #pwDiv {
    display: flex;
    flex-direction: column;
    height: 300px;
    width: 649px;
    label {
      margin-bottom: 40px;
    }

    #pwChangeErrors {
      position: relative;
      top: -40px;
      width: 400px;

      text-align: left;
      font-size: 0.5em;
    }

    button {
      &:hover {
        border: 1px solid white;
        outline: 1px solid white;
      }
    }
  }

  label {
    width: 270px;

    margin-top: 5px;
    margin-right: 37px;

    float: left;

    font-size: 0.8em;
    text-align: left;
  }
  input {
    border-radius: 5px;
    border: 0;
    font-size: 0.8em;
    float: left;
    width: 330px;

    padding: 5px;
  }
}

#twoFaDiv {
  display: none;
  flex-direction: column;

  font-size: 2em;

  #twoFaText,
  #twoFaStateDisabled,
  #twoFaStateEnabled,
  #twoFaErrorDiv,
  img,
  label,
  input,
  button {
    position: absolute;
  }

  #twoFaText {
    top: 70px;
    left: 100px;
  }

  #twoFaStateDisabled,
  #twoFaStateEnabled {
    top: 115px;
    left: 350px;
  }

  #twoFaStateDisabled,
  #twoFaError,
  #twoFaWarning {
    color: rgb(255, 100, 100);
  }

  #twoFaStateEnabled {
    color: rgb(78, 196, 78);
  }

  #twoFaInfoEnabled {
    label {
      left: 86px;
      top: 460px;
    }
  }

  #twoFaInfoDisabled {
    label {
      left: 60px;
      top: 460px;
    }
  }

  #twoFaInfoDisabled,
  #twoFaInfoEnabled {
    display: none;
  }

  #twoFaWarning {
    font-size: 1em;
    padding-left: 40px;
    padding-right: 40px;
  }

  #twoFaErrorDiv {
    height: 50px;
    top: 630px;
    left: 285px;

    p {
      display: none;
      margin: 0;
    }
  }

  img {
    left: 320px;
    top: 220px;
  }

  input {
    width: 95px !important;
    border-radius: 5px;
    border: 0;
    font-size: 0.8em;
    float: left;
    width: 330px;

    padding: 5px;
    padding-left: 12px;
    left: 350px;
    top: 520px;
  }

  .twoFaButtonDiv {
    height: 0px;

    button {
      font-size: 1em !important;
      left: 343px;
      top: 575px;
    }
  }
}

button {
  color: white;

  background: rgb(55, 149, 255);
  border: 1px solid white;

  font-size: 1.5em;

  &:hover {
    border: 2px solid white;
  }
}

.visible {
  display: inline;
  visibility: visible;
}
.hidden {
  display: none;
  visibility: hidden;
}
</style>
