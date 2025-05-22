/** 匹配生产环境的url的正则函数，且排除测试环境 */
export const isOnlineUrl = () =>
  !/^(?:(?:\d{1,3}\.){3}\d{1,3}:\d+|localhost:\d+)$/.test(
    window.location.host
  ) && !window.location.host.includes('test')

/** 匹配测试环境的url的正则函数，ip地址或包含test关键字 */
export const isTestUrl = () =>
  /^(?:(?:\d{1,3}\.){3}\d{1,3}:\d+|.*test.*)$/.test(window.location.host)
export const isLocalhost = () => /^localhost:\d+$/.test(window.location.host)

/** 中心页面地址 */
export const CentralUrl = 'https://central.qc-ai.cn'
/** 中心页面测试地址(端口差异) */
export const CentralTestUrl = 'http://central-test.qc-ai.cn:7445'

/** 跳转回到平台 */
export const goPlatform = (path: string) => {
  // 不判断直接浏览器离开同一提示弹窗
  if (path === '/login') {
    if (isOnlineUrl()) {
      return (window.parent.location.href =
        CentralUrl + path + '?fromUrl=' + window.location.href)
    } else {
      return (window.parent.location.href =
        CentralTestUrl + path + '?fromUrl=' + window.location.href)
    }
  }
  try {
    // 检查 window.parent 是否等于 window
    if (window.parent === window) {
      window.open(path, '_self')
    } else {
      window.parent.location.href = window.parent.location.origin + path
    }
  } catch (e) {
    // 如果访问 window.parent 失败，说明是跨域
    window.parent.location.href = window.parent.location.origin + path
  }
}

/** 替换图片地址后缀从png，jpg，jpeg，gif改为webp的压缩格式，如果url为空则返回空字符串 */
export const replaceImgUrlToWebp = (url = '') =>
  url.replace(/\.(png|jpg|jpeg|gif)/, '-thumb.webp')

/** 将对象转换为url查询字符串 */
export const queryFormat = (query: Record<string, any>) => {
  // 如果query为空对象，则返回空字符串
  if (!Object.keys(query).length) return ''
  return query
    ? `?${Object.entries(query)
        .map(([k, v]) => `${k}=${v}`)
        .join('&')}`
    : ''
}
