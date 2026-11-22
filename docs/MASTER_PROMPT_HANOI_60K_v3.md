# SYSTEM PROMPT: ARCHITECTURE & UX/UI BLUEPRINT v3 — `hanoi-legends`

> **Mã dự án:** `hanoi-legends` — *“Hà Nội Legends: Pieces of the Old Quarter”*
> **Loại:** Web open-world roleplay (RP), cozy, 20 km², 1 người chơi là chính (co-presence 32 CCU)
> **Stack hiện có:** TypeScript strict · React 18 · R3F/three 0.160 · Zustand · Express · zod · Prisma (chưa nối) · Vite 5
> **Baseline đo được (2026-11-21):** 6.111 LoC production · 701 LoC test (56 test xanh) · 9.233 LoC legacy đã archive · bundle 297,58 kB gzip
> **Mục tiêu:** 60.000 LoC **có kiểm soát** + không phá vỡ contract đang chạy.
> **Cách dùng:** Copy toàn bộ tài liệu này làm system prompt. AI **chỉ thực thi STEP 1**, dừng xin duyệt, rồi mới sang STEP 2.

---

## 1. BỐI CẢNH & MỤC TIÊU CHỐNG LỖ (ANTI-FAILURE STRATEGY)

### 1.1 Product Thesis (một câu, không viết lại)

> Một thế giới mở **cozy, đậm Hà Nội, quy mô 20 km²**, nơi người chơi **nhập vai một người Hà Nội bình thường**, mỗi ngày đi bộ, ăn sáng, làm nghề, trò chuyện, chụp ảnh, và **ghép lại từng mảnh ký ức** của thành phố.

**Moat không phải** đồ hoạ AAA, **không phải** 20 km². Moat là: **độ chân thực văn hoá + cảm giác bình yên + khả năng nhập vai**. Mất 1 trong 3 → dự án chết dù code chạy.

### 1.2 Trạng thái thật của repo (đo, không suy đoán)

| Hạng mục | Đo được | Đánh giá |
|---|---|---|
| LoC production (ts/tsx/css) | 6.111 | 10,2% mục tiêu 60k |
| LoC test | 701 (56 test, 6 file) | tỷ lệ test/prod = 1:8,7 — **quá mỏng** cho 60k |
| `tsc --noEmit` | 0 lỗi | ✅ |
| `vitest run` | 56/56 | ✅ |
| `verify:world` | 311 POI, median 24 m, max 44 m | ✅ nhưng **chỉ phủ 22/320 tile** |
| `vite build` | JS 1.064 kB → **297,58 kB gzip** | ✅ ngân sách 2.500 kB |
| `npm run lint` | **exit 2 — không có file cấu hình ESLint** | ❌ cổng giả |
| `.github/workflows` | **không tồn tại** | ❌ không có CI |
| `prisma validate` | schema tham chiếu `CharacterSkill[]` — **model không được định nghĩa**; còn 7 model gacha/companion/battle-pass | ❌ schema không dựng được, mâu thuẫn thesis |
| `@prisma/client` import | **0 chỗ** | Prisma là dead weight 815 dòng |
| `src/legacy` | 9.233 LoC (lớn hơn cả game đang chạy) | phải đưa khỏi `main` |

### 1.3 Mười hai kịch bản thất bại — kèm bằng chứng và LUẬT BẤT BIẾN

| # | Cách chết | Bằng chứng trong repo | LUẬT chống lỗ (invariant có test) |
|---|---|---|---|
| **F1** | 20 km² nhưng rỗng | Cổng mật độ chỉ quét **22/320 tile (6,9%)**; 233/311 POI là hàng quán/ghế đá filler; toàn bộ nội dung viết tay = **2 quest + 4 dialogue** | `density-gate` phủ **100% tile có đường**; thêm `content-gate`: mỗi km² phải có ≥ 90 phút nội dung *duy nhất* (không lặp). Thiếu → CI đỏ |
| **F2** | Bản đồ sai tỉ lệ, dân Hà Nội thấy sai | Khoảng cách landmark bị nén 2–3× (bảng §1.4) | `scale-contract`: một hệ số tỉ lệ duy nhất + bảng khoảng cách chuẩn + test “đi bộ 5 phút tới X” |
| **F3** | Chi phí server giết dự án | World là JSON tĩnh (tốt); nhưng API đang là `Map` in-memory | Client-authoritative world, server-authoritative tài sản. Static tile trên CDN + ETag. Presence 4 Hz, bán kính 120 m. Trần **≤ 0,004 USD/CCU/giờ** |
| **F4** | Lỗ hổng kinh tế | `POST /api/shop/purchase` **tin `price` do client gửi** → mua 1đ; `earnedToday` **không reset khi sang ngày** (`day += 1` nhưng không reset) → sau vài ngày mọi thu nhập chỉ còn 20% | Bảng giá **server-side**; `Idempotency-Key` bắt buộc; mọi thay đổi tiền = 2 dòng ledger tổng 0; test “mua 2 lần cùng key ⇒ 1 giao dịch” và test “rollover reset cap” |
| **F5** | 10 phút đầu tệ | Từ spawn tới NPC đầu tiên chỉ **14,6 m** (tốt) nhưng luồng “Chơi mới” **bắt gõ tên** → chặn người chơi gamepad | Time-to-control ≤ 20 s. Tên mặc định + nút “Đi luôn”. Quest đầu ≤ 60 s |
| **F6** | Sai pháp lý VN | Blueprint cũ trích **NĐ 13/2023** — đã hết hiệu lực 01/01/2026 | Tuân **NĐ 147/2024/NĐ-CP** (hiệu lực 25/12/2024): phân loại 00+/12+/16+/18+, đăng ký tài khoản cần họ tên + ngày sinh + SĐT VN, dưới 16 tuổi do giám hộ đăng ký, giới hạn giờ chơi cho người dưới 18. Dữ liệu cá nhân theo **Luật 91/2025/QH15 + NĐ 356/2025**. OSM = ODbL (ghi công). Hoá đơn VAT 10% |
| **F7** | “Hà Nội” sáo rỗng | Toàn bộ nội dung viết tay = **4 NPC có thoại** trên 29 tuyến phố; “36 phố – 36 nghề” có `craft` trong data nhưng **chưa chảy vào gameplay** | **Content Bible** bắt buộc; mỗi phố phải có: nghề, 1 thoại riêng, 1 âm thanh, 1 món ăn/biểu tượng. Review văn hoá trước khi merge |
| **F8** | Perf & màn hình trắng | 297,58 kB gzip chỉ để hiện Title; three.js nằm trong chunk chính; **không có ErrorBoundary**, không `noscript`, không fallback WebGL | Tách chunk R3F; ErrorBoundary + màn hình “Máy bạn chưa bật WebGL”; 60 FPS @ GTX 1050/M1; ≤ 220 draw call; LCP < 2,5 s |
| **F9** | Không tiếp cận được | 11 khai báo font < 12px; **17 cỡ chữ** rời rạc; chỉ **2** rule `:focus-visible` cho 21 nút; chữ trắng trên nền xanh lá = **2,33:1** (chuẩn AA cần 4,5:1); không có `env(safe-area-inset-*)` | Type scale 8 bậc, min 12px; mọi phần tử bấm được có focus ring 3px; mọi cặp màu ≥ 4,5:1 (đo tự động); hỗ trợ safe-area |
| **F10** | Trôi dạt thiết kế | **3 hệ token song song**: `styles.css` (26 token, đang chạy), `global.css` (59 token, chỉ legacy import), `designTokens.ts` (150 dòng, 0 import). Thêm 27 mã hex + 64 `rgba()` viết cứng trong CSS | **Một** nguồn token duy nhất. CI cấm mã hex trong CSS component. Xoá 2 hệ chết |
| **F11** | Chất lượng là kịch | `lint` exit 2; không CI; `JWT_SECRET` fallback `dev-only-secret-change-me`; không RBAC middleware, không audit log | Cổng chỉ được tính khi **chạy thật và đỏ được**. Secret thiếu ⇒ **crash lúc khởi động**, không fallback |
| **F12** | Nợ bảo trì | `src/legacy` 9.233 LoC + 7 model gacha trong schema | “Xoá là tính năng”: mỗi phase phải xoá ≥ 5% LoC chết. Legacy → git tag, không nằm trong `main` |

