/**
 * Settings (Phase 2). Until now `settings` existed in the store and the save but
 * nothing could change it — `reduceMotion` was even hard-coded to false in Player.
 *
 * Every toggle here writes through `updateSettings`, which the save layer persists.
 * The audio switches are honest: turning SFX off stops the bus from being built at
 * all, so a muted game costs zero CPU on audio.
 */
import { useGameStore } from '../store'

const Toggle = ({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint: string
  checked: boolean
  onChange: (next: boolean) => void
}) => (
  <label className="settings__row">
    <span className="settings__copy">
      <strong>{label}</strong>
      <small>{hint}</small>
    </span>
    <input
      type="checkbox"
      className="settings__input"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      role="switch"
      aria-checked={checked}
      aria-label={label}
    />
  </label>
)

export const SettingsPanel = ({ onClose }: { onClose: () => void }) => {
  const settings = useGameStore((s) => s.settings)
  const updateSettings = useGameStore((s) => s.updateSettings)

  return (
    <div className="panel settings" role="dialog" aria-label="Cài đặt">
      <h2 className="settings__title">Cài đặt</h2>

      <Toggle
        label="Giảm chuyển động"
        hint="Tắt nhún nhảy của nhân vật và hiệu ứng giao diện. Nên bật nếu bạn bị chóng mặt."
        checked={settings.reduceMotion}
        onChange={(reduceMotion) => updateSettings({ reduceMotion })}
      />

      <Toggle
        label="Âm thanh"
        hint="Tiếng bước chân, chuông chùa, tiếng phố bằng Web Audio."
        checked={settings.sfx}
        onChange={(sfx) => updateSettings({ sfx })}
      />

      <div className="settings__row settings__row--static">
        <span className="settings__copy">
          <strong>Ngôn ngữ</strong>
          <small>Bản tiếng Anh đang được dịch; nội dung vẫn là tiếng Việt.</small>
        </span>
        <span className="settings__value">{settings.language === 'vi' ? 'Tiếng Việt' : 'English'}</span>
      </div>

      <button type="button" className="btn" onClick={onClose}>
        Xong
      </button>
    </div>
  )
}
