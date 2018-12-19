<template>
  <div class="page-mining m-mobile">


      <div class="table-area">
        <div class="big-menu">
          {{tabItems}}
          <h2 :class="bigMenuIndex===2?'active':''" @click="onBigMenuClick(2)">挂单挖矿</h2>
          <!-- <h2 :class="bigMenuIndex===1?'active':''" @click="onBigMenuClick(1)">锁仓挖矿</h2> -->
          <h2 :class="bigMenuIndex===3?'active':''" @click="onBigMenuClick(3)">推荐返佣</h2>
          <!-- <h2 :class="bigMenuIndex===0?'active':''" @click="onBigMenuClick(0)">持仓分红</h2> -->
        </div>
        <div v-if="bigMenuIndex===0">
          <div v-if="info.userData" class="field-area">
            <div class="part">
              <p class="label">我的CET持仓</p>
              <p class="value">{{totalCET}}</p>
            </div>
            <div class="flex"></div>
            <div class="part">
              <p class="label">昨日分红累计折合</p>
              <p class="value">{{wrap(getVal(userMining, "yesterday.dividend.amount"))}} BCH</p>
            </div>
            <div class="flex"></div>
            <div class="part">
              <p class="label">历史分红收益</p>
              <p class="value">{{wrap(getVal(userMining, "history.dividend.amount"))}} BCH</p>
            </div>
          </div>
          <div v-else class="yesterday login" style="color:#333;">
            <language text="[link]登录[/link]后查看">
              <template slot="link" slot-scope="{ value }">
                <nuxt-link :to="'/account/signin?redirect='+encodeURIComponent('/mining')">{{value}}</nuxt-link>
              </template>
            </language>
          </div>
          <via-tab :index="tabIndex" :items="tabItems" @onChange="onTabChange"></via-tab>
          <div v-if="tabIndex === 0">
            <b-table class="m_table myDealTable" :fields="unAssignFields"  :items="unAssignItems"></b-table>
            <blank v-if="!unAssignItems.length"></blank>
          </div>
          <div v-else-if="tabIndex === 1">
            <b-table class="m_table myDealTable" :fields="historyFields"  :items="historyItems">
              <template slot="dividend" slot-scope="item">
                <p class="tc">{{amountAdapt(item.value.amount)}}</p>
              </template>
              <template slot="mining" slot-scope="item">
                <p class="tc">{{amountAdapt(item.value.amount)}}</p>
              </template>
              <template slot="mining_difficulty" slot-scope="item">
                <p class="tc">{{amountAdapt(item.value.amount)}}</p>
              </template>
              <template slot="dividend_rate" slot-scope="item">
                <p class="tc">{{fixedNum(item.value)}}%</p>
              </template>
            </b-table>
            <blank v-if="!historyItems.length"></blank>
            <b-pagination v-if="calHistoryNum.page>1" :total-rows="calHistoryNum.total" :value="currentHistoryPage" :per-page="calHistoryNum.perPage" align="right" size="sm" @input="gotoDivideHistoryPage" :prev-text="$t('global.prev_page')" :next-text="$t('global.next_page')" :hide-ellipsis="hideEndText" :hide-goto-end-buttons="hideEndText" ></b-pagination>
          </div>
          <div v-if="tabIndex === 2">
            <div class="user-selection">
              <b-input class="options" type="date" size="sm" v-model="dividendTime" required :min="minDividendTime" :max="maxDividendTime"/>
              <div class="divid-label">
                <span class="label">本日分红率：<span class="val">{{fixedNum(devidendItems.dividend_rate)}}%</span></span>
                <span class="label">累计折合：<span class="val">{{wrap(getVal(devidendItems, "total_dividend.amount"))}} {{wrap(getVal(devidendItems, "total_dividend.coin_type"))}}</span></span>
              </div>
            </div>
            <b-table class="m_table myDealTable" :fields="devidendFields"  :items="devidendItems.detail">
              <template slot="bch_amount" slot-scope="item">
                <p class="tc">{{item.value.amount}}</p>
              </template>
              <template slot="dividend_amount" slot-scope="item">
                <p class="tc">{{item.value.amount}}</p>
              </template>
            </b-table>
            <blank v-if="!devidendItems.detail || !devidendItems.detail.length"></blank>
          </div>
        </div>
        <!-- <div v-else-if="bigMenuIndex===1">
          <div v-if="info.userData" class="field-area">
            <div class="part">
                <p class="label">我的CET可用余额</p>
                <p class="value v-pb">{{wrap(getVal(lockInfo, "available"))}}</p>
                <p class="label">
                  <b-button v-if="lockInfo && lockInfo.available >= 10000" @click="isLockOperate=true;lockCETVisible=true;" variant="outline-green" class="btn-xxs" type="button">锁仓</b-button>
                  <b-button v-else variant="outline-gray" class="btn-xxs" type="button">锁仓</b-button>
                </p>
            </div>
            <div class="flex"></div>
            <div class="part">
              <p class="label">我的锁仓</p>
              <p class="value v-pb">
                <span>{{wrap(getVal(lockInfo, "lock"))}} CET</span>
              </p>
              <p class="label">
                <b-button v-if="lockInfo && lockInfo.lock > 0" @click="isLockOperate=false;lockCETVisible=true;" variant="outline-yellow" class="btn-xxs" type="button">解锁</b-button>
                <b-button v-else variant="outline-gray" class="btn-xxs" type="button">解锁</b-button>
              </p>
            </div>
            <div class="flex"></div>
            <div class="part">
              <p class="label v-pb-6">解锁中</p>
              <p class="value v-pb">
                <span>{{wrap(getVal(lockInfo, "unlock"))}} CET</span>
              </p>
              <p class="label">
                <b-button v-if="lockInfo && lockInfo.unlock > 0" @click="unlockRecodeVisible=true;reqUnlockRecords()" variant="outline-yellow" class="btn-xxs" type="button">撤销</b-button>
                <b-button v-else variant="outline-gray" class="btn-xxs" type="button">撤销</b-button>
              </p>
            </div>
            <div class="flex"></div>
            <div class="part">
              <p class="label first">参与挖矿锁仓总量</p>
              <p class="value v-pb">{{wrap(getVal(miningInfo, "mining_lock_amount"))}} CET</p>
              <p class="label first v-pb">平台锁仓总量</p>
              <p class="label v-pb">{{wrap(getVal(miningInfo, "lock_amount"))}} CET</p>
            </div>
          </div>
          <div v-else class="yesterday login" style="color:#333;">
              <language text="[link]登录[/link]后查看">
                  <template slot="link" slot-scope="{ value }">
                    <nuxt-link :to="'/account/signin?redirect='+encodeURIComponent('/mining')">{{value}}</nuxt-link>
                  </template>
              </language>
          </div>
          <via-tab :index="tabUserIndex" :items="tabUserItems" @onChange="onTabUserChange"></via-tab>
          <div v-if="tabUserIndex===0">
            <b-table class="m_table myDealTable" :fields="myLockMiningRecordsFields" :items="myLockMiningRecordsItems.data">
              <template slot="create_time" slot-scope="item">
                  <span>{{timeString(item.value * 1000)}}</span>
              </template>
              <template slot="mining_1000" slot-scope="item">
                  <p class="tc">{{amountAdapt(item.item.remark.per_amount)}}</p>
              </template>
              <template slot="mining_difficulty" slot-scope="item">
                  <p class="tc">{{amountAdapt(item.item.remark.lock_amount)}}</p>
              </template>
            </b-table>
            <b-pagination v-if="myLockMiningRecordsItems.total_page > 1" :total-rows="myLockMiningRecordsItems.total" :value="myLockMiningRecordsPage"
                          :per-page="10" align="right" size="sm" @input="reqLockMiningList"
                          :prev-text="$t('global.prev_page')" :next-text="$t('global.next_page')" :hide-ellipsis="hideEndText"
                          :hide-goto-end-buttons="hideEndText" ></b-pagination>
            <blank v-if="!myLockMiningRecordsItems.data || !myLockMiningRecordsItems.data.length"></blank>
          </div>
        </div> -->
        <div v-else-if="bigMenuIndex===2">
          <div v-if="info.userData" class="field-area">
            <div class="part">
              <p class="label">我的今日排名</p>
              <p class="value">{{wrap(getVal(myMakerMiningInfo, "today_rank"), "", true)}}</p>
            </div>
            <div class="flex"></div>
            <div class="part">
              <p class="label">今日累计积分</p>
              <p class="value">{{wrap(getVal(myMakerMiningInfo, "today_score"))}}</p>
            </div>
            <div class="flex"></div>
            <div class="part">
              <p class="label">昨日排名 | 获得奖励</p>
              <p class="value">{{wrap(getVal(myMakerMiningInfo, "yesterday_rank"), "", true)}} | {{wrap(getVal(myMakerMiningInfo, "yesterday_mining_amount"))}} CET</p>
            </div>
            <div class="flex"></div>
            <div class="part">
              <p class="label">历史获得奖励</p>
              <p class="value">{{wrap(getVal(myMakerMiningInfo, "total_mining_amount"))}} CET</p>
            </div>
          </div>
          <div v-else class="yesterday login" style="color:#333;">
            <language text="[link]登录[/link]后查看">
              <template slot="link" slot-scope="{ value }">
                <nuxt-link :to="'/account/signin?redirect='+encodeURIComponent('/mining')">{{value}}</nuxt-link>
              </template>
            </language>
          </div>
          <div v-else-if="tabOrderIndex===1">
            <div class="user-selection">
              <div class="divid-label">
              </div>
            </div>

          </div>
        </div>
        <div v-else-if="bigMenuIndex===3">
          <div v-if="info.userData" class="field-area">
            <div class="part">
              <p class="label">已推荐朋友</p>
              <p class="value">{{wrap(getVal(referInfo, "refer_num"))}}</p>
            </div>
            <div class="flex"></div>
            <div class="part">
              <p class="label">昨日返佣</p>
              <p class="value">{{wrap(getVal(referInfo, "yesterday_gift_sum"))}} CET</p>
            </div>
            <div class="flex"></div>
            <div class="part">
              <p class="label">已获得佣金</p>
              <p class="value v-pb">{{wrap(getVal(referInfo, "gift_sum"))}} CET</p>
              <p class="label main-color" ><nuxt-link :to="'/my/info/refer'">详细记录<span> ></span></nuxt-link></p>
            </div>
          </div>
          <div v-else class="yesterday login" style="color:#333;">
            <div text="[link]登录[/link]后查看">
              <template slot="link" slot-scope="{ value }">
                <nuxt-link :to="'/account/signin?redirect='+encodeURIComponent('/mining')">{{value}}</nuxt-link>
              </template>
            </div>
          </div>
          <via-tab :index="tabReferIndex" :items="tabReferItems"></via-tab>


            <br v-if="referHistoryItems.data && referHistoryItems.data.length"/>
          </div>
        </div>
      </div>

