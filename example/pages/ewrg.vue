<template>
  <div class="page-mining m-mobile">
    <h1>{{title}}</h1>
    <p>让世界更美丽</p>
    <p>{{say()}}</p>
    <p>{{dataField.label.text}}</p>
    <hr/>
    <button @click="changeLang('zh_Hans_CN')">简体中文</button>
    <button @click="changeLang('zh_Hant_HK')">繁體中文</button>
    <button @click="changeLang('en_US')">English</button>
  </div>

</template>

<script>
  import Vue from "vue";
  import { mapState } from "vuex";
  export default {
    components: {
    },
    data() {
      console.log("data", this.i18n);
      return {
        title: "你好世界",
        dataField: {
          label: {
            text: "通过比特币让世界更美好"
          }
        }
      };
    },
    mounted() {
      window.curentPage = this;
      this.$nextTick(() => {

      });
    },



    head() {
      return {
        title: "示例" ,
      };
    },
    computed: Object.assign(mapState(["i18n"]), {
      getText() {
        return "示例";
      }
    }),
    methods: {
      say() {
        return "生活很美";
      },
      changeLang(lang) {
        this.$store.dispatch("i18n/setLang", lang);
      }
    },
    watch: {

    },
  };
</script>

<style lang="scss" scoped>

</style>