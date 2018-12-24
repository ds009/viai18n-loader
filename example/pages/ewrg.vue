<template>
  <div class="ex-page-apikey" v-if="info.userData">
    <b-modal centered :no-close-on-backdrop="true" ref="op_protect" title="二次验证" v-model="opProtectShow" :hide-footer="true">
      <form class="vercodeBox" @submit.prevent="secondFASubmit">
        <Vercode ref="opProtectVercode" v-if="opProtectShow" :errorText="errorText.vercode" :switcher="(info.userData.has_totp_auth && info.userData.mobile)?true:false" :defaults="info.userData.protect_type" :authed="true" v-model="inputValue.conditional.vercode.model" @input="errorText.vercode=''" :smsType="smsType"></Vercode>
        <div class="btn-container d-flex">
          <b-btn class="btc-lg" type="submit" variant="gradient-yellow">提交</b-btn>
        </div>
      </form>
    </b-modal>
    <!-- Modal View -->
    <b-modal centered class="viewModal" :no-close-on-backdrop="true" id="opView" :title="opModalTitle" :hide-footer="true" v-model="opViewModel">
      <form class="vercodeBox" v-if="viewObject" ref="opViewModal">
        <div>
          <span class="inline-block" style="width:120px;">您的API:</span><span>{{viewObject.remark}}</span>
        </div>
        <div class="mt-10">
          <b-tooltip content="已复制到剪贴板" target="access-copy-successed" style="display:inline" :show="accessKeyCopied" :triggers="'false'">
            <span>已复制到剪贴板</span>
          </b-tooltip>
          <span class="inline-block" style="width:120px;">Access ID:</span><span>{{viewObject.access_id}}</span>
          <a style="text-decoration: none;" class="ml-10 btnCopy" href="javascript:void(0);" id="access-copy-successed" @click="onCopy('accessKey')">
            <i class="iconfont icon-copy color-gray"></i>
          </a>
        </div>
        <div class="mt-10">
          <b-tooltip content="已复制到剪贴板" target="secret-copy-successed" style="display:inline" :show="secretKeyCopied" :triggers="'false'">
            <span>已复制到剪贴板</span>
          </b-tooltip>
          <span class="inline-block" style="width:120px;">Secret Key:</span><span>{{viewObject.secret_key}}</span>
          <a style="text-decoration: none;" class="ml-10 btnCopy" href="javascript:void(0);" id="secret-copy-successed" @click="onCopy('secretKey')">
            <i class="iconfont icon-copy color-gray"></i>
          </a>
        </div>
        <div class="mt-30 clearfix">
          <Qrcode class="qrCodeImg fl" :val="JSON.stringify(qrVal)" :size="qrcode.size" :bg-color="qrcode.bgColor" :fg-color="qrcode.fgColor" level="L"></Qrcode>
          <span style="padding-top: 100px;" class="ml-20 fl">请使用手机APP扫码</span>
        </div>
      </form>
    </b-modal>
    <!-- Modal Create/Edit -->
    <b-modal centered :no-close-on-backdrop="true" id="opCreate" ref="opCreateModal" :title='createContext.keyID ? "修改密钥" : "新建密钥"' :hide-footer="true" v-model="opCreateModel">
      <form @submit.prevent="createOrUpdateAPIKey">
        <form-input autofocus type="text" placeholder="备注" :error="createContext.errorText.remark" @input="createContext.errorText.remark=''" @blur="lazyCheckRemark(createContext.inputValue.required.remark)" v-model="createContext.inputValue.required.remark"></form-input>
        <b-form-textarea rows="3" max-rows="6" aria-describedby="input-help input-feeback" :state="createContext.errorText.allowIPs === ''?'':false" v-model="createContext.inputValue.required.allowIPs" @blur="lazyCheckAllowIPs(createContext.inputValue.required.allowIPs)" @input="createContext.errorText.allowIPs=''" placeholder="适用的IP 地址（一行一个，最多5个）"></b-form-textarea>
        <b-form-invalid-feedback>
          {{createContext.errorText.allowIPs}}
        </b-form-invalid-feedback>
        <div class="check-box">
          <span class="limit-label">权限：</span>
          <b-form-checkbox
            class="c-light"
            :value="true"
            :unchecked-value="false" v-model="createContext.inputValue.optional.limit">
            <div class="ta-l">
              <span>可提现</span>
            </div>
          </b-form-checkbox>
        </div>
        <Vercode ref="createEditVercode" :errorText="createContext.errorText.vercode" :switcher="(info.userData.has_totp_auth && info.userData.mobile)?true:false" :defaults="info.userData.protect_type" :authed="true" v-model="createContext.inputValue.required.vercode" @input="createContext.errorText.vercode=errorText.vercode=''" :smsType="'add_api_withdraw_address'"></Vercode>
        <div class="btn-container d-flex">
          <b-btn variant="gradient-yellow" class="btn btn-lg" type="submit">提交</b-btn>
        </div>
      </form>
    </b-modal>
    <!-- Modal Delete -->
    <b-modal centered :no-close-on-backdrop="true" id="opDelete" ref="opDeleteModal" :title="deleteContext.title" :hide-footer="true" v-model="opDeleteModel">
      <div class="btn-container d-flex">
        <b-btn variant="gradient-yellow" class="btn btn-lg" @click="deleteModal(deleteContext.item)">删除</b-btn>
      </div>
    </b-modal>
    <!-- Modal Bind Email -->
    <b-modal centered :no-close-on-backdrop="true" title="新建白名单地址" :hide-footer="true" v-model="opBindEmailModel">
      <p>注意！添加白名单前需绑定邮箱。</p>
      <div class="btn-container d-flex">
        <b-btn variant="gradient-yellow" class="btn btn-sm ml-30" @click="opBindEmailModel=false">取消</b-btn>
        <b-btn variant="gradient-yellow" class="btn btn-sm" @click="$router.push('/my/info/basic')">去绑定</b-btn>
      </div>
    </b-modal>

    <validate-dialog v-model="opCreateWhiteModel" ref="createWhiteAddrDialog" title="新建白名单地址" :steps="createWhiteSteps" :stepBarVisible="stepBarVisible" @hide="onCreateWhiteHide()" @currentStep="setCurrentStep" @emailtoken="(token)=>{this.submitCreateWhite(token)}">
      <div slot="custom1" class="create-email-info">
        <form @submit.prevent="createOrUpdateWhiteKey">
          <form-input autofocus type="text" placeholder="备注" :error="createWhiteContext.errorText.remark" @input="createWhiteContext.errorText.remark=''" @blur="lazyCheckRemark(createWhiteContext.inputValue.required.remark)" v-model="createWhiteContext.inputValue.required.remark"></form-input>
          <div class="check-area">
            <div class="sub-check" @click="checkAddr(true)">
              <b-form-checkbox
                class="c-light"
                :value="true"
                :unchecked-value="false"
                :checked="isInnerTransfer"
                disabled="disabled">
                <div class="ta-l">
                  <span>站内转账地址</span>
                </div>
              </b-form-checkbox>
            </div>
            <div class="sub-check" @click="checkAddr(false)">
              <b-form-checkbox
                class="c-light"
                :value="true"
                :unchecked-value="false"
                :checked="!isInnerTransfer"
                disabled="disabled">
                <div class="ta-l">
                  <span>站外转账地址</span>
                </div>
              </b-form-checkbox>
            </div>
          </div>
          <div v-if="!isInnerTransfer">
            <form-input autofocus type="text" placeholder="币种" :error="createWhiteContext.errorText.coin_type" @input="createWhiteContext.errorText.coin_type='';ulShow=true" @blur="inputBlur" v-model="createWhiteContext.inputValue.required.coin_type"></form-input>
            <div class="icosearch"><img src="~assets/img/icons/i_search.svg"/></div>
            <div class="coin-search"><coin-search-select ref="coinSearchSelect" :addAll="false" :ulShow="ulShow" @changeInput="changeCoin" :value="createWhiteContext.inputValue.required.coin_type"></coin-search-select></div>
            <form-input autofocus type="text" placeholder="地址" :error="createWhiteContext.errorText.address" @input="createWhiteContext.errorText.address=''" @blur="lazyCheckRemark(createWhiteContext.inputValue.required.address)" v-model="createWhiteContext.inputValue.required.address"></form-input>
            <form-input :style="tagLable?'display:block':'display:none'" type="text" :placeholder="tagLable" :error="createWhiteContext.errorText.coin_tag" @input="createWhiteContext.errorText.coin_tag=''" v-model="createWhiteContext.inputValue.optional.coin_tag"></form-input>
          </div>
          <div v-else>
            <form-input autofocus type="text" placeholder="CoinEx账号" :error="createWhiteContext.errorText.address" @input="createWhiteContext.errorText.address=''" @blur="lazyCheckRemark(createWhiteContext.inputValue.required.address)" v-model="createWhiteContext.inputValue.required.address"></form-input>
          </div>
          <Vercode ref="createEditVercode" :errorText="createWhiteContext.errorText.vercode" :switcher="(info.userData.has_totp_auth && info.userData.mobile)?true:false" :defaults="info.userData.protect_type" :authed="true" v-model="createWhiteContext.inputValue.required.vercode" @input="createWhiteContext.errorText.vercode=errorText.vercode=''" :smsType="'add_api_withdraw_address'"></Vercode>

          <div class="btn-container d-flex">
            <b-btn variant="gradient-yellow" class="btn btn-lg" type="submit">提交</b-btn>
          </div>
        </form>
      </div>
      <div slot="custom2" class="create-ok">
        <table><tbody>
        <tr v-if="!isInnerTransfer">
          <th class="label">币种：</th>
          <th class="value">{{createWhiteContext.inputValue.required.coin_type}}</th>
        </tr>
        <tr>
          <th class="label">地址：</th>
          <th class="value">{{createWhiteContext.inputValue.required.address}}</th>
        </tr>
        </tbody></table>
        <p class="oklabel">白名单地址添加成功！</p>
        <div class="btn-container d-flex">
          <b-btn variant="gradient-yellow" class="btn btn-lg" @click="createOK">确认</b-btn>
        </div>
      </div>
    </validate-dialog>
    <two-column>
      <div slot="left-side">
        <MenuBar/>
      </div>
      <div slot="right-content" class="right-content">
        <div v-if="(!info.userData.has_totp_auth && !info.userData.mobile)">
          <div class="o-h pl-40 pb-30" style="background:#ffffff;" >
            <p class="color-black mt-60 fs-20">2步完成新建API：</p>
            <div class="mt-20 o-h">
              <div class="fl step-box ta-c">
                <i class="mt-20">1</i>
                <p class="f18 mt-10 ta-c mt-5 color-green2">设置安全验证方式</p>
                <p class="color-green2 mt-10"><b-link to="/my/info/security">去设置<span> &gt;</span></b-link></p>
              </div>
              <div class="fl step-box ta-c ml-20">
                <i class="mt-20">2</i>
                <p class="f18  mt-10 ta-c mt-5 color-gray">新建API</p>
              </div>
            </div>
          </div>
        </div>
        <div v-else>
          <div class="config-line">
            <div class="flexshow">
              <div class="title c-dark">API设置: </div>
              <div class="flex"></div>
              <div class="op-line">
                <b-btn variant="outline-green" class="btn-xs" v-b-modal.opCreate @click="createContext.keyID=''">新建密钥</b-btn>
              </div>
            </div>
            <div class="table-line">
              <b-table :fields="tableFields" :items="listItems">
                <template slot="allow_ips" slot-scope="item">
                  <p v-if="!item.item.allow_ips">-</p>
                  <p v-else-if="item.item.allow_ips.indexOf('\n')>=0" v-for="(ip, index) in item.item.allow_ips.split('\n')" :key="index">
                    {{ ip }}
                  </p>
                  <p v-else-if="item.item.allow_ips.indexOf(';')>=0" v-for="(ip, index) in item.item.allow_ips.split(';')" :key="index">
                    {{ ip }}
                  </p>
                  <p v-else v-for="(ip, index) in item.item.allow_ips.split(',')" :key="index">
                    {{ ip }}
                  </p>
                </template>
                <template slot="create_time" slot-scope="item">
                  <span v-if="item.item.create_time">{{ utils.getTimeText(item.item.create_time) }}</span>
                </template>
                <template slot="is_expires" slot-scope="item">
                  <span v-if="!item.item.is_expires">已生效</span>
                  <span v-else>已失效</span>
                </template>
                <template slot="expired_time" slot-scope="item">
                  <span v-if="item.item.expired_time !== 0">{{ utils.getTimeText(item.item.expired_time) }}</span>
                  <span v-else-if="!item.item.is_expires">永久</span>
                  <span v-else>-</span>
                </template>
                <template slot="secret_key" slot-scope="item">
                  <!--<span v-if="item.item.secret_key">{{ item.item.secret_key }}</span>-->
                  <a href="javascript:void(0);" class="optionLink" muse_scanned="true" @click="popViewModal(item.item)">查看</a>
                </template>
                <template slot="limit" slot-scope="item">
                  <span v-if="item.item.create_time">{{ item.item.allow_withdraw?"可提现":"-" }}</span>
                </template>
                <template slot="options" slot-scope="item">
                  <div class="d-flex flex-wrap">
                    <b-link class="optionLink" muse_scanned="true" @click="popEditModal(item.item)">编辑</b-link>
                    <b-link class="optionLink ml-10" muse_scanned="true" @click="popDeleteModal(item.item)">删除</b-link>
                  </div>
                </template>
              </b-table>
              <div class="emptyTableBody noborder" v-if="!listItems.length">
                <p class="emptyTips">无API_KEY</p>
                <span class="i_emptyTable"></span>
              </div>
              <!-- <Pager :total-rows="items.length" v-model="currentPage" :per-page="pageSize"></Pager> -->
              <b-pagination v-if="false" align="right"  class="btn-sm" prev-text="" next-text="下一页" :total-rows="length" v-model="currentPage" :per-page="pageSize"></b-pagination>
            </div>
            <div class="hint-line">
              <div class="c-dark fs-16">提示：</div>
              <ul class="c-light mt-10">
                <li>• API密钥对相当于账号/密码对，请务必妥善保管。</li>
                <li>• 每个用户最多只能创建5个密钥对。</li>
              </ul>
            </div>
          </div>

          <div class="withdraw-line">
            <div class="flexshow">
              <div class="title c-dark">提现地址白名单</div>
              <div class="flex"></div>
              <div class="op-line">
                <b-btn variant="outline-green" class="btn-xs" @click="createNewWhiteAddress()">新建白名单地址</b-btn>
              </div>
            </div>
            <div class="table-line mt-30">
              <b-table :fields="whiteApiFields" :items="withdrawAddrItems">
                <template slot="withdraw_address_id" slot-scope="item">
                  <b-link class="optionLink" muse_scanned="true" @click="popDeleteAddressModal(item.item)">删除</b-link>
                </template>
              </b-table>
              <div class="emptyTableBody noborder" v-if="!withdrawAddrItems.length">
                <p class="emptyTips">{{$globalT("no_content")}}</p>
                <span class="i_emptyTable"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </two-column>
  </div>
