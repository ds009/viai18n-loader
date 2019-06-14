<style lang="stylus">
  .page-block {
    .block__info {
      min-height: 345px;
    }
  }
</style>

<template>
  <v-container class="page-block">
    <v-layout column>
      <v-flex>
        <CardTitleOut>
          <span>区块 <span>#{{$route.params.id}}</span></span>
          <span>
            <v-btn :to="`/block/${$route.params.id - 1}`" icon small flat color="info" class="m-0"><v-icon>skip_previous</v-icon></v-btn>
            <v-btn :to="`/block/${Number($route.params.id) + 1}`" icon small flat color="info" class="m-0"><v-icon>skip_next</v-icon></v-btn>
          </span>
        </CardTitleOut>

        <v-card>
          <div v-if="loading" class="block__info text-xs-center py-5">
            <v-progress-circular color="blue" indeterminate />
          </div>

          <v-container v-if="block" class="block__info" grid-list-md>
            <BlockInfoItem title="高度">
              {{block.number}}
            </BlockInfoItem>
            <BlockInfoItem title="出块时间">
              <LocalTime :time="block.time" />
            </BlockInfoItem>
            <BlockInfoItem title="出块节点">
              <AAccount :to="block.witness_account" /> <span class="grey--text">({{block.witness}})</span>
            </BlockInfoItem>
            <BlockInfoItem title="区块状态">
              <StatusChip :status="status" />
            </BlockInfoItem>

            <v-divider />

            <BlockInfoItem title="Hash">
              {{block.hash}}
            </BlockInfoItem>

            <BlockInfoItem title="父区块 Hash">
              {{block.parent_hash}}
            </BlockInfoItem>

            <BlockInfoItem title="交易默克尔哈希">
              {{block.tx_merkle_hash}}
            </BlockInfoItem>
            <BlockInfoItem title="交易收据哈希">
              {{block.tx_receipt_merkle_hash}}
            </BlockInfoItem>

            <v-divider />

            <BlockInfoItem title="交易数">
              {{block.tx_count}}
            </BlockInfoItem>
            <BlockInfoItem title="GAS 使用">
              {{block.gas_usage}}
            </BlockInfoItem>
          </v-container>
        </v-card>
      </v-flex>

      <v-flex v-if="block" class="mt-3">
        <v-card>
          <v-tabs v-model="activeTab" slider-color="primary" @change="onChangeTab">
            <!-- todo: 这里在配合 :to 使用的时候，会死循环，需要看一下为什么-->
            <v-tab :key="TABS.txs" class="font-weight-bold">
              全部交易 <span>({{block.transactions.length}})</span>
            </v-tab>
            <v-tab :key="TABS.raw" class="font-weight-bold">
              原始数据
            </v-tab>

            <v-tabs-items>
              <v-tab-item :key="TABS.txs">
                <v-data-table :headers="transactionsHeader" :items="block.transactions" hide-actions>
                  <template slot="items" slot-scope="{item}">
                    <td><ATx :to="item.hash" /></td>
                    <td>{{item.actions.length}}</td>
                    <td><AAccount :to="item.publisher" /></td>
                  </template>
                </v-data-table>
              </v-tab-item>

              <v-tab-item :key="TABS.raw">
                <code class="subheading ff-mono px-2 py-3 d-flex">{{JSON.stringify(block, null, 2)}}</code>
              </v-tab-item>
            </v-tabs-items>
          </v-tabs>
        </v-card>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import StatusChip from '~/components/StatusChip.vue'

const BlockInfoItem = {
  props: {
    title: String,
  },
  render() {
    return (
      <v-layout>
        <v-flex xs4 md4 tag='h4'>{this.title}</v-flex>
        <v-flex xs8 md8 class='word-break-break-all'>{this.$slots.default}</v-flex>
      </v-layout>
    )
  }
}

const TABS = {
  txs: 0,
  raw: 1
}
const TABS_LIST = ['txs', 'raw']

export default {
  name: 'page-block',
  components: {
    BlockInfoItem,
    StatusChip,
  },
  data() {
    // todo: 不知道为什么，query上tab的绑定不生效
    return {
      status: '',
      block: null,
      loading: true,
      activeTab: TABS[this.$route.query.tab] || TABS.actions,

      TABS,

      transactionsHeader: [{
        text: 'Hash',
        value: 'hash'
      }, {
        text: '交易数',
        value: 'actions'
      }, {
        text: '账号',
        value: 'publisher'
      }]
    }
  },
  mounted() {
    const blockNumber = this.$route.params.id
    this.$rpc.blockchain.getBlockByNum(blockNumber, true).then(res => {
      this.status = res.status
      this.block = res.block

      this.loading = false

      this.$backend.block(blockNumber).then(res => {
        this.$set(this.block, 'witness_account', res.witness_account)
      })
    })
  },
  methods: {
    onChangeTab(key) {
      // this.$router.push({
      //   query: {
      //     tab: TABS_LIST[key]
      //   }
      // })
    }
  }
}
</script>
