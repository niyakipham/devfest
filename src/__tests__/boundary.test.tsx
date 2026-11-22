// @vitest-environment jsdom
/**
 * F8: the app had no error boundary and no WebGL fallback, so any render throw
 * inside the scene layer produced a blank page with no explanation.
 */
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ErrorBoundary, WebGLFallback, detectWebGL } from '@game/ui/Boundary'

const Boom = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) throw new Error('shader compile failed: /glsl/water.frag')
  return <p>thành phố vẫn chạy</p>
}

describe('ErrorBoundary', () => {
  it('renders children when nothing throws', () => {
    render(
      <ErrorBoundary label="scene">
        <Boom shouldThrow={false} />
      </ErrorBoundary>,
    )
    expect(screen.getByText('thành phố vẫn chạy')).toBeTruthy()
  })

  it('shows a recoverable card instead of a white page, and never claims data loss', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    render(
      <ErrorBoundary label="scene">
        <Boom shouldThrow />
      </ErrorBoundary>,
    )

    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.getByText(/Thành phố đứng lại một nhịp/)).toBeTruthy()
    // the copy must reassure about the save, not scare the player
    expect(screen.getByText(/Bản lưu của bạn vẫn an toàn/)).toBeTruthy()
    // the raw message is available for bug reports
    expect(screen.getByText(/shader compile failed/)).toBeTruthy()
    // and there is a way out
    expect(screen.getByRole('button', { name: /Mở lại Hà Nội/ })).toBeTruthy()
    spy.mockRestore()
  })

  it('logs the crash with the layer label for triage', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    render(
      <ErrorBoundary label="scene">
        <Boom shouldThrow />
      </ErrorBoundary>,
    )
    expect(spy).toHaveBeenCalled()
    // React logs its own warning first; our line must be somewhere in the calls
    const ours = spy.mock.calls.map((c) => String(c[0])).filter((m) => m.includes('[hanoi-legends]'))
    expect(ours.length).toBeGreaterThan(0)
    expect(ours[0]).toContain('scene crashed')
    spy.mockRestore()
  })
})

describe('WebGL detection', () => {
  it('reports a reason when neither webgl2 nor webgl can be created', () => {
    const original = HTMLCanvasElement.prototype.getContext
    // jsdom implements neither context
    const reason = detectWebGL()
    expect(typeof reason).toBe('string')
    expect(reason!.length).toBeGreaterThan(0)
    HTMLCanvasElement.prototype.getContext = original
  })

  it('passes when a webgl2 context exists', () => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = (() => ({}) as never) as never
    expect(detectWebGL()).toBeNull()
    HTMLCanvasElement.prototype.getContext = original
  })

  it('fallback screen tells the player what to switch on', () => {
    render(<WebGLFallback reason="Không tạo được ngữ cảnh WebGL." />)
    expect(screen.getByText(/Máy này chưa bật WebGL/)).toBeTruthy()
    expect(screen.getByText(/hardware acceleration/)).toBeTruthy()
    expect(screen.getByRole('link', { name: /Kiểm tra WebGL/ })).toBeTruthy()
  })
})
