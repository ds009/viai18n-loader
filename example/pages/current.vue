<template>
  <div class="page-my-wallet-widthdraw">
    <b-modal v-model="withdrawTipVisible" centered title="" :hide-footer="true">
      <p style="font-size: 15px;line-height: 24px;">{{withdrawTip}}</p>
      <div class="btn-container">
        <b-button @click="withdrawTipVisible=false;" size="lg" variant="gradient-yellow">知道了</b-button>
      </div>
    </b-modal>

    <add-address :coinType="tab" :show="newAddressWinShow" @hidden="newAddressWinShow=false" @addSuccess="addSuccess"></add-address>
    <add-address-inter :coinType="tab" :show="newAddressInterWinShow" @hidden="newAddressInterWinShow=false" @addSuccess="addInterSuccess"></add-address-inter>
    <b-modal centered class="delete-win" :no-close-on-backdrop="true" ref="" title="注意！" @hidden="hidden" v-model="deleteWinShow" :hide-footer="true"
             size="lg">
      <div>
        <p class="fs-16 color-gray">是否删除地址</p>
        <div v-if="!isNormalWithdraw">
          <p class="pl-0  mt-10 word-break">
            <span class="color-black fs-16">{{delete_address.remark?delete_address.remark + ":":""}}</span>
            <span class="fs-14 color-gray">{{delete_address.account.split(":")[0]}}</span>
          </p>
        </div>
        <div v-else-if="isXMRTab">
          <p class="pl-0  mt-10 word-break">
            <span class="color-black fs-16">{{delete_address.remark?delete_address.remark + ":":""}}</span>
            <span class="fs-14 color-gray">{{delete_address.coin_address.split(":")[0]}}</span>
          </p>
          <p class="color-black mt-5 fs-16">Payment ID：</p>
          <p class="pl-30 color-gray word-break">
            {{delete_address.coin_address.split(":")[1]?delete_address.coin_address.split(":")[1]:""}}
          </p>
        </div>
        <div v-else-if="isMultiAddr">
          <p class="pl-0  mt-10 word-break">
            <span class="color-black fs-16">{{delete_address.remark?delete_address.remark + ":":""}}</span>
            <span class="fs-14 color-gray">{{delete_address.coin_address.split(":")[0]}}</span>
          </p>
          <p class="color-black mt-5 fs-16">{{tagName}}{{$globalT(":")}}
            <span class="color-gray word-break">
              {{delete_address.coin_address.split(":")[1]?delete_address.coin_address.split(":")[1]:""}}
            </span>
          </p>
        </div>
        <div v-else>
          <p class="pl-0  mt-10 word-break">
            <span class="color-black fs-16">{{delete_address.remark?delete_address.remark + ":":""}}</span>
            <span class="fs-14 color-gray">{{delete_address.coin_address.split(":")[0]}}</span>
          </p>
        </div>
      </div>
      <div class="btn-container d-flex" style="width:100%;">
        <b-btn type="submit" size="sm" variant="gradient-yellow" @click="deleteWinShow=false">取 消</b-btn>
        <b-btn type="submit" size="sm" variant="gradient-green" @click="deleteAddress" :disabled="address_busy">删 除</b-btn>
      </div>
    </b-modal>

    <b-modal centered :no-close-on-backdrop="true" ref="" title="提现申请已提交！" @hidden="hidden" v-model="modalShow" :hide-footer="true" size="lg">
      <b-form inline class="new-address row ta-c" @submit.stop.prevent="addressAdd">
        <div class="o-h mt-20 fs-16 color-gray w-100p ta-l" style="word-break: break-all;">
          <span>本笔提现地址：</span>
          <span>{{address}}</span>
        </div>
        <div class="mt-10 ta-l fs-16 color-gray" style="word-break: break-all;" v-if="isXMRTab">
          <span>Payment ID</span>
          <span>{{$globalT(":")}}</span>
          <span>{{paymentId}}</span>
        </div>

        <div class="mt-10 ta-l fs-16 color-gray" style="word-break: break-all;" v-else-if="isMultiAddr">
          <span>{{tagName}}</span>
          <span>{{$globalT(":")}}</span>
          <span>{{paymentId}}</span>
        </div>

        <div class="o-h mt-20 fs-16 color-gray w-100p">
          <b-form-checkbox id="checkbox1" v-model="checkbox_status">
            <span>快速添加该地址到地址簿</span>
          </b-form-checkbox>

        </div>
        <div class="o-h mt-10 fs-16 color-gray w-100p">
          <div class="input-container">
            <b-form-input class="f16 ta-c" autocomplete="off" v-show="checkbox_status" id="address_remark" size="lg" type="text" v-model="address_remark"
                          placeholder="该地址备注名称" style="border-width:0px;border-bottom-width:1px;"></b-form-input>
          </div>
        </div>
        <div class="btn-container d-flex" style="width:100%;">
          <b-btn type="submit" size="lg" variant="gradient-yellow" @click="addressAdd" :disabled="address_busy">确认</b-btn>
        </div>
      </b-form>
    </b-modal>

    <two-column>
      <div slot="left-side">
        <MenuBar/>
      </div>
      <div slot="right-content">
        <div class="box-shadow o-h" style="background:#ffffff;">
          <div :class="'coin-type-select-container '+lang.lang">
            <span class="text">{{coinFullName}}&nbsp;
              <span>提币</span>
            </span>
            <div class="exchange-container ml-20">
              <coin-search-select class="search-input-container" :addAll="false" @change="changeCoinType" value=""></coin-search-select>
            </div>
          </div>

          <template v-if="info.userData">
            <wallet-step v-if="(!info.userData.has_totp_auth && info.userData.mobile === '') || !info.userData.email"></wallet-step>
            <div v-else style="position:relative">
              <div class="mt-20"></div>

              <via-tab :items="tabItems" @onChange="onTabChange"></via-tab>
              <p class="trans-msg ta-c">
                <span v-if="isNormalWithdraw">当采用普通提币时，您的提币将走区块链转账，转账过程需等待区块确认。</span>
                <span v-else>当提币地址为CoinEx账号地址时，可选择站内转账。提币将不走区块链转账，通过平台内部实时划转，过程无需区块确认。</span>
              </p>

              <b-form v-if="isNormalWithdraw" inline class="btc-form" :class="lang.lang" @submit.prevent.stop="withdraw" autocomplete="false">
                <div class="row-wrap mt-5"></div>
                <label for="input-address">提币地址：</label>
                <div class="input-container">
                  <p class="via-input-error color-red fs-12">{{!addressError.alert?addressError.text:""}}&nbsp;</p>
                  <b-input-group size="lg" class="f16 address-input-group" :class="addressError.alert?'in-error':''">
                    <b-form-input ref="address-input" :class="addressFocus?'focus':''" placeholder="请输入地址" autocomplete="off" class="address-input"
                                  id="input-address" @focus.native="addressInput" @focusout.native="addressFocus=false" @input="addressInput"
                                  size="lg" v-model="address" type="text" />
                    <b-input-group-button class="coin-input-group-btn " :class="addressFocus?'focus':''">
                      <b-dropdown text="现有地址" variant="" size="lg" style="">
                        <b-dropdown-item v-for="(item,index) in cards" :key="index" @click="handleAddressSelect(item.coin_address,item)" :class="item.selected?'selected':''">
                          <span class="remark">{{item.remark? item.remark.simplify(12) + ":&nbsp;":""}}</span>
                          <span class="address">{{getDropdownAddress(item)}}</span>
                          <i class="icon iconfont icon-delete" @click.prevent.stop="deleteWinShow=true;delete_address=item;delete_address.account=''"></i>
                        </b-dropdown-item>
                        <b-dropdown-item @click="newAddressWinShow=true" class="add-item">
                          <span>
                            <i class="icon iconfont icon-i-add fs-14 mr-10"></i> 添加新地址</span>
                        </b-dropdown-item>
                      </b-dropdown>
                    </b-input-group-button>
                  </b-input-group>
                  <p class="color-gray" style="height:13px">&nbsp;</p>
                </div>
                <div v-if="isXMRTab" class="flex-content">
                  <div class="row-wrap mt-20"></div>
                  <label class="" for=""></label>
                  <div class="input-container">
                    <p class="mt-5 fs-12 color-red"></p>
                  </div>
                  <div class="row-wrap mt-0"></div>
                  <label class="" for="payment-id">
                    <span>Payment ID</span>
                    <span>{{$globalT(":")}}</span>
                  </label>
                  <div class="input-container f16 foucs-container f-common" :class="paymentIdError?'in-error':''">
                    <b-form-input class="f16" type="text" id="payment-id" AutoCompleteType="Disabled" autocomplete="off" step="any" :disabled="noPaymentId"
                                  size="lg" name="" v-model="paymentId" @input="paymentIdError=''" @focusin.native="paymentIdError=''"
                                  placeholder="请输入 Payment ID" style="z-index:0"></b-form-input>
                  </div>
                  <div class="row-wrap mt-0"></div>
                  <label class="" for=""></label>
                  <div class="input-container mt-5">
                    <b-form-checkbox class="c-light" @change="clearPayment" :unchecked-value="false" v-model="noPaymentId">
                      <div class="ta-l">
                        <span>无Payment ID</span>
                      </div>
                    </b-form-checkbox>
                  </div>
                </div>
                <div v-else-if="isMultiAddr" class="flex-content">
                  <div class="row-wrap mt-20"></div>
                  <label class="" for=""></label>
                  <div class="input-container">
                    <p class="mt-5 fs-12 color-red"></p>
                  </div>
                  <div class="row-wrap mt-0"></div>
                  <label class="" for="payment-id">
                    <span>{{tagName}}</span>
                    <span>{{$globalT(":")}}</span>
                  </label>
                  <div class="input-container f16 foucs-container f-common" :class="paymentIdError?'in-error':''">
                    <b-form-input class="f16" type="text" id="payment-id" AutoCompleteType="Disabled" autocomplete="off" step="any" :disabled="noPaymentId"
                                  size="lg" name="" v-model="paymentId" @input="paymentIdError=''" @focusin.native="paymentIdError=''"
                                  :maxlength="tab==='XRP'?10:256" :placeholder="inputTag" style="z-index:0"></b-form-input>
                  </div>
                  <div class="row-wrap mt-0"></div>
                  <label class="" for=""></label>
                  <div class="input-container mt-5">
                    <b-form-checkbox class="c-light" @change="clearPayment" :unchecked-value="false" v-model="noPaymentId">
                      <div class="ta-l">
                        <span>{{"无[Tag]".replace(/\[Tag\]/, tagName)}}</span>
                      </div>
                    </b-form-checkbox>
                  </div>
                </div>
                <div class="row-wrap mt-20"></div>
                <label class="" for=""></label>
                <div class="input-container">
                  <p class="mt-5 fs-12 color-red" v-if="withdrawAmountErrorText">{{ withdrawAmountErrorText }}</p>
                  <p class="mt-5 fs-12 color-red" v-if="tab==='NEO'&&!withdrawAmountErrorText">因NEO网络限制，提现金额必须为整数</p>
                </div>
                <div class="row-wrap mt-0"></div>
                <label class="" for="coin_withdraw_amount">实际到账：</label>
                <div class="input-container f20 foucs-container f-money" :class="moneyFoces?'money-focus':''">
                  <b-input-group :right="coinType.toUpperCase()">
                    <b-form-input class="f20" type="number" id="coin_withdraw_amount" AutoCompleteType="Disabled" autocomplete="off" step="any"
                                  size="lg" name="" v-model="coinActualAmount" @input="moneyInput" @focusout.native="moneyFoces=false"  @focusin.native="moneyInput"
                                  placeholder="金额" style="border-right-width:0px;z-index:0"></b-form-input>
                  </b-input-group>
                </div>
                <div class="row-wrap mt-0"></div>
                <label class="" for=""></label>
                <div class="input-container">
                  <div>
                    <b-tooltip content="*存在充值未完全确认或挂单冻结的情况，部分金额无法提现" target="can-not-withdraw-msg" bottom style="display:inline" placement="bottom">
                      <p style="text-align:left;width:100%" v-if="frozenAmount > 0 ||  confirmingDepositAmount > 0">*存在充值未完全确认或挂单冻结的情况，部分金额无法提现</p>
                    </b-tooltip>
                  </div>
                  <p class="color-gray mt-5">
                    <span>可提币数量：</span>
                    <a class="color-green2" href="javascript:void(0)" @click="coinAvailableClick" style="text-decoration: underline;">{{availableAmount}}</a> {{coinType.toUpperCase()}}
                    <span v-show="frozenAmount > 0 ||  confirmingDepositAmount > 0" class="warming-msg" style="">
                      <i class="fa fa-exclamation-circle fs-18" id="can-not-withdraw-msg" aria-hidden="true"></i>
                    </span>
                  </p>
                </div>
                <div class="row-wrap mt-0"></div>
                <label class="" for=""></label>
                <div class="input-container">
                  <div class="mt-5 color-gray o-h">
                    <div class="fl">
                      <span>网络手续费：</span>
                      <span>{{networkFee}} {{coinType.toUpperCase()}}</span>
                    </div>
                    <div class="fr">
                      <span>实际扣币：</span>
                      <span>{{actualReduce}} {{ coinType.toUpperCase() }}</span>
                    </div>
                  </div>
                </div>
                <div class="row-wrap mt-30"></div>
                <label class="" for="vercode" style="padding-bottom:23px;">验证码：</label>
                <div class="input-container foucs-container" :class="vercodeError.alert?'in-error':''">
                  <Vercode mode="border" v-if="info.userData" :isFirst="true" ref="vercode" :switcher="(info.userData.has_totp_auth && info.userData.mobile)?true:false"
                           :defaults="info.userData.protect_type" :countryCode="info.userData.country_code" :errorText="vercodeError.text"
                           @input="vercodeInput" @focusin.native="vercodeInput" :authed="true" v-model="validateCode"
                           smsType="add_withdraw"></Vercode>
                </div>
                <div class="row-wrap mt-20"></div>
                <div class="input-container full ta-c">
                  <b-btn v-if="checkTypeWithdraw()" type="btn" size="lg" variant="outline-yellow" :disabled="busy">立即提现</b-btn>
                  <b-btn v-else type="btn" size="lg" variant="outline-gray" :disabled="true">立即提现</b-btn>
                </div>
                <div v-if="!checkTypeWithdraw()" class="noWithdraw">
                  <span>{{utils.parseProperty(assets, "config."+coinType.toUpperCase()+".cannot_withdraw_reason")}}</span>
                </div>
              </b-form>

              <!-- 站内转账 -->
              <b-form class="innner-form" v-else @submit.prevent.stop="withdraw" autocomplete="false">
                <table class="inner-trans"><tbody>
                <tr class="tr-msg">
                  <td class="label"></td>
                  <td>
                    <p class="via-input-error color-red fs-12">{{!addressError.alert?addressError.text:""}}&nbsp;</p>
                  </td>
                </tr>
                <tr class="tr-addr">
                  <td class="label"><span>CoinEx账号：</span></td>
                  <td class="address-input-group">
                    <b-input-group size="lg" class="f16 address-input-group" :class="addressError.alert?'in-error':''">
                      <b-form-input ref="addressInputIn" :class="addressError.alert?'error':(addressFocus?'':'')" placeholder="请输入手机号或邮箱" autocomplete="off" class="address-input"
                                    @focus.native="addressInput" @focusout.native="addressFocus=false" @input="addressInput"
                                    size="lg" v-model="address" type="text" />
                      <b-input-group-button class="coin-input-group-btn " :class="addressFocus?'focus':''">
                        <b-dropdown text="站内联系人" variant="" size="lg" style="">
                          <b-dropdown-item v-for="(item,index) in innerTransAddrs" :key="index" @click="handleAddressSelect(item.account,item)" :class="item.selected?'selected':''">
                            <span class="remark">{{item.remark? item.remark.simplify(12) + ":&nbsp;":""}}</span>
                            <span class="address">{{getDropdownAddress(item, "account")}}</span>
                            <i class="icon iconfont icon-delete" @click.prevent.stop="deleteWinShow=true;delete_address=item;delete_address.coin_address=''"></i>
                          </b-dropdown-item>
                          <b-dropdown-item @click="newAddressInterWinShow=true" class="add-item">
                              <span>
                                <i class="icon iconfont icon-i-add fs-14 mr-10"></i> 添加新联系人</span>
                          </b-dropdown-item>
                        </b-dropdown>
                      </b-input-group-button>
                    </b-input-group>
                  </td>
                </tr>
                <tr class="tr-msg">
                  <td class="label"></td>
                  <td>
                    <div class="input-container">
                      <p class="mt-5 fs-12 color-red" v-if="withdrawAmountErrorText">{{ withdrawAmountErrorText }}</p>
                    </div>
                  </td>
                </tr>
                <tr class="tr-money">
                  <td class="label"><span>实际到账：</span></td>
                  <td class="address-input-group input-container">
                    <div class=" foucs-container f-money" :class="moneyFoces?'money-focus':''">
                      <b-input-group :right="coinType.toUpperCase()">
                        <b-form-input class="f20" type="number" AutoCompleteType="Disabled" autocomplete="off" step="any"
                                      size="lg" name="" v-model="coinActualAmount" @focusout.native="moneyFoces=false" @input="moneyInput" @focusin.native="moneyInput"
                                      placeholder="金额" style="border-right-width:0px;z-index:0"></b-form-input>
                      </b-input-group>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td class="label"></td>
                  <td>
                    <div>
                      <b-tooltip content="*存在充值未完全确认或挂单冻结的情况，部分金额无法提现" target="can-not-withdraw-msg" bottom style="display:inline" placement="bottom">
                        <p style="text-align:left;width:100%" v-if="frozenAmount > 0 ||  confirmingDepositAmount > 0">*存在充值未完全确认或挂单冻结的情况，部分金额无法提现</p>
                      </b-tooltip>
                    </div>
                    <p class="color-gray mt-5">
                      <span>可提币数量：</span>
                      <a class="color-green2" href="javascript:void(0)" @click="coinAvailableClick" style="text-decoration: underline;">{{availableAmount}}</a> {{coinType.toUpperCase()}}
                      <span v-show="frozenAmount > 0 ||  confirmingDepositAmount > 0" class="warming-msg" style="">
                          <i class="fa fa-exclamation-circle fs-18" id="can-not-withdraw-msg" aria-hidden="true"></i>
                        </span>
                    </p>
                    <div class="input-container">
                      <div class="mt-5 color-gray o-h">
                        <div class="fl">
                          <span>提现手续费：</span>
                          <span>{{networkFee}} {{coinType.toUpperCase()}}</span>
                        </div>
                        <div class="fr">
                          <span>实际扣币：</span>
                          <span>{{actualReduce}} {{ coinType.toUpperCase() }}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr class="tr-auth">
                  <td class="label"><span>验证码：</span></td>
                  <td class="foucs-container" :class="vercodeError.alert?'in-error':''">
                    <Vercode mode="border" v-if="info.userData" :isFirst="true" ref="vercode" :switcher="(info.userData.has_totp_auth && info.userData.mobile)?true:false"
                             :defaults="info.userData.protect_type" :countryCode="info.userData.country_code" :errorText="vercodeError.text"
                             @input="vercodeInput" @focusin.native="vercodeInput" :authed="true" v-model="validateCode"
                             smsType="add_withdraw"></Vercode>
                  </td>
                </tr>
                <tr>
                  <td colspan="2">
                    <div class="input-container full ta-c">
                      <b-btn type="btn" size="lg" variant="outline-yellow" :disabled="busy">立即提现</b-btn>
                    </div>
                  </td>
                </tr>
                </tbody></table>
              </b-form>
            </div>
          </template>

          <div class="mt-40 pl-40">
            <p class="f16">提现说明:</p>
            <div class="mt-5 color-gray explanation">
              <p>
                <b>提现网络费:</b>
                <span>
                  {{parseFloat(networkFee) === 0.00 || !isNormalWithdraw ?"0":networkFee}}；
                </span>
                <b>提现手续费:</b>
                <span>
                  0
                </span>
              </p>
              <div>
                <b>到账时间:</b>
                <span>{{" "}}{{isNormalWithdraw?"提现审核后将尽快汇出，到账时间取决于收款方所需要的确认数":"邮件确认后立即划转，实时到账。"}}</span>
              </div>
            </div>
            <p class="mt-20  pb-30">
              <a target="_blank" :href="'https://support.coinex.com/hc/articles/360006124733'"
                 class="f12">
                <span>提现常见问题</span> &gt;</a>
            </p>
          </div>
        </div>
        <header class="row-header">
          <span>最近五条提币记录</span>
          <b-link class="fr color-black fs-14" :to="'/my/wallet/record/withdraw?type=' + tab">
            <span>全部提现记录</span>&nbsp;&gt;</b-link>
        </header>
        <div class="box-shadow">
          <b-table class="m_table myDealTable" :fields="fields" :per-page="pageSize" :items="historyTableItems">
            <template slot="create_time" slot-scope="item">
              <b-link :to="'/my/wallet/withdraw/detail?id='+item.item.coin_withdraw_id">{{utils.getTimeText(item.value)}}</b-link>
            </template>

            <template slot="actual_amount" slot-scope="item">
              <p class="tr">{{(item.value).formatMoney(utils.getAccurate(tab,"long"),".","",true)}}</p>
            </template>
            <template slot="coin_address_display" slot-scope="item">
              <span v-if="item.item.transfer_method === 'local'">
                {{item.item.coin_address}}
              </span>
              <span v-else class="">{{item.value}}</span>
            </template>

            <template slot="confirmations" slot-scope="item">
              <template v-if="/to_confirm/.test(item.item.status)">
                <span class="status-item">待确认</span>
                <a class="status-item" href="javascript:;" @click="cancelPay(item.item)">撤销</a>
                <a class="status-item" href="javascript:;" @click="retryConfirmEmail(item.item)">重发邮件</a>
              </template>
              <template v-if="/audit|manual_audit/.test(item.item.status)">
                <span class="status-item">待审核</span>
                <a class="status-item" href="javascript:;" @click="cancelPay(item.item)">撤销</a>
              </template>
              <span v-if="/cancel|fail|finish|confirming|processing|confirmed|pass|not_pass/.test(item.item.status)" class="status-item">{{$globalT("withdraw_status_"+item.item.status)}}</span>
            </template>

            <template slot="tx_id" slot-scope="item">
              <a v-if="item.item.explorer.indexOf('http') >= 0" class="color-green2 ta-l" :href="item.item.explorer" target="_blank">{{item.value.formatTxId()}}</a>
              <p v-else-if="item.item.transfer_method === 'local'" class="ta-c">站内转账</p>
              <span v-else class="color-gray ta-l">
                {{item.value.formatTxId()}}>
              </span>
            </template>
          </b-table>
          <div class="emptyTableBody noborder" v-if="orderTab==='recent' && !historyTableItems.length">
            <p class="emptyTips">暂无记录</p>
            <span class="i_emptyTable"></span>
          </div>
        </div>
      </div>
    </two-column>
    <b-modal v-model="showExceedAmountAlert" centered title="" :hide-footer="true">
      <p style="text-align: center;font-size: 20px;">您的提现金额超过本日可提额度，请完成实名认证获得更高额度。</p>
      <div class="btn-container" style="margin-top: 22px;">
        <b-button size="lg" variant="gradient-yellow" @click="$router.push('/my/info/basic')">去认证</b-button>
      </div>
    </b-modal>
  </div>
