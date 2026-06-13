import { useRef } from "react"

import { ContextPanel } from "@/features/designer/components/layout/context-panel"
import { MainStage } from "@/features/designer/components/layout/main-stage"
import { useDesignerUi } from "@/features/designer/state/use-designer-ui"
import { useDesignerSettings } from "@/features/designer/state/use-designer-settings"

export function DesignerShell() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { settings, dispatch, setBackgroundImage } = useDesignerSettings()
  const ui = useDesignerUi()

  return (
    <div className="relative h-svh overflow-hidden bg-background">
      <div className="flex h-full min-h-0">
        <MainStage ui={ui} settings={settings} canvasRef={canvasRef} />

        <ContextPanel
          ui={ui}
          settings={settings}
          dispatch={dispatch}
          onImageUpload={setBackgroundImage}
        />
      </div>
    </div>
  )
}
