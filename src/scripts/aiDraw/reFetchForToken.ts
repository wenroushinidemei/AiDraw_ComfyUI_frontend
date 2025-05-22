export const reFetchForToken = () => {
  // 改动：重写fetch函数，添加 Authorization 头，进行用户身份鉴权
  const originalFetch = window.fetch
  window.fetch = async function (input, init = {}) {
    // 统一处理 headers
    const headers = new Headers(init.headers || {})

    // 添加 Authorization 头
    const accessToken = localStorage.getItem('accessToken')
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`)
    }

    // 创建新的请求配置
    const newInit = {
      ...init,
      headers
    }

    // 调用原始 fetch
    return originalFetch(input, newInit)
  }
}
