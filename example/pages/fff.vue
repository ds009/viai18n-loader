<template>
  <div class="page-token-detail">

    <div class="detail-inner">
      <div class="banner" :class="lang.lang==='en_US'&&'en'">
      </div>
      <div class="main">
        <div v-if="logined" class="panel-record">
          <p class="title">获取记录</p>
          <div class="records">
            <div class="item" v-if="records[0].decimalCmp(0)>0">
              <div class="num">{{records[0]}}</div>
              <p class="text">老用户奖励</p>
            </div>
            <div class="item" v-for="(item,index) in records.slice(1)" :key="'record-'+index">
              <div class="num" :class="{smaller:item.length>6}">
                <Numeric v-if="item!=='?'" :value="item" :length="6" :integerPadding="false" :digitPadding="false"></Numeric>
                <span v-else>{{item}}</span>
              </div>
              <p class="text">{{recordTexts[index]}}</p>
            </div>
          </div>
        </div>
        <div class="panel-act1">
          <!-- <div class="share-box">
            <span class="text">分享到：</span>
            <div class="qrcode-modal" v-show="weixinVisible">
              <div class="qrcode-header">
                <span class="close" @click="weixinVisible=false">x</span>
              </div>
              <div class="qrcode-content">
                <Qrcode class="qr-code-img" :val="qrcode.val" :size="qrcode.size" :bg-color="qrcode.bgColor" :fg-color="qrcode.fgColor" level="L"></Qrcode>
              </div>
            </div>
            <span class="item weixin" @click="shareWeixin">
              <i class="fa-weixin"></i>
            </span>
            <span class="item weibo" @click="share('tsina')">
              <i class="iconfont icon-weibo"></i>
            </span>
            <span class="item twitter" @click="share('twitter')">
              <i class="iconfont icon-twitter"></i>
            </span>
            <span class="item fb" @click="share('fb')">
              <i class="iconfont icon-facebook"></i>
            </span>
          </div> -->

          <div class="header">
            <span class="name">活动一</span>
            <span class="title" :class="lang.lang==='en_US'&&'en'">7亿CET豪气送</span>
          </div>
          <div class="body" :class="{logined:logined,end:isFinish()}">
            <template v-if="!logined">
              <div class="recharge-text" :class="{en:lang.lang==='en_US',end:isFinish()}"></div>
              <div class="invite-text" :class="{en:lang.lang==='en_US'}" v-if="!isFinish()"></div>
            </template>

            <template v-if="isFinish()" :class="{en:lang.lang==='en_US'}">
              <div v-if="lang.lang==='en_US'" class="delivered-box en">
                <div class="content">
                  <p class="text">700 million</p>
                  <p class="text">has been</p>
                  <p class="text">delivered</p>
                </div>
              </div>
              <div v-else class="delivered-box">
                <div class="content">
                  <p class="text">7亿</p>
                  <p class="text">已送完</p>
                </div>
              </div>
            </template>

            <div v-if="logined" class="section-info" id="act1-section-info">
              <div class="item">
                <div class="name">
                  <span>我的资产市值</span>
                  <span id="asset-tip" class="asset-tip fa-question-circle" :class="{end:isFinish()}"></span>
                </div>
                <b-tooltip target="asset-tip" container="act1-section-info" placement="top">
                  <div class="asset-tip-box">
                    <div>
                      <span>1. 账户总资产：</span>
                      <Numeric :value="user_usd" :digit="2" :length="12" :integerPadding="false"></Numeric> USD
                    </div>
                    <p>2. 参与活动的资产不包括CDY以及BTV</p>
                    <p>3. 参与活动的资产市值上限为10万USD</p>
                  </div>
                </b-tooltip>
                <div class="number">
                  <span class="num">
                    <Numeric :value="user_valid_usd" :digit="2" :length="12" :integerPadding="false"></Numeric>
                  </span>
                  <span class="unit">USD</span>
                </div>
              </div>
              <div class="item">
                <div class="name">
                  <span>好友贡献市值</span>
                  <span id="asset-tip-friend" class="asset-tip fa-question-circle" :class="{end:isFinish()}"></span>
                </div>
                <b-tooltip target="asset-tip-friend" container="act1-section-info" placement="top">
                  <div class="asset-tip-box">
                    <p>1. 单个好友贡献的市值=该好友资产市值*10% </p>
                    <p>2. 每个好友最多可贡献1万USD市值</p>
                    <p>3. 好友贡献的市值不设上限，邀请越多，送得越多</p>
                  </div>
                </b-tooltip>
                <div class="number">
                  <span class="num">
                    <Numeric :value="user_return_usd" :digit="2" :length="12" :integerPadding="false"></Numeric>
                  </span>
                  <span class="unit">USD</span>
                </div>
              </div>
              <div class="item">
                <p class="name">预计下次可分得</p>
                <div class="number">
                  <span class="num" v-if="!isFinish()">
                    <Numeric :value="user_share" :digit="2" :length="12" :integerPadding="false"></Numeric>
                  </span>
                  <span v-else class="num">0</span>
                  <span class="unit">CET</span>
                </div>
              </div>
            </div>
            <div class="section-market">
              <p class="name">平台活动总市值</p>
              <div class="number">
                <span class="num">
                  <Numeric :value="total_usd" :digit="2" :length="16" :hasComma="true" :integerPadding="false"></Numeric>
                </span>
                <span class="unit">USD</span>
              </div>
              <p class="update">{{assetUpdateText}}</p>

            </div>

            <div class="section-time">
              <p class="title">距离下次瓜分还剩</p>
              <div class="time-box">
                <div class="item">
                  <p class="name">小时</p>
                  <p class="number">{{hour}}</p>
                </div>
                <div class="item">
                  <p class="name">分钟</p>
                  <p class="number">{{minute}}</p>
                </div>
                <div class="item">
                  <p class="name">秒</p>
                  <p class="number">{{second}}</p>
                </div>
              </div>
            </div>

            <template v-if="!isFinish()">
              <span v-if="logined" class="recharge" @click="toRecharge">立即充值</span>
              <div v-else class="login-register-box">
                <span class="login" @click="toLogin">登录</span>
                <span class="register" @click="toRegister">注册</span>
              </div>

            </template>

            <div v-if="logined" class="section-invite" :class="isFinish()&&'end'">

              <div class="invite-decorate" :class="lang.lang==='en_US'&&'en'"></div>
              <div class="invite-body" :class="lang.lang==='en_US'&&'en'">
                <p class="title">每个好友最多可贡献1万USD市值</p>
                <div class="text">
                  <span>我的邀请ID：{{refer_code}}</span>
                  <span class="copy" id="refer-code" v-clipboard:copy="refer_code" v-clipboard:success="copyCodeSuccess"></span>

                  <b-tooltip content="已复制到剪贴板" target="refer-code" style="display:inline" :show="referCodeCopyed" :triggers="'false'">
                    已复制到剪贴板
                  </b-tooltip>

                </div>

                <div class="text">
                  <span>邀请链接：</span>
                  <span>http://www.coinex.com/activity/token?refer_code={{refer_code}}</span>
                  <span class="copy" id="refer-link" v-clipboard:copy="'https://www.coinex.com/activity/token?refer_code='+refer_code" v-clipboard:success="copyLinkSuccess"></span>

                  <b-tooltip content="已复制到剪贴板" target="refer-link" style="display:inline" :show="referLinkCopyed" :triggers="'false'">
                    已复制到剪贴板
                  </b-tooltip>
                </div>
                <div class="share-box">
                  <span class="text">分享推荐链接到：</span>
                  <span class="item twitter" @click="share('twitter')">
                    <i class="iconfont icon-twitter"></i>
                  </span>
                  <span class="item fb" @click="share('fb')">
                    <i class="iconfont icon-facebook"></i>
                  </span>
                </div>
              </div>
            </div>

            <div class="section-rule" :class="isFinish()&&'end'">
              <h3 class="title">活动规则</h3>
              <p class="text">
                <span>1. 活动期间，每日UTC时间2点，CoinEx将对用户资产进行快照，按照我参与活动的市值与平台活动总市值的比例瓜分1亿CET。我参与活动的市值=我的资产市值+好友贡献的市值。</span>
                <span>（例如，我的资产市值为10万USD，我邀请的20个好友累计贡献20万USD，平台活动总市值为2亿USD，那么我可以分得（10w+20w）/20000w*10000w=15w CET)。</span>
              </p>
              <p class="text">
                2. 我的资产市值上限为10万USD；超过10万，按10万计。
              </p>
              <p class="text">3. 单个好友贡献的市值=该好友资产市值*10%，好友贡献的市值不设上限，邀请越多，送得越多。</p>
              <p class="text">4. 平台活动总市值等于所有用户参与活动的市值总和。</p>
              <p class="text">5. 充值以下币种可参与瓜分CET：BCH、BTC、LTC、ETH、ETC、XMR、ZEC、DASH、DOGE、EOS、USDT、BTM。</p>
            </div>
          </div>
        </div>
        <div class="panel-act2">
          <div class="header">
            <span class="name">活动二</span>
            <span class="title" :class="lang.lang==='en_US'&&'en'">3亿CET回馈老用户</span>
          </div>
          <div class="body">
            <div class="section-rule" :class="royalFinished&&'end'">
              <h3 class="title">活动规则：</h3>
              <p class="text">1. 2018年1月30日7点（UTC）前注册的CoinEx用户，每个账户已于2018年1月31日（UTC）随机获得CET，总量1.5亿枚。</p>
              <p class="text">2. 2018年1月30日7点（UTC）前注册的ViaBTC矿池用户，只要在2月9日24点前（UTC）使用矿池账号绑定的邮箱或手机注册CoinEx，即可获得CET。</p>
              <p class="text">3. 每个主账号（包括子账号）仅限领取一次老用户回馈赠币。</p>
              <p class="text">4. CoinEx一共将赠出3亿CET回馈老用户，数量有限，先领先得，赠完即止。</p>
            </div>
            <template v-if="royalFinished">
              <div v-if="lang.lang==='en_US'" class="delivered-box en">
                <div class="content">
                  <p class="text">300 million</p>
                  <p class="text">has been</p>
                  <p class="text">delivered</p>
                </div>
              </div>
              <div v-else class="delivered-box">
                <div class="content">
                  <p class="text">3亿</p>
                  <p class="text">已送完</p>
                </div>
              </div>
            </template>
          </div>
        </div>
        <div class="panel-cet">
          <p class="header">关于CET</p>
          <div class="body">
            <div class="section-rule">
              <div class="text">
                <span>CoinEx Token（简称：CET）是由CoinEx交易平台官方推出的用户增值服务权益体系，它基于Ethereum ERC 20协议发行，未来将迁移到CoinEx自研的公链CoinEx Chain上。CET发行总量为100亿枚，且永不增发。CET本质为CoinEx交易平台的用户增值服务权益，可以在多种场景下流通并使用。</span>
              </div>
              <p class="text2">
                <span>了解更多：</span>
                <nuxt-link to="/token">https://www.coinex.com/token</nuxt-link>
              </p>
              <p class="text1">* CoinEx团队对本活动保留所有解释权。</p>
            </div>
          </div>
        </div>

        <div class="panel-qrcode">
          <div class="item">
            <Qrcode class="qr-code-img" val="https://twitter.com/coinexcom" :size="120" :bg-color="qrcode.bgColor" :fg-color="qrcode.fgColor"
                    level="L"></Qrcode>
            <p class="text">Twitter</p>
          </div>
          <div class="item">
            <Qrcode class="qr-code-img" val="https://www.facebook.com/TheCoinEx/" :size="120" :bg-color="qrcode.bgColor" :fg-color="qrcode.fgColor"
                    level="L"></Qrcode>
            <p class="text">Facebook</p>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
  import Numeric from "~/components/Numeric"
  import jiathis from "~/plugins/jiathis"
  import Vue from "vue"
  import Qrcode from "~/components/Qrcode";
  import {
    mapState
  } from "vuex"

  const SECOND_TIME = 1000
  const MINUTE_TIME = 60 * SECOND_TIME
  const HOUR_TIME = 60 * MINUTE_TIME
  const DAY_TIME = 24 * HOUR_TIME

  const UPDATE_PERIOD = 5 * MINUTE_TIME

  export default {
    layout: "homepage",
    components: {
      Numeric,
      Qrcode
    },
    validate({
               params,
               query
             }) {
      return false
    },
    head() {
      return {
        title: "CoinEx狂欢周" + " " + this.$globalT("site_title")
      };
    },
    asyncData({
                app,
                query,
                req,
                redirect,
                route
              }) {
      return app.axios.init(req).get("/res/account/cet/share").then((res) => {
        if (!res.data.code) {
          let data = res.data.data
          return {
            isLogin: true,
            total_usd: data.total_usd,
            user_share: data.user_share,
            user_usd: data.user_usd,
            royal_amount: data.royal_amount,
            shares: data.shares,
            user_return_usd: data.user_return_usd
          }
        }
      }).catch((e) => {
        if (e.response && (e.response.status === 401 || e.response.status === 40)) {
          return {
            isLogin: false
          }
        }
      })
    },

    data() {
      return {
        timers: [],
        isLogin: false,
        deliverStart: 1517623200000, //UTC 2018-02-03 02:00:00
        deliverPeriod: DAY_TIME,
        startTimestamp: 1517616000000, //UTC 2018-02-03 00:00:00
        dayCount: 7,
        hour: 0,
        minute: 0,
        second: 0,
        refer_code: "",

        total_usd: 0,
        user_share: 0,
        user_usd: 0,
        user_valid_usd: 0,
        user_return_usd: 0,

        royal_amount: "0",
        shares: {},

        nextUpdateTime: 0,
        updateTimeOffset: "",

        qrcode: {
          val: "http://www.coinex.com/activity/token?utm_source=wechat&utm_medium=share",
          secret: "",
          bgColor: "#FFFFFF",
          fgColor: "#000000",
          size: 220,
          issuer: "www.coinex.com"
        },
        weixinVisible: false,
        recordTexts: ["第一天", "第二天", "第三天", "第四天", "第五天", "第六天", "第七天"],
        royalFinished: false,
        referCodeCopyed: false,
        referLinkCopyed: false
      }
    },
    computed: {
      ...mapState(["lang"]),
      logined() {
        return this.isLogin
      },
      endTimestamp() {
        return this.startTimestamp + this.dayCount * DAY_TIME
      },
      deliverEnd() {
        return this.deliverStart + (this.dayCount - 1) * this.deliverPeriod
      },
      records() {
        let shares = this.shares || {}
        let firstDate = new Date(this.startTimestamp)
        let results = [this.royal_amount || ""]

        for (let i = 0; i < this.dayCount; i++) {
          let t = this.startTimestamp + i * this.deliverPeriod
          let d = new Date(t)
          let year = d.getUTCFullYear()
          let month = d.getUTCMonth() + 1
          let day = d.getUTCDate()
          let key = year + "-" + (month < 10 ? "0" : "") + month + "-" + (day < 10 ? "0" : "") + day
          results.push(shares[key] !== undefined ? shares[key] : "?")
        }
        return results
      },
      assetUpdateText() {
        if (this.isFinish()) {
          return "*最后更新于：2月9日2点(UTC)"
        } else {
          let text = "*" + "#time#后更新"
          return text.replace("#time#", this.updateTimeOffset)
        }
      }
    },
    watch: {
      isLogin(newValue) {
        if (newValue && !this.referCode) {
          this.fetchReferCode()
        }
      }
    },
    mounted() {
      //用户数据轮询
      let assetTimer = this.createTimer()
      assetTimer.setInfo(() => {
        return this.assetUpdate()
      }, 60 * SECOND_TIME)
      assetTimer.execute()

      // 总市值轮询
      let summaryTimer = this.createTimer()
      summaryTimer.setInfo(() => {
        return this.summaryUpdate()
      }, 60 * SECOND_TIME)
      summaryTimer.execute()

      // 总市值和距离下次瓜分时间读秒
      let countingTimer = this.createTimer()
      countingTimer.setInfo(() => {
        this.timeCounting()
        this.assetTimeCounting()
        return Promise.resolve(1)
      }, SECOND_TIME)
      countingTimer.execute()

      let giftStatusTimer = this.createTimer()
      giftStatusTimer.setInfo(() => {
        if (this.royalFinished) {
          return Promise.resolve(1)
        }
        return this.giftStatusUpdate()
      }, MINUTE_TIME)
      giftStatusTimer.execute()

      this.fetchReferCode()
      let refer_code = this.$route.query.refer_code
      if (refer_code) {
        window.sessionStorage.setItem("refer_code", refer_code)
      }
    },
    beforeDestroy() {
      this.timers.forEach(timer => {
        timer.clear()
      });
    },
    methods: {
      toLogin() {
        let link = "/account/signin?redirect=" + encodeURIComponent(this.$route.fullPath)
        ga("send", "event", {
          eventCategory: "link",
          action: "click",
          eventLabel: link
        })
        this.$router.push(link)
      },
      toRegister() {
        let link = "/account/signup"
        ga("send", "event", {
          eventCategory: "link",
          action: "click",
          eventLabel: link
        })
        this.$router.push(link)
      },
      toRecharge() {
        let link = "/my/wallet/deposit"
        ga("send", "event", {
          eventCategory: "link",
          action: "click",
          eventLabel: link
        })
        this.$router.push(link)
      },

      createTimer() {
        let id, task, delay
        let _this = this
        let timer = {
          setInfo(t, d) {
            task = t
            delay = d
          },
          execute() {
            task().catch(() => {}).then(() => {
              if (!_this.isFinish()) {
                id = setTimeout(() => {
                  timer.execute()
                }, delay)
              }
            })
          },
          clear() {
            window.clearTimeout(id)
          }
        }
        this.timers.push(timer)
        return timer
      },
      timeCounting() {
        let now = new Date().getTime()
        if ((!this.isFinish()) && now < this.deliverEnd) {
          let offset = this.deliverStart > now ? (this.deliverStart - now) : ((this.deliverEnd - now) % DAY_TIME)
          let hour = Math.floor(offset / HOUR_TIME)
          let minute = Math.floor(offset % HOUR_TIME / MINUTE_TIME)
          let second = Math.floor(offset % MINUTE_TIME / SECOND_TIME)
          this.hour = hour < 10 ? ("0" + hour) : hour
          this.minute = minute < 10 ? ("0" + minute) : minute
          this.second = second < 10 ? ("0" + second) : second
        } else {
          this.hour = 0
          this.minute = 0
          this.second = 0
        }
      },
      isFinish() {
        // return (new Date().getTime() - this.lastTimestamp) > 0
        return true
      },
      isStart() {
        return new Date().getTime() - this.startTimestamp > 0
      },
      isContinue() {
        return this.isStart() && !this.isFinish()
      },
      assetTimeCounting() {
        let now = new Date().getTime()
        if (this.nextUpdateTime > now) {
          let offset = this.nextUpdateTime - now
          let minute = Math.floor(offset % HOUR_TIME / MINUTE_TIME)
          let second = Math.floor(offset % MINUTE_TIME / SECOND_TIME)
          this.updateTimeOffset = (minute < 10 ? "0" : "") + minute + ":" + (second < 10 ? "0" : "") + second
        } else {
          this.updateTimeOffset = "05:00"
        }
      },
      giftStatusUpdate() {
        return this.axios.get("/res/account/cet/gift/status").then((res) => {
          if (!res.data.code) {
            this.royalFinished = res.data.data.finished
          }
        })
      },
      assetUpdate() {
        return this.axios.get("/res/account/cet/share").then((res) => {
          if (!res.data.code) {
            let data = res.data.data

            this.isLogin = true
            this.user_share = data.user_share
            this.user_usd = data.user_usd
            this.user_valid_usd = data.user_valid_usd
            this.royal_amount = data.royal_amount
            this.shares = data.shares
            this.user_return_usd = data.user_return_usd
          }
        }).catch((e) => {
          if (e.response && (e.response.status === 401 || e.response.status === 40)) {
            this.isLogin = false
          }
        })
      },
      summaryUpdate() {
        return this.axios.get("/res/account/balance/summary").then((res) => {
          if (!res.data.code) {
            let data = res.data.data
            this.total_usd = data.total_usd
            this.nextUpdateTime = parseInt(data.timestamp) * 1000 + UPDATE_PERIOD
          }
        })
      },

      fetchReferCode() {
        if (this.logined) {
          return this.axios.get("/res/activity/refer/code", {
            params: {
              activity_id: 3
            }
          }).then((res) => {
            if (!res.data.code) {
              this.refer_code = res.data.data.refer_code
            }
          })
        }
      },

      share(webid) {
        let channels = {
          tsina: "weibo",
          twitter: "twitter",
          fb: "facebook"
        }
        let channel = channels[webid]
        jiathis.share({
          webid: webid,
          title: "CoinEx狂欢周，十亿CET送不停，充得越多送得越多，一起来瓜分吧",
          url: `http://www.coinex.com/activity/token?refer_code=${this.refer_code}utm_source=${channel}&utm_medium=cpc`
        })
        ga("send", "event", {
          eventCategory: "share",
          action: "click",
          eventLabel: channel
        })
      },
      shareWeixin() {
        this.weixinVisible = true
        ga("send", "event", {
          eventCategory: "share",
          action: "click",
          eventLabel: "wechat"
        })
      },
      copyCodeSuccess() {
        this.referCodeCopyed = true;
        setTimeout(() => {
          this.referCodeCopyed = false;
        }, 2000);
      },
      copyLinkSuccess() {
        this.referLinkCopyed = true;
        setTimeout(() => {
          this.referLinkCopyed = false;
        }, 2000);
      }
    }
  }
