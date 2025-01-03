// 创建一个新文件来配置 API
export const API_BASE_URL = import.meta.env.PROD 
  ? 'https://你的后端域名/api'  // 生产环境 API 地址
  : '/api'                      // 开发环境保持代理 