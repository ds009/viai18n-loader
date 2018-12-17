<template>
  <div class="page-index">
    <Header></Header>
    <h1>需要翻译的内容</h1>
    <p>测试一下{{test+'本同人本乳糖'}}</p>
  </div>
</template>

<script>
  import Header from '../components/Header'

  export default {
    components: {Header},
    computed: {
      test() {
        return '测试'
      },
    },
  }
</script>

