import Vue from 'vue';
import {mapGetters} from 'vuex';

// use this mixin to tell our i18n helper which language is showing
// !!! the key must be $lang, which will be referenced by the helper !!!
Vue.mixin({
  computed: {
    ...mapGetters({'$lang': 'i18n/currentLang'}),
  }
});
