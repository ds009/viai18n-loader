<template>
  <div class="component-trade-depth">
    <div class="merge-section">
      <div class="depth-type">
        <span class="ask" @click="changeViewType(0)"></span>
        <span class="bid" @click="changeViewType(1)"></span>
        <span class="all" @click="changeViewType(2)"></span>
      </div>
      <div class="merge-option">
        <span class="name">合并深度：</span>
        <b-dropdown  size="sm" :text="depthMerge.text" class="noborder" right>
          <b-dropdown-item-button v-for="(merge,index) in mergeOptions" :key="merge.value" @click="changeMerge(index)">{{merge.text}}</b-dropdown-item-button>
        </b-dropdown>
      </div>
    </div>
    <div v-if="countVisible" class="count-section">
      <div class="count-control">
        <div class="line"></div>
        <i class="iconfont icon-shrink cur-hand" :class="countShrink&&'down'" @click="onToggleShrink"></i>
        <div class="line"></div>
      </div>
      <div v-show="!countShrink" class="count-option">
        <span class="name">显示数量：</span>
        <b-dropdown :text="depthCount.text" class="noborder">
          <b-dropdown-item-button v-for="(count,index) in countOptions" :key="count.value" @click="changeCount(index)">{{count.text}}</b-dropdown-item-button>
        </b-dropdown>
      </div>
    </div>
    <b-table class="title-depth-section" :fields="depthFields" :items="[]"></b-table>
    <div class="depth-section" :class="{'single':viewType!==2,'multi':viewType==2,'shrink':viewType!==2&&countShrink}">
      <div class="depths-wrap"  ref="ask-depths-wrap"  :class="{'dn-table':viewType===1}">
        <b-table class="ask-table"  :fields="dataFields" :items="computedAsks" @row-clicked="onClickRow">
          <template :slot="'0'" slot-scope="item">
            <Numeric :value="item.value" :length="Math.max(bidsLimit.price.length,asksLimit.price.length)" :digit="bidsLimit.price.digit"></Numeric>
          </template>
          <template :slot="'1'" slot-scope="item">
            <span v-if="isCutToZero(item.value,bidsLimit.amount.digit)">{{item.value.scientificToDecimal()}}</span>
            <Numeric v-else :value="item.value" :length="Math.max(bidsLimit.amount.length,asksLimit.amount.length)" :digit="bidsLimit.amount.digit"></Numeric>
          </template>
          <template :slot="'2'" slot-scope="item">
            <span v-if="isCutToZero(item.value,bidsLimit.total.digit)">{{item.value.scientificToDecimal()}}</span>
            <Numeric v-else :value="item.value" :length="Math.max(bidsLimit.total.length,asksLimit.total.length)" :digit="bidsLimit.total.digit"></Numeric>
          </template>
          <template :slot="'3'" slot-scope="item">
            <div class="percent ask" :style="{width:item.value}"></div>
          </template>
        </b-table>
      </div>
      <div  class="lastprice-wrap" :class="{'up':compLastPrice>0,'down':compLastPrice<0}">
        <template v-if="last.decimalCmp(0)>0">
          <span class="lastprice cur-hand" @click="onClickRow([last])">{{last.scientificToDecimal()}}</span>
          <i class="iconfont icon-arrow"></i>
          <span class="legal">≈ {{utils.transformedPrice(last,currency,currencyRate.rates,legalCurrency.currency,lang.lang)}}</span>
        </template>
        <span v-else class="lastprice">--</span>
      </div>
      <div class="depths-wrap" ref="bid-depths-wrap"  :class="{'dn-table':viewType===0,'shrink':countShrink }">
        <div class="depths-wrap-inner">
          <b-table class="bid-table" :fields="dataFields" :items="computedBids"  @row-clicked="onClickRow">
            <template :slot="'0'" slot-scope="item">
              <Numeric :value="item.value" :length="Math.max(bidsLimit.price.length,asksLimit.price.length)" :digit="bidsLimit.price.digit"></Numeric>
            </template>
            <template :slot="'1'" slot-scope="item">
              <span v-if="isCutToZero(item.value,bidsLimit.amount.digit)">{{item.value.scientificToDecimal()}}</span>
              <Numeric v-else :value="item.value" :length="Math.max(bidsLimit.amount.length,asksLimit.amount.length)" :digit="bidsLimit.amount.digit"></Numeric>
            </template>
            <template :slot="'2'" slot-scope="item">
              <span v-if="isCutToZero(item.value,bidsLimit.total.digit)">{{item.value.scientificToDecimal()}}</span>
              <Numeric v-else :value="item.value" :length="Math.max(bidsLimit.total.length,asksLimit.total.length)" :digit="bidsLimit.total.digit"></Numeric>
            </template>
            <template :slot="'3'" slot-scope="item">
              <div class="percent bid" :style="{width:item.value}"></div>
            </template>
          </b-table>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
  import Vue from "vue";
  import { mapState } from "vuex";
  import DepthRange from "~/components/exchange/DepthRange.vue";
  import Numeric from "~/components/Numeric";
  import tradeDepthLang from "./tradeDepthLang.js";

  export default {
    components: {
      DepthRange,
      Numeric,
    },
    props: {
      last: String,
      dest: String,
      currency: String,
      market: String,
    },
    data() {
      return {
        // countVisible: false,
        countShrink: false,
        retry: 0,
        asks: [],
        bids: [],
        depthMerge: {
          text: "",
          value: "",
        },
        depthCount: {
          value: 30,
          text: "30",
        },
        countOptions: [
          {
            value: 30,
            text: "30",
          },
          {
            value: 50,
            text: "50",
          },
          {
            value: 100,
            text: "100",
          },
        ],
        viewType: 2, // 0卖；1买；2买卖
      };
    },
    computed: {
      ...mapState([
        "marketInfo",
        "currencyRate",
        "lang",
        "legalCurrency",
      ]),
      countVisible() {
        return this.viewType !== 2;
      },

      computedBids() {
        const maxTotal =
          this.viewType === 2
            ? Math.max(this.maxBidTotal, this.maxAskTotal)
            : this.maxBidTotal;
        return this.bids.map(item => {
          const percent = item[2] * 100 / maxTotal;
          return item.concat((percent > 100 ? 100 : percent) + "%");
        });
      },
      maxBidTotal() {
        const maxIndex =
          this.viewType === 2
            ? Math.min(9, this.bids.length - 1)
            : this.bids.length - 1;
        return ((this.bids[maxIndex] || [])[2] || 0) * 1;
      },

      computedAsks() {
        const maxTotal =
          this.viewType === 2
            ? Math.max(this.maxBidTotal, this.maxAskTotal)
            : this.maxAskTotal;
        return this.asks.map(item => {
          const percent = item[2] * 100 / maxTotal;
          return item.concat(percent + "%");
        }).reverse();
      },

      maxAskTotal() {
        const maxIndex =
          this.viewType === 2
            ? Math.min(9, this.asks.length - 1)
            : this.asks.length - 1;
        return ((this.asks[maxIndex] || [])[2] || 0) * 1;
      },
      mergeOptions() {
        if (this.marketItem && this.marketItem.merge) {
          const options = this.marketItem.merge.map(value => {
            const result = value.split(".");
            let text = value;
            if (result[1]) {
              let digit = result[1].length;
              if (this.lang.lang === "ja_JP") {
                const digitMaps = tradeDepthLang.jpDigitMaps;
                digit = digitMaps[digit];
              }
              if (this.lang.lang === "ko_KP") {
                const digitMaps = tradeDepthLang.koDigitMaps;
                digit = digitMaps[digit];
              }
              text = "#digit#位小数".replace("#digit#", digit);
            }
            return {
              value: value,
              text: text,
            };
          });
          return options;
        }
        return [];
      },

      marketItem() {
        const markets = this.marketInfo.market || [];
        return markets.find(item => {
          if (item.market === this.market) {
            return true;
          }
        });
      },
      priceFloatByLast() {
        if (this.marketItem && this.marketItem.price) {
          return this.marketItem.price.decimalMinus(this.marketItem.lastPrice);
        }
        return "0";
      },
      compLastPrice() {
        return this.priceFloatByLast.decimalCmp(0);
      },
      depthFields() {
        return [
          {
            key: "a",
            label: "价格" + "(" + this.currency + ")",
            thClass: ["title-th", "abc"],
          },
          {
            key: "b",
            label: "数量" + "(" + this.dest + ")",
            thClass: "title-th",
          },
          {
            key: "c",
            label: "累计" + "(" + this.dest + ")",
            thClass: "title-th",
          },
        ];
      },
      dataFields() {
        return [
          {
            key: 0,
            label: "价格" + "(" + this.currency + ")",
          },
          {
            key: 1,
            label: "数量" + "(" + this.dest + ")",
          },
          {
            key: 2,
            label: "累计" + "(" + this.dest + ")",
          },
          {
            key: 3,
            label: "",
            tdClass: "td-precent",
          },
        ];
      },

      digit() {
        const margeValue = this.depthMerge.value;
        if (margeValue) {
          const result = margeValue.split(".");
          return result[1] ? result[1].length : 0;
        }
        return 0;
      },

      bidsLimit() {
        return {
          price: this.utils.obtainLimitInfo(
            this.bids,
            0,
            num => {
              return num.formatMoney(this.digit, ".", "");
            },
            16,
            this.digit
          ),
          amount: this.utils.obtainLimitInfo(this.bids, 1, null, 10),
          total: this.utils.obtainLimitInfo(this.bids, 2, null, 10, 4),
        };
      },
      asksLimit() {
        return {
          price: this.utils.obtainLimitInfo(
            this.asks,
            0,
            num => {
              return num.formatMoney(this.digit, ".", "");
            },
            16,
            this.digit
          ),
          amount: this.utils.obtainLimitInfo(this.asks, 1, null, 10),
          total: this.utils.obtainLimitInfo(this.asks, 2, null, 10, 4),
        };
      },
    },
    watch: {
      market() {
        this.initData();
      },
    },
    mounted() {
      this.socketEventHandler = this.socketManager.buildEventHandler();
      this.initData();
      this.handleDepthUpdate();
    },
    beforeDestroy() {
      this.socketEventHandler.offAll();
    },
    methods: {
      initData() {
        /** 还没从http请求获取到数据 */
        if (this.retry < 4 && this.mergeOptions.length === 0) {
          this.retry = this.retry + 1;
          setTimeout(() => {
            this.initData();
          }, 2000);
          return;
        }
        this.retry = 0;
        this.asks = [];
        this.bids = [];
        this.viewType = 2;

        const match = this.mergeOptions.find(option => {
          return option.value === this.marketItem.default_merge;
        });
        this.depthMerge = match ||
          this.mergeOptions[this.mergeOptions.length - 1] || {
            text: "",
            value: "",
          };
        this.subscribeDepths(this.depthCount.value, this.depthMerge.value);
      },
      onClickRow(rowItem) {
        this.$root.$emit("trade::placeorder.price", rowItem[0]);
      },
      changeViewType(type) {
        this.viewType = type;
      },
      changeMerge(index) {
        this.depthMerge = this.mergeOptions[index];
        this.subscribeDepths(this.depthCount.value, this.depthMerge.value);
      },
      changeCount(index) {
        this.depthCount = this.countOptions[index];
        this.subscribeDepths(this.depthCount.value, this.depthMerge.value);
      },
      handleDepthUpdate() {
        this.socketEventHandler.on("depth.update", (res) => {
          const params = res.params;
          if (!params) {
            return;
          }
          const depthCount = this.depthCount.value;
          const isFull = params[0];
          const data = params[1] || {};
          const asks = data.asks;
          const bids = data.bids;

          let localAsks = asks;
          let localBids = bids;
          if (!isFull) {
            // 更新逻辑：新旧数据，都是排好序的，无需再排序一次
            // 同时遍历有序的新旧数据，索引对应的数据进行比较，根据情况来移动索引，继续比较。

            if (asks && asks.length > 0) {
              let localLen = this.asks.length;
              if (localLen > 0) {
                localAsks = this.asks.slice(0);
                const len = asks.length;
                let i = 0;
                let j = 0;
                while (i < localLen && j < len) {
                  if (localAsks[i][0] - asks[j][0] > 0) { // 价格大
                    if (asks[j][1] * 1 !== 0) {
                      localAsks.splice(i, 0, asks[j]); // 插入
                      localLen = localLen + 1;
                      i++;
                      j++;
                    } else {
                      j++;
                    }
                  } else if (localAsks[i][0] === asks[j][0]) { // 价格一样
                    if (asks[j][1] * 1 === 0) { // 没有数量了，应该删掉
                      localAsks.splice(i, 1);
                      localLen--;
                      j++;
                    } else {
                      localAsks[i] = asks[j];
                      i++;
                      j++;
                    }
                  } else {
                    i++;
                  }
                }
                if (j < len) { // 提前遍历完了本地数据
                  localAsks = localAsks.concat(asks.slice(j));
                }
                if (localAsks.length > depthCount) {
                  localAsks = localAsks.slice(0, depthCount);
                }
              }
            }
            if (bids && bids.length > 0) {
              let localLen = this.bids.length;
              if (localLen > 0) {
                localBids = this.bids.slice(0);
                const len = bids.length;
                let i = 0;
                let j = 0;
                while (i < localLen && j < len) {
                  if (localBids[i][0] - bids[j][0] < 0) { // 价格小
                    if (bids[j][1] * 1 !== 0) {
                      localBids.splice(i, 0, bids[j]);
                      localLen = localLen + 1;
                      i++;
                      j++;
                    } else {
                      j++;
                    }
                  } else if (localBids[i][0] === bids[j][0]) { // 价格一样
                    if (bids[j][1] * 1 === 0) { // 没有数量了，应该删掉
                      localBids.splice(i, 1);
                      localLen--;
                      j++;
                    } else {
                      localBids[i] = bids[j];
                      j++;
                      i++;
                    }
                  } else {
                    i++;
                  }
                }
                if (j < len) { // 提前遍历完了本地数据
                  localBids = localBids.concat(bids.slice(j));
                }
                if (localBids.length > depthCount) {
                  localBids = localBids.slice(0, depthCount);
                }
              }
            }
          }

          if (localAsks) {
            this.calcTotal(localAsks);
            this.asks = localAsks;
          }
          if (localBids) {
            this.calcTotal(localBids);
            this.bids = localBids;
          }
        });
      },
      subscribeDepths(depthCount, merge) {
        this.socketManager.commit({
          method: "depth.subscribe",
          params: [this.market, depthCount, merge],
          unsubscribe: "depth.unsubscribe",
        });
      },
      calcTotal(array) {
        array.forEach((item, index) => {
          if (index > 0) {
            const t = array[index - 1][2].decimalAdd(item[1]);
            item[2] = t.round(8);
          } else {
            item[2] = item[1].round(8);
          }
        });
      },
      /**
       * 是否会被截断为0
       */
      isCutToZero(value, digit) {
        const min = digit < 1 ? "1" : ["0."].concat(Array.from({length: digit - 1}).map(() => { return "0"; })).join("") + "1";
        return min.decimalCmp(value) > 0;
      },
      onToggleShrink() {
        if (this.countShrink) {
          this.countShrink = false;
        } else {
          this.countShrink = true;
        }
      },
    },
  };