### 1.4 Bảng tỉ lệ bản đồ — phải sửa trước khi vẽ thêm tile

| Landmark | Trong game | Thực tế | Sai số |
|---|---|---|---|
| Hồ Gươm (tâm) | 341 m | 0 m | +341 m |
| Nhà thờ Lớn | 278 m | ~900 m | nén 3,2× |
| Phố Đường Tàu | 589 m | ~900 m | nén 1,5× |
| Chợ Đồng Xuân | 811 m | ~1.300 m | nén 1,6× |
| Nhà hát Lớn | 498 m | ~1.000 m | nén 2,0× |
| Văn Miếu | 914 m | ~2.100 m | nén 2,3× |
| Cầu Long Biên | 800 m | ~2.400 m | nén 3,0× |
| Lăng Bác | 924 m | ~2.600 m | nén 2,8× |

Quận Hoàn Kiếm thật ≈ **5,3 km²**; rect `HOAN_KIEM` trong code = 620 × 950 m = **0,59 km²**. Vậy:
**Luật:** 20 km² là **Hà Nội nén tỉ lệ ~1:3 (tuyến tính)**, không phải bản đồ địa lý. Phải ghi rõ trong game + Credits, và mọi khoảng cách thiết kế tính bằng **phút đi bộ**, không bằng km.

**Hệ quả cần quyết định ngay (discovery quan trọng nhất):** nén 1:3 mà vẫn giữ **tốc độ đi bộ thật** thì thế giới *cảm giác* rộng gấp 3 lần. Từ spawn tới Cô Hoa (14,6 m) là 4 giây — tốt cho hook — nhưng băng ngang 20 km² ở 3,4 m/s mất **~24 phút thực**. Ba phương án, phải chọn **một** và ghi ADR:

| PA | Cách làm | Ưu | Nhược |
|---|---|---|---|
| **A (khuyến nghị)** | Giữ tốc độ thật (3,4 / 6,2 m/s), **nén khoảng cách 1:3** chỉ ở tầng dữ liệu, thêm transit dày (bus/metro/xích lô) | Cảm giác “đi bộ Hà Nội” đúng, hook 4 giây vẫn giữ | Phải đầu tư transit sớm (Phase 5) |
| B | Giữ địa lý thật, tăng tốc độ 3× | Bản đồ “đúng” | Phá cảm giác cozy, nhân vật trượt |
| C | Bỏ 20 km², làm 5,3 km² Hoàn Kiếm thật | Trung thực nhất | Mất điểm bán “20 km²” |

### 1.5 Scope Fence

| MVP (Phase 1–4) | V1.1 (Phase 5–7) | **NEVER** (cấm trong 60k) |
|---|---|---|
| Hoàn Kiếm + phố cổ chơi được trọn, 4 nghề, 25 quest, 40 NPC, photo mode, nhà trọ, save cloud | Mở đủ 20 km² (12 quận nén), 6 nghề, 60 quest, 120 NPC, lễ hội theo lịch thật, hội quán | Gacha/lootbox · PvP combat · voice chat · mobile native · NFT/crypto · modding SDK · server-side physics tick · copy tài sản/logo thương hiệu khác |

### 1.6 KPI sống–chết

| Chỉ số | Sống | Chết |
|---|---|---|
| Time-to-control | ≤ 20 s | > 45 s |
| D1 / D7 / D30 | 35% / 15% / 6% | < 20% / < 8% / < 2% |
| Session | 18–28 phút | < 6 phút |
| FPS p50 | ≥ 60 | < 40 |
| Crash-free session | ≥ 99,5% | < 98% |
| Conversion cosmetic | 3–5% | > 12 % (đang bán sức mạnh) |
| Mật độ nội dung | ≥ 90 phút nội dung duy nhất / km² | < 30 phút |
| Contrast vi phạm | 0 | bất kỳ |

---

## 2. STEP 1 === { DESIGN CHỨC NĂNG } (FUNCTIONAL SPECIFICATIONS)

> **YÊU CẦU THỰC THI:** Thiết kế & code **toàn bộ** luồng logic, schema, API dưới đây **TRƯỚC**. Chưa vẽ UI đẹp, chưa làm animation. Chỉ logic chạy được + test.

### 2.0 Ngân sách 60.000 LoC (bắt buộc)

