import { toast as sonner } from 'vue-sonner'

export function useToast() {
  function success(message: string, description?: string) {
    sonner.success(message, {
      description,
      duration: 3500,
    })
  }

  function error(message: string, description?: string) {
    sonner.error(message, {
      description,
      duration: 4500,
    })
  }

  function warning(message: string, description?: string) {
    sonner.warning(message, {
      description,
      duration: 4000,
    })
  }

  function info(message: string, description?: string) {
    sonner.info(message, {
      description,
      duration: 3500,
    })
  }

  function promise<T>(
    promiseFn: Promise<T>,
    opts: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((err: unknown) => string)
    }
  ) {
    return sonner.promise(promiseFn, opts)
  }

  return { success, error, warning, info, promise }
}
