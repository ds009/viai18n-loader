<template>
  <b-modal v-if="history" title="成交明细" :no-close-on-backdrop="true" centered :class="['component-history-modal','detail-modal','modal-dialog-large']" v-model="visible" @hidden="onHidden" :hide-footer="true">
    <div class="delegate-detail">
      <div class="item">
        <p class="text">
          <Numeric :value="history.avg_price" :length="17" :digit="digits.price" :integerPadding="false"></Numeric>
        </p>
        <p class="name">{{"成交均价（#coin#）".replace("#coin#",currency)}}</p>
      </div>
      <div class="item">
        <p class="text">
          <Numeric :value="history.deal_amount" :length="17" :digit="digits.amount" :integerPadding="false"></Numeric>
        </p>
        <p class="name">{{"成交数量（#coin#）".replace("#coin#",dest)}}</p>
      </div>
      <div class="item">
        <p class="text">
          <Numeric :value="history.deal_money" :length="17" :digit="8" :integerPadding="false"></Numeric>
        </p>
        <p class="name">{{"成交金额（#coin#）".replace("#coin#",currency)}}</p>
      </div>
      <div v-if="computedFees.length===1" class="item">
        <p class="text">
          <Numeric :value="computedFees[0].value" :length="17" :integerPadding="false" :digit="8"></Numeric>
        </p>
        <p class="name">
          <span>手续费</span>
          <span>（{{computedFees[0].name}}）</span>
        </p>
      </div>
      <div v-if="computedFees.length===2" class="item fixed-fee">
        <span class="name">手续费</span>
        <div class="fees">
          <div v-for="(fee,index) in computedFees" :key="index">
            <Numeric :value="fee.value" :length="feesLimit.length" :digit="feesLimit.price"></Numeric>
            <span class="name">{{fee.name}}</span>
          </div>
        </div>
      </div>
    </div>
    <b-table :items="details" :fields="detailFields">
      <template slot="create_time" slot-scope="item">
        {{ utils.getTimeText(item.value) }}
      </template>
      <template slot="price" slot-scope="item">
        <Numeric :value="item.value" :length="detailsLimit.price.length" :digit="detailsLimit.price.digit"></Numeric>
      </template>
      <template slot="amount" slot-scope="item">
        <Numeric :value="item.value" :length="detailsLimit.amount.length" :digit="detailsLimit.amount.digit"></Numeric>
      </template>
      <template slot="deal_money" slot-scope="item">
        <Numeric :value="item.value" :length="detailsLimit.deal_money.length" :digit="detailsLimit.deal_money.digit"></Numeric>
      </template>
      <template slot="fee" slot-scope="item">
        <Numeric :value="item.value" :length="detailsLimit.fee.length" :digit="detailsLimit.fee.digit"></Numeric>
        {{item.item.fee_asset}}
      </template>
      <template slot="role" slot-scope="item">
        {{item.value}}
      </template>
    </b-table>
    <ul class="pagination pull-right">
      <li class="page-item">
        <span class="page-link cur-hand" v-show="detailCurrPage!==1" @click="loadDetail(detailCurrPage-1)">上一页</span>
      </li>
      <li class="page-item">
        <span class="page-link cur-hand" v-show="detailHasNext" @click="loadDetail(detailCurrPage+1)">下一页</span>
      </li>
    </ul>
  </b-modal>
</template>