| # | Phân hệ | Thư mục | LoC | Ghi chú |
|---|---|---|---|---|
| P0 | Core runtime: loop, input, camera, audio bus, time/mùa, save + migration, perf monitor | `src/core/**` | 7.500 | tách khỏi `game/scene` hiện tại |
| P1 | World 20 km²: tile, streaming, collision, OSM pipeline, POI registry, ambient life, transit, map | `src/world/**` | 11.500 | đang có 985 |
| P2 | RP & progression: creator, wardrobe, needs, 6 nghề + mini-game, housing, transport, photo, journal, pieces | `src/rp/**` (alias đã có) | 11.000 | đang có 0 |
| P3 | Narrative: dialogue graph, quest state machine, NPC schedule/memory, faction, nội dung 60 quest/120 NPC | `src/narrative/**` | 7.000 | đang có 128 |
| P4 | Economy: ledger, shop, IAP VN, season journal, faucet/sink, anti-inflation | `src/economy/**` | 5.000 | đang có 72 (ledger server) |
| P5 | Social/realtime: presence 32 CCU, chat, hội quán, photo feed, moderation | `src/social/**` | 4.500 | đang có 0 |
| P6 | Backend/API/security: auth, RBAC, audit, rate limit, save cloud, anti-cheat, observability | `src/server/**`, `src/shared/**` | 5.500 | đang có 1.366 |
| P7 | Admin/CMS: POI/NPC/quest/season editor, moderation console, economy dashboard, flags | `src/admin/**` | 4.000 | đang có 0 |
| P8 | UX/UI: design system, 30 màn, a11y, i18n, responsive/touch | `src/game/ui/**`, `src/shared/styles/**` | 4.000 | đang có 1.712 |
| | **TỔNG** | | **60.000** | |

**Luật ngân sách:** báo cáo `LoC_thực/LoC_ngân_sách` mỗi phase. Vượt > 10% → **cắt feature, không cắt test**. Thiếu > 20% → không được gọi là Done.
**Ngân sách test (ngoài 60k):** ≥ 12.000 LoC test; coverage `shared` + `world` + `economy` ≥ 75%; mỗi bug fix phải kèm test.

### 2.1 Luật phụ thuộc (giữ nguyên, thêm ESLint rule máy kiểm)

```
shared ← world ← rp ← narrative ← game/ui        (một chiều)
server  chỉ import shared
core    không biết React
rp/narrative  không import trực tiếp three
```
Không file nào > 350 LoC. Mỗi feature sau `featureFlag`.

### 2.2 Persona & core loop

6 persona đã có trong `shared/contracts` (STUDENT, SILVERSMITH, PHO_VENDOR, CYCLO_DRIVER, PHOTOGRAPHER, FOLK_SINGER). Mỗi nghề: 4 mini-game riêng, 20 cấp tay nghề, 5 nhánh danh tiếng.

Một ngày in-game = 24 phút thực:
`Thức dậy → nhu cầu → 3 “ý định trong ngày” → ra phố → NPC/sự kiện → làm nghề/quest → Đồng + Piece + Danh tiếng → tối về nhà, journal, ảnh → ngủ = lưu + tổng kết`.

**Ba trục tiến bộ, không có “level sức mạnh”:** tay nghề (1–20) · danh tiếng (5 phe, −100…+100) · bộ sưu tập (480 Pieces + 120 photo challenge + 36 phố).

### 2.3 P0 — Core Runtime (7.500 LoC)

| ID | Chức năng | Chi tiết |
|---|---|---|
| CORE-01 | Game loop | Fixed timestep 60 Hz, accumulator, max 5 step/frame, interpolation alpha; **pause khi tab hidden** (đã có, giữ); clamp `dt ≤ 50 ms` |
| CORE-02 | Renderer facade | R3F; instancing bắt buộc cây/đèn/ghế/nhà; 3 LOD (0 < 40 m, 1 40–120 m, 2 > 120 m billboard); `dispose()` có test |
| CORE-03 | Quality tiers | Tự đo 90 frame đầu → `low/med/high`; low tắt bloom + giảm shadow map; lưu vào save |
| CORE-04 | Physics | Capsule, slope ≤ 45°, step 0,35 m; chỉ collide static mesh theo tile; không physics engine nặng |
| CORE-05 | Input | Keyboard/Mouse + **Gamepad (L/R bumpers = Q/E)** + touch; rebinding; buffer 120 ms |
| CORE-06 | Camera | Third-person orbit (mặc định), first-person, photo free-cam (FOV 20–90) |
| CORE-07 | Audio | Web Audio bus Master/Music/SFX/Ambience; 3D positional; ducking khi thoại; **âm thanh theo quận + giờ** (Hà Nội signature: còi xe, tàu, chuông chùa) |
| CORE-08 | Time & weather | 1 giây thực = 1 phút in-game (đã có); 4 mùa theo lịch thật; mưa phùn, nồm, nắng gắt |
| CORE-09 | Save | `SaveGameV1` zod + migration chain `v1→v2`; localStorage offline-first + cloud; **autosave sau mỗi quest/level/giao dịch**, không chỉ 3 phút |
| CORE-10 | Resilience | `ErrorBoundary` toàn app + màn “Thiết bị chưa hỗ trợ WebGL” + `noscript` |
| CORE-11 | Day rollover | **Một hàm `rolloverDay()` duy nhất** reset `earnedToday`, hồi needs khi ngủ, chốt journal. Không có chỗ nào khác được `day += 1` |
| ER-CORE-01 | Lỗi phải chống | Memory leak khi unload tile; mất save khi đóng tab (pagehide flush) |

### 2.4 P1 — World 20 km² (11.500 LoC)

Bounding box **5.000 × 4.000 m = 20 km²**, gốc tại Hồ Gươm, tile **250 × 250 m → 20 × 16 = 320 tile**.

