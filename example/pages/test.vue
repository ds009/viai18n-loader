<template>
  <div class="page-vote-create">


    <div v-if="isEdit" class="banner">
      <p class="title">编辑项目</p>
    </div>
    <template v-else>
      <div class="banner">
        <p class="title">提交项目资料</p>
        <!-- <p class="subtitle">{{"提交的项目成功上线后，奖励提交人 #num# CET".replace("#num#",1000)}}</p>
        <ul class="slider">
          <li class="item" style="left:0">
            <span class="dot"></span>
            <span class="text">提交项目</span>
          </li>
          <li class="item" style="left:25%;">
            <span class="dot"></span>
            <span class="text">初审</span>
          </li>
          <li class="item" style="left:50%;">
            <span class="dot"></span>
            <span class="text">投票</span>
          </li>
          <li class="item" style="left:75%;">
            <span class="dot"></span>
            <span class="text">复审</span>
          </li>
          <li class="item" style="left:100%;">
            <span class="dot"></span>
            <span class="text">上线</span>
          </li>
        </ul> -->
      </div>
      <!-- <div v-else class="banner first">
        <p class="title">首发直通车</p>
        <p class="subtitle">首发项目CoinEx将直接进行专业审核；</p>
        <p class="subtitle">符合首发上币要求的项目可直接进入上币流程；</p>
        <p class="subtitle">其余项目将进入投票环节。</p>
      </div> -->
    </template>

    <div class="main">
      <div class="panel1">
        <!-- <p v-if="!isFirst" class="tip">温馨提示：初审通过奖励已取消</p> -->
        <div class="upload-box">
          <p class="name required">币种图标：</p>
          <input v-show="false" id="icon-file" name="icon-file" type="file" accept="image/png" @change="onChangeFile" />
          <label class="upload-btn" for="icon-file"  :class="{'error-border':error.file}">
            <template v-if="!fileData">
              <i class="iconfont icon-upload"></i>
              <span class="upload-text">上传</span>
            </template>
            <img v-else class="upload-image" :src="fileData">
          </label>
          <p class="upload-tip">请上传 96*96像素以上 PNG格式图片，图片大小不超过1M</p>
        </div>
        <div class="coin-box">
          <p class="name required">币种名称（英文）：</p>
          <div class="row-item input-item coin-item"  :class="{'error-border':error.fullName}">
            <span class="coin-label">全称</span>
            <input class="coin-input input" @blur="onBurlFullName" v-model="fullName" placeholder="eg:Bitcoin Cash">
          </div>
          <!-- <p class="coin-error">该币种已存在，请重新填写</p> -->
          <div class="row-item input-item coin-item" :class="{'error-border':error.shortName}">
            <span class="coin-label">简称</span>
            <input class="coin-input input" v-model="shortName" placeholder="eg:BCH">
          </div>
        </div>

        <div class="type-box">
          <p class="name" :class="{'required':isFirst}">币种类型：</p>
          <div class="d-inline-flex" :class="{'error-border':error.chainType}">
            <div class="type-item" :class="{'active':chainType==='public'}" @click="onChangeChainType(chainType==='public','public')">公链</div>
            <div class="type-item" :class="{'active':chainType==='non-public'}" @click="onChangeChainType(chainType==='non-public','non-public')">非公链</div>
          </div>
        </div>

        <p class="name" :class="{'required':isFirst}">发行日期：</p>

        <label class="row-item input-item" :class="{'error-border':error.issueDate}">
          <input type="date"  :max="today" v-model="issueDate" placeholder=""  class="input">
        </label>

        <p class="name" :class="{'required':isFirst}">发行总量：</p>
        <div class="row-item input-item" :class="{'error-border':error.issueTotal}">
          <input v-model="issueTotal" type="number" placeholder=""  class="input">
        </div>

        <div class="issue-price-box">
          <p class="name">发行价格：</p>
          <input  class="input border-left-0" :placeholder="'eg：1'+item.coin+'=2000Token'">

          <div class="input-item row-item d-flex" v-for="(item,index) in issuePrices" :key="index">

            <input v-model="item.rate" class="input border-left-0" :placeholder="'eg：1'+item.coin+'=2000Token'">
            <!--here here-->
            <span v-if="index===0" class="create" @click="onCreateIssuePrice">
               <i class="iconfont icon-upload"></i>
            </span>
            <span v-else class="delete" @click="onDeleteIssuePrice(index)">
              <i class="iconfont icon-remove"></i>
            </span>
          </div>
        </div>
      </div>
      <div class="panel2">
        <p class="name" :class="{'required':isFirst}">官网：</p>
        <div class="row-item input-item" :class="{'error-border':error.website}">
          <input v-model="website" placeholder="输入链接"  class="input">
        </div>

        <p class="name" :class="{'required':isFirst}">白皮书：</p>
        <div class="row-item input-item" :class="{'error-border':error.whitePaper}">
          <input v-model="whitePaper" placeholder="输入链接"  class="input">
        </div>
        <p class="name">区块浏览器：</p>
        <div class="input-item row-item">
          <input v-model="browser" class="input" placeholder="输入链接">
        </div>
        <!--<p class="name">合约地址：</p>-->
        <!--<div class="row-item input-item">-->
          <!--<input v-model="contractAddress" placeholder="输入链接"  class="input">-->
        <!--</div>-->
        <p class="name">源代码：</p>
        <div class="row-item input-item">
          <input v-model="sourceCode" placeholder="输入链接"  class="input">
        </div>
        <p class="name">社区：</p>
        <p class="label">昨日排名 | 获得奖励</p>
        <input  class="input border-left-0" placeholder="哈哈哈">
        <div class="input-item row-item d-flex" v-for="(item,index) in communities" :key="index">

          <input v-model="item.url" class="input border-left-0" placeholder="哈哈哈">
          <!--here here-->
          <span v-if="index===0" class="create" @click="onCreateCommunity">
            <i class="iconfont icon-upload"></i>
          </span>
          <span v-else class="delete" @click="onDeleteCommunity">
            <i class="iconfont icon-remove"></i>
          </span>
        </div>
      </div>
      <div class="panel3">
        <template v-if="!isEdit">
          <p class="name" :class="{'required':isFirst}">项目联系人：</p>
          <div class="contact-box-wrap" :class="{'error-border':error.contact}">
            <div class="row-item contact-box" v-for="(item,index) in contacts" :key="index">
              <input placeholder="姓名" class="contact-name" v-model="item.name">
              <div class="input-item contact-input">
                <input class="input" placeholder="电话/邮箱" v-model="item.detail">
                <span v-if="index===0" class="create" @click="onCreateContact">
                  <i class="iconfont icon-upload"></i>
                </span>
                <span v-else class="delete" @click="onDeleteContact(index)">
                  <i class="iconfont icon-remove"></i>
                </span>
              </div>
            </div>
          </div>
        </template>
        <div class="textarea-box clearfix">
          <p class="name required">项目介绍（英文）：</p>
          <textarea v-model="describeEN" class="textarea"  :class="{'error-border':error.describeEN}" placeholder="介绍内容包括但不限于该项目的技术、解决的问题、项目优势、项目计划、团队介绍、投资机构等"></textarea>
          <p class="num">至少100字</p>
        </div>
        <div class="textarea-box clearfix">
          <p class="name">项目介绍（中文）：</p>
          <textarea v-model="describeCN" class="textarea" :class="{'error-border':error.describeCN}" placeholder="介绍内容包括但不限于该项目的技术、解决的问题、项目优势、项目计划、团队介绍、投资机构等"></textarea>
          <p class="num">至少100字</p>
        </div>
        <div class="d-flex justify-content-center">
          <b-button size="sm" variant="outline-yellow" @click="createProject">提交</b-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import Vue from "vue";

  export default {
    components: {

    },
    layout: "incompatible",
    head() {
      return {
        title: "投票上币" ,

        // meta: [
        //   {
        //     hid: "g_viewport",
        //     name: "viewport",
        //     content: "width=device-width, initial-scale=1.0",
        //   },
        // ],
      };
    },
    async fetch(context) {
      const { app, store, req, redirect, route } = context;
      const isEdit = route.path === "/vote/edit";
      try {
        let userData = store.state.info.userData;
        if (!userData) {
          await store.dispatch("updateUserData", req);
          userData = store.state.info.userData;
        }
        if (!userData) {
          redirect(
            `/account/signin?redirect=${encodeURIComponent(route.fullPath)}`
          );
        }
      } catch (e) {
        // app.axios.handleError(e, context, true);
      }
    },


    data() {
      return {
        fileData: null,
        file: null,
        logo: null,
        fullName: "",
        shortName: "",
        chainType: "",
        issueDate: "",
        issueTime: 0,
        issueTotal: "",
        issuePrices: [],
        website: "",
        whitePaper: "",
        browser: "",
        contractAddress: "",
        sourceCode: 'test贝尔v 奋斗',
        communities: [],
        contacts: [
          {
            name: "",
            detail: "",
          },
        ],
        describeEN: "",
        describeCN: "",
        error: {
          file: false,
          fullName: false,
          shortName: false,
          describeEN: false,
          describeCN: false,

          contact: false,
          website: false,
          chainType: false,
          issueDate: false,
          issueTotal: false,
          whitePaper: false,
        },
        requiredVisible: false,
        geetest: {
          enable: false,
          validate: null,
          captchaObj: null,
        },
        today: "",
        isFirst: false,
        isEdit: false,
        id: "",
        imageChange: false,
        nameRepeat: false,
      };
    },
    computed: {
      issuePriceOpts() {
        return ["BCH", "BTC", "ETH", "USD", "Other"];
      },
      communityOpts() {
        return ["Telegram", "Twitter", "Facebook", "weibo"];
      },
    },
    watch: {
      issueDate(newVal) {
        if (newVal === "") {
          this.issueTime = 0;
        } else {
          this.error.issueDate = false;
          this.issueTime = 'd';
        }
      },
      shortName(newVal, oldVal) {
        if (newVal === oldVal) {
          return;
        }
        if (newVal) {
          this.shortName = newVal.toUpperCase();
          this.error.shortName = false;
        } else {
          this.shortName = "";
        }
      },
      fullName(newVal, oldVal) {
        if (newVal === oldVal) {
          return;
        }
        const regx = /^[\x00-\x7F]+$/;
        const name = newVal.trim();
        if (name) {
          if (!regx.test(name)) {
            this.fullName = oldVal;
          }
          this.error.fullName = false;
        }
      },
      describeCN(newVal, oldVal) {
        if (newVal === oldVal) {
          return;
        }
        if (newVal) {
          this.error.describeCN = false;
        }
      },
      describeEN(newVal, oldVal) {
        if (newVal === oldVal) {
          return;
        }
        if (newVal) {
          this.error.describeEN = false;
        }
      },
      website(newVal, oldVal) {
        if (newVal === oldVal) {
          return;
        }
        if (newVal) {
          this.error.website = false;
        }
      },
      chainType(newVal, oldVal) {
        if (newVal === oldVal) {
          return;
        }
        if (newVal) {
          this.error.chainType = false;
        }
      },
      issueTotal(newVal, oldVal) {
        if (newVal === oldVal) {
          return;
        }
        if (newVal) {
          this.error.issueTotal = false;
        }
      },
      whitePaper(newVal, oldVal) {
        if (newVal === oldVal) {
          return;
        }
        if (newVal) {
          this.error.whitePaper = false;
        }
      },
      contacts: {
        handler: function() {
          if (this.isFirst) {
            const contacts = this.buildContacts();
            if (contacts.length !== 0) {
              this.error.contact = false;
            }
          }
        },
        deep: true,
      },
    },
    mounted() {
      this.isEdit = true;
      this.isFirst = true;
      if (!this.isEdit) {
        this.resetData();
      }
      if (this.issuePrices && this.issuePrices.length === 0) {
        this.onCreateIssuePrice();
      }

      if (this.communities && this.communities.length === 0) {
        this.onCreateCommunity();
      }
      if (this.contacts && this.contacts.length === 0) {
        this.onCreateContact();
      }

      this.today = 'dateTimeUtils.formatDate(Date.now() - 1000 * 60 * 60 * 24)';
      if (this.issueTime !== 0) {
        this.issueDate = 'dateTimeUtils.formatDate(this.issueTime * 1000)';
      }
    },
    methods: {
      resetData() {
        this.fileData = null;
        this.file = null;
        this.logo = null;
        this.fullName = "";
        this.shortName = "";
        this.chainType = "";
        this.issueDate = "";
        this.issueTime = 0;
        this.issueTotal = "";
        this.issuePrices = [];
        this.website = "";
        this.whitePaper = "";
        this.browser = "";
        this.contractAddress = "";
        this.sourceCode = "";
        this.communities = [];
        this.contacts = [];
        this.describeEN = "";
        this.describeCN = "";
        this.error = {
          file: false,
          fullName: false,
          shortName: false,
          describeEN: false,
          describeCN: false,
          contact: false,
          website: false,
          chainType: false,
          issueDate: false,
          issueTotal: false,
          whitePaper: false,
        };
        this.requiredVisible = false;
        this.geetest = {
          enable: false,
          validate: null,
          captchaObj: null,
        };
        this.nameRepeat = false;
        this.imageChange = false;
        this.today = 'dateTimeUtils.formatDate(Date.now() - 1000 * 60 * 60 * 24)';
        this.onCreateIssuePrice();
        this.onCreateCommunity();
        this.onCreateContact();
      },
      async onBurlFullName() {
        if (this.isEdit) {
          return;
        }

      },
    },
  };
</script>

<style lang="scss">
</style>
