<template>
  <div class="page-index">
    <Header></Header>
    <h1>需要翻译的内容</h1>
    <p title="一段中文">{{test}}</p>
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
