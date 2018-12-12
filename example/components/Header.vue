<template>
  <div class="header">
    <div @mouseover="langShow=true" @mouseout="langShow=false" class="lang-config">

      <button id="set-lang">{{currentLangText}}</button>

      <div class="lang-menu" v-if="langShow" v-for="item in availableLocales" :key="item.value"
           @click="onSetLang(item)">
        <span class="menu-text">{{item.text}}</span>
      </div>
    </div>
  </div>
</template>

<script>
  import {mapGetters} from 'vuex';

  export default {
    data() {
      return {
        langShow: false,
      }
    },
    computed: {
      ...mapGetters({currentLangText: 'i18n/currentLangText', availableLocales: 'i18n/availableLocales'})
    },
    methods: {
      onSetLang(item) {
        this.$store.dispatch("i18n/setLang", item.value);
      },
    }
  }
</script>

<style lang="scss">
  .header {
    position: relative;
    width: 100%;
    height: 50px;
    .lang-config {
      float: right;
      position: relative;
      #set-lang {
        cursor: pointer;
        background: transparent;

        border: 1px solid gray;
        margin-right: 10px;
        border-radius: 5px;
        min-width: 120px;
        padding: 5px 10px;
      }

      .lang-menu {
        padding: 5px 10px;
        width: 100%;
        border-bottom: 1px solid #f9f9f9;
      }

      .menu-text:hover {
        color: #52cbca;
        cursor: pointer;
      }
    }

  }
</style>
