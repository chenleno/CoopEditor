import editorManager from '@/services/editorManager'
import { debounce, calcRem } from '@/utils/baseUtil'

window.onload = function() {
  calcRem()
  const editorManagerInstance = new editorManager()
  const editor = editorManagerInstance.editor
  const refreshDebounced = debounce(() => editor.refresh(), 500)
  window.addEventListener('resize', () => { 
    calcRem()
    refreshDebounced()
  })
}