</script>

<style lang="scss">
  // @font-face {
  //   font-family: "Impact";
  //   src: url("~assets/fonts/Impact.ttf") format('truetype');
  // }
  .page-token-detail {
    margin-top: -110px;
    background-image: linear-gradient(143deg, #3023ae, #c86dd7);
    .detail-inner {
      background-image: url("~assets/img/token/detail_banner_bg.png");
      background-repeat: no-repeat;
      background-size: 100% auto;
      padding-top: 110px;
    }
    .banner {
      margin-top: 50px;
      margin-bottom: 30px;
      width: 100%;
      height: 202px;
      background-image: url("~assets/img/token/detail_banner_theme_cn.png");
      background-repeat: no-repeat; // background-size: 880px 202px;
      background-position: center top;
      background-size: contain;
      &.en {
        background-image: url("~assets/img/token/detail_banner_theme_en.png");
      }
    }
    .main {
      width: 1200px;
      margin: 0 auto;
    }
    .panel-record {
      .title {
        font-size: 24px;
        text-align: center;
        color: #c8a5fe;
      }
      .records {
        display: flex;
        justify-content: center;
        margin-top: 23px;
      }
      .item {
        margin-left: 21px;
        &:first-child {
          margin-left: none;
        }
        .num {
          overflow: hidden;
          text-overflow: ellipsis;
          width: 133px;
          height: 83px;
          font-size: 35px;
          color: #c8a5fe;
          line-height: 83px;
          text-align: center;
          background-image: url("~assets/img/icons/cet_token_num.svg");
          background-repeat: no-repeat;
          background-size: 100% 100%;
          &.smaller {
            font-size: 28px;
          }
        }
        .text {
          font-size: 14px;
          margin-top: 12.5px;
          color: #c8a5fe;
          text-align: center;
        }
      }
    }
    .panel-act1 {
      margin-top: 51px;
      position: relative; // .share-box {
      //   position: absolute;
      //   top: -5px;
      //   right: 0;
      //   color: #fff;
      //   .text {
      //     padding-right: 10px;
      //     font-size: 14px;
      //   }
      //   .item {
      //     cursor: pointer;
      //     font-size: 20px;
      //     margin-left: 9px;
      //     display: inline-block;
      //     &:hover {
      //       color: #f8e71c;
      //     }
      //   }
      //   .fa-weixin {
      //     font-family: "FontAwesome"
      //   }
      //   .qrcode-modal {
      //     background-clip: padding-box;
      //     background-color: #FFFFFF;
      //     border: 1px solid rgba(0, 0, 0, 0.3);
      //     border-radius: 6px 6px 6px 6px;
      //     box-shadow: 0 3px 7px rgba(0, 0, 0, 0.3);
      //     left: 50%;
      //     margin: -200px 0 0 -200px;
      //     overflow: hidden;
      //     position: fixed;
      //     top: 50%;
      //     width: 300px;
      //     height: 300px;
      //     overflow: hidden;
      //     z-index: 9999;
      //     .qrcode-header {
      //       position: relative;
      //       height: 40px;
      //     }
      //     .close {
      //       position: absolute;
      //       top: 10px;
      //       right: 10px;
      //       display: inline-block;
      //       width: 30px;
      //       height: 30px;
      //       text-align: center;
      //       cursor: pointer;
      //     }
      //     .qrcode-content {
      //       width: 220px;
      //       height: 220px;
      //       margin: 0 auto;
      //     }
      //   }
      // }
      .header {
        width: 620px;
        height: 70px;
        border-radius: 36px;
        background-image: linear-gradient(91deg, #63c5f6, #c908b9);
        box-shadow: 8px 2px 20px 0 rgba(0, 0, 0, 0.1);
        margin: 0 auto 0 auto;
        z-index: 999;
        position: relative;
        text-align: center;
        .name {
          position: absolute;
          left: 36px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 24px;
          font-weight: 600;
          color: #fff;
        }
        .title {
          line-height: 70px;
          font-size: 32px;
          font-weight: 500;
          color: #f8e71c;
          &.en {
            font-size: 20px;
          }
        }

      }
      .body {
        position: relative;
        padding-top: 110px;
        padding-bottom: 104px;
        top: -35px;
        width: 100%;
        min-height: 850px;
        background-size: 100% 100%;
        background-image: url("~assets/img/token/detail_box.svg");
        background-repeat: no-repeat;

        &.end {
          .name,
          .title,
          .em,
          .num,
          .number,
          .update,
          .text,
          .unit {
            color: #9b9b9b !important;
          }
        }
        &.logined {
          padding-top: 70px;
        }
        .recharge-text {
          position: absolute;
          left: -1px;
          top: 193px;
          width: 347px;
          height: 209px;
          background-image: url("~assets/img/token/detail_decorate_cn.png");
          background-repeat: no-repeat;
          background-size: 100% 100%;
          &.en {
            background-image: url("~assets/img/token/detail_decorate_en.png");
          }
          &.end {
            background-image: url("~assets/img/token/detail_decorate_end.png");
          }
          &.end.en {
            background-image: url("~assets/img/token/detail_decorate_end_en.png");
          }
        }
        .invite-text {
          position: absolute;
          right: 38px;
          top: 193px;
          width: 347px;
          height: 209px;
          background-image: url("~assets/img/token/detail_invite_text_cn.svg");
          background-repeat: no-repeat;
          background-size: 100% 100%;
          &.en {
            right: 60px;
            top: 230px;
            width: 269px;
            height: 110px;
            background-image: url("~assets/img/token/detail_invite_text_en.png");
          }
        }
        .delivered-box {
          position: absolute;
          top: 200px;
          right: 128px;
          background-image: url("~assets/img/token/detail_circle.svg");
          background-repeat: no-repeat;
          background-size: 100% 100%;
          width: 210px;
          height: 210px;
          display: flex; // flex-direction: column;
          justify-content: center;
          align-items: center;
          font-size: 40px;
          line-height: 1.15;
          &.en {
            font-size: 28px;
          }
          .content {
            transform: rotate(-15deg);
          }
          .text {
            text-align: center;
            color: #612cb6 !important;
          }
        }
        .section-info {
          widows: 100%;
          display: flex;
          justify-content: center;
          .item {
            padding: 0 10px;
            min-width: 350px;
          }
          .name {
            font-size: 18px;
            text-align: center;
            color: #9466d7;
            position: relative;
            .asset-tip {
              // background-image: url("~assets/img/token/detail_info.svg");
              // background-size: contain;
              // display: inline-block;
              font-family: "FontAwesome";
              width: 15px;
              height: 15px;
              background-repeat: no-repeat;
              margin-left: 5px;
              position: relative;
              top: -5px;
              display: inline-block;
              color: #8c6bd1;
              &.end {
                color: #9b9b9b;
              }
            }
          }
          .asset-tip-box {
            padding: 8px;
            text-align: left;
            font-size: 14px;
          }
          .number {
            text-align: center;
          }
          .num {
            font-size: 64px;
            color: #9466d7;
            display: inline-block; // font-family: "Impact";
          }
          .unit {
            font-size: 14px;
            padding-left: 10px;
            color: #9466d7;
          }


        }
        .section-market {
          margin-top: 10px;
          text-align: center;
          .name {
            font-size: 14px;
            color: #9466d7;
          }
          .number {
            margin-top: 6px;
            .num {
              font-size: 36px;
              color: #9466d7;
              margin-right: 4px; // font-family: "Impact";
            }
            .unit {
              font-size: 14px;
              color: #9466d7;
            }
          }
          .update {
            margin-top: 2px;
            font-size: 12px;
            color: #636363;
          }
        }
        .section-time {
          margin-top: 23px;
          .title {
            font-size: 16px;
            text-align: center;
            color: #73a9ed;
          }
          .time-box {
            display: flex;
            justify-content: center;
            margin-top: 11px;
            .item {
              width: 94px;
              height: 84px;
              border-radius: 16px;
              background-color: #ffffff;
              box-shadow: 0 2px 10px 0 rgba(207, 207, 207, 0.5);
              margin: 0 15px;
              position: relative;
            }
            .name {
              position: absolute;
              top: 10px;
              right: 10px;
              font-size: 14px;
              color: #73a9ed;
            }
            .number {
              padding-top: 10px;
              text-align: center;
              font-size: 48px;
              line-height: 74px;
              color: #73a9ed;
            }
          }
        }

        .section-invite {
          width: 960px;
          margin: 55px auto 0 auto;
          min-height: 200px;
          border-radius: 100px;
          background-image: linear-gradient(92deg, #63c5f6, #c908b9);
          box-shadow: 0 2px 10px 0 rgba(207, 207, 207, 0.5);
          display: flex;
          align-items: center;
          padding-left: 40px;
          &.end {
            background-image: none;
            background-color: #9b9b9b;
          }

          .invite-decorate {
            width: 250px;
            height: 145.9px;
            background-image: url("~assets/img/token/detail_invite_box_text_cn.svg");
            background-repeat: no-repeat;
            background-size: contain;
            background-position: center;
            &.en {
              background-image: url("~assets/img/token/detail_invite_box_text_en.svg")
            }
          }
          .invite-body {
            -webkit-font-smoothing: antialiased;
            text-align: left;
            padding-left: 20px;
            .title {
              font-size: 36px;
              font-weight: 600;
              line-height: 1.67;
              text-align: left;
              color: #ffffff !important;
            }
            .text {
              font-size: 18px;
              color: #ffffff !important;
            }
            .copy {
              display: inline-block;
              margin-left: 10px;
              width: 18px;
              height: 18px;
              background-image: url("~assets/img/token/detail_copy.svg");
              background-repeat: no-repeat;
              background-size: contain;
              cursor: pointer;
            }
            .share-box {
              color: #fff;
              top: -5px;
              right: 0;
              color: #fff;
              .text {
                padding-right: 10px;
                font-size: 14px;
              }
              .item {
                cursor: pointer;
                font-size: 20px;
                margin-left: 9px;
                display: inline-block;
                &:hover {
                  color: #f8e71c;
                }
              }
              .fa-weixin {
                font-family: "FontAwesome"
              }
            }

            &.en {
              padding-left: 40px;
              .title {
                font-size: 28px;
                padding-right: 45px;
                line-height: 1.2;
                padding-bottom: 10px;
              }
              .text {
                font-size: 16px;
              }
            }
          }
        }

        .recharge {
          display: block;
          margin: 34px auto 0 auto;
          width: 260px;
          height: 50px;
          border-radius: 36px;
          background-image: linear-gradient(92deg, #63c5f6, #c908b9);
          font-size: 24px;
          line-height: 50px;
          text-align: center;
          color: #f8e71c;
          text-decoration: none;
          cursor: pointer;
        }
        .login-register-box {
          margin-top: 58px;
          display: flex;
          justify-content: center;
          text-align: center;
          font-size: 24px;

          .login {
            margin: 0 10px;
            min-width: 220px;
            height: 50px;
            line-height: 50px;
            border-radius: 36px;
            background-image: linear-gradient(92deg, #63c5f6, #c908b9);
            color: #f8e71c;
            text-shadow: 8px 2px 20px rgba(0, 0, 0, 0.1);
            cursor: pointer;
          }
          .register {
            margin: 0 10px;
            min-width: 220px;
            height: 50px;
            line-height: 50px;
            border-radius: 36px;
            border-style: solid;
            border-width: 2px;
            color: #c409b4;
            text-shadow: 8px 2px 20px rgba(0, 0, 0, 0.1);
            cursor: pointer;
          }
        }
        .section-rule {
          text-align: left;
          margin-top: 100px;
          padding: 0 110px;
          .title {
            font-size: 20px;
            line-height: 1.5;
            color: #4a4a4a;
          }
          .text {
            font-size: 16px;
            line-height: 1.88;
            color: #636363;
          }
          .em {
            font-weight: 600;
            color: #4a4a4a;
          }

        }


      }
    }

    .panel-act2 {
      margin-top: 67px;
      .header {
        text-align: center;
        width: 620px;
        height: 70px;
        border-radius: 36px;
        background-image: linear-gradient(to left, #c308b4, #ffdf6d);
        box-shadow: 8px 2px 20px 0 rgba(0, 0, 0, 0.1);
        position: relative;
        margin: 0 auto;
        z-index: 999;
        .name {
          position: absolute;
          left: 39px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 24px;
          font-weight: 600;
          text-align: left;
          color: #fff;
        }
        .title {
          line-height: 70px;
          font-size: 32px;
          font-weight: 500;
          text-align: left;
          color: #fff67e;
          text-shadow: 8px 2px 20px rgba(0, 0, 0, 0.1);
          &.en {
            font-size: 20px;

          }
        }
      }
      .body {
        position: relative;
        top: -35px;
        width: 100%;
        min-height: 390px;
        background-size: 100% 100%;
        background-image: url("~assets/img/token/detail_box2.svg");
        background-repeat: no-repeat;

        .delivered-box {
          position: absolute;
          top: 111px;
          right: 128px;
          background-image: url("~assets/img/token/detail_circle.svg");
          background-repeat: no-repeat;
          background-size: 100% 100%;
          width: 210px;
          height: 210px;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 40px;
          line-height: 1.15;
          &.en {
            font-size: 28px;
          }
          .content {
            transform: rotate(-15deg);
          }
          .text {
            text-align: center;
            color: #612cb6;
          }
        }
        .section-rule {
          text-align: left;
          padding: 108px 115px 42px 115px;
          .title {
            font-size: 20px;
            line-height: 1.5;
            color: #4a4a4a;
          }
          .text {
            font-size: 16px;
            line-height: 1.88;
            color: #636363;
          }
          .em {
            font-weight: 600;
            color: #4a4a4a;
          }
          &.end {
            .title,
            .text,
            .em {
              color: #9b9b9b;
            }
          }
        }
      }
    }

    .panel-cet {
      margin-top: 65px;
      .header {
        width: 620px;
        height: 70px;
        border-radius: 36px;
        background-image: linear-gradient(91deg, #63c5f6, #c908b9);
        box-shadow: 8px 2px 20px 0 rgba(0, 0, 0, 0.1);
        z-index: 999;
        position: relative;
        text-align: center;
        line-height: 70px;
        font-size: 32px;
        font-weight: 500;
        color: #fff67e;
        margin: 0 auto;
      }
      .body {
        position: relative;
        top: -35px;
        width: 100%;
        min-height: 350px;
        background-size: 100% 100%;
        background-image: url("~assets/img/token/detail_box3.svg");
        background-repeat: no-repeat;
        .section-rule {
          padding: 109px 127px 83px 110px;
          text-align: left;
          color: #636363;
          .text {
            font-size: 16px;
            line-height: 1.88;
          }
          .text1 {
            margin-top: 48px;
            font-size: 14px;
          }
          .text2 {
            margin-top: 10px;
            font-size: 16px;
            line-height: 1.88;
          }
        }
      }
    }

    .panel-qrcode {
      display: flex;
      justify-content: center;
      padding-bottom: 85px;
      padding-top: 40px;
      .item {
        margin: 0 40px;
      }
      .text {
        margin-top: 10px;
        font-size: 16px;
        font-weight: 500;
        text-align: center;
        color: #ffffff;
      }
    }
  }
</style>
