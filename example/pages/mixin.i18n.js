import Vue from "vue";

export default {
    computed:{
      tg(){
        return '发的发生的故事梵蒂冈'
      }
    },
    methods:{
      $globalT(key){
       return {title: '中文标题'}[key]
      },
      $test:() => {
        return '测试文案'
      }
    }
}