</template>

<script>
  import Vue from "vue";
  import { mapState } from "vuex";


  const pageSize = 10;
  const PREPARE_ONLINE = false;
  export default {
    components: {
    },
    data() {
      return {
        miningRuleLink: "https://support.coinex.com/hc/articles/360008522533",
        prepareOnLine: PREPARE_ONLINE,
        miningInfo: {},
        userMining: {},
        total: 36,
        accountCET: 1000,
        tabItems: ["待分配分红明细", "历史分配", "我的分红明细"],
        tabUserItems: ["我的锁仓挖矿产出明细"],
        tabOrderItems: ["今日排名", "历史奖励", "我的奖励"],
        tabReferItems: ["历史返佣"],
        tabIndex: 0,
        tabUserIndex: 0,
        tabOrderIndex: 0,
        tabReferIndex: 0,
        hideEndText: true,
        alertVisible: false,
        alertConditionVisible: false,
        currentUnAssignPage: 1,
        currentHistoryPage: 1,
        currentOrderMiningRankPage: 1,
        currentMyOrderMiningRankPage: 1,
        currentOrderMiningRankHistoryPage: 1,
        currentPlatformReferPage: 1,
        currentTradeHistoryPage: 1,
        bigMenuIndex: 2,
        referShow: false,
        lockCETVisible: false,
        qrcode: {
          val: "/mobile/activity/mining?refer_code=",
          secret: "",
          bgColor: "#FFFFFF",
          fgColor: "#000000",
          size: 120,
        },
        lockCETContext: {
          $t: this.$t,
          keyID: null,
          inputValue: {
            required: {
              vercode: "",
            },
            optional: {
              limit: false,
            },
          },
          errorText: {
            vercode: "",
          },
        },
        unAssignFields: {
          coin_type: {
            label: "币种",
            sortable: false,
            thStyle: {
              width: "180px",
            },
            thClass: ["ta-l", "pl-20", "coin-type"],
            tdClass: ["ta-l", "pl-20", "coin-type"],
          },
          mining_day: {
            label: "平台本日手续费收入",
            thClass: ["ta-r"],
            tdClass: ["ta-r", "pr-20", "middle-val"],
            sortable: false,
          },
          mining_hour: {
            label: "平台本小时手续费收入",
            thClass: ["ta-r"],
            tdClass: ["ta-r", "pr-20", "middle-val"],
            sortable: false,
          },
          dividend_all: {
            label: "累计待分配分红",
            thClass: ["ta-r", "pr-20", "last-row"],
            tdClass: ["ta-r", "pr-20", "last-row"],
            sortable: false,
          },
        },
        unAssignItems: [],
        historyFields: {
          report_date: {
            label: "日期",
            sortable: false,
            thStyle: {
              width: "180px",
            },
            thClass: ["ta-l", "pl-20", "datec"],
            tdClass: ["ta-l", "pl-20", "datec"],
          },
          dividend: {
            label: "分红累积折合（BCH）",
            thClass: ["ta-r", "middle-val"],
            tdClass: ["ta-r", "pr-20", "middle-val"],
            sortable: false,
          },
          dividend_rate: {
            label: "分红率",
            thClass: ["ta-r", "middle-val"],
            tdClass: ["ta-r", "pr-10", "middle-val"],
            sortable: false,
          },
        },
        info:{},
        historyInfo: {},
        historyItems: [],
        devidendFields: {
          coin_type: {
            label: "币种",
            sortable: false,
            thStyle: {
              width: "180px",
            },
            thClass: ["ta-l", "pl-20", "coin-type"],
            tdClass: ["ta-l", "pl-20", "coin-type"],
          },
          dividend_amount: {
            label: "分红收入",
            thClass: ["ta-r", "pr-30"],
            tdClass: ["ta-r", "pr-30"],
            sortable: false,
          },
          bch_amount: {
            label: "折合（BCH）",
            thClass: ["ta-r", "pr-20"],
            tdClass: ["ta-r", "pr-30"],
            sortable: false,
          },
        },
        devidendItems: [],
        miningDetailFields: {
          start_time: {
            label: "开始时间",
            sortable: false,
            thClass: ["ta-l", "pl-20"],
            tdClass: ["ta-l", "pl-20"],
          },
          end_time: {
            label: "截止时间",
            thClass: ["ta-c"],
            tdClass: ["ta-c"],
            sortable: false,
          },
          mining_diffculty: {
            label: "基准难度（CET/小时）",
            thClass: ["ta-r", "pr-30"],
            tdClass: ["ta-r", "pr-30"],
            sortable: false,
          },
          my_mining_diffculty: {
            label: "我的挖矿难度（CET/小时）",
            thClass: ["ta-r", "pr-30"],
            tdClass: ["ta-r", "pr-30"],
            sortable: false,
          },
          mining_amount: {
            label: "交易挖矿产出（CET）",
            thClass: ["ta-r", "pr-20"],
            tdClass: ["ta-r", "pr-30"],
            sortable: false,
          },
        },
        miningDetailItems: [],
        dividendTime: 0,
        minDividendTime: "",
        maxDividendTime: "",
        miningTime: 0,
        serverTime: 0,
        makerTime: 0,
        minMakerTime: 0,
        maxMakerTime: 0,
        referCode: "",
        isPhone: false,
        minMiningTime: "",
        maxMiningTime: "",
        currentTimeZoneHour: "",
        userMenuIndex: 0,
        lockNum: "",
        lockTotal: 0,
        unlockRecodeVisible: false,
        unlockRecordData: {},
        currentLockRecordPage: 1,
        unlockRecordFields: {
          create_time: {
            label: "解锁发起时间",
            sortable: false,
            thStyle: {
              width: "180px",
            },
            thClass: ["ta-l", "pl-20", "coin-type"],
            tdClass: ["ta-l", "pl-20", "coin-type"],
          },
          amount: {
            label: "解锁数量（CET）",
            thClass: ["ta-r", "pr-20"],
            tdClass: ["ta-r", "pr-30"],
            sortable: false,
          },
          arrive_time: {
            label: "到账时间",
            thClass: ["ta-c", "pr-20"],
            tdClass: ["ta-c", "pr-20"],
            sortable: false,
          },
          operation: {
            label: "操作",
            thClass: ["ta-r", "pr-20"],
            tdClass: ["ta-r", "pr-20"],
            thStyle: {
              width: "60px",
            },
            sortable: false,
          },
        },
        miningHistoryFields: {
          report_date: {
            label: "日期",
            sortable: false,
            thStyle: {
              width: "180px",
            },
            thClass: ["ta-l", "pl-20", "coin-type"],
            tdClass: ["ta-l", "pl-20", "coin-type"],
          },
          mining: {
            label: "交易挖矿产出",
            thClass: ["ta-r", "pr-30"],
            tdClass: ["ta-r", "pr-30"],
            sortable: false,
          },
          mining_difficulty: {
            label: "基准难度（CET/小时）",
            thClass: ["ta-r", "pr-20"],
            tdClass: ["ta-r", "pr-30"],
            sortable: false,
          },
        },
        rangeTodayFields: {
          rank: {
            label: "排名",
            thStyle: {
              width: "180px",
            },
            thClass: ["ta-c", "br-1"],
            tdClass: ["ta-c", "br-1"],
            sortable: false,
          },
          score: {
            label: "积分",
            thClass: ["ta-c"],
            tdClass: ["ta-c"],
            sortable: false,
          },
        },
        rangeTodayItems: {},
        rangeHistoryFields: {
          rank: {
            label: "排名",
            thStyle: {
              width: "180px",
            },
            thClass: ["pl-20", "ta-l"],
            tdClass: ["pl-20", "ta-l"],
            sortable: false,
          },
          score: {
            label: "积分",
            thClass: ["ta-r", "pr-30"],
            tdClass: ["ta-r", "pr-30"],
            sortable: false,
          },
          mining_amount: {
            label: "奖励（CET）",
            thClass: ["ta-r", "pr-20"],
            tdClass: ["ta-r", "pr-30"],
            sortable: false,
          },
        },
        rangeHistoryItems: {},
        myRangeHistoryFields: {
          create_time: {
            label: "日期",
            sortable: false,
            thStyle: {
              width: "180px",
            },
            thClass: ["ta-l", "pl-20", "coin-type"],
            tdClass: ["ta-l", "pl-20", "coin-type"],
          },
          rank: {
            label: "排名",
            thClass: ["ta-r", "pr-30"],
            tdClass: ["ta-r", "pr-30"],
            sortable: false,
          },
          score: {
            label: "积分",
            thClass: ["ta-r", "pr-30"],
            tdClass: ["ta-r", "pr-30"],
            sortable: false,
          },
          mining_amount: {
            label: "奖励（CET）",
            thClass: ["ta-r", "pr-20"],
            tdClass: ["ta-r", "pr-30"],
            sortable: false,
          },
        },
        myRangeHistoryItems: {},
        referHistoryFields: {
          report_date: {
            label: "日期",
            sortable: false,
            thStyle: {
              width: "180px",
            },
            thClass: ["ta-c", "coin-type"],
            tdClass: ["ta-c", "coin-type"],
          },
          refer_amount: {
            label: "当日返佣累计（CET）",
            thClass: ["ta-c"],
            tdClass: ["ta-c"],
            sortable: false,
          },
        },
        referHistoryItems: {},
        lockInfo: {},
        isLockOperate: true,
        miningMsg: "你本小时可挖CET将从 [num1] 变为 [num2]",
        isLockProcessing: false, // 是否在解锁或者锁仓
        referInfo: {},
        myMakerMiningInfo: {},
        tradeHistoryRecord: {},
        myLockMiningRecordsFields: {
          create_time: {
            label: "日期",
            sortable: false,
            thStyle: {
              width: "180px",
            },
            thClass: ["ta-l", "pl-20", "coin-type"],
            tdClass: ["ta-l", "pl-20", "coin-type"],
          },
          mining_difficulty: {
            label: "我的锁仓",
            thClass: ["ta-r", "pr-30"],
            tdClass: ["ta-r", "pr-30"],
            sortable: false,
          },
          mining_1000: {
            label: "每[num]CET收益".replace(/\[num\]/, 10000),
            thClass: ["ta-r", "pr-30"],
            tdClass: ["ta-r", "pr-30"],
            sortable: false,
          },
          amount: {
            label: "我的收益",
            thClass: ["ta-r", "pr-20"],
            tdClass: ["ta-r", "pr-20"],
            sortable: false,
          },
        },
        myLockMiningRecordsItems: [],
        myLockMiningRecordsPage: 1,
      };
    },
    mounted() {
      this.$nextTick(() => {
        this.currentTimeZoneHour = this.wrapTime(this.serverTime).time;

        this.showUserAlert();
        this.onBigMenuClick(this.bigMenuIndex, true);

        if (this.info.userData) {
          this.$store.dispatch("updateReferCode").then(() => {
            if (this.info.referCode) {
              this.referCode = this.info.referCode;
              const url =
                this.qrcode.val.indexOf(location.origin) >= 0
                  ? this.qrcode.val
                  : location.origin + this.qrcode.val;
              this.qrcode.val = url + this.referCode + "&lang=" + this.lang.lang;
            }
          });
          this.reqLockInfo();
        }
      });
    },



    head() {
      return {
        title: "挖矿" ,
      };
    },
    computed: Object.assign(mapState(["assets", "info", "funds", "lang"]), {
      lockmsg() {
        return "最多可锁仓 [num]份（1份=10000 CET）".replace(
          /\[num\]/,
          `<span clas="num-color" style="color: #ffbc32;">${parseInt(
            this.lockInfo.available / 10000
          )}</span>`
        );
      },
      unlockmsg() {
        return "最多可解锁 [num]份（1份=10000 CET）".replace(
          /\[num\]/,
          `<span clas="num-color" style="color: #ffbc32;">${this.lockInfo.lock /
          10000}</span>`
        );
      },
      miningLockMsg() {
        return this.miningMsg
          .replace(
            /\[num1\]/,
            `<span class="color-red">${this.lockInfo.difficulty || 0} CET</span>`
          )
          .replace(
            /\[num2\]/,
            `<span class="color-red">${this.myNewDiffculty || 0} CET</span>`
          );
      },
      myNewDiffculty() {
        const newVal = this.isLockOperate
          ? parseInt(this.lockInfo.difficulty) +
          parseInt(this.lockTotal / 10000) *
          (this.getVal(this.miningInfo, "mining_difficulty.amount") || 0)
          : this.lockInfo.difficulty -
          this.lockTotal /
          10000 *
          (this.getVal(this.miningInfo, "mining_difficulty.amount") || 0);
        return newVal < 0.0000001 ? 0 : newVal;
      },
      lockConfirmTitle() {
        return this.isLockOperate ? "确定锁仓" : "确定解锁";
      },
      lockTitle() {
        return this.isLockOperate ? "锁仓CET" : "解锁CET";
      },
      indicateVal() {
        const alreadyMining =
          this.getVal(this.miningInfo, "already_mining") || 0;

        return alreadyMining / this.total / 100000000 * 100;
      },
      calHistoryNum() {
        return {
          total: this.historyInfo.total || 0,
          perPage: pageSize,
          page: this.historyInfo.total_page || 0,
        };
      },
      unlockRecordsNum() {
        return {
          total: this.historyInfo.total || 0,
          perPage: pageSize,
          page: this.historyInfo.total_page || 0,
        };
      },
      miningLink() {
        if (this.lang.lang === "zh_Hans_CN") {
          return "/help/article?id=125";
        } else if (this.lang.lang === "zh_Hant_HK") {
          return "/help/article?id=126";
        } else {
          return "/help/article?id=127";
        }
      },

      diviendTimeArr() {
        // 挖矿活动开始时间  UTC 7月1日00:00:00
        let beginTime = Date.UTC(2018, 6, 1, 0, 0, 0, 0) / 1000;
        const result = [beginTime];
        const endtime = this.serverTime - 24 * 60 * 60;
        while (beginTime < endtime) {
          beginTime += 24 * 60 * 60;
          result.push(beginTime);
        }

        return result;
      },

      timeArr() {
        // 挖矿活动开始时间  UTC 7月1日00:00:00
        let beginTime = Date.UTC(2018, 6, 1, 0, 0, 0, 0) / 1000;
        const result = [beginTime];
        while (beginTime < this.serverTime) {
          beginTime += 24 * 60 * 60;
          result.push(beginTime);
        }

        return result;
      },
      totalCET() {
        const result = this.utils.parseProperty(this.funds, "funds.CET.available");
        const resultFrozen = this.utils.parseProperty(this.funds, "funds.CET.frozen");

        let total = 0;
        const avail = parseFloat(result);
        const frozen = parseFloat(resultFrozen);
        if (!isNaN(avail)) {
          total += avail;
        }
        if (!isNaN(frozen)) {
          total += frozen;
        }

        if (result == null) {
          return "-";
        }

        return (total + "").scientificToDecimal();
      },
    }),
    methods: {
      getRankItems(list, index = 0, count = 20) {
        const result = [];

        for (let i = 0; i < count; i++) {
          if (list && list[i + index]) {
            result.push(list[i + index]);
          } else {
            result.push({});
          }
        }

        return result;
      },

      timeString(time) {
        const date = new Date(time);
        return this.utils.dateformat(date, "yyyy.MM.dd");
      },
      onBigMenuClick(index, isFirst) {
        if (this.bigMenuIndex === index && !isFirst) {
          return;
        }

        this.bigMenuIndex = index;

        switch (index) {
          case 0: {
            this.reqUserMining();
            this.reqUserDividend();
          } break;
          case 1: {
            this.reqLockMiningList();
          } break;
          case 2: {
            this.reqMyOrderRankInfo();
            this.reqOrderMiningRank(this.currentOrderMiningRankPage);
            this.reqOrderMiningRankHistory(this.currentOrderMiningRankHistoryPage);
            this.reqMyOrderMiningRankHistory(this.currentMyOrderMiningRankPage);
          } break;
          case 3: {
            this.reqPersonalRefer();
            this.reqPlatformRefer(this.currentPlatformReferPage);
          } break;
        }
      },

      // 获取我的锁仓挖矿产出明细
      reqLockMiningList(page = 1) {
        if (!this.info.userData) {
          return;
        }
        const _this = this;
        this.myLockMiningRecordsPage = page;
        this.axios.get("/res/mining/dividend/list", {
          params: {
            limit: 20,
            page,
          },
        }).then(res => {
          this.utils.handleRequest(res, _this, {
            "0": function() {
              _this.myLockMiningRecordsItems = res.data.data || {};
            },
          });
        });
      },

      // 查询我的挂单挖矿信息
      reqMyOrderRankInfo() {
        if (!this.info.userData) {
          return;
        }
        const _this = this;
        this.axios.get("/res/mining/maker/info/my").then(res => {
          this.utils.handleRequest(res, _this, {
            "0": function() {
              _this.myMakerMiningInfo = res.data.data || {};
              _this.myMakerMiningInfo.yesterday_rank = parseInt(_this.myMakerMiningInfo.yesterday_rank) === 0 ? "" : _this.myMakerMiningInfo.yesterday_rank;
            },
          });
        });
      },

      // 查询挂单挖矿实时排名
      reqOrderMiningRank(page = 1) {
        const _this = this;
        this.currentOrderMiningRankPage = page;
        this.axios.get("/res/mining/maker/rank", {
          params: {
            limit: 50,
            page,
          },
        }).then(res => {
          this.utils.handleRequest(res, _this, {
            "0": function() {
              _this.rangeTodayItems = res.data.data || {};
            },
          });
        });
      },

      // 查询挂单挖矿历史
      reqOrderMiningRankHistory(page = 1) {
        const _this = this;
        this.currentOrderMiningRankHistoryPage = page;
        this.axios.get("/res/mining/maker/history", {
          params: {
            timestamp: dateTimeUtils.text2UTCSecond(this.makerTime),
            limit: 50,
            page,
          },
        }).then(res => {
          this.utils.handleRequest(res, _this, {
            "0": function() {
              _this.rangeHistoryItems = res.data.data || {};
            },
          });
        });
      },

      // 查询我的挂单挖矿历史
      reqMyOrderMiningRankHistory(page = 1) {
        if (!this.info.userData) {
          return;
        }
        const _this = this;
        this.currentMyOrderMiningRankPage = page;
        this.axios.get("/res/mining/maker/history/my", {
          params: {
            limit: 20,
            page,
          },
        }).then(res => {
          this.utils.handleRequest(res, _this, {
            "0": function() {
              _this.myRangeHistoryItems = res.data.data || {};
            },
          });
        });
      },

      // 查询个人返佣
      reqPersonalRefer() {
        if (!this.info.userData) {
          return;
        }
        const _this = this;
        this.axios.get("/res/activity/refer").then(res => {
          this.utils.handleRequest(res, _this, {
            "0": function() {
              _this.referInfo = res.data.data || {};
            },
          });
        });
      },

      // 查看平台返佣历史
      reqPlatformRefer(page = 1) {
        const _this = this;
        this.currentPlatformReferPage = page;
        this.axios.get("/res/activity/refer/history/summary", {
          params: {
            limit: 40,
            page,
          },
        }).then(res => {
          this.utils.handleRequest(res, _this, {
            "0": function() {
              _this.referHistoryItems = res.data.data || {};
            },
          });
        });
      },
      cancelUnlock(id) {
        const _this = this;
        this.axios.delete("/res/mining/lock/" + id).then(res => {
          this.utils.handleRequest(res, _this, {
            "0": function() {
              _this.unlockRecordData = res.data.data || { data: [] };
              _this.reqUnlockRecords(this.currentLockRecordPage);
              _this.$store.dispatch("setSuccessText", "撤销成功");
              _this.reqLockInfo();
            },
          });
        });
      },
      cccc(id) {
        const _this = this;
        this.axios.delete("/res/mining/lock/" + id).then(res => {
          this.utils.handleRequest(res, _this, {
            "0": function() {
              _this.unlockRecordData = res.data.data || { data: [] };
              _this.reqUnlockRecords(this.currentLockRecordPage);
              _this.$store.dispatch("setSuccessText", "撤销成功");
              _this.reqLockInfo();
            },
          });
        });
      },
      inputChange() {
        const val = this.$refs.inputLock.value;
        let num = parseInt(val);
        if (!isNaN(num)) {
          const lockMax = parseInt(this.lockInfo.available / 10000);
          if (this.isLockOperate && num > lockMax) {
            num = lockMax;
          }
          const unLockMax = parseInt(this.lockInfo.lock / 10000);
          if (!this.isLockOperate && num > unLockMax) {
            num = unLockMax;
          }
          this.lockNum = num + "";
          this.$refs.inputLock.value = this.lockNum;
          this.lockTotal = 10000 * num;
        } else {
          this.lockNum = "";
          this.$refs.inputLock.value = "";
          this.lockTotal = 0;
        }
      },
      reqUnlockRecords(page = 1) {
        this.currentLockRecordPage = page;
        const _this = this;
        this.axios
          .get("/res/mining/lock", {
            params: {
              page: page,
              limit: 10,
              business: "unlock",
              status: "created",
            },
          })
          .then(res => {
            this.utils.handleRequest(res, _this, {
              "0": function() {
                _this.unlockRecordData = res.data.data || { data: [] };
              },
            });
          });
      },
      reqLockInfo() {
        const _this = this;
        this.axios.get("/res/mining/lock/info").then(res => {
          this.utils.handleRequest(res, _this, {
            "0": function() {
              _this.lockInfo = res.data.data || {};
            },
          });
        });
      },
      lockOrUnlock() {
        const _this = this;
        const amount = parseInt(this.lockTotal / 10000);
        if (amount <= 0 || this.isLockProcessing) {
          return;
        }
        this.isLockProcessing = true;
        this.axios
          .post("/res/mining/lock", {
            amount: amount,
            business: this.isLockOperate ? "lock" : "unlock",
          })
          .then(res => {
            this.isLockProcessing = false;
            this.utils.handleRequest(res, _this, {
              "0": function() {
                _this.$store.dispatch("setSuccessText", res.data.message);
                _this.lockCETVisible = false;
                _this.reqLockInfo();
                _this.$refs.inputLock.value = "";
              },
            });
          })
          .catch(() => {
            this.isLockProcessing = false;
          });
      },
      onTabChange(index) {
        this.tabIndex = index;
      },
      onTabUserChange(index) {
        this.tabUserIndex = index;
      },
      onTabOrderChange(index) {
        this.tabOrderIndex = index;
      },
      amountAdapt(val) {
        if (this.isPhone) {
          val = (val || "") + "";
          if (val.length > 11 && val.indexOf(".") >= 0) {
            if (val.indexOf(".") < 11) {
              return val.substr(0, 12);
            } else {
              return val.substr(0, val.indexOf("."));
            }
          } else {
            return val;
          }
        } else {
          return val;
        }
      },
      fixedNum(val) {
        if (val && !isNaN(parseFloat(val))) {
          return (parseFloat(val) * 100).toFixed(2);
        }
        return "-";
      },
      wrapTime(timeStampt) {
        const date = new Date(timeStampt * 1000);
        const wrapNum = num => {
          return parseFloat(num) < 10 ? "0" + num : num;
        };
        return {
          date: `${date.getFullYear()}.${wrapNum(date.getMonth() + 1)}.${wrapNum(
            date.getDate()
          )}`,
          time: `${wrapNum(date.getHours())}:${wrapNum(
            date.getMinutes()
          )}:${wrapNum(date.getSeconds())}`,
        };
      },
      wrapDate(dateStr, addDay) {
        dateStr = (dateStr + "").replace("/-/g", "/");
        let oDate = new Date(dateStr).getTime() / 1000;
        if (addDay) {
          oDate += 24 * 60 * 60;
        }
        return this.wrapTime(oDate).date;
      },
      // 获取当前用户分红历史
      reqUserDividend() {
        if (!this.info.userData) {
          return;
        }
        const time = dateTimeUtils.text2UTCSecond(this.dividendTime);
        this.axios
          .get("/res/mining/dividend/history/my?start_time=" + time)
          .then(res => {
            if (res.data && !res.data.code) {
              this.devidendItems = res.data.data || {};
            }
          });
      },

      // 获取当前用户分红历史
      reqUserMiningHistory() {
        if (!this.info.userData) {
          return;
        }

        const time = dateTimeUtils.text2UTCSecond(this.miningTime);
        this.axios
          .get("/res/mining/mining/history/my?start_time=" + time)
          .then(res => {
            if (res.data && !res.data.code) {
              this.miningDetailItems = res.data.data || {};
            }
          });
      },
      gotoDivideHistoryPage(page = 1) {
        this.currentHistoryPage = page;
        this.axios
          .get("/res/mining/dividend/history?page=" + page + "&limit=" + pageSize)
          .then(res => {
            if (res.data && !res.data.code) {
              this.historyItems = res.data.data.data || [];
              this.historyInfo = res.data.data || {};
            }
          });
      },
      gotoAuth() {
        this.$router.push("/my/info/basic");
      },
      gotoRule() {
        if (typeof sessionStorage !== "undefined") {
          sessionStorage.Mining_Condition_Alert_Shown = true;
        }
        // TODO: 跳转至活动页

        this.alertConditionVisible = false;
        window.open(this.miningRuleLink);
      },
      wrap(val, defaultVal, noZero) {
        if (parseFloat(val) === 0 && noZero) {
          return "- -";
        }

        return ((val || defaultVal || "- -") + "").toUpperCase();
      },
      getVal(obj, field) {
        const num = this.utils.parseProperty(obj, field);

        if (num != null) {
          return (num + "").scientificToDecimal();
        }
        return num;
      },
      showUserAlert() {
        if (typeof sessionStorage !== "undefined") {
          if (!sessionStorage.Mining_Condition_Alert_Shown) {
            this.alertConditionVisible = true;
            sessionStorage.Mining_Condition_Alert_Shown = true;
          }
        }
      },
      // 获取用户的挖矿收益
      reqUserMining() {
        if (PREPARE_ONLINE || !this.info.userData) {
          return;
        }

        this.axios.get("/res/mining/info/my").then(res => {
          if (res.data && !res.data.code) {
            this.userMining = res.data.data || {};
          }
        });
      },
    },
    watch: {
      "info.userData": function() {},
      // dividendTime() {
      //   this.reqUserDividend();
      // },
      // miningTime() {
      //   this.reqUserMiningHistory();
      // },
      makerTime() {
        this.reqOrderMiningRankHistory();
      },
    },
  };