| ID | Chức năng | Chi tiết |
|---|---|---|
| WORLD-01 | Tile format | `tile_{x}_{z}.json`: roads (spline + width), buildings (footprint/height/facade), props, POI refs, nav graph, audio id |
| WORLD-02 | Streaming | Ring 5×5, priority theo khoảng cách + hướng nhìn, budget 2 tile/frame, unload hysteresis (đã có `TileStreamer`) |
| WORLD-03 | **Scale contract** | Hệ số nén duy nhất `COMPRESS = 1:3`; bảng khoảng cách chuẩn (§1.4) là **nguồn sự thật**; test “5 phút đi bộ từ Hồ Gươm tới Nhà thờ Lớn” |
| WORLD-04 | OSM pipeline | Overpass extract → lọc tag → làm sạch topology → sinh tile; **attribution ODbL** trong Credits. Chạy offline, kết quả commit dạng JSON |
| WORLD-05 | Procedural facade | 12 style: nhà ống 3–5 tầng, ban công sắt, mái tôn, biệt thự Pháp, chung cư cũ, shophouse; biến thiên theo phố |
| WORLD-06 | 36 phố – 36 nghề | `street.craft` (đã có) **phải chảy vào gameplay**: biển hiệu, prop, âm thanh, NPC, quest. Test: 100% phố có ≥ 1 quest hoặc 1 thoại riêng |
| WORLD-07 | POI registry | `id, type, name, nameEn, x, z, radius, tileId, district, street, craft, action, hours, payload, requirements` |
| WORLD-08 | **Density gate v2** | Mỗi tile **có đường** ≥ 4 POI; mỗi 150 m ≥ 1 interactable; **100% tile có đường**, không chỉ Phase 1 |
| WORLD-09 | **Content gate** | Mỗi km² ≥ 90 phút nội dung duy nhất; đếm tự động từ dialogue/quest/POI `action` duy nhất |
| WORLD-10 | 12 landmark bespoke | Hồ Gươm + Tháp Rùa + Đền Ngọc Sơn + Cầu Thế Húc · Nhà thờ Lớn · Cầu Long Biên · Hồ Tây + Trấn Quốc · Văn Miếu · Lăng Bác · Hoàng thành · Nhà hát Lớn · Chợ Đồng Xuân |
| WORLD-11 | Transit | Xe bus theo tuyến, metro Cát Linh–Hà Đông, bến xích lô, thuê xe đạp/xe máy; nav graph pathfinding |
| WORLD-12 | Map & minimap | 2D vector từ world-data; fog-of-war; filter; pin + route (đã có nền `MapScreen`) |
| WORLD-13 | Ambient life | Bồ câu, mèo, chó, xe máy AI theo làn, hàng rong, quán nước vỉa hè |
| ER-WORLD-01 | Lỗi phải chống | Tile seam; building trôi; nav graph không liên thông (BFS validator) |

### 2.5 P2 — RP & Progression (11.000 LoC)

| ID | Chức năng | Chi tiết |
|---|---|---|
| RP-01 | Character creator | 4 bước ≤ 90 s: ngoại hình (24 preset) → trang phục → persona → tên + bio 200 ký tự. **Có nút “Đi luôn” với tên mặc định** |
| RP-02 | Wardrobe | 80 item, 6 slot, dye 8 màu |
| RP-03 | Needs | Năng lượng, no đói, an yên, **vệ sinh** (hiện đang decay mà không hiển thị, không hồi — phải hoặc dùng, hoặc xoá). **Không bao giờ gây chết** |
| RP-04 | 6 nghề | Mỗi nghề 4 mini-game: chạm bạc (nhịp), nấu phở (timing + thứ tự), chụp ảnh (khung hình), xích lô (tuyến), vẽ (nét), hát (nhịp) |
| RP-05 | Housing | Thuê theo quận; 120 món nội thất; grid + xoay; comfort buff |
| RP-06 | Transport | Xe đạp, xe máy, xích lô (chở khách), bus, metro; **mũ bảo hiểm** (chi tiết văn hoá) |
| RP-07 | Photo mode | Free-cam, 12 filter, tilt-shift, khung; challenge ngày; album |
| RP-08 | Journal | Tự sinh từ event; thống kê (km đã đi, bát phở đã ăn, NPC đã gặp), bản đồ ký ức |
| RP-09 | RP identity | Character sheet công khai, in-character mode, 24 emote |
| RP-10 | Pieces | 480 mảnh → 36 bức tranh phố → lore + cosmetic |
| ER-RP-01 | Lỗi phải chống | Duplicate item khi lag (idempotency); save migration khi thêm slot |

### 2.6 P3 — Narrative (7.000 LoC)

| ID | Chức năng | Chi tiết |
|---|---|---|
| NPC-01 | Dialogue engine | Graph node `line, speaker, emotion, choices[], condition, effect, next`; `vi/en`; typing; skip; log; cooldown 30 s chống lặp |
| NPC-02 | Quest state machine | `LOCKED → AVAILABLE → ACTIVE → COMPLETE → CLAIMED` (+ `FAILED` chỉ cho timed quest); objective: talk/fetch/craft/deliver/photo/visit/wait_until/escort/minigame_score |
| NPC-03 | NPC schedule | Timetable 24h × 7 ngày × mùa; mưa thì trú; lễ thì đi hội |
| NPC-04 | NPC memory | Nhớ 12 sự kiện gần nhất → thoại + giá |
| NPC-05 | Barks | 8 nhóm câu theo ngữ cảnh (mưa, Tết, đêm, đông) |
| NPC-06 | Content scale | 60 quest (20 main + 40 side), 120 NPC có tên, **1.200 dòng thoại vi + 1.200 en** |
| NPC-07 | Reputation | 5 phe −100…+100; ngưỡng mở thoại/giá; suy giảm 1 điểm/ngày không tương tác |
| ER-NPC-01 | Lỗi phải chống | Quest deadlock (validator reachability), NPC kẹt nav |

### 2.7 P4 — Economy (5.000 LoC)

| ID | Chức năng | Chi tiết |
|---|---|---|
| ECO-01 | Hai tiền tệ | `Đồng` (kiếm trong game) · `Hoa Sen` (mua bằng VND). **Không đổi ngược** |
| ECO-02 | Ledger | Double-entry 2 dòng tổng 0; `idempotencyKey` unique; chỉ INSERT + reversal |
| ECO-03 | **Giá server-side** | Shop đọc `price` từ **bảng giá trên server**, không từ request. Sửa lỗ hổng hiện tại |
| ECO-04 | Faucet/Sink | Faucet: nghề, quest, bán đồ, daily. Sink: ăn, thuê nhà, nhiên liệu, cosmetic. Lạm phát < 2%/tuần (dashboard) |
| ECO-05 | IAP | Gói Hoa Sen 20k/50k/100k/200k/500k VND; VAT 10%; VNPay/MoMo/ZaloPay; verify receipt server-side; refund flow |
| ECO-06 | Season Journal | 60 cấp/8 tuần, track premium **chỉ cosmetic** |
| ECO-07 | Photo print | In ảnh chất lượng cao (premium) |
| ECO-08 | Sponsorship | Biển hiệu thương hiệu Hà Nội, **gắn nhãn “Tài trợ”** rõ ràng |
| ER-ECO-01 | Lỗi phải chống | Race mua song song (transaction + row lock); replay receipt; âm quỹ (`balance >= 0`) |

### 2.8 P5 — Social/Realtime (4.500 LoC)

Co-presence 32 người/instance (shard theo quận), sync 4 Hz, interpolation 200 ms, chỉ gửi entity trong 120 m · Chat 4 kênh + rate limit 5 msg/10 s + filter + report · 24 emote · Photo feed có moderation · Hội quán 30 người · Friend/invite.
**ER:** desync khi lag (client prediction + reconciliation), spam, quấy rối (report + mute + block).

