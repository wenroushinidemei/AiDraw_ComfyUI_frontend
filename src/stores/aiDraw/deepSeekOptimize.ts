import { debounce } from 'lodash'
import { defineStore } from 'pinia'
import { Ref, computed, ref, watch } from 'vue'

import { app } from '@/scripts/app'
import { isLocalhost, isOnlineUrl, isTestUrl } from '@/utils/aiDraw/url'

import { useToastStore } from '../toastStore'

export interface GetTextNodeRequest {
  /**
   * workflowApiJson，经过comfyui转换后的workflow，同/prompt接口入参的prompt字段值
   */
  prompt: string[]
  [property: string]: any
}

export interface GetTextNodeResponse {
  code: number
  data: TextNode[]
  msg: string
  [property: string]: any
}

export interface TextNode {
  input: string
  node_id: string
  /**
   * prompt
   */
  node_type: string
  title: string
  [property: string]: any
}

export interface RefinePromptsResponse {
  code: number
  data: RefinePrompts[]
  msg: string
  [property: string]: any
}

export interface RefinePrompts {
  /**
   * 为空字符串时说明成功，有值时为报错信息
   */
  error_msg: string
  raw_prompt: string
  refined_prompt: string
  [property: string]: any
}

export const useDeepSeekOptimizeStore = defineStore('deepSeekOptimize', () => {
  const getTextNodeLoading = ref(false)
  const textNodes = ref<TextNode[]>([])

  const url = (path: string) => {
    if (isLocalhost()) {
      // 只有本地部署时代理请求才能正常使用
      return path
    } else if (isOnlineUrl()) {
      // 避免comfyui的路径影响接口
      return 'https://aidraw.qc-ai.cn/comfyui/' + path
    } else if (isTestUrl()) {
      // 避免comfyui的路径影响接口
      return 'http://aidraw-test.qc-ai.cn:7443/comfyui/' + path
    }
    return ''
  }

  const getTextNode = debounce(async () => {
    const p = await app.graphToPrompt()
    getTextNodeLoading.value = true
    const u = url('api/list_prompt_nodes')
    void fetch(u, {
      method: 'POST',
      body: JSON.stringify({
        prompt: p.output
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then((response) => response.json())
      .then((res: GetTextNodeResponse) => {
        textNodes.value = res.data
      })
      .finally(() => {
        getTextNodeLoading.value = false
      })
  }, 1000)

  /** 被选中的节点 */
  const selectedTextNodes = ref<TextNode[]>([])
  const refinePromptsLoading = ref(false)

  const refinePromptsParams = computed(() => {
    // 未选择文字节点时，默认选择所有文字节点
    if (selectedTextNodes.value.length === 0)
      return textNodes.value.map((node) => node.input)
    return selectedTextNodes.value.map((node) => node.input)
  })
  // 当节点更改时，各种处理
  watch(
    textNodes,
    (newVal, oldVal) => {
      // 快速比较textNodes和selectedTextNodes里的id是否一致，需要删除textNodes中没有的在selectedTextNodes里的节点
      const newIds = newVal.map((node) => node.node_id)
      const oldIds = oldVal.map((node) => node.node_id)
      const deleteIds = oldIds.filter((id) => !newIds.includes(id))
      selectedTextNodes.value = selectedTextNodes.value.filter(
        (node) => !deleteIds.includes(node.node_id)
      )
      // 通过相同id从textNodes更新selectedTextNodes里节点
      selectedTextNodes.value = selectedTextNodes.value.map((node) => {
        const newNode = newVal.find((n) => n.node_id === node.node_id)
        if (newNode) {
          return newNode
        }
        return node
      })
    },
    {
      deep: true
    }
  )

  /** 润色提示词 */
  const refinePrompts = debounce(async () => {
    refinePromptsLoading.value = true
    const u = url('api/refine_prompts')
    void fetch(u, {
      method: 'POST',
      body: JSON.stringify(refinePromptsParams.value),
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then((response) => response.json())
      .then((res: RefinePromptsResponse) => {
        const newPrompt = res.data
        // 更新节点内容和配置的参考代码
        const handlePromptUpdate = (
          p: RefinePrompts,
          i: number,
          nodes: Ref<TextNode[]>
        ) => {
          if (p.error_msg) {
            return useToastStore().add({
              severity: 'warn',
              summary: 'Warn',
              detail: `#${nodes.value[i].node_id}：${p.error_msg}`,
              life: 4000
            })
          }
          const newNode = app.graph.getNodeById(nodes.value[i].node_id)
          let widget
          if (newNode?.type === 'CLIPTextEncodeFlux') {
            // CLIPTextEncodeFlux的默认使用第二个输入框
            widget =
              newNode?.widgets?.[
                newNode?.widgets?.findIndex(
                  (i) => i.type === ('converted-widget' as any)
                ) === 1
                  ? 0
                  : 1
              ]
          } else {
            // 从 newNode.widgets 数组中选择一个 widget，如果第一个 widget 的类型是 'converted-widget'，则选择第二个 widget，否则选择第一个 widgetTODO:未来是否有三个输入框，输入框如果不在前面，则需要调整
            widget =
              newNode?.widgets?.[
                newNode?.widgets?.findIndex(
                  (i) => i.type === ('converted-widget' as any)
                ) === 0
                  ? 1
                  : 0
              ]
          }
          if (!widget?.value) return
          widget.value = p.refined_prompt
          if (!newNode?.widgets_values) return
          newNode.widgets_values[0] = p.refined_prompt
        }
        newPrompt.forEach((prompt, index) =>
          handlePromptUpdate(
            prompt,
            index,
            selectedTextNodes.value.length ? selectedTextNodes : textNodes
          )
        )
        // newNode.setDirtyCanvas(true, true)
        app.graph.setDirtyCanvas(true, true)
        // 如果有一个成功，则提示成功
        if (newPrompt.some((n) => !n.error_msg))
          useToastStore().add({
            severity: 'success',
            summary: 'Success',
            detail: '润色提示词成功',
            life: 3000
          })
      })
      .finally(() => {
        refinePromptsLoading.value = false
      })
  }, 100)

  /** 切换工作流并初始化 */
  const initDeepSeekOptimize = () => {
    selectedTextNodes.value = []
    void getTextNode()
    refinePromptsLoading.value = false
  }

  return {
    getTextNodeLoading,
    getTextNode,
    textNodes,
    refinePrompts,
    refinePromptsLoading,
    selectedTextNodes,
    initDeepSeekOptimize
  }
})