</script>

<style lang="scss" scoped>
  .page-mining {
    position: relative;
    .operation {
      color:#0fd1c5;
      cursor: pointer;
    }
    .flexshow {
      display: flex;
      .flex {
        flex: 1;
      }
      .flex-table {
        flex: 1;
        border: 1px solid #e9ecef;
        .br-1 {
          border-right: 1px solid #e9ecef;
        }
      }
    }
    .page-mining-bg {
      position: absolute;
      text-align: center;
      background-color: #253244;
      height: 302px;
      max-width: 100%;
      overflow: hidden;
      width: 100%;
      img {
        height: 302px;
        width: 100%;
      }
    }

    .btn-container {
      margin-top: 40px;
    }

    .main-area {
      padding-top: 85px;
      padding-bottom: 133px;
      width: 1200px;
      margin: 0 auto;
      min-height: 900px;
      position: relative;

      .refer-info {
        display: inline-block;
        position: relative;

        .tri-box {
          width: 170px;
          height: 176px;
          margin: auto;
          margin-top: -220px;
          padding-top: 20px;
          position: absolute;
          left: -20px;

          &.hide {
            display: none;
          }

          .tri-container {
            background-color: #ffffff;
            text-align: center;
            font-size: 12px;
            position: relative;

            .closeimg {
              position: absolute;
              top: 10px;
              right: 10px;
            }

            &::after {
              display: block;
              width: 20px;
              content: " ";
              position: absolute;
              border-bottom: 0px solid #fff;
              border-top: 10px solid #fff;
              border-left: 10px solid transparent;
              border-right: 10px solid transparent;
              bottom: -20px;
              height: 20px;
              margin: auto;
              left: 75px;
            }
          }

          .scan-code {
            height: 170px;
            text-align: center;
            .qrcode-content {
              padding-top: 20px;
              margin-left: 25px;
              margin-bottom: 6px;
            }
            .text {
              color: #6f6f6f;
            }
          }

          .op-area {
            margin-top: 14px;

            button {
              width: 100px;
              height: 30px;
              font-size: 14px;
              line-height: 26px;
              width: auto;
              min-width: 100px;
              margin: 0 10px;
              margin-bottom: 10px;

              a:hover {
                color: #fff;
                text-decoration: none;
              }
            }

            .btnop {
              border-radius: 100px;
              padding: 0px 10px;
              display: inline-block;
              font-size: 14px;
              line-height: 26px;
              margin: 0 10px;
              text-decoration: none;
              min-width: 100px;
              margin-bottom: 10px;
            }
          }
        }
      }

      .cur-progress {
        .title-area {
          color: #0fd1c5;
          font-size: 18px;
          .label {
            margin-right: 3px;
            color: #ffffff;
          }
        }

        .indicate {
          height: 30px;
          border-radius: 15px;
          position: relative;
          width: 100%;
          margin-top: 6px;
          overflow: hidden;
          background-image: linear-gradient(
              to top,
              #192330,
              #113541 50%,
              #192330
          );

          .pointer {
            height: 22px;
            border-radius: 11px;
            background-image: linear-gradient(to bottom, #22e6b8, #02a5b0);
            position: absolute;
            top: 4px;
            left: 0;
          }
        }
      }

      .intro-link {
        margin-top: 20px;
        text-align: center;
        font-size: 14px;
        a {
          color: #e2e2e2;
        }
      }

      .detail-fields {
        display: flex;
        margin-top: 58px;
        // padding-bottom: 30px;
        position: relative;
        .part:nth-child(3) {
          // position: absolute;
        }
        .flex {
          flex: 1;
        }
        .part:last-child {
          white-space: nowrap;
        }
        .part {
          font-size: 14px;
          line-height: 16px;
          .label {
            color: #9b9b9b;
          }

          .blockshow {
            display: block;
            margin-top: 6px;
          }

          .pbottom {
            padding-bottom: 25px;
          }

          .value {
            color: #0fd1c5;
          }

          .total {
            color: #0fd1c5;
            font-size: 24px;
            line-height: 28px;
            font-weight: 100;
          }

          .field {
            margin: 14px 0;
            .color-gray {
              text-decoration: none;
            }

            .logo-link {
              color: #0fd1c5;
              // text-decoration: underline;
            }
          }

          a {
            color: #e2e2e2;
          }

          .white {
            color: #fff;
          }

          &.last {
            .label-val {
              color: #9b9b9b;
            }
          }
        }
      }

      .flex {
        flex: 1;
      }

      .user-menu {
        margin-top: 65px;
        color: #fff;
        display: flex;
        font-size: 14px;
        .menu-item {
          border: solid 1px #979797;
          border-right-width: 0;
          padding: 5px 12px;
          user-select: none;
          cursor: pointer;
          &.active {
            background-image: linear-gradient(to left, #ffe070, #ffb900);
            border: solid 1px #ffb900;
            color: #0c353d;
          }
          &.lastc {
            border-left: 0;
            border-right-width: 1px;
          }
        }
      }

      .main-color {
        color: #52cbca !important;
        cursor: pointer;
      }

      .yesterday {
        height: 100px;
        background-color: #ffffff;
        box-shadow: 0 0 20px 0 rgba(0, 0, 0, 0.1);
        margin-top: 135px;
        display: flex;

        &.nop {
          margin-top: 0;
        }

        &.login {
          font-size: 24px;
          text-align: center;
          line-height: 100px;
          margin-top: 0;
          box-shadow: none;
          font-weight: normal;
          margin-top: 10px;
          .component-language {
            margin: auto;
          }
          a {
            margin: 0 3px;
          }
        }

        &.online {
          display: block;
          text-align: center;
          .online-mark {
            font-size: 18px;
            padding: 45px 0 10px 0;
          }

          .view-rule {
            font-size: 14px;
          }
        }

        .part {
          flex: 1;
          text-align: center;
          &.bor {
            border-right: solid 1px #eeeeee;
          }
          &.main {
            background-image: linear-gradient(to left, #22e6b8, #00c1ce);
            position: relative;

            &::after {
              content: " ";
              position: absolute;
              right: 0px;
              border-bottom: 20px solid #22e6b8;
              border-top: 20px solid #22e6b8;
              border-left: 0px solid #fff;
              border-right: 20px solid #fff;
              top: 0;
              bottom: 0;
              height: 20px;
              margin: auto;
            }

            .mymark {
              height: 24px;
              background-image: linear-gradient(to left, #ffe070, #ffb900);
              line-height: 24px;
              position: absolute;
              font-size: 14px;
              color: #0a3239;
              min-width: 56px;
              padding: 0px 10px;
              top: 0;
              left: -10px;

              &::before {
                content: " ";
                position: absolute;
                border-bottom: 10px solid transparent;
                border-top: 0px;
                border-left: 0px solid #6f6f6f;
                border-right: 10px solid #6f6f6f;
                bottom: -10px;
                height: 10px;
                left: 0;
                margin: auto;
              }
            }
          }
          .label {
            color: #6f6f6f;
            font-size: 14px;
            line-height: 1.14;
            margin-top: 28px;
            &.first {
              margin-top: 18px;
            }
            &.last {
              margin-top: 16px;
            }
          }

          .label:last-child {
            margin-top: 20px;
          }

          .value {
            color: #192330;
            font-size: 20px;
            line-height: 22px;
            margin-top: 10px;
          }

          .txt-wrap {
            margin-left: 3px;
          }

          .svalue {
            margin-top: 10px;
          }
        }
      }

      .field-area {
        display: flex;
        padding: 25.9px 21px;
        .flexshow {
          display: flex;
          .btn-xxs {
            margin-top: 2px;
            margin-left: 9px;
          }
        }
        .flex {
          flex: 1;
        }
        .part {
          .label {
            color: #6f6f6f;
            font-size: 14px;
          }
          .value {
            font-size: 20px;
            line-height: 1.1;
            margin-top: 10px;
          }
          .v-pb {
            margin-bottom: 10px;
          }
          .v-pb-6 {
            margin-bottom: 6px;
          }
          .main-color {
            font-size: 14px;
            margin-top: 0px;
          }

          .small-size {
            font-size: 14px;
          }

          .btn-xxs {
            height: 24px;
            border-width: 1px;
          }
        }
      }

      .table-area {
        padding-top: 32px;
        min-height: 300px;
        h2 {
          height: 36px;
          text-align: center;
          font-size: 36px;
        }
        margin-top: 10px;
        background-color: #fff;
        box-shadow: 0 0 20px 0 rgba(0, 0, 0, 0.1);

        .big-menu {
          text-align: center;
          padding-bottom: 32px;
          border-bottom: 1px solid #eeeeee;

          h2 {
            user-select: none;
            height: 38px;
            border: 1px solid #d2d2d2;
            line-height: 36px;
            font-size: 20px;
            display: inline-block;
            min-width: 160px;
            padding: 0 34px;
            color: #898989;
            border-radius: 20px;
            font-weight: 200;
            // margin-right: 10px;
            margin: 0 20px;
            font-weight: normal;
            cursor: pointer;

            &.active {
              color: #52cbca;
              border: 1px solid #52cbca;
            }
          }

          h2:last-child {
            margin-right: 0px;
          }
        }

        .user-selection {
          padding: 10px 20px;
          .custom-select {
            padding: 5px 10px;
          }

          &.flexshow {
            display: flex;
          }
          input[type="date"]::-webkit-calendar-picker-indicator {
            visibility: visible !important;
            display: inline !important;
            opacity: 1 !important;
          }
          .options {
            width: 140px;
            height: 30px;
            border: 1px solid #dddddd;
            display: inline-block;
            user-select: none;

            &.small {
              width: 100px;
            }

            &.big {
              width: 175px;
            }

            .date {
              color: #666;
            }

            .time {
              color: #999;
              margin-left: 6px;
            }

            input {
              user-select: none;
            }
          }
          .time-label {
            width: 160px;
            height: 30px;
            color: #a5a5a5;
            border: 1px solid #dddddd;
            line-height: 28px;
            padding-left: 14px;
            margin-left: 10px;
            display: inline-block;

            &.tmark {
              width: auto;
              border-color: transparent;
              padding: 0;
              position: absolute;
              left: 100px;
              font-size: 13px;
              line-height: 27.5px;
            }
          }
          .divid-label {
            float: right;
            .val {
              font-size: 18px;
              color: #52cbca;
              line-height: 30px;
            }

            .label {
              margin-left: 19px;
            }
          }
        }
      }
    }
  }
</style>

<style lang="scss">
  .page-mining {
    .main-color {
      color: #52cbca !important;
      cursor: pointer;
    }
    .btn-outline-gray {
      color: #bdbdbd;
      border-color: #bdbdbd;
    }
    .btn-gradient-gray {
      color: #fff;
      background-color: #bdbdbd;
    }
    .btn-outline-gray:hover {
      background-color: #fff;
      color: #bdbdbd;
      border-color: #bdbdbd;
    }
    .record-table {
      .modal-dialog {
        max-width: 650px;
      }
      .modal-body {
        padding-left: 0;
        padding-right: 0;
      }
    }
    .modal-body {
      max-height: 620px;
    }
    .modal-msg {
      font-size: 16px;
      color: #999;
      margin: 5px 0;
      .label {
        color: #666;
      }
    }
    .table-area {
      .table thead th {
        background-color: #f9f9f9;
      }
      .tab-root {
        padding-top: 10px;
        .container {
          padding-left: 20px;
          text-align: left;
          margin-left: 0px;
          .item {
            font-size: 16px;
            width: auto;
            padding: 0 10px;
            margin-right: 10px;
          }
        }
      }
    }

    .lock-msg {
      color: #6f6f6f;
      font-size: 14px;
      padding-bottom: 8px;
      .num-color {
        color: #ffbc32;
      }
    }
    .input-area {
      display: flex;
      .lock-input {
        width: 100px;
        text-indent: 8px;
        height: 40px;
        border: 1px solid #d1d1d1 !important;
        line-height: 38px;
        font-size: 16px;
        color: #192330;
      }
      .method {
        font-size: 16px;
        line-height: 38px;
        color: #6f6f6f;
        margin: 0 10px;
      }
      .unit {
        width: 150px;
        height: 40px;
        border: 1px solid #d1d1d1;
        line-height: 38px;
        text-indent: 10px;
        font-size: 16px;
        color: #192330;
      }
      .total {
        color: #192330;
        font-size: 20px;
        line-height: 38px;
        .inall {
          margin: 0 10px;
          color: #6f6f6f;
        }
      }
    }
    .lock-tip {
      margin-top: 20px;
      color: #6f6f6f;
      p {
        margin-top: 6px;
      }
    }
  }

  .body-l {
    .page-mining {
      .main-area {
        .table-area {
          .big-menu {
            h2 {
              font-size: 16px;
            }
          }
          .tab-root {
            .container {
              height: 36px;
              overflow: hidden;
              .item {
                line-height: 36px;
                height: 36px;
                font-size: 14px;
              }
            }
          }
        }
      }
    }
  }
</style>
