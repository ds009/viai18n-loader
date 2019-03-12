<template>
  <div class="page-index">
    <Header></Header>
    <h1>需要翻译的内容</h1>
    <p title="一段中文">{{test}}</p> <div class="row-item input-item">
    <input v-model="contractAddress" placeholder="输入链接"  class="input">
  </div>
    <p class="name">反方规范腐反对跟复古风格个人更好听不让他果然要不你也认同隔壁认同蛋糕dfvre：</p>
    <div class="row-item input-item">
      <input v-model="sourceCode" placeholder="输入链接"  class="input">
    </div>
    <p class="name">社区：</p>
    <p class="label">昨日排名 | 获得奖励</p>

    <input  v-for="index in [1,2,3,4]" :key="index" class="input border-left-0" placeholder="输入链接">
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
