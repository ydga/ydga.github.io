import { DEFAULT_PAGE_ID } from "@/features/designer/model/ui-types"
import { CanvasViewport } from "@/features/designer/components/layout/canvas-viewport"
import { CanvasToolbar } from "@/features/designer/components/layout/canvas-toolbar"
import { ZoomControls } from "@/features/designer/components/layout/zoom-controls"
import type { CanvasSettings } from "@/features/designer/model/types"
import type { DesignerUi } from "@/features/designer/state/use-designer-ui"

type MainStageProps = {
  ui: DesignerUi
  settings: CanvasSettings
  canvasRef: React.RefObject<HTMLCanvasElement | null>
}

export function MainStage({ ui, settings, canvasRef }: MainStageProps) {
  const isPageSelected =
    ui.selection.kind === "page" && ui.selection.pageId === DEFAULT_PAGE_ID

  return (
    <main className="relative flex min-h-0 min-w-0 flex-1 flex-col">
      <CanvasToolbar ui={ui} />

      <CanvasViewport
        settings={settings}
        canvasRef={canvasRef}
        displayScale={ui.effectiveScale}
        onFitScaleChange={ui.setFitScale}
        isPageSelected={isPageSelected}
        onSelectPage={ui.selectPageAndOpen}
        pageName={ui.pageName}
        onPageNameChange={ui.setPageName}
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center px-4">
        <ZoomControls
          effectiveScale={ui.effectiveScale}
          zoomMode={ui.zoomMode}
          onZoomIn={ui.zoomIn}
          onZoomOut={ui.zoomOut}
          onZoomFit={ui.zoomFit}
        />
      </div>
    </main>
  )
}
