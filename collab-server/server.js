const { Server } = require('@hocuspocus/server');

const server = new Server({
  port: 8888,
  
  // 连接建立时的回调
  async onConnect(data) {
    console.log(`✅ 用户连接到文档: ${data.documentName}`);
    console.log(`   当前连接数: ${data.instance.documents.size}`);
  },

  // 断开连接时的回调
  async onDisconnect(data) {
    console.log(`❌ 用户断开连接: ${data.documentName}`);
  },

  // 监听文档变更
  async onChange(data) {
    console.log(`📝 文档更新: ${data.documentName}`);
  },
});

server.listen();
