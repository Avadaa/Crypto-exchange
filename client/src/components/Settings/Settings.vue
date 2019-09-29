<template>
  <div id="settings" class="hidden">
    <div id="panel">
      <img src="../../assets/pics/logo.png" height="150" width="150" />
      <div id="upload">
        <p>Upload your new avatar</p>
        <vue-dropzone
          ref="myVueDropzone"
          id="dropzone"
          :options="dropzoneOptions"
          @vdropzone-complete="afterComplete"
        ></vue-dropzone>
        <br />
        <button>Upload</button>
        <p>Maximum file size 5MB</p>
      </div>
      <div></div>
    </div>
  </div>
</template>

<script>
import vue2Dropzone from "vue2-dropzone";
import "vue2-dropzone/dist/vue2Dropzone.min.css";
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
        maxFilesize: 5,
        maxfiles: 1,
        init: function() {
          this.on("addedfile", function(file) {
            if (this.files.length > 1) {
              this.removeFile(this.files[0]);
            }
          });
        }
      }
    };
  },

  methods: {
    afterComplete(file) {
      console.log(file);
    }
  }
};
</script>

<style scoped lang="scss">
#settings,
#panel {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  margin: auto;
}

#settings:not(#panel) {
  width: 100vw;
  height: 100vh;

  z-index: 1;
  background: rgba(116, 116, 116, 0.7);
}
#panel {
  background: rgb(41, 41, 41);
  border: 2px solid white;
  border-radius: 5px;
  width: 800px;
  height: 700px;

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

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
      color: white;
      height: 50px;
      width: 350px;
      background: rgb(55, 149, 255);
      border: 1px solid white;

      &:hover {
        border: 2px solid white;
      }
    }
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
