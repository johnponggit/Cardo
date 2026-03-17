// app.js
App({
  onLaunch: function () {
    // 获取用户信息
    this.getUserInfo();
  },

  getUserInfo: function () {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.globalData.userInfo = userInfo;
    }
  },

  globalData: {
    userInfo: null
  }
});