### 2.9 P6 — Backend/Security (5.500 LoC)

**Nguyên tắc: server authoritative cho mọi thứ có giá trị.**

| Nhóm | Endpoint | Ghi chú |
|---|---|---|
| Auth | `POST /auth/register`, `/login`, `/refresh`, `/logout`, `/forgot` | JWT 15 m + refresh 30 d rotate; bcrypt cost 12; rate limit 5/phút/IP; **thu họ tên + ngày sinh + SĐT** (NĐ 147/2024); dưới 16 tuổi theo hồ sơ giám hộ |
| Character | `GET/POST /character`, `PATCH /character/:id`, `POST /character/:id/wardrobe` | zod schema trong `shared/contracts` |
| World | `GET /world/tiles/:x/:z` (CDN, ETag), `GET /world/poi?bbox=` | Không cần auth cho tile tĩnh |
| Quest | `GET /quests`, `POST /quests/:id/accept|progress|claim` | Server validate theo rule |
| Economy | `GET /wallet`, `POST /shop/purchase` (SKU, không price), `POST /iap/verify`, `GET /ledger` | `Idempotency-Key` bắt buộc |
| Social | `GET /friends`, `GET /feed`, `POST /photos`, `POST /report` | Ảnh → object storage + strip EXIF GPS |
| Admin | `/admin/poi|npc|quest|season|flags|moderation` | RBAC + audit log |
| Realtime | `presence:join`, `presence:delta`, `chat:send`, `emote`, `photo:new` | Socket auth bằng JWT, payload ≤ 1 KB |

**RBAC 6 role:** `PLAYER` · `CREATOR` · `SUPPORT` · `MODERATOR` · `ADMIN` · `SUPER_ADMIN` (2FA bắt buộc).
**Bảo mật bắt buộc:** helmet + CSP, CORS allowlist (hiện đang `cors()` mở), zod 100% input, sanitize bio/chat, rate limit Redis, audit append-only, **`JWT_SECRET` thiếu ⇒ process exit**, `SECURITY.md`.

### 2.10 Schema cốt lõi (Prisma — sửa schema hiện tại)

```prisma
// GIỮ & SỬA
model PlayerProfile { id String @id @default(cuid()) userId String @unique
  name String @db.VarChar(24) persona Persona @default(STUDENT)
  bio String? @db.VarChar(200) inCharacter Boolean @default(true)
  craftLevel Int @default(1) craftXp Int @default(0)
  wallet Wallet? saves SaveSlot[] progress CraftProgress[] reps Reputation[] }

model CraftProgress { id String @id @default(cuid()) profileId String persona Persona
  level Int @default(1) xp Int @default(0) @@unique([profileId, persona]) }

model Wallet   { id String @id profileId String @unique dong BigInt @default(0) hoaSen Int @default(0) }
model LedgerEntry { id String @id walletId String deltaDong BigInt @default(0)
  reason String refType String? refId String? idempotencyKey String @unique
  balanceAfter Json createdAt DateTime @default(now()) @@index([walletId, createdAt]) }
model Purchase { id String @id profileId String sku String amountVnd Int
  provider String status PaymentStatus @default(PENDING) receipt Json? }

model Poi { id String @id tileId String type PoiType name String nameEn String?
  x Float z Float radius Float @default(2) schedule Json? requirements Json?
  payload Json? isActive Boolean @default(true) @@index([tileId, type]) }
model Npc / QuestDef / QuestInstance / Reputation / WardrobeItem / Housing / PhotoPost / Report / AuditLog / FeatureFlag

// XOÁ khỏi main (không chỉ archive): CompanionSpecies, Companion, Move,
// GachaBanner, GachaPull, BattlePassSeason, BattlePassProgress, Rarity, Element
// SỬA: model Character tham chiếu CharacterSkill[] (chưa định nghĩa) — xoá field,
//      hoặc thay bằng PlayerProfile + CraftProgress.
```

### 2.11 Business logic dùng chung (`shared/formulas`)

Đã có và **giữ nguyên** (đã test): `xpToNext = 120 × level^1.35` · `decayNeeds` · `speedMultiplier` (mood < 25 ⇒ 0,9×, không bao giờ 0) · `priceWithReputation` (giảm tối đa 15%) · `dailyIncomeCap = 800 + level × 120` · `applyIncomeCap` (vượt cap chỉ tính 20%) · `FOOD` 5 món · `isTeleportSuspect`.
**Bổ sung bắt buộc:** `rolloverDay()` (reset cap) · `scaleContract` (hệ số nén) · `contentBudget`.

**Ghi chú cân bằng (số đo thật):** 2 quest Phase 1 cho **105 XP**; L1→L2 cần **120 XP** ⇒ **không thể lên cấp trong toàn bộ nội dung hiện có**. Tổng XP tới L20 = **54.891**. Vì vậy Phase 2 phải có nghề lặp lại được thì đường cong mới có nghĩa.

### 2.12 Non-functional

60 FPS @ GTX 1050/M1; ≤ 220 draw call; ≤ 2,5 MB gzip initial (**hiện 297,58 kB — còn dư, nhưng phải tách chunk R3F**); LCP < 2,5 s; TTI < 8 s trên 4G; a11y AA; p95 API < 250 ms; uptime 99,5%; RPO 5 phút / RTO 30 phút.

### 2.13 Roadmap 8 phase (mỗi phase là lát cắt dọc chạy được)

| Phase | Nội dung | LoC ra | Checkpoint |
|---|---|---|---|
| 1 | Core loop + Hoàn Kiếm + nhân vật + save | 9.000 | Vào game < 8 s, 60 FPS — **đã đạt 6.111** |
| **1.5** | **Trả nợ (bắt buộc trước Phase 2): xoá legacy khỏi `main`, xoá 2 hệ token chết, dựng ESLint + CI, ErrorBoundary, sửa schema Prisma, sửa giá server-side, reset income cap** | **−1.500 (xoá) +800** | Mọi cổng **đỏ được**; 0 hex viết cứng |
| 2 | POI/shop/dialogue + nghề phở + needs + journal + audio | 9.000 | Chơi 30 phút có mục tiêu |
| 3 | Quest graph + 15 quest + 30 NPC + reputation | 8.000 | Xong 1 chain main |
| 4 | Economy + ledger + shop + save cloud + auth + IAP | 8.000 | Mua bán không thể duplicate |
| 5 | Mở đủ 20 km² + 12 landmark + map + transit | 9.000 | Đi hết map không crash; gate phủ 100% |
| 6 | Photo mode + album + Pieces + season journal | 6.000 | Có lý do quay lại D7 |
| 7 | Realtime 32 + chat + hội quán + moderation | 6.000 | 2 client thấy nhau < 300 ms |
| 8 | Admin CMS + analytics + a11y + i18n + polish | 5.000 | 60.000 LoC, mọi gate xanh |

