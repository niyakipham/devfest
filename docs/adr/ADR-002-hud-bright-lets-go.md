# ADR-002 — HUD "Bright Let's-Go" (thay thế chrome Cozy Storybook)

- **Ngày:** 2026-11-21
- **Trạng thái:** Accepted — supersedes §3.2–3.3 của `MASTER_PROMPT_HANOI_60K.md`
- **Bối cảnh:** Chủ dự án gửi ảnh tham chiếu HUD in-game (phong cách *Pokémon Let's Go*) và yêu cầu
  redesign UX/UI theo ảnh. Bản v1 dùng thẻ giấy kem + pill sage lấy từ key art trước đó.

## Quyết định

Đổi **ngôn ngữ UI** sang "Bright Let's-Go": thế giới bão hoà, chrome bằng kính trắng, slab tối mờ,
bánh xe công cụ tròn, nút 3D dày. Giữ nguyên **toàn bộ spec chức năng** và store/quest/save.

### Token v2 (đo từ ảnh tham chiếu)

| Token | Giá trị | Dùng cho |
|---|---|---|
| `--c-slab` | `rgba(17,43,52,.62)` | plate tên, thanh L/R, debug |
| `--c-glass` | `rgba(255,255,255,.94)` | panel, rail, needs, toast |
| `--c-ink` | `#123A4B` | chữ chính |
| `--c-teal` | `#21B4E0` | nước, primary phụ, speaker chip |
| `--c-green` | `#3FC24B` | nút primary, thanh năng lượng |
| `--c-lime` | `#8ED44A` | cỏ, fill "bụng" |
| `--c-yellow` | `#F7C948` | chip level, tiền tệ, fill "sức" |
| `--c-red` | `#E8483F` | badge, quest marker, danger |
| Radius | 26px panel · 999px pill · 15px rail · 52/66px slot | |
| Elevation | `0 8px 22px rgba(10,40,52,.24)` + inset trắng | mọi chrome nổi |
| Nút | gradient 3 stop + `0 5px 0` cạnh đáy, active tụt 4px | cảm giác "bấm được" |

### Ánh xạ thành phần (ảnh → game)

| Ảnh tham chiếu | Game |
|---|---|
| Name plate giữa trên (Lv + tên + HP) | `.plate`: Ngày/giờ + tên POI hoặc nhiệm vụ + tiến độ ngày |
| Rail icon trắng bên trái | `.rail`: Bản đồ, Nhật ký, Máy ảnh, Cài đặt, Trợ giúp |
| Cụm 3 slot tròn góc phải dưới | `.party`: Ăn (🍜), Máy ảnh (📷), Xích lô (🛺); badge = số mảnh ký ức |
| Thanh `L … R` + label + meter | `.switch`: đổi công cụ, meter = năng lượng 10 vạch |
| HUD tối giản, không khung | Needs thu gọn góc trái dưới; prompt chỉ hiện khi tới gần |

### Hệ quả

- **Tích cực:** HUD đọc được trên mọi nền; mọi thứ bấm được đều có phản hồi vật lý; không cần học.
- **Đánh đổi:** mất chất "giấy thủ công" của bản v1 → chuyển sang cảm giác game console. Chấp nhận,
  vì chủ dự án ưu tiên ngôn ngữ này.
- **Bắt buộc:** text trên nền sáng luôn dùng `--c-ink`; text trên slab luôn trắng + text-shadow nhẹ;
  không đặt chữ trực tiếp lên trời/cỏ mà không có chrome.
- **Đã cập nhật:** `src/game/ui/styles.css` (viết lại), `Hud/TitleScreen/Creator/DialogueBox/Journal/
  Overlays` + màn mới `MapScreen`; test UI chuyển sang class mới (`.panel`, `.btn`, `.need__fill`).
- **Không đổi:** store, quest, save, API, world data, density gate.
