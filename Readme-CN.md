# viai18n-loader - 为 Vue (Nuxt) 定制的一套i18n解决方案（也可以扩展到其他框架）

持续开发升级中，欢迎提交PR或修改建议

**[Check the documentation in English 查看英文文档](https://github.com/viabtc/viai18n-loader/blob/master/Readme.md)**

# 为什么?
* 我们需要自动生成的key
    > 缓存失效和命名是计算机科学两大难题 -- Phil Karlton

   目前大多数i18n解决方案都要对待翻译文案进行人工命名，例如 `$t("message.hello")`, 这种命名往往很浪费时间。也有一些自动以hash值命名的方案，但是会比较难查找定位对应的文案。
   此方案自动提取源码中的待翻译文案，用前八个字符（超过八个字则添加md5特征值）为key，方便查找定位（参见[样例](https://github.com/viabtc/viai18n-loader/blob/master/example/pages/index.messages.json)）

* 翻译文案应该被放在源代码旁边

  一些方案讲所有翻译文案集中到一个文件，这种方式不适合模块化的开发，影响页面加载速度

# 怎么做?
1. 通过两种方式自动查找需要翻译的文案: 正则表达式 或者 分隔符(参阅下文例子)。
2. 保留每一段文案的前八个字符作为 key (另外加上md5值的四个首字符如果文案长度超过八个字符)。
3. 利用正则表达式，用翻译表达式替换源码中的文案。
4. 创建或更新对应的 `filename.messages.json` 文件来保存翻译文案, 并在源代码文件 `filename.vue`中引用这些文案，并插入对应的调用函数。

# **!!! 注意 !!!**
* `this` 在 es6 顶级模块会绑定到 `undefined`, 而不是vue instance.

  所有script部分的带翻译文案需要放在函数里面，而不是直接放在module的定义里(不能用箭头函数 参阅 [文档](https://vuejs.org/v2/guide/instance.html#Data-and-Methods))


# 使用方法

## 配置 webpack
以下样例基于 [Nuxt.js](https://nuxtjs.org/)

**如果设置 `regString`, 这个loader会用正则表达式`new RegExp(regString)`来匹配所有文案，包括 `texts/attributes/string templates` **

**如果设置 `delimiter`分隔符, 这个loader会忽视 `regString`, 它会自动匹配所有被 `delimiter`包夹的文案, 例如用两个井号做分隔符的时候匹配 `##text##`.**
```
    {
        test: /\.vue$/,
        exclude: [/node_modules/],
        loader: 'viai18n-loader',
        enforce: 'pre',
        options: {
          updateMessagesFile: ctx.isClient && ctx.isDev, // 只有在dev环境下编译client才会更新json文件（请将对应的json纳入git版本管理，正式部署不需要重新生成）
          cacheTime: 3000,
          // 用来匹配简体中文字符的 regString
          regString: '[\u4e00-\u9fa5\u3002\uff1b\uff0c\uff1a\u2018\u2019\u201c\u201d\uff08\uff09\u3001\uff1f\uff01\ufe15\u300a\u300b]+',
          // delimiter: '##', // 匹配被分隔符包夹的文案，例如分隔符 '##' 将会匹配 '##text##'
          // Loader 将会优先使用json文件里面已经有的翻译文案, 如果不存在, 则会使用以下translator来自动填充翻译
          languages: [{
            key: 'zh_Hans_CN',
            translator: (matched) => {
              // 有时候一些文案会用不同的翻译，可以在源码中的文案前面添加标记 [R]，之后用translator来自动删除
              return matched.replace(/^\[R\]+/, '')
            }
          }, {
            key: 'zh_Hant_HK',
            translator: (matched) => {
              // 自动将简体翻译成繁体的示例
              return chineseS2T.s2t(matched.replace(/^\[R\]+/, ''))
            }
          }, {
            key: 'en_US',
            // 如果某个语言未指定translator则会使用默认的(即 首个语言所使用的translator, 例如这里的zh_Hans_CN)
          }],
        }
      }
```
## 添加一个全局插件来告诉loader当前需要显示的语言类型
例如:
```
    import Vue from 'vue';
    import {mapGetters} from 'vuex';

    // **!!! 这个key必须是 $lang, 它将被loader替换的翻译脚本引用!!!**
    Vue.mixin({
      computed: {
        ...mapGetters({'$lang': 'currentLang'}),
      }
    });
```
**!!! 注意，这个key必须是 $lang, 它将被loader替换的翻译脚本引用!!!**

这个loader会自动在源码中插入脚本来使用 `$lang`:
```
    methods:{
        $t(key){
              if(!this.$lang && !messages["${defaultLang}"]) return key;
              const trans = messages[this.$lang]||messages["${defaultLang}"]||{};
              return trans[key];
        },
    }
```
`defaultLang` 即默认语言，在config里面给定的首个语言, 在此处例子中取值`zh_Hans_CN`




## 样例
请查看example文件夹:

1. 此样例基于 [Nuxt.js](https://nuxtjs.org/)
2. 下载项目并在根目录和example目录分别运行 `npm install` 然后在example文件夹运行 `npm run dev`
3. 尝试修改文案和翻译体验插件功能

## Cli 工具
我们提供了一个辅助工具用于集合所有待翻译文案，并在网页中展示方便翻译，最终再将翻译好的文案
请查看对应的项目仓库 [viai18n-cli](https://github.com/viabtc/viai18n-cli)

# 路线图
- [ ] Add tests