</template>

<style lang="scss">
  .ex-page-apikey {
    .modal-body {
      max-height: 560px;
    }
    .viewModal {
      .modal-content {
        width: 640px;
      }
    }
    .right-content {
      .config-line {
        background: white;
        box-shadow: 0 0 20px 0 #ececec;
        padding: 40px 40px 24px 40px;
        .title {
          font-size: 20px;
        }
        .hint-line {
          margin-top: 60px;
        }
      }

      .nowrap {
        white-space: nowrap;
      }
      .flexshow {
        display: flex;
      }
      .flex {
        flex: 1;
      }
      .plr-5 {
        padding: 0 5px;
      }
      .warning {
        margin-top: 10px;
        color: #6f6f6f;
      }
      .withdraw-line {
        margin-top: 10px;
        background: white;
        padding: 31px 40px 24px 40px;
        .title {
          font-size: 20px;
          line-height: 32px;
        }

        .table-line {
          margin-top: 32px;
          background: white;
        }
      }

      .table-line {
        margin-top: 40px;
        background: white;
        border: solid 1px #eeeeee;
      }
    }

    .create-ok {
      font-size: 16px;
      .label {
        color: #6f6f6f;
      }
      .value {
        color: #192330;
      }
      th {
        padding-bottom: 30px;
      }

      .oklabel {
        padding-bottom: 40px;
        color: #192330;
        font-size: 16px;
      }
    }

    .create-email-info {
      position: relative;
      .check-area {
        padding: 10px 0;
        .custom-control-input:disabled~.custom-control-indicator {
          background-color: #fff;
        }
        .custom-control-input:checked ~ .custom-control-indicator,
        .custom-control-input:focus ~ .custom-control-indicator {
          // box-shadow: none;
          background: #52cbca;
          height: 10px;
          width: 10px;
          margin-top: 2px;
        }
        .custom-control-indicator {
          border-radius: 50%;
          height: 14px;
          width: 14px;
        }
        .c-light:first-child {
          margin-right: 60px;
        }
        .c-light {
          cursor: pointer;
          user-select: none;
        }
        .sub-check {
          display: inline-block;
        }
      }
      .coin-search {
        position: absolute;
        left: 0px;
        right: 0px;
        top: 172px;
        .search-selcet .input {
          display: none;
        }
        .list-container .list {
          max-height: 203px !important;
        }
      }
      .icosearch {
        position: absolute;
        top: 143px;
        right: 0;
      }
    }

    .check-box {
      margin: 50px 0 10px;
      line-height: 24px;
      display: flex;
      align-items: center;
      user-select: none;

      .limit-label {
        color: #6f6f6f;
        font-size: 16px;
        margin-right: 22px;
      }

      .ta-l {
        margin-left: 10px;
        margin-top: 1px;
      }
    }
  }
