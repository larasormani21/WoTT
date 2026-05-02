import type { Ref } from 'vue'

export function useFileUpload(options: {
  fileInputRef: Ref<HTMLInputElement | null>
  isAccepted: (fileName: string) => boolean
  onLoad: (text: string) => void
  onReject: (reason: string) => void
}) {
  const openFilePicker = () => {
    options.fileInputRef.value?.click()
  }

  const handleFileUpload = (event: Event) => {
    const inputElement = event.target as HTMLInputElement
    const selectedFile = inputElement.files?.[0]

    if (!selectedFile) return

    if (!options.isAccepted(selectedFile.name)) {
      options.onReject('Only .json or .jsonld allowed')
      return
    }

    const reader = new FileReader()

    reader.onload = (readerEvent) => {
      const fileText = readerEvent.target?.result as string
      options.onLoad(fileText)
    }

    reader.readAsText(selectedFile)
  }

  return { openFilePicker, handleFileUpload }
}
