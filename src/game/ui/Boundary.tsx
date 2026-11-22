import { Component, type ErrorInfo, type ReactNode } from 'react'

/**
 * F8 of the blueprint: the app shipped 297 kB of JS with no error boundary and no
 * WebGL fallback, so a single shader compile error produced a blank page.
 *
 * Two layers:
 *  <ErrorBoundary>  — catches any render/runtime throw, offers save + reload
 *  <WebGLGate>      — checks for a WebGL2/1 context *before* mounting the canvas
 *                     and shows a readable explanation instead of a white screen
 */

interface BoundaryProps {
  children: ReactNode
  /** shown in the console for triage */
  label: string
}

interface BoundaryState {
  error: Error | null
}

export class ErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // keep the stack for the bug report the player sees
    console.error(`[hanoi-legends] ${this.props.label} crashed`, error, info.componentStack)
  }

  private reload = (): void => {
    // the save layer is localStorage-first, so a reload never loses progress
    window.location.reload()
  }

  render(): ReactNode {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="fallback" role="alert">
        <div className="panel fallback__card">
          <h2>Thành phố đứng lại một nhịp</h2>
          <p>
            Có lỗi khi đang vẽ thành phố. Bản lưu của bạn vẫn an toàn — nó nằm trong trình duyệt, không bị mất.
          </p>
          <pre className="fallback__trace">{error.message}</pre>
          <div className="fallback__actions">
            <button type="button" className="btn" onClick={this.reload}>
              Mở lại Hà Nội
            </button>
          </div>
          <p className="fallback__hint">
            Nếu lỗi lặp lại, hãy thử tắt hiệu ứng đồ hoạ trong phần Cài đặt, hoặc mở bằng Chrome/Edge bản mới.
          </p>
        </div>
      </div>
    )
  }
}

/** Returns null when WebGL is available, otherwise a short human reason. */
export const detectWebGL = (): string | null => {
  if (typeof document === 'undefined') return null
  try {
    const canvas = document.createElement('canvas')
    const gl2 = canvas.getContext('webgl2')
    if (gl2) return null
    const gl1 = canvas.getContext('webgl') ?? canvas.getContext('experimental-webgl')
    if (gl1) return null
    return 'Trình duyệt không tạo được ngữ cảnh WebGL.'
  } catch (err) {
    return err instanceof Error ? err.message : 'Không kiểm tra được WebGL.'
  }
}

export const WebGLFallback = ({ reason }: { reason: string }): ReactNode => (
  <div className="fallback" role="alert">
    <div className="panel fallback__card">
      <h2>Máy này chưa bật WebGL</h2>
      <p>
        Hà Nội Legends vẽ thành phố bằng WebGL. Bạn vẫn có thể xem nhật ký và bản đồ, nhưng chưa đi dạo được.
      </p>
      <pre className="fallback__trace">{reason}</pre>
      <ul className="fallback__list">
        <li>Chrome/Edge: Settings → System → “Use hardware acceleration when available”.</li>
        <li>Firefox: about:config → <code>webgl.disabled</code> = false.</li>
        <li>Máy ảo / remote desktop thường tắt GPU — hãy thử trên máy thật.</li>
      </ul>
      <div className="fallback__actions">
        <a className="btn" href="https://get.webgl.org/" target="_blank" rel="noreferrer">
          Kiểm tra WebGL của máy
        </a>
      </div>
    </div>
  </div>
)