<script>
  import Vue from "vue";
  import { mapState } from "vuex";
  import Numeric from "~/components/Numeric";
  export default {
    components: {
      Numeric,
    },
    props: {
      history: {
        type: Object,
        default() {
          return null;
        },
      },
    },

    data() {
      return {
        visible: false,
        details: [],
        detailPageSize: 10,
        detailCurrPage: 1,
        detailHasNext: false,
      };
    },
    computed: {
      ...mapState(["marketInfo"]),
      detailFields() {
        return {
          create_time: {
            label: "成交时间",
          },
          price: {
            label: "成交价格",
          },
          amount: {
            label: "成交量",
          },
          deal_money: {
            label: "成交金额",
          },
          fee: {
            label: "手续费",
          },
          role: {
            label: "Taker/Maker",
          },
        };
      },
      detailsLimit() {
        return {
          price: this.utils.obtainLimitInfo(this.details, "price", null, 16, this.digits.price),
          amount: this.utils.obtainLimitInfo(this.details, "amount"),
          deal_money: this.utils.obtainLimitInfo(this.details, "deal_money", null, 15, 8),
          fee: this.utils.obtainLimitInfo(this.details, "fee", null, 12, 8),
        };
      },

      currency() {
        return this.marketItem ? this.marketItem.buy_asset_type : "";
      },
      dest() {
        return this.marketItem ? this.marketItem.sell_asset_type : "";
      },
      marketItem() {
        if (!this.history) {
          return null;
        }
        const markets = this.utils.parseProperty(
          this.marketInfo,
          "multiCurrencyMarket.market_info"
        );
        return markets ? markets[this.history.market] : null;
      },
      /**
       * 小数位
       */
      digits() {
        const marketItem = this.marketItem;
        return {
          price: marketItem ? marketItem.buy_asset_type_places : 12,
          amount: marketItem ? marketItem.sell_asset_type_places : 8,
        };
      },
      computedFees() {
        const fees = [];
        const history = this.history;
        if (!history) {
          return fees;
        }
        // 扣了默认币种
        fees.push({
          name: history.type === "buy" ? this.dest : this.currency,
          value: history.deal_fee || "",
        });
        // 扣了抵扣币种
        const feeAsset = history.fee_asset;
        const assetFee = history.asset_fee || "";
        if (feeAsset) {
          if (fees[0].name === feeAsset) { // 抵扣的币种和默认币种一样
            fees[0].value = fees[0].value.decimalAdd(assetFee);
          } else {
            fees.push({
              name: feeAsset,
              value: assetFee,
            });
          }
        }
        return fees;
      },
      feesLimit() {
        return this.utils.obtainLimitInfo(this.computedFees || [], "value", null, 17, 8);
      },
    },
    watch: {
      history() {
        this.reset();
        if (this.history) {
          this.loadDetail(1);
        }
      },
    },
    mounted() {
    },
    methods: {
      onHidden() {
        this.$emit("hidden");
      },
      reset() {
        this.details = [];
        this.detailPageSize = 10;
        this.detailCurrPage = 1;
        this.detailHasNext = false;
        this.visible = !!this.history;
      },
      loadDetail(page) {
        if (!this.history) {
          return;
        }
        return this.axios
          .get(
            `/res/order/finished/${this.history.order_id}?page=${page}&limit=${
              this.detailPageSize
              }`
          )
          .then(res => {
            const result = res.data;
            if (!result.code) {
              const content = result.data;
              this.details = content.data;
              this.detailCurrPage = content.curr_page;
              this.detailHasNext = content.has_next;
            }
          });
      },
    },
  };
</script>

<style lang="scss">
  .component-history-modal {
    .delegate-detail {
      display: flex;
      background-color: #f9f9f9;
      .item {
        position: relative;
        padding: 16px 0;
        flex: 1;
        width: 2px;
        // &:first-child::before {
        //   display: none;
        // }
        &:last-child::after{
          display: none;
        }
        &::after {
          content: "";
          display: inline-block;
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 1px;
          height: 30px;
          background: #dddddd;
          right: 0;
        }
        &.fixed-fee{
          display: flex;
          flex-direction: row;
          padding: 6px 0;
          align-items: center;
          justify-content: center;
        }
      }
      .text {
        font-size: 14px;
        text-align: center;
        color: #27313e;
      }
      .name {
        font-size: 12px;
        text-align: center;
        color: #898989;
      }
      .fees{
        display: flex;
        flex-direction: column;
        padding-left: 8px;
        .name{
          padding-left: 5px;
        }
      }
    }
  }
</style>