</template>
<script>
  import Vue from "vue";
  import {mapState} from "vuex";
  import Pager from "~/components/Pager";
  import utils from "~/plugins/utils";
  import TwoColumn from "~/components/2Column";
  import MenuBar from "~/components/MenuBar";
  import Vercode from "~/components/Vercode.vue";
  import AddAddress from "~/components/AddressAdd";
  import AddAddressInter from "~/components/AddressAddInter";
  import ViaTab from "~/components/Tab";
  import WalletStep from "~/components/wallet/WalletStep";
  import consts from "~/plugins/consts";
  import CoinSearchSelect from "~/components/CoinSearchSelect";
  const pageSize = 5;
  const xmrTabs = ["XMR", "XMC", "XMV"];

  export default {
    components: {
      Pager,
      Vercode,
      TwoColumn,
      MenuBar,
      AddAddress,
      ViaTab,
      WalletStep,
      AddAddressInter,
      CoinSearchSelect,
    },
    //   layout:"2Column",
    head() {
      return {
        title: "提币" + this.$globalT("site_title"),
      };
    },
    mounted() {
      this.$nextTick(() => {
        this.reqInnerTransAddr();
      });
    },
    methods: {
      // 请求站内转账联系人
      reqInnerTransAddr() {
        this.axios.get("/res/bank/local/withdraw/address").then(res => {
          if (res.data && res.data.code === 0) {
            this.innerTransAddrs = res.data.data || [];
          } else {
            this.dispatch("setErrorText", res.data.message);
          }
        }).catch(e => {
          this.dispatch("setErrorText", e.message);
        });
      },

      moneyInput() {
        this.moneyFoces = true;
        this.withdrawAmountErrorText = "";
        this.addressFocus = false;
      },
      addressInput() {
        this.moneyFoces = false;
        this.addressFocus = true;
        this.addressError = {
          alert: false,
          text: "",
        };
      },
      clearPayment() {
        this.paymentIdError = "";
        this.paymentId = "";
      },
      vercodeInput() {
        this.vercodeError = {
          alert: false,
          text: "",
        };
      },
      // 检查是否可以提现
      checkTypeWithdraw() {
        if (!this.assets || !this.assets.withdraw_asset_type) {
          return true;
        }

        return this.assets.withdraw_asset_type.indexOf(this.tab.toUpperCase()) >= 0;
      },
      deleteAddress() {
        const _this = this;
        let url = "/res/bank/withdraw/address/" + _this.delete_address.withdraw_address_id;
        if (!this.isNormalWithdraw) {
          // 站内转账地址删除
          url = "/res/bank/local/withdraw/address/" + _this.delete_address.local_withdraw_address_id;
        }

        _this.address_busy = true;
        _this.axios.delete(url).then(e => {
          if (!e.data.code) {
            _this.$store.dispatch("setSuccessText", "删除成功");
            _this.address_busy = false;
            setTimeout(function() {
              _this.deleteWinShow = false;
              _this.initAddressList();
              _this.reqInnerTransAddr();
            }, 800);
          } else {
            // 全局错误
            _this.address_busy = false;
            _this.$store.dispatch("setErrorText", e.data.message);
          }
        }).catch(e => {
          _this.address_busy = false;
          _this.$store.dispatch("setErrorText", e.message);
        });
      },
      initAddressList() {
        const _this = this;
        // 更新地址列表
        const addressType = _this.tab.toLowerCase() === "cny" ? "card" : "address?coin_type=" + _this.tab.toLowerCase();
        _this.axios.get("/res/bank/" + (_this.tab.toLowerCase() === "cny" ? "user" : "withdraw") + "/" + addressType)
          .then(res => {
            _this.cards = res.data.data;
            return true;
          });
      },
      addSuccess() {
        this.initAddressList();
      },
      addInterSuccess() {
        // 刷新站内转账联系人列表
        this.reqInnerTransAddr();
      },
      handleClick() {
        this.$refs["address-input"].focus();
      },
      amountFormat: function(val, digit = 8) {
        if (/\./.test(val)) {
          let decimal = /\.(\d*)?/.exec(val);
          if (decimal && decimal.length) {
            decimal = decimal[1];
          }
          if (decimal && decimal.length >= digit) {
            return val.split(".")[0] + "." + decimal.substring(0, digit);
          } else {
            return val;
          }
        } else {
          return val;
        }
      },
      handleAddressSelect(address, item) {
        if (this.isWithTagCoins) {
          const arr = utils.formatXMRAddress(address);
          this.address = arr[0] || "";
          if (!this.noPaymentId) {
            this.paymentId = arr[1] || "";
          }
        } else {
          this.address = address;
        }
        if (this.isNormalWithdraw) {
          this.cards.forEach((elem) => {
            elem["selected"] = false;
          });
        } else {
          this.innerTransAddrs.forEach((elem) => {
            elem["selected"] = false;
          });

          setTimeout(() => {
            this.addressInput();
            this.$refs.addressInputIn.focus();
          }, 200);
        }
        item["selected"] = true;
      },
      changeCoinType(item) {
        if (item && item.value) {
          this.$router.push("/my/wallet/withdraw?type=" + item.value);
        }
      },
      hidden() {},
      getDropdownAddress(item, field = "coin_address") {
        if (item.remark && (item.remark.length + item[field].length) > 40) {
          return item[field].simplify(20);
        } else if ((item.remark.length + item[field].length) > 40) {
          return item[field].simplify(20);
        } else {
          return item[field];
        }
      },
      addressAdd() {
        if (this.address_busy) {
          return false;
        }
        const _this = this;
        if (!this.checkbox_status) {
          _this.modalShow = false;
          return false;
        }
        const data = {
          coin_address: _this.address,
          coin_type: _this.tab,
          remark: _this.address_remark,
        };
        if (this.isWithTagCoins && this.paymentId !== "") {
          data["coin_address"] = this.address + ":" + this.paymentId;
        }
        _this.address_busy = true;
        _this.axios
          .post("/res/bank/coin/withdraw/address/" + this.coin_withdraw_id, data)
          .then(res => {
            _this.address_busy = false;
            if (!res.data.code) {
              _this.$store.dispatch("setSuccessText", res.data.message);
              setTimeout(function() {
                _this.modalShow = false;
                // _this.$store.dispatch("updateAssets");
                _this.initAddressList();
              }, 888);
            } else {
              _this.$store.dispatch("setErrorText", res.data.message);
            }
          }).catch(e => {
          _this.$store.dispatch("setErrorText", e.message);
          this.address_busy = false;
        });
      },
      init() {
        this.address = "";
        this.coinActualAmount = 0;
        this.cnyWithdrawAmount = "";
        // this.fundspass = "";
        if (this.$refs.vercode) {
          this.$refs.vercode.$emit("reset");
        }
        this.withdrawAmountErrorText = "";
        this.addressError = {
          alert: false,
          text: "",
        };
        this.vercodeError = {
          alert: false,
          text: "",
        };
        this.paymentIdError = "";
      },
      coinAvailableClick() {
        this.coinActualAmount = this.availableAmount
          .decimalMinus(this.networkFee)
          .round(utils.getAccurate(this.tab, "long"));
        if (this.coinActualAmount.decimalCmp(0) < 0) {
          this.coinActualAmount = "0";
        }
      },
      initData(list) {
        list.forEach(item => {
          if (!item.coin_type) {
            item.coin_type = "CNY";
          } else {
            item.coin_type = item.coin_type;
          }
          if (item.card_info) {
            item.addr =
              item.bank_name +
              " " +
              item.card_info.card_branch +
              " " +
              item.card_no;
          }
        });
      },
      getRecords() {
        const _this = this;
        const type = "coin";
        this.axios
          .get("/res/account/" + type + "/withdraw?page=" + this.currentPage + "&limit=" + this.pageSize +
            (this.coinType !== "CNY" ? "&coin_type=" + this.coinType.toLowerCase() : "")
          ).then(res => {
          if (!res.data.code) {
            _this.initData(res.data.data.data);
            _this.historyTableFields =
              _this["history" + (_this.coinType === "CNY" ? "CNY" : "Coin") + "TableFields"];
            _this.historyTableItems = res.data.data.data;
            _this.length = res.data.data.total;
          } else {
            _this.$store.dispatch("setErrorText", res.data.message);
            _this.historyTableItems = [];
            _this.length = 0;
          }
        })
          .catch(e => {
            _this.$store.dispatch("setErrorText", e.message);
            _this.historyTableItems = [];
            _this.length = 0;
          });
      },
      withdraw(e) {
        // 提现
        const _this = this;
        let resultAll = true;
        if (!this.coinActualAmount) {
          this.withdrawAmountErrorText = "请填写到账数量";
          resultAll = false;
        } else if ((!isNaN(this.coinActualAmount)) && this.coinActualAmount * 1 <= 0) {
          this.withdrawAmountErrorText = "请填写正确的提现金额";
          resultAll = false;
        }
        if (!this.address) {
          this.addressError = {
            alert: true,
            text: "请填写提币地址",
          };
          resultAll = false;
        }
        if (!this.validateCode || !this.validateCode.content.validate_code) {
          this.vercodeError = {
            alert: true,
            text: "请填写验证码",
          };
          resultAll = false;
        }
        if (this.isWithTagCoins && this.isNormalWithdraw && !_this.noPaymentId && !_this.paymentId) {
          this.paymentIdError = "请输入 [Tag]".replace(/\[\tag]/, consts.TagName[this.tab]);
          resultAll = false;
        }
        if (!e.target.getAttribute("disabled") &&
          !this.busy &&
          this.checkWithdrawAmount() && resultAll
        ) {
          let type = "coin";
          if (this.tab === "CNY") {
            type = "cash";
          }
          const data = {};
          if (this.tab === "CNY") {
            data.amount = this.cnyWithdrawAmount;
          } else {
            data.actual_amount = this.coinActualAmount;
          }
          data.coin_address = _this.address;
          if (this.isWithTagCoins && this.isNormalWithdraw) {
            if (!_this.noPaymentId) {
              data.coin_address = _this.address + ":" + _this.paymentId;
            }
          }
          data.coin_type = _this.tab.toLowerCase();
          data.transfer_method = this.isNormalWithdraw ? "onchain" : "local";
          if (
            this.validateCode.type === "mobile" ||
            this.validateCode.type === "voice"
          ) {
            data.sms_captcha = this.validateCode.content;
          } else if (this.validateCode.type === "google") {
            data.totp_captcha = this.validateCode.content;
          }
          _this.busy = true;
          // 提交
          _this.axios
            .post("/res/account/" + type + "/withdraw", data)
            .then(res => {
              _this.busy = false;
              if (res.data.code === 0) {
                _this.$router.push(`/my/wallet/withdraw/detail?id=${res.data.data.coin_withdraw_id}`);
              } else if (res.data.code === 202) {
                // _this.fundsPasswordError = res.data.message;
                if (_this.$refs.vercode) {
                  _this.$refs.vercode.$emit("reset");
                }
                // _this.$store.dispatch("setErrorText", res.data.message);
                _this.withdrawTip = res.data.message;
                _this.withdrawTipVisible = true;
              } else if (res.data.code === 7) {
                _this.vercodeError.text = res.data.message;
                this.addressError.alert = false;
              } else if (res.data.code === 33 || res.data.code === 310) {
                // 账号错误
                this.addressError.text = res.data.message;
                this.addressError.alert = false;
              } else if (res.data.code === 120) {
                this.showExceedAmountAlert = true; // 超出提现额度
              } else {
                // 全局错误
                // _this.$store.dispatch("setErrorText", res.data.message);
                _this.withdrawTip = res.data.message;
                _this.withdrawTipVisible = true;
              }
            })
            .catch(() => {
              _this.busy = false;
            });
        }
      },
      cancelPay(item) {
        // 取消订单
        let type = "coin";
        if (this.tab === "CNY") {
          type = "cash";
        }
        const _this = this;
        this.axios
          .delete(
            "/res/account/" + type + "/withdraw/" + item[type + "_withdraw_id"]
          )
          .then(res => {
            if (!res.data.code) {
              item.status = "cancel";
              _this.init();
              _this.$store.dispatch("updateAssets");
            } else {
              // 全局错误
              _this.$store.dispatch("setErrorText", res.data.message);
            }
          });
      },
      retryConfirmEmail(item) {
        this.axios.patch(`/res/account/coin/withdraw/${item.coin_withdraw_id}`)
          .then((res) => {
            if (!res.data.code) {
              this.$store.dispatch("setSuccessText", "发送成功");
            } else {
              this.$store.dispatch("setErrorText", res.data.message);
            }
            this.getRecords();
          });
      },
      checkWithdrawAmount: function() {
        const type = this.tab === "CNY" ? "cny" : "coin";
        let result = true;
        if (this[type + "WithdrawAmount"] && (this.coinActualAmount || this.cnyWithdrawAmount)) {
          const amount = type === "cny" ? this[type + "WithdrawAmount"] : this.coinActualAmount;
          if (amount.toString().decimalCmp(this.availableAmount) > 0) {
            this.withdrawAmountErrorText = "提现超过可提现数量";
            result = false;
          } else if (this.isNormalWithdraw && amount.toString().decimalCmp(this.leastAmount) < 0) {
            this.withdrawAmountErrorText =
              "小于最小提现额度" + " " + this.leastAmount + this.tab;
            result = false;
          } else if (amount.toString() <= 0) {
            result = false;
          }
          // else if (
          //   amount
          //     .toString()
          //     .decimalAdd(this.todayWithdrawAmount)
          //     .decimalCmp(this.dayWithdrawLimit) > 0
          // ) {
          //   // else if(amount.toString().decimalCmp(this.largeAmount)>0){
          //   //   this.withdrawAmountErrorText = $t("manage.assets.withdraw.large_limit")+" "+$t("unit."+this.tab) + this.largeAmount
          //   //   result = false
          //   // }
          //   this.withdrawAmountErrorText =
          //     "大于今日提取额度 " + this.tab + this.dayWithdrawLimit;
          //   result = false;
          // }

          if (this.isNormalWithdraw) {
            if (this.tab === "NEO" && amount.toString().indexOf(".") >= 0) {
              this.withdrawAmountErrorText = "";
              result = false;
            }
          }
        }
        return result;
      },
      checkTabData() {
        return this.assets && this.assets.assets && this.assets.assets.rate_data && this.assets.assets.rate_data[this.tab];
      },
      // 提币方式更改事件
      onTabChange(index) {
        this.isNormalWithdraw = index === 0;
        this.init();
        this.moneyFoces = false;
        this.addressFocus = false;
      },
    },
    data() {
      return {
        showExceedAmountAlert: false,
        delete_address: {
          coin_address: "",
          account: "",
        },
        deleteWinShow: false,
        newAddressWinShow: false,
        newAddressInterWinShow: false,
        addressFocus: false,
        moneyFoces: false,
        noPaymentId: false,
        paymentId: "",
        paymentIdError: "",
        ps: "",
        coin_withdraw_id: "",
        checkbox_status: false,
        validateCode: null,
        vercodeError: {
          alert: false, // 输入框是否标红
          text: "", // 文本内容
        },
        currentPage: 1,
        addressError: {
          alert: false, // 输入框是否标红
          text: "", // 文本内容
        },
        busy: false,
        address_busy: false,
        modalShow: false,
        remark: "",
        address_remark: "",
        // fundspass: "",
        // fundsPasswordError: "",
        withdrawAmountErrorText: "",
        cnyWithdrawAmount: "",
        cards: [],
        electedCardItem: null,
        charge: 0, // 手续费
        coinActualAmount: 0, // 实际到账
        address: "",
        pageSize: pageSize,
        orderTab: "recent",
        historyTableItems: [],
        length: 0,
        tab: this.variables.defaultAsset,
        coinType: this.variables.defaultAsset.toLowerCase(),
        withdrawTip: "",
        withdrawTipVisible: false,
        frozen_cets: "0",
        tabItems: ["普通提币", "站内转账"],
        isNormalWithdraw: true, // 是否是普通转账
        innerTransAddrs: [], // 站内转账地址
      };
    },
    asyncData(context) {
      const { app, query, req, error } = context;

      let type = "coin";
      if (query.type === "cny") {
        type = "cash";
      }
      query.type = query.type || "bch";
      const addressType =
        query.type === "cny"
          ? "card"
          : "address?coin_type=" + query.type.toUpperCase();
      const userCardPromise = app.axios.init(req).get(
        "/res/bank/" + (query.type === "cny" ? "user" : "withdraw") +
        "/" + addressType);
      const withdrawPromise = app.axios
        .init(req)
        .get(
          "/res/account/" +
          type +
          "/withdraw?page=1" +
          "&limit=" +
          pageSize +
          (query.type !== "cny" ? "&coin_type=" + query.type : "")
        );
      const getServerTimePromise = app.axios.init(req).get("/res/system/time");
      return Promise.all([userCardPromise, withdrawPromise, getServerTimePromise])
        .then(res => {
          if (!res[0].data.code && !res[1].data.code && !res[2].data.code) {
            const addressId = parseInt(query.id);
            let address = "";
            let paymentId = "";
            const cards = res[0].data.data;
            res[1].data.data.data.forEach(item => {
              if (!item.coin_type) {
                item.coin_type = "CNY";
              } else {
                item.coin_type = item.coin_type;
              }
              if (query.type === "cny") {
                item.addr =
                  item.bank_name +
                  " " +
                  item.card_info.card_branch +
                  " " +
                  item.card_no;
              }
            });
            if (addressId && cards) {
              cards.forEach((item) => {
                // withdraw_address_id
                // console.log(item.withdraw_address_id,addressId,item.withdraw_address_id === addressId,address);
                if (parseInt(item.withdraw_address_id) === addressId) {
                  address = item.coin_address;
                  if (xmrTabs.indexOf(query.type.toUpperCase()) !== -1) {
                    const arr = utils.formatXMRAddress(address);
                    address = arr[0] || "";
                    paymentId = arr[1] || "";
                  }
                  return false;
                }
              });
            }
            const tab = query.type.toUpperCase() || "BCH";
            return {
              tab,
              coinType: query.type.toLowerCase(),
              cards: cards,
              address: address,
              paymentId: paymentId,
              historyTableItems: res[1].data.data.data,
              length: res[1].data.data.total,
              serverTime: res[2].data.data.current_timestamp,
            };
          }
        })
        .catch(e => {
          if (!app.axios.handleError(e, context)) {
            error({
              statusCode: 500,
              message: e && e.message,
            });
          }
        });
    },
    fetch(context) {
      const { app, store, req, error } = context;
      return Promise.all([
        store.dispatch("updateAssets", req),
        store.dispatch("updateUserData", req),
        store.dispatch("updateFunds", req),
        store.dispatch("updateAssetDisplay", req),
      ]).catch(e => {
        if (!app.axios.handleError(e, context)) {
          error({
            statusCode: 500,
            message: e && e.message,
          });
        }
      });
    },
    computed: Object.assign(mapState(["assets", "info", "funds", "lang"]), {
      tagName() {
        return consts.TagName[this.tab];
      },
      isMultiAddr() {
        return consts.WithTagCoins.indexOf(this.tab) >= 0;
      },
      inputTag() {
        return "请输入 [Tag]".replace(/\[Tag\]/, consts.TagName[this.tab]);
      },
      isXMRTab() {
        if (xmrTabs.indexOf(this.tab) !== -1) {
          return true;
        }
        return false;
      },
      isWithTagCoins() {
        if (consts.WithTagCoins.indexOf(this.tab) !== -1) {
          return true;
        }
        return false;
      },
      fields() {
        return {
          create_time: {
            label: "提现时间",
          },
          actual_amount: {
            label: "金额(" + this.tab + ")",
            thStyle: {
              width: "120px",
            },
            thClass: ["ta-r"],
          },
          coin_address_display: {
            label: "提现地址",
          },
          confirmations: {
            label: "状态",
            thStyle: {
              width: "210px",
            },
          },
          "tx_id": {
            thStyle: {
              width: "260px",
            },
            tdClass: "ta-l",
            label: "交易ID",
            sortable: false,
          },
        };
      },
      withdrawFunds: function() {
        // 特殊处理，BCC放最后
        const sorts = this.funds.sort.slice();
        for (let i = 0; i < sorts.length; i++) {
          if (sorts[i] === "BCC") {
            const last = sorts[sorts.length - 1];
            sorts[sorts.length - 1] = sorts[i];
            sorts[i] = last;
          }
        }
        return sorts.filter(item => {
          if (item !== "148") {
            return true;
          }
        });
      },
      historyTableFields: {
        get() {
          if (this.tab === "CNY") {
            return {
              create_time: {
                label: "时间",
              },
              // coin_type: {
              //   label: this.$t("manage.assets.cointype")
              // },
              amount: {
                label: "数量" + "(" + this.tab + ")",
              },
              addr: {
                label: "提现银行账号",
              },
              status: {
                label: "状态",
              },
              remark: {
                label: "备注",
              },
              operations: {
                label: "操作",
              },
            };
          } else {
            return {
              create_time: {
                label: "时间",
              },
              // coin_type: {
              //   label: this.$t("manage.assets.cointype")
              // },
              actual_amount: {
                label: "数量" + "(" + this.tab + ")",
              },
              coin_address_display: {
                label: "提现地址",
              },
              confirmations: {
                label: "状态",
              },
              // remark: {
              //   label: this.$t("manage.assets.remark")
              // },
              operations: {
                label: "操作",
              },
            };
          }
        },
        set() {},
      },
      confirmingDepositAmount() {
        if (this.assets && this.assets.assets && this.assets.assets.rate_data[this.tab]) {
          return (this.assets.assets.rate_data[this.tab].confirming_deposit_amount + "").scientificToDecimal();
        }
        return "";
      },
      coinWithdrawAmount: function() {
        const val = this.coinActualAmount
          .toString()
          .decimalAdd(this.networkFee)
          .decimalAdd(this.coinWithdrawFee);
        if (val.decimalCmp(0) > 0) {
          return val;
        } else {
          return "";
        }
      },
      // 实际扣币
      actualReduce() {
        return this.coinActualAmount.toString().decimalAdd(this.networkFee).scientificToDecimal();
      },
      coinWithdrawFee: function() {
        const fee = this.coinActualAmount
          .toString()
          .decimalAdd(this.networkFee)
          .decimalDiv("1".decimalMinus(this.withdrawFeeRate))
          .decimalMul(this.withdrawFeeRate);
        if (fee.decimalCmp(this.withdrawLeastFee) > 0) {
          return fee;
        } else {
          return this.withdrawLeastFee;
        }
      },
      cnyActualWithdraw: function() {
        const val = this.cnyWithdrawAmount
          .toString()
          .decimalMinus(this.cnyWithdrawFee);
        if (val.decimalCmp(0) > 0) {
          return val;
        } else {
          return "";
        }
      },
      cnyWithdrawFee: function() {
        const fee = this.withdrawFeeRate.decimalMul(this.cnyWithdrawAmount || 0);
        if (fee.decimalCmp(this.withdrawLeastFee) < 0) {
          return this.withdrawLeastFee;
        } else {
          return fee;
        }
      },
      networkFee: function() {
        // 站内转账，手续费为0
        if (!this.isNormalWithdraw) {
          return 0;
        }
        let r;
        try {
          r = this.assets.assets.rate_data[this.tab].withdraw_tx_fee;
        } catch (e) {
          r = 0;
        }
        return r;
      },
      withdrawLeastFee: function() {
        let r;
        try {
          r = this.assets.assets.rate_data[this.tab].withdraw_least_amount; // ;withdraw_least_fee
        } catch (e) {
          r = 0;
        }
        return r;
      },
      withdrawFeeRate: function() {
        let r = 0;
        try {
          r = this.assets.assets.rate_data[this.tab].withdraw_fee_rate || 0; //
        } catch (e) {
          r = 0;
        }
        return r;
      },
      totalAmount: function() {
        if (!this.checkTabData()) {
          return "-";
        }
        const r = this.assets.assets.rate_data[this.tab].available !== undefined
          ? this.assets.assets.rate_data[this.tab].available
          : "";
        return parseFloat(r) + "";
      },
      availableAmount: function() {
        if (!this.checkTabData()) {
          return "";
        }
        const r = this.assets.assets.rate_data[this.tab].can_withdraw_amount !==
        undefined
          ? this.assets.assets.rate_data[this.tab].can_withdraw_amount
          : "";
        const num = parseFloat(r) + "";
        return (num + "").scientificToDecimal();
      },
      leastAmount: function() {
        let r;
        try {
          r = this.assets.assets.rate_data[this.tab].withdraw_least_amount;
        } catch (e) {
          r = 0;
        }
        return r;
      },
      largeAmount: function() {
        if (!this.checkTabData()) {
          return "";
        }
        return this.assets.assets.rate_data[this.tab].withdraw_large_amount;
      },
      dayWithdrawLimit: function() {
        if (!this.checkTabData()) {
          return "";
        }
        return this.assets.assets.rate_data[this.tab].daily_withdraw_limit;
      },
      todayWithdrawAmount: function() {
        if (!this.checkTabData()) {
          return "";
        }
        return this.assets.assets.rate_data[this.tab].today_withdraw_amount;
      },
      frozenAmount: function() {
        if (!this.checkTabData()) {
          return "";
        }
        return (this.assets.assets.rate_data[this.tab].frozen + "").scientificToDecimal();
      },
      coinFullName() {
        if (this.assets && this.assets.coinInfo && this.assets.coinInfo[this.tab]) {
          return this.assets.coinInfo[this.tab].fullName;
        }
        return "";
      },
    }),
    watch: {
      modalShow(val) {
        if (!val) {
          this.init();
        }
      },
      coinActualAmount(newAmount, oldAmount) {
        if (!newAmount) {} else {
          if (isNaN(newAmount)) { // 不是数字
            this.coinActualAmount = oldAmount;
          } else { // 限制8位
            let dotNum = parseInt(this.utils.parseProperty(this.assets, "config." + this.tab.toUpperCase() + ".withdraw_precision"));
            if (isNaN(dotNum) || !this.isNormalWithdraw) {
              dotNum = 8;
            }
            const num = this.amountFormat(newAmount, dotNum);
            if (num !== newAmount) {
              this.$nextTick(() => {
                this.coinActualAmount = num;
              });
            }
          }
        }
      },
      currentPage() {
        this.getRecords();
      },
      coinType() {
        this.currentPage = 1;
        this.getRecords();
      },
      coinWithdrawAmount() {
        if (this.coinWithdrawAmount * 1 > 0) {
          this.checkWithdrawAmount();
        }
      },

      paymentId(newVal) {
        if (this.tab === "XRP") {
          if (newVal && (!(/^[\d]+$/.test(newVal)) || newVal.length > 10)) {
            setTimeout(() => {
              this.paymentId = this.paymentId.substring(0, 10).replace(/[^0-9]/ig, "");
            }, 50);

            setTimeout(() => {
              this.paymentIdError = "Tag只能填写数字1-10位";
            }, 200);
          }
        }
      },
    },
  };
