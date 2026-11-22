// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { useGameStore } from '@game/store'
import { POIS } from '@world/data/hoanKiem'
import { CozyApp } from '@game/CozyApp'

// The 3D canvas needs WebGL, which jsdom does not provide. Everything else is real.
vi.mock('@game/scene/Scene', () => ({ Scene: () => <div data-testid="scene" /> }))
// jsdom has no WebGL; the gate is tested directly in boundary.test.tsx
vi.mock('@game/ui/Boundary', async () => {
  const actual = await vi.importActual('@game/ui/Boundary')
  return { ...(actual as object), detectWebGL: () => null }
})

describe('UI shell (design system)', () => {
  beforeEach(() => {
    useGameStore.setState({
      phase: 'TITLE',
      dialogue: null,
      prompt: null,
      promptPoi: null,
      toasts: [],
      pieces: [],
      hasSave: false,
    })
  })

  it('renders the cozy title card with the exact palette classes', () => {
    const { container } = render(<CozyApp />)
    expect(container.querySelector('.title__logo h1')?.textContent).toContain('Hà Nội')
    expect(screen.getByText('Chơi mới')).toBeTruthy()
    expect(screen.getByText('Tiếp tục')).toBeTruthy()
    expect(container.querySelector('.panel')).toBeTruthy()
    expect(container.querySelectorAll('.btn').length).toBeGreaterThanOrEqual(4)
    // primary action is the sage pill, disabled save is ghosted
    expect(container.querySelector('.btn--disabled')).toBeTruthy()
  })

  it('walks the player from title to character creation to the world HUD', () => {
    const { container } = render(<CozyApp />)

    fireEvent.click(screen.getByText('Chơi mới'))
    expect(screen.getByText('Bạn là ai ở Hà Nội?')).toBeTruthy()

    const input = screen.getByLabelText('Tên của bạn')
    fireEvent.change(input, { target: { value: 'Minh' } })
    fireEvent.click(screen.getByText('Nghệ nhân bạc'))
    fireEvent.click(screen.getByText('Bắt đầu ngày mới'))

    expect(useGameStore.getState().phase).toBe('PLAYING')
    expect(screen.getByText(/05:40/)).toBeTruthy()
    expect(container.querySelector('.hud')).toBeTruthy()
    expect(container.querySelector('.need__fill')).toBeTruthy()
  })

  it('shows the interaction prompt and opens a dialogue card', async () => {
    useGameStore.getState().startNew('Lan', 'PHOTOGRAPHER')
    render(<CozyApp />)

    act(() => {
      useGameStore.getState().scanNearestPoi(POIS.find((p) => p.id === 'npc-co-hoa')!.x, POIS.find((p) => p.id === 'npc-co-hoa')!.z)
    })
    // the name plate and the interaction prompt both surface the NPC
    expect(screen.getAllByText(/Cô Hoa bán phở/).length).toBeGreaterThanOrEqual(1)

    act(() => {
      useGameStore.getState().interact()
    })
    expect(screen.getByText('Cô Hoa')).toBeTruthy()
    const nextButton = await screen.findByText('Tiếp', {}, { timeout: 4000 })
    fireEvent.click(nextButton)
    await screen.findByText(/Ăn một bát phở bò/, {}, { timeout: 4000 })
  })

  it('opens the 20 km² map from the left rail', () => {
    useGameStore.getState().startNew('Minh', 'STUDENT')
    render(<CozyApp />)
    fireEvent.click(screen.getByLabelText('Bản đồ'))
    expect(screen.getByText(/Bản đồ Hà Nội · 20 km²/)).toBeTruthy()
    fireEvent.click(screen.getByText('Đóng'))
    expect(useGameStore.getState().mapOpen).toBe(false)
  })

  it('quick-eats from the party wheel and spends dong', () => {
    useGameStore.getState().startNew('Minh', 'STUDENT')
    const before = useGameStore.getState().player.dong
    render(<CozyApp />)
    fireEvent.click(screen.getByLabelText('Bánh mì dọc đường'))
    const after = useGameStore.getState().player.dong
    expect(after).toBe(before - 25)
    expect(screen.getByText(/Bánh mì nóng/)).toBeTruthy()
  })

  it('offers a pause card with save and resume', () => {
    useGameStore.getState().startNew('Bảo', 'STUDENT')
    useGameStore.getState().pause()
    render(<CozyApp />)
    expect(screen.getByText('Tạm dừng')).toBeTruthy()
    fireEvent.click(screen.getByText('Tiếp tục'))
    expect(useGameStore.getState().phase).toBe('PLAYING')
  })
})
