import { useLocalStorage } from '@vueuse/core'

import { api } from '../api'
import { getStorageValue } from '../utils'

export const aglLocaleInit = async () => {
  // 最初始化函数
  if (!getStorageValue('AGL.Locale')) {
    // 如果没有配置语言，则拉取配置语言
    const AGLLocale = await api.getSetting('AGL.Locale')
    // 如果没有配置语言，则主动配置中文
    if (!AGLLocale) {
      api.storeSetting('AGL.Locale', 'zh-CN').then(() => {
        // 刷新
        window.location.reload()
      })
    } else {
      // 如果线上配置有，但是本地没有则主动赋值并刷新
      const agl = useLocalStorage('AGL.Locale', AGLLocale)
      agl.value = AGLLocale
      window.location.reload()
    }
  }
}