</script>

<style lang="scss">
  @import "~assets/scss/variables";
  .page-my-wallet-widthdraw {
    .coin-type-select-container {
      display: flex;
      &.ja_JP {
        .exchange-container {
          width: 231px;
        }
      }
      .exchange-container {
        width: 201px;
        height: 35px;
        .search-input-container:before {
          top: 6px;
        }
      }
      .text {
        line-height: 33px;
      }
    }
    .list-group {
      &.left-menu {
        .list-group-item {
          &.active {
            &:hover {
              cursor: pointer;
            }
          }
        }
      }
    }
    .warming-msg {
      position: relative;
      margin-left: 3px;
      i {
        position: absolute;
        top: -3px;
      }
    }
    .delete-win {
      .modal-dialog {
        .word-break {
          word-break: break-all;
        }
        .btn-container {
          justify-content: space-between;
        }
      }
    }
    .myDealTable {
      .status-item {
        margin: 0 4px;
      }
    }
    .trans-msg{
      margin: auto;
      margin-top: 24px;
      line-height: 1.71;
      color: #e35555;
      font-size: 14px;
      max-width: 610px;
    }
  }
  .address-input-group {
    .coin-input-group-btn {
      button {
        box-sizing: border-box;
        height: 42px;
      }
      button {
        min-width: auto !important;
        font-size: 14px;
        border-radius: 0px;
        background: inherit;
        color: #52cbca;
        border-left-width: 0px;
        border-color: #dddddd;
        line-height: 40px;
      }
      &.focus {
        button {
          border: solid 2px #52cbca;
          border-color: #52cbca !important;
          border-left-width: 0px !important;
        }
      }
    }

    &.in-error{
      .address-input {
        border: 2px solid #e35555;
      }
      .coin-input-group-btn button{
        border: 2px solid #e35555;
        border-left-width: 0!important;
      }
    }

    .address-input {
      border-right-width: 0px !important;
      &:focus {
        border: solid 2px #52cbca;
        border-right-width: 0px !important;
      }
    }
    .coin-input-group-btn {
      .dropdown-menu {
        font-family: PingFangSC;
        right: 0 !important;
        left: auto !important;
        width: 450px;
        top: -2px !important;
        padding: 0 !important; // opacity: .9;
        border: solid 2px #52cbca; // border-top-width: 0;
        border-radius: 0;
        background-color: #ffffff;
        box-shadow: 0 0 20px 0 #ececec;
        transform: translate3d(0px, 43px, 0px) !important;
        .dropdown-item {
          padding: 3px 24px;
          height: 31px;
          position: relative;
          overflow: hidden;
          &:not(:last-child) {
            border-bottom: solid 1px #dddddd;
          }
          &.add-item {
            padding-top: 7px;
            text-align: center;
            color: #ffbc32;
            font-size: 14px;
            .icon {
              margin-right: 8px;
            }
          }
          &.selected {
            &:before {
              content: "\2713";
              color: #52cbca;
              position: absolute;
              left: 7px;
              top: 7px;
            }
          }
          &:hover {
            background-color: #f9f9f9;
          }
          .remark {
            font-size: 16px;
          }
          .address {
            font-size: 14px;
            color: #6f6f6f;
          }
          .icon-delete {
            position: absolute;
            right: 10px;
            top: 3px;
            color: $gray;
            &:hover {
              color: $brandGreen
            }
          }
        }
      }
    }
  }
  .explanation {
    p {
      line-height: 1.71em;
    }
  }
  .input-container{
    .btn-outline-gray{
      color: #fff;
      background-color: #8c8c8c;
      &:hover{
        color: #fff;
        background-color: #8c8c8c;
      }
    }
  }

  .foucs-container{
    &.f-common{
      height: 42px;
    }
    &.f-money{
      height: 48px;
    }

    &.money-focus{
      border: 2px solid #52cbca;
      input,
      .input-group-addon{
        border-width: 0!important;
      }
    }

    .form-control:focus,
    .via-input-container.has-border .via-input-text:focus {
      border-color: #52cbca;
      border-width: 2px;
    }

    &.in-error{
      .via-input-container .via-input-text, .form-control {
        border-color: #e35555;
        border-width: 2px;
      }
      .via-input-error{
        display: none;
      }
    }
  }

  .btc-form {
    justify-content: start;
    width: 600px;
    margin: auto;
    padding-top: 20px;
    .row-wrap {
      width: 100%;
      margin-top: 1px;
    }
    &.en_US{
      label { width: 100px; }
    }
    &.ja_JP{
      label { width: 127px; }
    }
    &.ko_KP{
      label { width: 127px; }
    }
    label {
      font-size: 16px;
      padding-right: 10px;
      width: 112px;
      justify-content: flex-end;
      text-align: right;
      &.custom-control {
        &.custom-checkbox {
          width: 400px !important;
          text-align: left;
          justify-content: flex-start;
        }
      }
    }
    .flex-content {
      display: flex;
      align-items: center;
      flex-flow: row wrap;
    }

    .input-container {
      min-width: 470px;
      input {
        width: 100%;
        font-size: 16px;
        min-height: 38px;
      }
      &.full{
        width: 100%;
        margin-top: 20px;
      }
      .vercode-border{
        min-height: 96px;
      }
    }
    .input-group-addon {
      border-left-width: 0px !important;
      background: inherit !important;
      border-radius: 0px;
      font-size: 16px;
    }
  }
  .noWithdraw{
    position:absolute;
    width: 940px;
    height: 471px;
    background: rgba(23,35,48,.6);
    top:59px;
    left: 0;
    z-index: 100;
    display: flex;
    justify-content: center;
    align-items: center;
    span{
      color:#ffffff;
      font-size: 24px;
      -webkit-font-smoothing: antialiased;
    }
  }
  .innner-form{
    margin-top: 24px;
    .inner-trans{
      margin: auto;
      td{
        vertical-align: middle;
      }
      .input-container {
        min-width: 450px;
      }
      .label{
        padding-right: 10px;
      }
      input {
        width: 100%;
        font-size: 16px;
        min-height: 38px;
      }
      .tr-addr{
        height: 62px;
        .label{
          padding-right: 10px;
        }
        td{
          padding: 0px 0px 20px 0;
        }
      }
      .tr-auth{
        .label{
          vertical-align: top;
          padding-top: 40px;
        }

        .vercode-border{
          padding-top: 15px;
        }
      }
      .tr-msg{
        height: 20px;
      }
      .label{
        font-family: inherit;
        font-size: 16px;
        text-align: right;
        color: #192330;
      }
      .address-input-group{
        min-width: 300px;
        .address-input {
          &.inner-addr{
            border-right-width: 1px!important;
            width: 500px;
          }
          &:focus{
          }
          &.error{
            border: 2px solid #e35555;
            border-right-width: 2px!important;
          }
        }
      }
      .input-group-addon {
        border-left-width: 0!important;
        background: inherit!important;
        border-radius: 0;
        font-size: 16px;
      }
      // button{
      //   margin-top: 17px;
      // }
    }
  }
</style>
