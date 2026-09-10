import { ref, shallowRef } from 'vue'

interface ConfirmOptions {
  title: string
  message?: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
}

const visible = ref(false)
const options = shallowRef<ConfirmOptions>({
  title: '',
  message: '',
  confirmText: 'ยืนยัน',
  cancelText: 'ยกเลิก',
  type: 'danger',
})

let resolvePromise: ((value: boolean) => void) | null = null

export function useConfirm() {
  function confirm(opts: ConfirmOptions): Promise<boolean> {
    options.value = {
      confirmText: 'ยืนยัน',
      cancelText: 'ยกเลิก',
      type: 'danger',
      ...opts,
    }
    visible.value = true
    return new Promise((resolve) => {
      resolvePromise = resolve
    })
  }

  function accept() {
    visible.value = false
    resolvePromise?.(true)
    resolvePromise = null
  }

  function reject() {
    visible.value = false
    resolvePromise?.(false)
    resolvePromise = null
  }

  return { confirm, accept, reject, visible, options }
}
