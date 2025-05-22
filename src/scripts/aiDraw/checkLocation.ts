// 如果url携带token说明是来自单独的访问
export const checkLocation = () => {
  const currentUrl = new URL(window.location.href)
  const accessToken = currentUrl.searchParams.get('accessToken')
  if (accessToken) {
    // 从 URL 查询参数中获取 accessToken 的值
    localStorage.setItem('accessToken', accessToken)
    // 存储完token后删除url中的token参数
    currentUrl.searchParams.delete('accessToken')
    // 重定向到去除token参数的url
    window.location.href = currentUrl.href
  }
}