---

## 3. STEP 2 === { DESIGN UX/UI SAU } (DỰA TRÊN IMAGE STYLE — 200 OK)

> **YÊU CẦU THỰC THI:** Áp dụng **chính xác** hệ token dưới đây lên chức năng ở STEP 1. Không thêm màu ngoài palette. Không dùng font thiếu dấu tiếng Việt. Không sao chép nhân vật/logo/tài sản của bất kỳ game thương mại nào — chỉ lấy **thông số thị giác**.

### 3.1 Giải mã ảnh (đo bằng pixel, không cảm tính)

| Thuộc tính | Kết quả |
|---|---|
| **Mood** | *Toy-diorama adventure*: thế giới bão hoà, sáng high-key, hình khối mập, **không viền đen**, bóng mềm, sạch như đồ chơi sơn. Đối lập hoàn toàn với “giấy kem thủ công” của blueprint v1 — **v2 là hướng đúng, v1 phải bị thay** |
| **Camera** | Third-person sau lưng, cao 1,5–1,7 m, cách 3 m, nghiêng xuống 12–18°, FOV ~50–60° |
| **Chất liệu UI** | Hai vật liệu duy nhất: **kính trắng** (trắng gần đục, viền trong 1px, bóng mềm) và **slab xanh-rêu gần đen** (alpha ~0,72–0,78 + blur). Không gradient rực, không viền màu |
| **Bố cục HUD** | Plate giữa-trên (pill cấp + tên + thanh mảnh + mũi tên) · rail icon dọc trái · **bánh xe 3 ô tròn** góc phải-dưới (ô active to hơn, nhô cao, có vành trắng) · slab `L … R` + meter ngay dưới · prompt capsule giữa-dưới. Tổng diện tích HUD ~6–8% màn hình |
| **Ngôn ngữ tương tác** | **Icon-only**: không có số, không chữ thừa. Chỉ **một** mục active tại một thời điểm. Phím hiện dạng **keycap tròn trắng** |
| **Điểm nhấn** | Ô đang chọn to hơn + nhô lên + vành trắng → luật: *mỗi màn hình chỉ 1 primary action* |

### 3.2 Color Tokens (hex đo từ ảnh + đã kiểm contrast)

**A. Thế giới (dùng cho 3D/material, không dùng cho chữ)**