</script>

<style lang="scss">
  .component-trade-depth {
    background-color: #ffffff;
    box-shadow: 0 0 20px 0 #ececec;

    .dropdown-item {
      outline: none;
      cursor: pointer;
      // border-bottom: 1px solid #e9ecef;
    }
    .merge-section {
      align-items: center;
      padding: 0 20px;
      // height: 49px;
      height: 89px;
      .merge-option {
        margin-top: 10px;
        display: flex;
        align-items: center;
        .name {
          font-size: 12px;
          text-align: right;
          color: #898989;
          white-space: nowrap;
          margin-right: 3px;
        }
        .dropdown{
          min-width: 104px;
          background-color: #f9f9f9;
          flex:1;
        }
        .dropdown-toggle{
          width: 100%;
          line-height: 24px;
          height: 24px;
          padding-left: 8px;
          padding-right: 20px;
          &::after{
            position: absolute;
            right: 8px;
            top:9px;
          }
        }

      }
      .depth-type {
        display: flex;
        justify-content: flex-end;
        white-space: nowrap;
        padding-top: 20px;
        .ask,
        .bid,
        .all {
          width: 20px;
          height: 17px;
          display: inline-block;
          // border: 1px solid gray;
          margin-left: 5px;
          background-repeat: no-repeat;
          background-size: contain;
          cursor: pointer;
        }
        .ask {
          background-image: url("~assets/img/icons/i_merge_ask.png");
        }
        .bid {
          background-image: url("~assets/img/icons/i_merge_bid.png");
        }
        .all {
          background-image: url("~assets/img/icons/i_merge_all.png");
        }
      }
    }
    .count-section {
      padding-bottom: 8px;
      .count-control {
        display: flex;
        align-items: center;
        margin-top: -11px;
        .line {
          height: 1px;
          background-color: #eeeeee;
          flex: 1;
        }
        .icon-shrink {
          margin: 0 10px;
          color: #898989;
          font-size: 12px;
          &:hover {
            color: #52cbca;
          }
          &.down {
            transform: rotate(180deg);
          }
        }
      }
      .count-option {
        display: flex;
        align-items: center;
        padding-left: 20px;
        .name {
          font-size: 12px;
          text-align: right;
          color: #898989;
          white-space: nowrap;
        }
      }
    }
    .title-depth-section {
      .title-th {
        font-size: 12px;
        height: 30px;
        line-height: 30px;
        background-color: #f9f9f9;
      }
    }
    .depth-section {
      height: 640px;
      overflow: hidden;
      &.single {
        height: 610px;
        .depths-wrap {
          overflow-x: hidden;
          overflow-y: auto;
          max-height: 570px;
          height: auto;
        }
        &.shrink {
          height: 627px;
          .depths-wrap {
            overflow-x: hidden;
            overflow-y: auto;
            max-height: 588px;
          }
        }
      }
      &.multi {
        .depths-wrap-inner {
          height: 100%;
          overflow: hidden;
        }
        .ask-table {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
        }
        .bid-table {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
        }
      }
      .depths-wrap {
        position: relative;
        height: 300px;
        transition: height 0.3s;
        &.dn-table {
          height: 0 !important;
        }
        tr:hover {
          background-color: rgba(30, 39, 49, 0.05);
          cursor: pointer;
        }
        th {
          height: 0;
          line-height: 0;
          min-height: 0;
          overflow: hidden;
          padding-left: 0;
          padding-right: 0;
        }
        th:nth-child(1) {
          width: 37%;
        }
        th:nth-child(2) {
          width: 31%;
        }
        th:nth-child(3) {
          width: 32%;
        }
        th:nth-child(4) {
          width: 0;
        }
        td {
          height: 29px;
          padding: 0;
          line-height: 29px;
          font-size: 12px;
          color: #6f6f6f;
          cursor: pointer;
        }
        td:nth-child(4),
        .td-precent {
          position: absolute;
          left: 0;
          right: 0;
          border: none;
          .percent {
            position: absolute;
            top: 0;
            bottom: 0;
            right: 0;
            width: 0px;
            z-index: 1;
            pointer-events: none;
            opacity: 0.2;
            &.bid {
              background-color: #00b275;
            }
            &.ask {
              background-color: #e35555;
            }
          }
        }
      }
      .lastprice-wrap {
        height: 40px;
        background-color: #ffffff;
        box-shadow: 0 0 10px 0 #ececec;
        display: flex;
        justify-content: center;
        align-items: center;
        border-top: solid 1px #eeeeee;
        border-bottom: solid 1px #eeeeee;
        .lastprice {
          font-size: 20px;
          font-weight: 500;
          margin-right: 10px;
        }
        &.up {
          color: #00b66f;
          .icon-arrow {
            display: inline-block;
            transform: rotate(180deg);
          }
        }
        &.down {
          color: #e35555;
        }
        .legal {
          margin-left: 10px;
          color: #6f6f6f;
          font-size: 13px;
        }
      }
    }
  }

  .body-s {
    .component-trade-depth {
      @media (min-width: 1280px) {
        .merge-section {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-direction: row-reverse;
          height: 49px;
          .merge-option {
            margin-top: 0;
          }
          .depth-type {
            padding-top: 0;
          }
        }
        .depth-section {
          height: 680px;
          .depths-wrap {
            max-height: 320px;
            height: 310px;
          }
          &.single {
            height: 650px;
            .depths-wrap {
              height: auto;
              max-height: 592px;
            }
            &.shrink {
              height: 667px;
              .depths-wrap {
                max-height: 608px;
              }
            }
          }
          .lastprice-wrap{
            height: 59px;
          }
          .depths-wrap {
            td {
              height: 31px;
            }
          }
        }
      }
    }
  }
</style>
