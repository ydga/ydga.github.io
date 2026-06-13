import { useRef } from "react"

import { ContextPanel } from "@/features/designer/components/layout/context-panel"
import { MainStage } from "@/features/designer/components/layout/main-stage"
import { useDesignerUi } from "@/features/designer/state/use-designer-ui"
import { useDesignerSettings } from "@/features/designer/state/use-designer-settings"
import { usePageNameSync } from "@/features/designer/state/use-page-name-sync"

export function DesignerShell() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { settings, dispatch, setBackgroundImage } = useDesignerSettings()
  const ui = useDesignerUi()

  usePageNameSync({
    settings,
    pageNameSource: ui.pageNameSource,
    setPageNameFromPreset: ui.setPageNameFromPreset,
    syncPageNameFromSettings: ui.syncPageNameFromSettings,
  })

  return (
    <div className="relative h-svh overflow-hidden bg-background">
      <div className="flex h-full min-h-0">
        <MainStage ui={ui} settings={settings} canvasRef={canvasRef} />

        <ContextPanel
          ui={ui}
          settings={settings}
          dispatch={dispatch}
          canvasRef={canvasRef}
          onImageUpload={setBackgroundImage}
        />
      </div>
    </div>
  )
}
