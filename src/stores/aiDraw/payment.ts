import { debounce } from 'lodash'
import { defineStore } from 'pinia'
import {
  // reactive,
  ref
} from 'vue'

export interface GetCalculateCostRequest {
  /**
   * workflowApiJson，经过comfyui转换后的workflow，同/prompt接口入参的prompt字段值
   */
  prompt: string[]
  [property: string]: any
}

export interface GetCalculateCostResponse {
  code: number
  data: GetCalculateCostData
  msg: string
  [property: string]: any
}

export interface GetCalculateCostData {
  /**
   * 消耗的算力点
   */
  cost: number
  [property: string]: any
}

/** 支付系统 */
export const usePaymentStore = defineStore('payment', () => {
  /** 请求参数 */
  //   const params = reactive<GetCalculateCostRequest>({
  //     prompt: []
  //   })
  const getCalculateCostLoading = ref(false)
  const calculateCost = ref<string>('0')

  const getCalculateCost = debounce((output: any) => {
    getCalculateCostLoading.value = true
    const u = 'api/calculate_cost'
    void fetch(u, {
      method: 'POST',
      body: JSON.stringify({
        prompt: output
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then((response) => response.json())
      .then((res: GetCalculateCostResponse) => {
        calculateCost.value = res.data.cost.toString()
      })
      .finally(() => {
        getCalculateCostLoading.value = false
      })
  }, 1000)

  return {
    getCalculateCostLoading,
    calculateCost,
    getCalculateCost
  }
})