| Token | Hex | Lấy từ |
|---|---|---|
| `--w-grass-lit` | `#A6D344` | cỏ nắng (đo #A6D344 / #B7D358 / #C6DA4F) |
| `--w-grass-mid` | `#52A731` | cỏ trung |
| `--w-foliage` | `#076B26` | tán lá sâu (#076B26 / #0E6B29) |
| `--w-foliage-lit` | `#4FBE4A` | tán lá nắng |
| `--w-water-shallow` | `#5FD0E0` | nước nông (#56CADC / #99DAE8) |
| `--w-water-mid` | `#17B8D9` | nước giữa (#0CA0CD / #14ABD2) |
| `--w-water-deep` | `#044597` | đáy nước sâu (#024196) |
| `--w-sand` | `#E5E5BD` | bãi cát (#CFE565 / #E4E5B9) |
| `--w-rock` | `#AFAB95` | vách đá |
| `--w-rock-shade` | `#456910` | bóng đá |

**B. UI — mọi cặp dưới đây đã đo, đạt WCAG AA (≥ 4,5:1) cho chữ thường**

| Token | Giá trị | Dùng cho | Contrast đo được |
|---|---|---|---|
| `--c-ink` | `#123A4B` | chữ chính trên kính | **12,12:1** trên trắng |
| `--c-ink-soft` | `#3D6474` | chữ phụ | 6,42:1 |
| `--c-ink-muted` | `#5A7684` | caption | 4,82:1 *(thay `#6A8B98` cũ = 3,65:1 — KHÔNG đạt)* |
| `--c-glass` | `rgba(255,255,255,.94)` | mọi panel nổi | ink trên kính = 11,52–11,71:1 |
| `--c-slab` | `rgba(11,43,38,.78)` | plate, thanh L/R, debug | trắng **9,11:1** · kem **7,99:1** · vàng **5,81:1** *(ở worst-case nền cát; alpha .62 cũ chỉ đạt 3,63 với vàng)* |
| `--c-on-primary` | `#08221A` | **chữ trên nút xanh** | **7,20:1** trên `#4FC24B` *(chữ trắng hiện tại = 2,33:1 — hỏng hoàn toàn)* |
| `--c-primary` | `#3FC24B` | nút chính (nền) | — |
| `--c-primary-deep` | `#177A28` | đáy gradient nút | trắng 5,45:1 |
| `--c-teal` | `#21B4E0` | nước/accent phụ | ink `#08303D` = 5,78:1 |
| `--c-teal-deep` | `#0E7FA8` | link, viền focus | trắng 4,55:1 |
| `--c-gold` | `#F7C948` | cấp, tiền tệ, XP | ink = 10,69:1 |
| `--c-danger` | `#BC332C` | nhiệm vụ, cảnh báo | trắng 5,76:1 |
| `--c-violet` | `#5B49B8` | di tích, xưởng nghề | trắng 6,80:1 |
| `--c-focus` | `#0E7FA8` (ring 3px + offset 3px) | focus bàn phím | 4,55:1 |

**Quy tắc palette:** nền thế giới = họ xanh-lam; **mọi** surface tương tác = kính trắng; **mọi** primary action = xanh lá + chữ `--c-on-primary`; **mọi** text trên kính = `--c-ink`. Accent chỉ cho icon/status ≤ 10% diện tích. **Cấm** chữ trắng trên xanh lá/teal.

### 3.3 Typography & Grid

- **Display:** Nunito 800/900 (đang dùng, hỗ trợ đủ dấu tiếng Việt). Fallback `Be Vietnam Pro`.
- **Body:** Nunito 600, 16 px, line-height 1,55 (tiếng Việt nhiều dấu cần thoáng hơn tiếng Anh).
- **Type scale 8 bậc** (thay 17 cỡ hiện tại): `12 · 13 · 14 · 16 · 18 · 22 · 28 · 36`. **Cấm < 12 px.**
- **Grid:** 12 cột, gutter 24 px, margin ngoài 5% (min 24 px). **Safe area:** `padding: max(18px, env(safe-area-inset-*))`.
- **HUD anchor:** plate `top: 18px` giữa; rail `left: 18px` giữa dọc; party `right: 22px; bottom: 22px`; slab L/R `bottom: 108px → 116px`; prompt `bottom: 116px` giữa. Ở màn < 900 px: ẩn needs + slab, giữ party và prompt.
- **Z-index:** World 0 · Vignette 10 · HUD 20 · Panel 30 · Modal 40 · Toast 50 · Debug 99.
- **Font loading:** hiện `@import` Google Fonts chặn render → chuyển sang `<link rel="preconnect">` + `font-display: swap`, self-host woff2 subset `vietnamese`.

### 3.4 Component Specs

| Component | Công thức |
|---|---|
| `Panel` (kính) | `background: var(--c-glass)`; `border: 2px solid #fff`; `radius: 26px`; padding 26/30; `box-shadow: 0 18px 44px rgba(10,40,52,.30), inset 0 1px 0 #fff`; `backdrop-filter: blur(14px)` |
| `Slab` | `background: var(--c-slab)`; `radius: 16px`; `box-shadow: 0 8px 20px rgba(8,30,40,.28)`; chữ trắng 900 + `text-shadow 0 2px 3px rgba(0,0,0,.35)` |
| `Button` primary | gradient 3 stop `#6BDD74 → #4FC24B → #177A28`; chữ `--c-on-primary` 900; `radius: 999px`; `min-height: 52px`; `box-shadow: 0 5px 0 #177A28`; active tụt 4 px |
| `Button` ghost | nền `rgba(255,255,255,.72)`; chữ `--c-ink` 800; `box-shadow: 0 4px 0 rgba(18,58,75,.14)` |
| `Rail button` | 46 × 46 px; `radius: 15px`; kính trắng; icon stroke 2 px `--c-ink`; hover nhô 3 px; **focus ring 3 px `--c-focus`** |
| `Party slot` | 52 px, active 66 px; viền trắng 3 px; nền radial sáng; badge đỏ 20 px; nhô lên 8 px khi active |
| `Keycap` | tròn 26 px; trắng; chữ 13 px 900; `box-shadow: 0 2px 0 rgba(8,30,40,.35)` |
| `Meter` | track `rgba(255,255,255,.22)`; fill gradient `#B6EE6D → #3FC24B`; cao 6 px; radius 999 |
| `Prompt` | capsule kính, keycap tròn xanh + nhãn + mũi tên ▼; enter `scale .92→1` 180 ms |
| `Toast` | kính, icon trái 24 px, 1 dòng + 1 sub, tự tắt 3,5 s, trượt phải, không chặn input |
| `Modal` | scrim `rgba(8,34,26,.62)`; panel giữa; enter `scale .94→1` 280 ms `--e-out` |

### 3.5 Motion

| Hành vi | Thông số |
|---|---|
| Panel xuất hiện | opacity 0→1 + scale .94→1, 280 ms `cubic-bezier(.22,1,.36,1)` |
| Ô active đổi | scale 1→1.06→1, 160 ms, kèm nhô 8 px |
| Chuyển màn | cross-fade 180 ms + blur thế giới 4 px (không slide ngang nặng) |
| Photo mode | letterbox trượt 240 ms + grid 1/3 fade in |
| Giảm chuyển động | `prefers-reduced-motion` **và** setting trong game → chỉ fade 120 ms. **Phải đọc từ `settings.reduceMotion`, không hardcode `false` như `Player.tsx` hiện tại** |

### 3.6 User flow 10 phút đầu (dùng làm e2e test)

```
0:00 Boot (logo 1,5 s, skip được) → 0:02 Title (panel lệch trái: Chơi mới / Tiếp tục / Cài đặt)
0:08 Chọn save (3 slot + "Chơi nhanh")
0:12 Creator 4 bước, có nút "Đi luôn" (tên mặc định, KHÔNG bắt gõ bàn phím)
0:22 Cold open: 5:40 sáng, Phố Đường Tàu, tiếng tàu, hơi nước, camera chậm
0:35 Có điều khiển + chip "W A S D / E tương tác" (đổi sang icon gamepad nếu cắm tay cầm)
1:00 Quest 1 "Một bát phở buổi sáng" — 14,6 m tới Cô Hoa (đo từ spawn, đã đạt)
2:30 Nhận Đồng + Piece #1 + mở Journal lần đầu
3:30 Quest 2 "Chụp Hồ Gươm lúc bình minh" → mở Photo Mode (dạy 3 phím)
5:00 Cô Hoa nhớ mặt: "Mai quay lại nhé" → hook D2
6:00 Mở bản đồ 20 km² (fog-of-war), ghim Phố cổ
8:00 Nhiệm vụ ngày + teaser Season Journal (không bán gì trong 10 phút đầu)
10:00 Tự do — "Hôm nay bạn muốn làm gì?" (3 ý định)
```

**Vòng giữ chân:** micro 30–90 s (POI, bark, mèo) · session 18–28 phút (1 ngày in-game) · daily (3 nhiệm vụ + photo challenge) · weekly (hội quán, chợ cuối tuần) · seasonal 8 tuần (Tết, Trung Thu theo lịch thật).

**Monetization flow:** chơi 30 phút → thấy cosmetic trong shop (không popup) → preview trên nhân vật → mở khoá bằng Hoa Sen → VNPay/MoMo → nhận ngay + hoá đơn VAT. **Không** countdown giả, không lootbox, không paywall nội dung.

### 3.7 Screen inventory (30 màn — mỗi màn bắt buộc có loading / empty / error / offline)

1 Boot · 2 Title · 3 Save select · 4 Creator (4 bước) · 5 Cold open · 6 In-world HUD · 7 Interaction prompt · 8 Dialogue · 9 Journal · 10 Map 20 km² · 11 Minimap · 12 Quest list · 13 Quest detail · 14 Inventory · 15 Wardrobe · 16 Shop · 17 Crafting mini-game · 18 Housing · 19 Transport · 20 Photo mode · 21 Album/Feed · 22 Pieces · 23 Season Journal · 24 Social hub · 25 Profile · 26 Settings · 27 Accessibility · 28 Payment/IAP · 29 Error/Offline/404 · 30 Admin CMS.

### 3.8 Screen spec mẫu — **#6 In-World HUD** (màn quan trọng nhất, phải khớp ảnh)

```
┌──────────────────────────────────────────────────────────────┐
│                    ╭───────────────────╮                     │
│                    │  Lv 12  Ngày 3     │  ← plate: pill cấp  │
│                    │  Cô Hoa bán phở    │     + tên POI       │
│                    │  ▁▁▁▁▁▁▁▁▁▁▁▁▁     │     + bar tiến độ   │
│                    ╰───────────────────╯                     │
│ ┌──┐                                                         │
│ │▣ │  ← rail: Bản đồ / Nhật ký / Máy ảnh / Cài đặt / Trợ giúp │
│ ├──┤     (46px, kính trắng, icon 2px)          ╭───╮         │
│ │☰ │                                          │ ○ │ ← slot 52 │
│ ├──┤                                       ╭──╮╰───╯   active │
│ │◉ │                                       │◎│ 66px          │
│ ├──┤                                       ╰──╯                │
│ │⚙ │                              ╭──────────────────────╮    │
│ ├──┤                              │ (L)  Máy ảnh     (R) │    │
│ │? │                              │ ▂▂▂▂▂▂▂▂░░░░  năng lượng │
│ └──┘                              ╰──────────────────────╯    │
│                                                               │
│                  ╭──────────────────────╮                     │
│                  │ (E)  Nói chuyện  ▼   │ ← prompt            │
│                  ╰──────────────────────╯                     │
└──────────────────────────────────────────────────────────────┘
```
- Plate: slab, min-width 208 px, `top: 18px`, canh giữa, bar 4 px gradient lime→green.
- Rail: `left: 18px`, canh giữa dọc, gap 10 px, chỉ icon, tooltip chữ khi hover/focus.
- Party: `right: 22px; bottom: 22px`, 3 slot, ô active 66 px + nhô 8 px + vành trắng.
- Slab L/R: rộng 232 px, `bottom: 116px`; keycap tròn trắng 24 px; meter 10 vạch (hoặc 1 thanh — chọn **1 thanh** cho dễ đọc trên mobile).
- Needs: góc trái-dưới, panel kính thu gọn; **ẩn dưới 900 px**.
- Không minimap, không la bàn, không chữ quest trên HUD — chi tiết nằm trong Journal/Map (đúng tinh thần ảnh).
- Trạng thái: `hover` (nhô 3 px), `focus-visible` (ring 3 px `--c-focus`), `active` (tụt 4 px), `disabled` (opacity .5 + `cursor: not-allowed`), `offline` (chip xám "Đang ngoại tuyến — vẫn chơi được").
- Touch: mọi target ≥ 48 × 48 px; rail chuyển thành cột phải; slab ẩn (dùng nút trên party).

---

## 4. HƯỚNG DẪN TRIỂN KHAI (EXECUTION COMMAND)

### 4.1 Prompt khởi động

> “Bạn đã đọc blueprint v3. **Xác nhận hiểu** trong 10 dòng: (1) 9 phân hệ + ngân sách LoC, (2) 5 luật chống lỗ cứng, (3) scope fence, (4) 3 token chính + 1 font, (5) phase bạn làm đầu tiên.
> Sau đó **chỉ thực thi [PHASE 1.5 — TRẢ NỢ]** theo thứ tự: (a) đưa `src/legacy` ra khỏi `main` bằng git tag, (b) xoá `shared/styles/global.css` + `shared/styles/designTokens.ts`, giữ **một** token duy nhất trong `game/ui/styles.css`, (c) dựng ESLint + GitHub Actions chạy `check`, (d) thêm `ErrorBoundary` + fallback WebGL + `noscript`, (e) sửa `prisma/schema.prisma` (xoá model gacha, sửa `CharacterSkill`, hoặc bỏ Prisma nếu Phase 4 chưa tới), (f) chuyển giá shop sang server-side + reset `earnedToday` khi rollover, (g) đổi token màu theo §3.2 và thêm focus ring cho mọi nút.
> Mỗi mục xong phải có test hoặc gate tương ứng. **Chưa làm STEP 2. Dừng lại chờ tôi duyệt.**”

### 4.2 Quy tắc thực thi (bắt buộc)

1. **Thứ tự:** Functional → UX/UI. Không vẽ màn hình trước khi logic + test của màn đó tồn tại.
2. **Lát cắt dọc:** mỗi phase chạy end-to-end, không để TODO xuyên phase.
3. **Báo cáo bàn giao:** `Phase · LoC thực/ngân sách · file tạo/xoá · test pass · gate xanh · rủi ro · việc tiếp`.
4. **Không vượt rào:** thêm feature ngoài scope → dừng, hỏi, ghi ADR.
5. **Không phá contract:** đổi API/DB phải có migration + tương thích ngược hoặc version bump.
6. **Test trước khi xong:** bug nào sửa cũng phải có test; economy/quest phải có integration test.
7. **Cổng chỉ tính khi đỏ được:** `typecheck → lint (thật) → unit → integration → build size → density → content → a11y contrast → 0 hex trong CSS component`.
8. **Ngôn ngữ:** code tiếng Anh; nội dung tiếng Việt trước, `en` sau; **không hardcode chuỗi trong component** (hiện toàn bộ chuỗi đang nằm trong JSX).

### 4.3 Checklist duyệt từng phase

- [ ] Vào game ≤ 8 s, có điều khiển ≤ 20 s, quest đầu ≤ 60 s?
- [ ] 60 FPS máy phổ thông, ≤ 220 draw call, bundle ≤ 2,5 MB gzip?
- [ ] Density gate phủ **100%** tile có đường? Content gate đạt 90 phút/km²?
- [ ] Không chỗ nào bán sức mạnh? Không lootbox? Không đổi Đồng → Hoa Sen?
- [ ] Mọi thay đổi tiền đi qua ledger có idempotency? Giá đọc từ server?
- [ ] `earnedToday` reset đúng lúc sang ngày? Có test rollover?
- [ ] Mọi cặp màu chữ ≥ 4,5:1 (đo tự động)? Không cỡ chữ < 12 px?
- [ ] Mọi nút có `:focus-visible`? Target ≥ 48 px trên touch? Safe-area?
- [ ] `settings.reduceMotion` thực sự được đọc ở mọi animation?
- [ ] Font render đủ dấu tiếng Việt? Chuỗi nào còn hardcode?
- [ ] Mọi màn có loading/empty/error/offline?
- [ ] Có ErrorBoundary + fallback WebGL + `noscript`?
- [ ] LoC nằm trong ngân sách phase? Đã xoá ≥ 5% code chết?
- [ ] Trích dẫn pháp lý đúng bản hiện hành (NĐ 147/2024 · Luật 91/2025 + NĐ 356/2025)?

---

**HẾT BLUEPRINT v3.** — *Bắt đầu từ PHASE 1.5. Không nhảy bước.*
