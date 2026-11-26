# ADR-005 — HUD "Phố cổ Legends": chrome lá cây đậm + portrait dock + cel-shaded anime

- **Ngày:** 2026-11-22
- **Trạng thái:** Accepted — supersedes lớp trình bày của ADR-002 (giữ nguyên spec chức năng)
- **Bối cảnh:** Chủ dự án gửi ảnh tham chiếu in-game (Pokémon Let's Go / Pokopia style —
  ảnh collage 4 frame: plate "Lvl 12 Butterfree" trên đỉnh, rail icon trắng bên trái,
  cụm portrait tròn + 3 nút item tròn bên phải dưới, thanh `L/R` xanh lá dưới cùng) và yêu
  cầu: *"UX/UI hiện tại xấu quá, cải thiện giúp tôi giao diện giống image của tôi gửi nhé —
  nhân vật của game giống phong cách của game genshin."* Ảnh không đến qua ADR-002 (ảnh đó
  là HUD "Let's Go"); đây là phiên bản hoàn thiện hơn của cùng ngôn ngữ, cộng lớp nhân vật anime.

## Quyết định

### 1. Ngôn ngữ hình khối HUD (ảnh → game)

| Ảnh tham chiếu | Hà Nội Legends |
|---|---|
| Plate "Lvl 12 Butterfree" (xanh lá đậm, 2 dòng) | `.plate`: overline vàng small-caps `NGÀY n · giờ · mùa` + tên địa điểm/nhiệm vụ trắng bold + chip loại + thanh ngày |
| Rail icon trắng trên mặt thế giới, không nền panel | `.rail` trong suốt; nút tròn trắng viền trắng, glyph teal; nút Map đầu tiên là **squircle lớn** |
| Cụm portrait tròn (Eevee nhỏ + Pikachu lớn) | `.mates`: portrait companion (nếu đã đón) nhét góc trái + portrait persona (Genshin-style key visual) lớn bên phải; companion có badge `Lv` vàng, bấm = vỗ về (groom) |
| 3 nút item tròn (ball lớn giữa) | `.party`: 3 nút tròn — tool active phóng to + nền vàng, hai nút còn lại trắng ngà |
| Thanh `L · Pikachu · R` + HP bar | `.switch`: pill `L · tên tool · R` trên nền chip tối + **10 vạch segment xanh HP** |
| Map pin giọt nước màu azure | Ấn dấu `.title__pin` (giọt teap azure + sao vàng) trên Title; `.prompt` đính PinIcon; legend map giữ nguyên |
| Needs tối giản | `.needs`: chip tối mờ, meter mảnh — vẫn đủ 4 nhu cầu (RP-03) |

### 2. Nhân vật "phong cách Genshin" — nguyên bản, không sao chép IP

Không dùng asset, mô hình, hay tên của Genshin Impact. Cảm giác đạt được bằng:

- **Toon shading 3 bước** (`MeshToonMaterial` + gradient map 3 mức, cache chia sẻ) — vùng sáng/tối
  tách bạch như splash art; rim light lạnh từ hướng đối diện (`WORLD.rimLight`) tách nhân vật khỏi nền.
- **Mặt anime**: sclera hạt hạnh nhân → iris hổ phách/nâu → glint trên-trái + **viền mí trên đậm**
  (3+1×2 parts). Đây là tín hiệu mạnh nhất ở khoảng cách gameplay.
- **Tóc sculpt**: 2 mảng mái quét lệch + **ahoge** dựng ngược; giữ nguyên grid tóc theo persona.
- **Key visual AI-generated** (`public/portraits/`): 6 chân dung persona + 4 chân dung companion —
  tông cel-shaded painterly, bối cảnh Hà Nội (Tháp Rùa in trên tranh sinh viên). Dùng ở Creator
  (màn chọn nhân vật), DialogueBox (avatar theo tên speaker) và dock HUD.

### 3. Creator → màn chọn nhân vật

2 cột: trái = hero portrait full-bleed + plate tên/nghề (vai trò + tên), phải = tên + grid 6 persona
(ảnh chân dung, radio group, active viền vàng + glow lá cây). Toàn bộ là panel **lá cây đậm**
(`--c-leaf-*`) với chữ trắng/vàng — tương phản AA, không nền trắng trắng.

### 4. Giữ nguyên (bắt buộc)

- Store, quest engine, save, API, world, density gate — **không đổi một dòng logic**.
- Class hooks mà test đang assert: `.btn`, `.panel`, `.hud`, `.need__fill`, `.persona`, `.prompt`,
  `.slot`, `.switch__btn`, `.rail__btn`, `.title__logo h1`, `.plate*`, …
- Cổng thiết kế: token gate (0 raw colour, 0 dead token, ≥ 40 tokens), contrast gate (19 pairs ≥ AA),
  typography floor (≥ 12 px, focus-visible đủ 6 nhóm, `--tap-min`, safe-area, không `@import`).
- `RIG` proportions giữ nguyên (6–8 heads) — thêm parts vẫn trong `PART_BUDGET = 40` (tối đa ~30/hình).

## Đánh đổi

- Bỏ chất "kính trắng" của ADR-002 ở các chrome nổi — chấp nhận, vì ảnh tham chiếu đặt trắng *lên*
  thế giới bão hoà chứ không đặt panel trắng khắp nơi. Panel trắng chỉ còn ở màn hình modal.
- Chân dung AI là binary ~2 MB trong git — chấp nhận như game asset; không ảnh hưởng bundle JS
  (public/, tải theo nhu cầu UI, không vào chunk three).

## Cổng chất lượng còn hiệu lực

`npm run check` + `npm run tokens` + `npm run contrast` + test UI (jsdom) + test rig nhân vật.
