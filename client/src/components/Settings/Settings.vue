<template>
  <div id="settings" class="hidden">
    <div id="container">
      <div id="tabs">
        <button id="tab" @click="toggleTabs()">Account settings</button>
      </div>
      <div id="avatar">
        <img id="user-avatar-preview" src="../../assets/pics/logo.png" height="150" width="150" />
        <div id="upload">
          <p>Upload your new avatar</p>
          <vue-dropzone ref="myVueDropzone" id="dropzone" :options="dropzoneOptions"></vue-dropzone>
          <br />
          <button id="upload-btn" v-on:click="send();">Upload</button>
          <p>Maximum file size 2MB</p>
        </div>
        <div></div>
      </div>
      <div id="accountInfo">
        <div id="nameDiv">
          <label for="username">New username</label>
          <input type="text" name="username" v-model="username" autocomplete="off" />
          <br />
          <p id="username-res-msg">msg</p>
          <button v-on:click="changeName();">Change name</button>
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
      username: "",
      password: "",
      passwordRetype: ""
    };
  },

  methods: {
    async send() {
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
    toggleTabs() {
      if ($("#avatar").css("display") == "block") {
        $("#avatar").css("display", "none");
        $("#accountInfo").css("display", "block");
      } else {
        $("#avatar").css("display", "block");
        $("#accountInfo").css("display", "none");
      }
    },
    async changeName() {
      let usernameRes = await auth.changeName({
        newName: this.username,
        userId: this.$store.state.user.userId
      });

      $("#username-res-msg").text(usernameRes.data.msg);

      if (usernameRes.data.success) {
        $("#username-p").text(usernameRes.data.username);
        $("#username-res-msg").css("left", "-30px");
        $("#username-res-msg").css("color", "rgb(170, 255, 170)");

        localStorage.setItem("username", usernameRes.data.username);
      } else {
        $("#username-res-msg").css("left", "-3px");
        $("#username-res-msg").css("color", "rgb(255, 163, 163)");
      }
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

#tab {
  height: 50px;
  width: 200px;

  position: absolute;
  left: 570px;
  top: 30px;
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
  width: 796px;
  height: 700px;
  font-size: 2em;

  #nameDiv {
    position: relative;
    top: 140px;
    left: 40px;

    button {
      position: relative;
      top: -70px;
      margin-top: 20px;
      margin-left: 320px;

      width: 180px;
      font-size: 0.7em;
    }
    p {
      position: relative;
      color: rgb(41, 41, 41);
      top: 5px;
      width: 300px;

      font-size: 0.75em;
    }
  }

  label {
    margin-top: 5px;
    float: left;
    width: 250px;
  }
  input {
    border-radius: 5px;
    border: 0;
    font-size: 1em;
    float: left;

    padding: 5px;
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