</style>

<script>
  import Vue from "vue";
  import { mapState } from "vuex";
  import utils from "~/plugins/utils";
  import TwoColumn from "~/components/2Column";
  import FormInput from "~/components/FormInput.vue";
  import Vercode from "~/components/Vercode.vue";
  import Qrcode from "~/components/Qrcode";
  import regexps from "~/plugins/regexps";
  import MenuBar from "~/components/AccountMenuBar";
  import ValidateDialog from "~/components/ValidateDialog.vue";
  import CoinSearchSelect from "~/components/CoinSearchSelect";
  import consts from "~/plugins/consts";
  const pageSize = 10;

  export default {
    components: {
      TwoColumn,
      FormInput,
      Vercode,
      Qrcode,
      MenuBar,
      ValidateDialog,
      CoinSearchSelect,
    },
    head: function() {
      return {
        title: "API密钥" + this.$globalT("site_title"),
      };
    },

    asyncData: function(context) {
      const { app, req } = context;
      const userAPIPromise = app.axios
        .init(req)
        .get("/res/user/auth/api?page=1&limit=" + pageSize);
      const withdrawAddrPromise = app.axios
        .init(req)
        .get("/res/bank/api/withdraw/address");
      return Promise.all([userAPIPromise, withdrawAddrPromise])
        .then(res => {
          const userAPIData = res[0];
          const withdrawAddr = res[1];
          return {
            length: userAPIData.data.data.total,
            listItems: userAPIData.data.data.data || [],
            withdrawAddrItems: (withdrawAddr.data || {}).data || [],
          };
        })
        .catch(e => {
          app.axios.handleError(e, context, true);
        });
    },
    data() {
      return {
        accessKeyCopied: false,
        secretKeyCopied: false,
        stepBarVisible: false,
        ulShow: false,
        rebateCode: "",
        createWhiteSteps: [
          {
            step: "custom1",
          },
          {
            step: "email",
            send: true,
            emailType: "add_api_withdraw_address",
          },
          {
            step: "custom2",
            pass: true,
          },
        ],
        inputValue: {
          conditional: {
            vercode: {
              condition: function(context) {
                return context.opProtectShow;
              },
              model: null,
            },
          },
        },
        errorText: {
          vercode: "",
        },
        createContext: {
          $t: this.$t,
          keyID: null,
          inputValue: {
            required: {
              remark: "",
              vercode: "",
              allowIPs: "",
            },
            optional: {
              limit: false,
            },
          },
          errorText: {
            remark: "",
            vercode: "",
            allowIPs: "",
          },
        },
        createWhiteContext: {
          $t: this.$t,
          keyID: null,
          inputValue: {
            required: {
              remark: "",
              coin_type: "",
              address: "",
              vercode: "",
            },
            optional: {
              coin_tag: "",
            },
          },
          errorText: {
            remark: "",
            vercode: "",
            coin_type: "",
            address: "",
            coin_tag: "",
          },
        },
        deleteContext: {
          title: "",
          item: null,
        },
        viewContext: {
          title: "",
          item: null,
        },
        qrcode: {
          val: "",
          bgColor: "#FFFFFF",
          fgColor: "#000000",
          size: 120,
        },
        secondFASubmit: null,
        opProtectShow: false,
        opCreateModel: false,
        opDeleteModel: false,
        opBindEmailModel: false,
        opCreateEmailModel: false,
        opViewModel: false,
        opCreateWhiteModel: false,
        opViewMode: 0,
        currentPage: 0,
        listItems: [],
        withdrawAddrItems: [],
        viewObject: null,
        length: 0,
        pageSize: pageSize,
        bindEmailInfo: {
          operateToken: "",
          emailCodeToken: "",

          email: "",
          sequence: "",
          validateCode: "",
        },
        tagLable: "",
        isInnerTransfer: true,
      };
    },
    computed: Object.assign(
      {
        qrVal: function() {
          if (this.viewObject) {
            return {
              apiKey: "" + this.viewObject.access_id + "",
              secretKey: "" + this.viewObject.secret_key + "",
            };
          } else {
            return {};
          }
        },
        opModalTitle() {
          return this.opViewMode === 0 ? "查看密钥" : "新建密钥";
        },
        tableFields() {
          return {
            remark: {
              label: "备注",
              thStyle: {
                width: "84px",
              },
            },
            is_expires: {
              label: "状态",
              thStyle: {
                width: "80px",
              },
            },
            expired_time: {
              label: "有效期",
              thClass: "nowrap",
              thStyle: {
                width: "80px",
              },
            },
            access_id: {
              label: "Access ID",
              class: "break-word plr-5",
            },
            secret_key: {
              label: "Secret Key",
              thStyle: {
                width: "86px",
              },
              class: "break-word plr-5",
            },
            allow_ips: {
              label: "IP白名单",
              thClass: "nowrap",
              class: "break-word plr-5",
            },
            limit: {
              label: "权限",
              thStyle: {
                width: "100px;",
              },
              class: "plr-5",
            },
            options: {
              label: "操作",
            },
          };
        },
        whiteApiFields() {
          return {
            remark: {
              label: "备注",
              thStyle: {
                width: "100px",
              },
            },
            coin_type: {
              label: "币种",
              thStyle: {
                width: "180px",
              },
            },
            coin_address: {
              label: "地址",
              class: "break-word",
            },
            withdraw_address_id: {
              label: "操作",
              thStyle: {
                width: "100px",
              },
            },
          };
        },
      },
      mapState(["info", "lang"])
    ),

    methods: {
      checkAddr(isInner) {
        this.isInnerTransfer = isInner;
      },
      inputBlur() {
        this.lazyCheckRemark(
          this.createWhiteContext.inputValue.required.coin_type
        );
        setTimeout(() => {
          if (!this.createWhiteContext.inputValue.required.coin_type) {
            this.ulShow = false;
          }

          this.setTagLabel();
        }, 200);
      },
      setTagLabel() {
        this.tagLable = consts.TagName[this.createWhiteContext.inputValue.required.coin_type] || "";
      },
      changeCoin(val) {
        this.createWhiteContext.inputValue.required.coin_type = val;
      },
      createNewWhiteAddress() {
        if (this.info.userData.email) {
          this.opCreateWhiteModel = true;
        } else {
          this.opBindEmailModel = true;
        }
      },
      // 设置当前创建白名单的所走步骤
      setCurrentStep(item) {
        this.currentStep = item;
      },
      onCreateWhiteHide() {
        this.clearWhiteContext();
        if (this.currentStep && this.currentStep.pass) {
          this.refreshWhiteList();
        }

        this.refreshWhiteList();
      },
      refreshWhiteList() {
        const _this = this;
        this.axios.get("/res/bank/api/withdraw/address").then(res => {
          utils.handleRequest(res, _this, {
            "0": function() {
              _this.withdrawAddrItems = res.data.data || [];
            },
          });
        });
      },
      createOK() {
        this.opCreateWhiteModel = false;
        this.refreshWhiteList();
      },
      onCopy(type) {
        let text = "";
        if (type === "accessKey") {
          text = this.viewObject.access_id;
        } else if (type === "secretKey") {
          text = this.viewObject.secret_key;
        }
        if (text) {
          this.$copyText(text, this.$refs.opViewModal)
            .then(() => {
              this[`${type}Copied`] = true;
              setTimeout(() => {
                this[`${type}Copied`] = false;
              }, 1200);
            })
            .catch(err => {
              console.error(err);
            });
        }
      },

      resetAllVercode: function() {
        if (this.$refs.opProtectVercode) {
          this.$refs.opProtectVercode.$emit("reset");
        }
        if (this.$refs.createEditVercode) {
          this.$refs.createEditVercode.$emit("reset");
        }

        utils.clearContext(this);
      },

      refreshList: function() {
        const _this = this;
        this.axios.get("/res/user/auth/api?page=1&limit=" + pageSize).then(res => {
          utils.handleRequest(res, _this, {
            "0": function() {
              _this.length = res.data.data.total;
              _this.listItems = res.data.data.data;
            },
          });
        });
      },
      clearWhiteContext() {
        this.createWhiteContext.inputValue.required = {
          remark: "",
          coin_type: "",
          address: "",
          vercode: "",
        };

        this.createWhiteContext.errorText = {
          remark: "",
          vercode: "",
          coin_type: "",
          address: "",
        };

        this.currentStep = {};
      },
      // 新建白名单 检查提交信息
      createOrUpdateWhiteKey() {
        this.setTagLabel();
        if (this.tagLable) {
          this.createWhiteContext.inputValue.required.coin_tag = this.createWhiteContext.inputValue.optional.coin_tag + "";
        } else {
          delete this.createWhiteContext.inputValue.required.coin_tag;
        }

        if (this.isInnerTransfer) {
          delete this.createWhiteContext.inputValue.required.coin_type;
        }

        if (
          utils.checkRequired(this.createWhiteContext) &&
          utils.checkRequired(this) &&
          this.checkCreateWhiteForm()
        ) {
          // 二次验证
          const vercode = this.createWhiteContext.inputValue.required.vercode;
          this.createWhiteContext.inputValue.required.coin_type = this.createWhiteContext.inputValue.required.coin_type || "";
          let url, params;
          if (vercode.type === "mobile") {
            url = "/res/message/validate/sms";
            params = {
              sequence: vercode.content.sequence,
              validate_code: vercode.content.validate_code,
            };
          } else if (vercode.type === "google") {
            url = "/res/user/validate/totp";
            params = {
              validate_code: vercode.content.validate_code,
            };
          }
          this.axios.post(url, params).then((res) => {
            if (!res.data.code) {
              this.$refs.createWhiteAddrDialog.nextStep();
              this.operate_token = res.data.data.operate_token;
            } else {
              this.createWhiteContext.errorText.vercode = res.data.message;
            }
          });
        }

        this.createWhiteContext.inputValue.required.coin_type = this.createWhiteContext.inputValue.required.coin_type || "";
      },

      submitCreateWhite(token) {
        const required = this.createWhiteContext.inputValue.required;
        const optional = this.createWhiteContext.inputValue.optional;
        const coinAddress = this.tagLable ? (required.address + ":" + optional.coin_tag) : required.address;
        const params = {
          remark: required.remark,
          coin_address: coinAddress,
          coin_type: required.coin_type,
          email_code_token: token,
          operate_token: this.operate_token,
          transfer_method: "onchain",
        };

        if (this.isInnerTransfer) {
          delete params.coin_type;
          params.transfer_method = "local";
        }

        const _this = this;
        this.axios.post("/res/bank/api/withdraw/address", params).then(res => {
          utils.handleRequest(res, this, {
            "0": function() {
              _this.$refs.createWhiteAddrDialog.nextStep();
            },
          });

          if (res.data.code !== 0) {
            this.opCreateWhiteModel = false;
          }
        });
      },

      createOrUpdateAPIKey: function() {
        if (
          utils.checkRequired(this.createContext) &&
          utils.checkRequired(this) &&
          this.checkCreateForm()
        ) {
          const _this = this;

          const required = this.createContext.inputValue.required;
          const optional = this.createContext.inputValue.optional;
          const params = {
            remark: required.remark,
            allow_withdraw: optional.limit === true,
          };

          params.allow_ips = required.allowIPs ? required.allowIPs : "";

          // 二次验证
          const vercode = this.createContext.inputValue.required.vercode;

          if (vercode) {
            if (vercode.type === "mobile") {
              params.sms_captcha = vercode.content;
            } else if (vercode.type === "google") {
              params.totp_captcha = vercode.content;
            }
          }

          const method = this.createContext.keyID ? "put" : "post";
          const url =
            "/res/user/auth/api" +
            (this.createContext.keyID ? "/" + this.createContext.keyID : "");
          return this.axios[method](url, params).then(res => {
            utils.handleRequest(res, _this, {
              "0": function() {
                _this.$refs.opCreateModal.hide();
                _this.opProtectShow = false;

                if (!_this.createContext.keyID) {
                  _this.listItems.unshift(res.data.data);
                  _this.viewObject = res.data.data;
                  _this.opViewMode = 1;
                  _this.opViewModel = true;
                } else {
                  _this.refreshList();
                }
              },
              "8": function() {
                _this.smsType = _this.createContext.keyID
                  ? "edit_user_auth"
                  : "add_user_auth";
                _this.secondFASubmit = _this.createOrUpdateAPIKey;
                _this.opProtectShow = true;
              },
            });
          });
        }
      },

      popEditModal: function(keyItem) {
        this.createContext.keyID = keyItem.user_auth_id;
        this.createContext.inputValue.required.remark = keyItem.remark;
        this.createContext.inputValue.required.allowIPs = keyItem.allow_ips;
        this.createContext.inputValue.optional.limit =
          keyItem.allow_withdraw === true;
        this.$refs.opCreateModal.show();
      },

      getAPIKey: function() {
        let params = null;
        // 二次验证

        const vercode = this.inputValue.conditional.vercode.model;
        if (vercode) {
          params = {};
          if (vercode.type === "mobile") {
            params.sms_captcha = JSON.stringify(vercode.content);
          } else if (vercode.type === "google") {
            params.totp_captcha = JSON.stringify(vercode.content);
          }
        }

        const _this = this;
        return this.axios
          .get(
            "/res/user/auth/api/" + this.viewContext.item.user_auth_id,
            params
              ? {
                headers: params,
              }
              : null
          )
          .then(res => {
            utils.handleRequest(res, _this, {
              "0": function() {
                _this.opProtectShow = false;
                Vue.set(
                  _this.viewContext.item,
                  "secret_key",
                  res.data.data.secret_key
                );
                _this.viewObject = _this.viewContext.item;
                _this.opViewMode = 0;
                _this.opViewModel = true;
              },
              "8": function() {
                _this.smsType = "get_user_auth";
                _this.secondFASubmit = _this.getAPIKey;
                _this.opProtectShow = true;
              },
            });
          });
      },

      popDeleteAddressModal(keyItem) {
        this.$refs.opDeleteModal.show();
        this.deleteContext.title = "确定删除白名单 [name] ?".replace(/\[name\]/, keyItem.remark);
        this.deleteContext.item = keyItem;
        this.deleteContext.isWhiteAddress = true;
      },

      popDeleteModal: function(keyItem) {
        this.$refs.opDeleteModal.show();
        this.deleteContext.title =
          "确定删除API" + " " + keyItem.remark + " " + "?";
        this.deleteContext.item = keyItem;
        this.deleteContext.isWhiteAddress = false;
      },

      popViewModal: function(keyItem) {
        this.resetAllVercode();
        this.viewContext.item = keyItem;
        this.getAPIKey(this.viewContext.item);
      },

      deleteModal() {
        if (this.deleteContext.isWhiteAddress) {
          this.deleteWhiteAddress();
        } else {
          this.deleteAPIKey();
        }
      },

      deleteWhiteAddress: function() {
        const params = {};
        // 二次验证
        const vercode = this.inputValue.conditional.vercode.model;
        if (vercode) {
          if (vercode.type === "mobile") {
            params.sms_captcha = vercode.content;
          } else if (vercode.type === "google") {
            params.totp_captcha = vercode.content;
          }
        }

        const _this = this;
        const url = "/res/bank/api/withdraw/address/" + (_this.deleteContext.item.api_withdraw_address_id);
        return this.axios
          .delete(url, {
            data: params,
          }).then(res => {
            utils.handleRequest(res, _this, {
              "0": function() {
                _this.$refs.opDeleteModal.hide();
                _this.opProtectShow = false;
                _this.refreshWhiteList();
              },
              "8": function() {
                _this.smsType = "delete_user_auth";
                _this.secondFASubmit = _this.deleteWhiteAddress;
                _this.opProtectShow = true;
              },
            });
          });
      },

      deleteAPIKey: function() {
        const params = {};
        // 二次验证
        const vercode = this.inputValue.conditional.vercode.model;
        if (vercode) {
          if (vercode.type === "mobile") {
            params.sms_captcha = vercode.content;
          } else if (vercode.type === "google") {
            params.totp_captcha = vercode.content;
          }
        }
        // console.log(params)
        // console.log(this.deleteContext.item)
        const _this = this;
        return this.axios
          .delete("/res/user/auth/api/" + this.deleteContext.item.user_auth_id, {
            data: params,
          })
          .then(res => {
            utils.handleRequest(res, _this, {
              "0": function() {
                _this.$refs.opDeleteModal.hide();
                _this.opProtectShow = false;
                _this.refreshList();
              },
              "8": function() {
                _this.smsType = "delete_user_auth";
                _this.secondFASubmit = _this.deleteAPIKey;
                _this.opProtectShow = true;
              },
            });
          });
      },
      lazyCheckRemark: function(value) {
        if (!value) {
          this.createContext.errorText.remark = "请填写备注名";
          return false;
        }
        if (value.length > 20) {
          this.createContext.errorText.remark = "超出20个字符长度限制";
          return false;
        }
        if (value && !regexps.apiRemarkRegExp.test(value)) {
          this.createContext.errorText.remark = "IP 白名单格式有误";
          return false;
        }
        return true;
      },

      lazyCheckAllowIPs(value) {
        if (value) {
          const ips = value.split("\n");
          let valid = true;
          for (let i = 0; i < ips.length; i++) {
            const isIP = regexps.ipRegExp.test(ips[i]) || regexps.ipV6RegExp.test(ips[i]);
            if (!isIP) {
              valid = false;
              break;
            }
          }
          if (!valid) {
            this.createContext.errorText.allowIPs = "IP 白名单格式有误";
            return false;
          }
        }
        return true;
      },
      checkCreateForm: function() {
        const valid1 = this.lazyCheckRemark(
          this.createContext.inputValue.required.remark
        );
        const valid2 = this.lazyCheckAllowIPs(
          this.createContext.inputValue.required.allowIPs
        );
        return valid1 && valid2;
      },

      checkCreateWhiteForm() {
        const valid1 = this.lazyCheckRemark(
          this.createWhiteContext.inputValue.required.remark
        );

        return valid1;
      },
    },
    fetch(context) {
      const { app, store, req } = context;
      return store.dispatch("updateUserData", req).catch(e => {
        app.axios.handleError(e, context, true);
      });
    },

    watch: {
      opProtectShow: function(isShow) {
        if (isShow) {
          utils.clearContext(this);
          this.resetAllVercode();
        }
      },
      opCreateModel(isShow) {
        if (isShow) {
          if (!this.createContext.keyID) {
            utils.clearContext(this.createContext);
          }
          this.resetAllVercode();
        }
      },
      opDeleteModel(isShow) {
        if (isShow) {
          this.resetAllVercode();
        }
      },
      "createWhiteContext.inputValue.required.coin_type": function(val) {
        if (!val) {
          this.ulShow = false;
        }
        this.createWhiteContext.inputValue.required.coin_type = val.toUpperCase();
        if (this.$refs.coinSearchSelect && this.$refs.coinSearchSelect.displayArr.length > 0) {
          this.$refs.coinSearchSelect.displayArr.forEach((item) => {
            if (item.value === val) {
              setTimeout(() => {
                if (this.$refs.coinSearchSelect) {
                  this.$refs.coinSearchSelect.onSelect(item);
                }
                this.ulShow = false;
              }, 200);
            }
          });
        }
      },
    },
  };
</script>

