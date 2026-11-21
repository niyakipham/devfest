# SYSTEM PROMPT: ARCHITECTURE & UX/UI BLUEPRINT (60,000 LoC)

> **MÃ DỰ ÁN:** `hanoi-legends-rpg` — *"Hanoi Legends: Pieces of the Old Quarter"*
> **LOẠI:** Web-based Open-World Roleplay Game (RP) · Cozy Storybook · 20 km²
> **NGÔN NGỮ THI HÀNH:** TypeScript (strict) · React 18 · Three.js / R3F · Zustand · Express · Socket.IO · Prisma / PostgreSQL · Redis
> **BASELINE HIỆN CÓ:** repo đã có skeleton ~10,082 LoC (`src/core`, `src/modules`, `src/server`, `src/ui`, `prisma/schema.prisma` với 27 model). Nhiệm vụ là **mở rộng lên 60,000 LoC có kiểm soát**, không viết lại từ đầu, không phá vỡ contract đang có.
> **CÁCH DÙNG:** Copy toàn bộ tài liệu này làm System Prompt. AI **chỉ được thực thi STEP 1 trước**, dừng lại xin duyệt, rồi mới sang STEP 2.

---

## 1. BỐI CẢNH & MỤC TIÊU CHỐNG LỖ (ANTI-FAILURE STRATEGY)

### 1.1 Product Thesis (một câu, không được viết lại)

> Một thế giới mở **cozy, thủ công, đậm Hà Nội** rộng 20 km², nơi người chơi **nhập vai một người Hà Nội bình thường** (sinh viên, nghệ nhân, cô bán phở, anh xích lô, nhiếp ảnh gia, nghệ sĩ) — mỗi ngày đi bộ, uống cà phê, làm nghề, trò chuyện, chụp ảnh, trang trí nhà, và **ghép từng "mảnh" ký ức** của thành phố lại với nhau.

**Điểm chốt:** *moat* của game **không phải** đồ hoạ AAA, **không phải** diện tích 20 km² — mà là **độ chân thực văn hoá + cảm giác bình yên + khả năng nhập vai**. Nếu mất 3 thứ này, dự án chết dù code chạy đúng.

### 1.2 Ngân sách 60,000 LoC (bắt buộc — vượt là fail)

| # | Phân hệ | Thư mục | LoC | % |
|---|---|---|---|---|
| P0 | Core Runtime (render, physics, input, audio, save, time) | `src/core/**` | 8,000 | 13.3% |
| P1 | World 20 km² (streaming, LOD, OSM pipeline, POI, map) | `src/modules/world/**` | 10,000 | 16.7% |
| P2 | RP & Progression (creator, needs, 6 nghề, nhà, xe, photo) | `src/modules/character/**`, `housing/**`, `transport/**` | 11,000 | 18.3% |
| P3 | Narrative / Quest / NPC | `src/modules/quest/**`, `src/modules/npc/**` | 6,500 | 10.8% |
| P4 | Economy & Monetization | `src/modules/economy/**`, `monetization/**` | 4,500 | 7.5% |
| P5 | Social / Realtime | `src/modules/social/**` | 4,000 | 6.7% |
| P6 | Backend / API / Security | `src/server/**`, `src/shared/**` | 6,000 | 10.0% |
| P7 | Admin / CMS / Analytics | `src/modules/admin/**` | 3,500 | 5.8% |
| P8 | UX–UI Design System & 30 Screens | `src/ui/**`, `src/shared/styles/**` | 6,500 | 10.8% |
| | **TỔNG** | | **60,000** | 100% |

**Luật ngân sách:** mỗi phase bàn giao phải báo cáo `LoC_thực_tế / LoC_ngân_sách`. Vượt >10% → **cắt feature, không cắt test**. Thiếu >20% → **không được gọi là Done**.

### 1.3 Tư duy ngược — "Nếu 60,000 dòng này thất bại thì vì sao?" và LUẬT CHỐNG LỖ

| # | Kịch bản thất bại | Luật bất biến (INVARIANT) áp vào code |
|---|---|---|
| F1 | **20 km² nhưng rỗng** — người chơi đi 2 phút không gặp gì | **Luật 7 giây / 150 mét:** cứ mỗi 150 m phải có ≥1 *interactable*; đi bộ 7 s phải có 1 "micro-moment" (âm thanh, NPC nhìn, mèo chạy, hương cà phê). Có **validator tự động** quét `POI` density trên grid 250 m và **fail CI** nếu tile nào < 4 POI. |
| F2 | **Scope phình, 60k LoC không ai bảo trì nổi** | Module boundary cứng (`core` không import `modules`; module không import chéo; chỉ nói qua `shared/contracts`). Mỗi feature sau `featureFlag`. Mọi quyết định kiến trúc ghi `docs/adr/ADR-xxx.md`. Không file nào >350 LoC. |
| F3 | **Chi phí server giết dự án** | **Client-authoritative cho world, server-authoritative cho tài sản.** Server **không** tick vật lý, không đồng bộ vị trí tần suất cao (chỉ 4 Hz delta + interest management bán kính 120 m). World data là **static JSON + CDN**, không query DB mỗi bước chân. Ngân sách: **≤ $0.004 / CCU / giờ**. |
| F4 | **10 phút đầu tệ → D1 sập** | "90-second hook": vào game ≤ 8 s (không logo wall), **có điều khiển trong 20 s**, **quest đầu tiên trong 60 s**, **cảm xúc đầu tiên (ăn bát phở / chụp ảnh Hồ Gươm lúc bình minh) trong 5 phút**. Không tutorial dài, không popup chặn. |
| F5 | **Không có doanh thu** | Chỉ bán **cosmetic + Season Journal + Photo print + sponsorship thương hiệu Hà Nội**. **KHÔNG lootbox, KHÔNG gacha, KHÔNG pay-to-win, KHÔNG bán vật phẩm ảnh hưởng sức mạnh.** |
| F6 | **Vi phạm bản quyền / pháp lý VN** | Công trình thật → **stylized, không logo thương hiệu thật**, không dùng nhạc có bản quyền, không dùng ảnh OSM thiếu attribution (ODbL). Có **age rating**, điều khoản NĐ 13/2023/NĐ-CP (dữ liệu cá nhân), hoá đơn VAT 10%, cổng VNPay/MoMo/ZaloPay. |
| F7 | **Game "Hà Nội" nhưng sáo rỗng, sai văn hoá** | Mọi nội dung phải qua **Content Bible** (36 phố – 36 nghề, lịch âm, mùa, tiếng Việt có dấu chuẩn). Có **cultural review checklist** trước khi merge nội dung. Không dùng "Hà Nội = phở + Hồ Gươm" làm toàn bộ game. |
| F8 | **Perf chết trên máy phổ thông** | Budget cứng: 60 FPS @ GTX 1050 / M1 / Chrome; ≤ 220 draw call; ≤ 2.5 MB gzip initial; LCP < 2.5 s. Có **perf gate trong CI** (bundle size + scene stats). |
| F9 | **Nội dung hết sau 3 ngày** | Nội dung là **hệ thống**, không phải level: NPC lịch trình theo giờ, mùa lễ hội theo lịch thật, nghề có loop lặp có biến thiên, "Pieces" sưu tầm 480 mảnh, photo challenge hằng ngày. |
| F10 | **Cộng đồng độc hại / bot / cheat** | Chat có rate limit + filter + report; tài sản server-authoritative + ledger double-entry; anti-cheat phát hiện teleport/speed; RBAC 6 role; audit log mọi hành động admin. |

### 1.4 Scope Fence (hàng rào chống tham)

| MVP (bắt buộc, Phase 1–4) | V1.1 (Phase 5–6) | **NEVER** (cấm trong 60k LoC) |
|---|---|---|
| 1 quận lõi **Hoàn Kiếm + phố cổ** (≈ 3.2 km²) fully playable, 4 nghề, 25 quest, 40 NPC, photo mode, nhà trọ, save cloud | Mở rộng đủ **20 km²** (12 quận), 6 nghề, 60 quest, 120 NPC, mùa lễ hội, social hub, Season Journal | Gacha/lootbox · PvP combat · open-world multiplayer > 32 người/instance · voice chat · mobile native app · NFT/crypto · modding SDK · 4K textures · full VO cho 10k dòng thoại |
| Server: auth + save + economy | Realtime co-presence 32 người | Server-side physics tick |

### 1.5 KPI sống–chết

| Chỉ số | Ngưỡng sống | Ngưỡng chết |
|---|---|---|
| Time-to-first-control | ≤ 20 s | > 45 s |
| D1 / D7 / D30 | 35% / 15% / 6% | < 20% / < 8% / < 2% |
| Session length | 18–28 phút | < 6 phút |
| FPS trung vị (p50 thiết bị) | ≥ 60 | < 40 |
| Crash-free session | ≥ 99.5% | < 98% |
| Conversion cosmetic | 3–5% | > 12% (nghĩa là đang bán pay-to-win) |
| Cost/CCU/giờ | ≤ $0.004 | > $0.012 |
| Tile density validator | 100% pass | bất kỳ tile fail |

---

## 2. STEP 1 === { DESIGN CHỨC NĂNG } (FUNCTIONAL SPECIFICATIONS)

> **YÊU CẦU THỰC THI:** Thiết kế & code **toàn bộ** luồng logic, kiến trúc, schema, API dưới đây **TRƯỚC**. Chưa được vẽ UI đẹp, chưa được làm animation — chỉ **logic chạy được + test**.

### 2.0 Personas & Core Loop

**6 persona nhập vai (chọn lúc tạo nhân vật, đổi được sau 7 ngày in-game):**

| Persona | Nghề chính | Vòng lặp đặc trưng | Nguồn thu nhập in-game |
|---|---|---|---|
| Sinh viên Mỹ thuật | Vẽ truyện tranh phố cổ | Nhận commission → vẽ (mini-game) → bán ở Hàng Mã | Đồng (VND in-game) |
| Nghệ nhân bạc | Chạm bạc phố Hàng Bạc | Mua bạc → chạm → bán/đặt vào nhà | Đồng + danh tiếng |
| Cô bán phở | Nấu phở gia truyền | Săn nguyên liệu chợ Đồng Xuân → nấu → mở quán | Đồng + khách quen |
| Anh xích lô | Chở khách quanh Hồ Gươm | Chọn tuyến → chở khách → nghe chuyện | Đồng + "mảnh ký ức" |
| Nhiếp ảnh gia | Photo mode chuyên nghiệp | Săn khoảnh khắc → chỉnh màu → triển lãm | Đồng + vé triển lãm |
| Nghệ sĩ hát xẩm / ca trù | Biểu diễn đêm phố cổ | Tập → diễn → mở rộng khán giả | Đồng + danh tiếng văn hoá |

**Core loop (một ngày in-game ~ 24 phút thực):**
`Thức dậy (nhà) → Nhu cầu (đói/mệt/tâm trạng) → Chọn 1 trong 3 "Ý định trong ngày" → Ra phố (di chuyển) → Gặp NPC/sự kiện → Làm nghề/quest → Nhận Đồng + Pieces + Danh tiếng → Tối: về nhà, trang trí, xem Journal, chụp ảnh → Ngủ = lưu + tổng kết ngày`.

**Ba trục tiến bộ (không có "level sức mạnh"):**
1. **Tay nghề** (Craft Level 1–20/nghề) → mở công thức, animation đẹp hơn.
2. **Danh tiếng** (5 phe: Cư dân, Tiểu thương, Nghệ nhân, Giới trẻ, Di sản) → mở thoại, cửa hàng, quest.
3. **Bộ sưu tập** (480 Pieces + 120 photo challenges + 36 phố) → mở lore, cosmetic.

---

### 2.1 Kiến trúc tổng thể

```
apps/
  web/            → React 18 + Vite (client game)
  admin/          → React + CMS (P7)
services/
  api/            → Express + Prisma (P6)
  realtime/       → Socket.IO gateway (P5/P6)
packages/
  shared/         → types, zod contracts, formulas (dùng chung 3 nơi)
  world-data/     → JSON tiles, POI, landmark (CDN-ready)
```

**Luật phụ thuộc (bắt buộc, có ESLint rule):**
`shared ← core ← modules ← ui` · `server` chỉ import `shared`. **Không import ngược.** `core` **không** biết React. `modules` **không** import trực tiếp `three` ngoài `core/renderer` facade.

**Data flow 1 frame:**
`InputSystem → Intent → Simulation(60 Hz fixed) → WorldState(diff) → Renderer(interpolate) → UI(react, 10 Hz)`
Server chỉ nhận: `auth`, `save`, `economy`, `inventory`, `quest_event`, `photo_upload`, `presence_delta`.

---

### 2.2 P0 — CORE RUNTIME (8,000 LoC)

| ID | Chức năng | Chi tiết kỹ thuật |
|---|---|---|
| FR-CORE-01 | Game loop | Fixed timestep 60 Hz accumulator, max 5 step/frame, interpolation alpha; pause khi tab hidden; time-scale 0–2 |
| FR-CORE-02 | Renderer facade | WebGL2 qua R3F; culling frustum + occlusion (hi-Z đơn giản); instancing bắt buộc cho cây/đèn/ghế; 3 LOD (0: <40 m full, 1: 40–120 m, 2: >120 m billboard) |
| FR-CORE-03 | Post-processing "painterly" | Bloom nhẹ + LUT color-grade + fog màu theo mùa + vignette; **tắt được** cho máy yếu (auto-detect qua `deviceMemory`/benchmark 90 frame) |
| FR-CORE-04 | Physics | Capsule character, slope ≤ 45°, step 0.35 m; chỉ collide với static mesh theo tile; xe máy = raycast 2 bánh đơn giản; **không** dùng physics engine nặng (Rapier optional sau flag) |
| FR-CORE-05 | Input | Keyboard/Mouse + Gamepad (Web Gamepad API) + touch (mobile web); rebinding; deadzone; input buffer 120 ms cho nhảy/tương tác |
| FR-CORE-06 | Camera | Third-person orbit + first-person + "photo cam" (free-fly, FOV 20–90, tilt-shift, DOF) |
| FR-CORE-07 | Audio | Web Audio graph: bus Master/Music/SFX/Ambience; 3D positional (HRTF off cho perf); ducking khi thoại; soundscape theo district + giờ |
| FR-CORE-08 | Time & Weather | Chu kỳ 24 phút/ngày; 4 mùa theo lịch thật; mưa phùn, nồm ẩm, nắng gắt, gió mùa; ảnh hưởng: trơn trượt nhẹ, tầm nhìn, NPC có ô |
| FR-CORE-09 | Save/Load | Local IndexedDB (offline) + cloud (server authoritative cho inventory/currency); save schema versioning + migration chain; autosave mỗi 3 phút & khi ngủ |
| FR-CORE-10 | Asset pipeline | Draco/meshopt nén, KTX2 texture, atlas cho UI, budget tải theo tile; preload ring 1 tile trước khi player tới |
| FR-CORE-11 | Debug overlay | FPS, draw call, tile state, memory, entity count, net stat; hotkey F9; chỉ bật ở dev/staging |
| ER-CORE-01 | Lỗi cần chống | Memory leak khi stream tile (mọi `dispose()` phải có test), delta-time spike gây xuyên tường (clamp dt ≤ 50 ms) |

### 2.3 P1 — WORLD 20 km² (10,000 LoC)

**Định nghĩa không gian:** bounding box **5.0 km × 4.0 km = 20 km²**, gốc toạ độ tại Hồ Gươm, trục X = Đông–Tây, Z = Nam–Bắc. Tile **250 m × 250 m** → **20 × 16 = 320 tile**. Stream **5×5 = 25 tile** quanh player (bán kính 625 m) + ring preload.

| ID | Chức năng | Chi tiết |
|---|---|---|
| FR-WORLD-01 | Tile format | `tile_{x}_{z}.json`: roads (spline + width), buildings (footprint + height + facade style), props, POI refs, nav graph, ambient audio id, weather mask |
| FR-WORLD-02 | Streaming manager | Priority queue theo khoảng cách + hướng nhìn; budget 2 tile/frame; unload sau 2 tile; LRU cache 40 tile |
| FR-WORLD-03 | OSM import pipeline | Script Node: Overpass extract → lọc tag → làm sạch topology → sinh tile; **ODbL attribution** trong Credits |
| FR-WORLD-04 | Procedural facade | 12 style Hà Nội: nhà ống 3–5 tầng, ban công sắt, mái tôn, "tube house" hẹp, biệt thự Pháp, chung cư cũ, shophouse; biến thiên theo phố |
| FR-WORLD-05 | 36 phố – 36 nghề | Map `street → craft` (Hàng Bạc: bạc; Hàng Mã: đồ giấy; Hàng Gai: lụa; Hàng Thiếc: thiếc; Hàng Đồng: đồng; Hàng Chiếu: chiếu; Hàng Quạt: quạt; Thuốc Bắc: thuốc bắc; Lãn Ông; Chả Cá; Bát Sứ; Mã Mây; Tạ Hiện...). Ảnh hưởng: biển hiệu, prop, âm thanh, NPC, quest |
| FR-WORLD-06 | POI registry | Schema: `id, type, pos, radius, interaction, schedule, requirements, lootTable`. Type: `shop, food, landmark, quest_giver, photo_spot, bench, shrine, workshop, transport` |
| FR-WORLD-07 | Interactable density validator | Script CI: mỗi tile ≥ 4 POI, mỗi 150 m đường đi ≥ 1 POI; fail build nếu vi phạm |
| FR-WORLD-08 | Landmark bespoke (12) | Hồ Gươm + Tháp Rùa + Đền Ngọc Sơn + Cầu Thế Húc · Phố cổ · Nhà thờ Lớn · Cầu Long Biên · Hồ Tây + Chùa Trấn Quốc · Văn Miếu · Lăng Bác + Quảng trường Ba Đình · Hoàng thành Thăng Long · Nhà hát Lớn · Chợ Đồng Xuân · Phố Đường Tàu |
| FR-WORLD-09 | Transport network | Trạm bus + tuyến (xanh/đỏ), ga Cát Linh–Hà Đông (metro), bến xích lô, điểm thuê xe đạp/xe máy; pathfinding trên nav graph |
| FR-WORLD-10 | Map & minimap | 2D vector map render từ world-data; fog-of-war nhẹ theo khám phá; filter (ăn uống, di sản, dịch vụ); pin + route |
| FR-WORLD-11 | Ambient life | Chim bồ câu, mèo, chó, xe máy AI chạy theo làn, tiếng còi xe (signature Hà Nội), người đi bộ, hàng rong, quán nước vỉa hè |
| FR-WORLD-12 | Air quality (AQI) | Chỉ số AQI theo giờ/mùa → ảnh hưởng tầm nhìn + buff tâm trạng khi đeo khẩu trang / vào quán cà phê |
| FR-WORLD-13 | Season & festival layer | Tết (hoa đào, phố ông đồ, pháo hoa), Trung Thu (đèn lồng Hàng Mã), 30/4, 2/9, Giỗ Tổ; lịch thật + override admin |
| ER-WORLD-01 | Lỗi cần chống | Tile seam (dùng chung edge node), floating building (snap heightmap), nav graph không liên thông (validator BFS) |

**District rollout (Phase 5 mới cần đủ):** Hoàn Kiếm (core) → Ba Đình → Đống Đa → Hai Bà Trưng → Tây Hồ → Cầu Giấy → Long Biên → Hoàng Mai → Thanh Xuân → Nam/Bắc Từ Liêm → Hà Đông.

### 2.4 P2 — RP & PROGRESSION (11,000 LoC)

| ID | Chức năng | Chi tiết |
|---|---|---|
| FR-RP-01 | Character creator | 4 bước: Ngoại hình (24 preset + slider) → Trang phục (áo dài, áo bà ba, đồng phục, streetwear) → Persona → Tên + tiểu sử (200 ký tự, filter) |
| FR-RP-02 | Wardrobe | 80 item, 6 slot (áo, quần, giày, phụ kiện, mũ/nón, ba lô); dye 8 màu; unlock bằng Đồng/Pieces/Season |
| FR-RP-03 | Needs | `Năng lượng`, `No đói`, `Tâm trạng (An yên)`, `Vệ sinh`. Regen/decay theo phút; ảnh hưởng speed, thoại, mini-game; **không bao giờ gây chết** (chỉ giảm hiệu suất — cozy, không punishing) |
| FR-RP-04 | Nghề & crafting | 6 nghề, mỗi nghề 4 mini-game khác nhau (chạm bạc: rhythm; nấu phở: timing + thứ tự; chụp ảnh: framing; xích lô: đường đi; vẽ: nét; hát: nhịp) |
| FR-RP-05 | Housing | Thuê phòng theo quận (giá khác nhau); 120 món nội thất; grid placement + free-rotate; "góc thư giãn" buff tâm trạng; mời NPC/bạn bè |
| FR-RP-06 | Transport | Đi bộ, xe đạp, xe máy, xích lô (chở khách), bus (theo tuyến), metro; tiêu hao năng lượng/nhiên liệu; đỗ xe; mũ bảo hiểm (chi tiết văn hoá) |
| FR-RP-07 | Photo mode | Free-cam, 12 filter, tilt-shift, khung viền, sticker; **challenge hằng ngày**; lưu album; in ảnh (cosmetic/premium) |
| FR-RP-08 | Journal | Nhật ký ngày (auto-generated từ event), bản đồ ký ức, thống kê (km đã đi, bát phở đã ăn, NPC đã gặp) |
| FR-RP-09 | RP identity | "Character sheet" công khai: bio, persona, faction, câu cửa miệng; **In-character mode** (chat chỉ RP, filter riêng); emote 24 động tác (vẫy, cúi chào, ngồi hè phố, uống trà đá) |
| FR-RP-10 | "Pieces" | 480 mảnh ký ức (lore Hà Nội) ẩn trong thế giới; ghép thành 36 bức tranh phố; mỗi bức mở 1 đoạn lore + cosmetic |
| ER-RP-01 | Lỗi cần chống | Save migration khi thêm slot trang phục; duplicate item khi mất mạng lúc mua (idempotency key) |

### 2.5 P3 — NARRATIVE / QUEST / NPC (6,500 LoC)

| ID | Chức năng | Chi tiết |
|---|---|---|
| FR-NPC-01 | Dialogue engine | Graph node: `line, speaker, emotion, choices[], condition, effect, next`; hỗ trợ `vi/en`; typing effect; skip; log |
| FR-NPC-02 | Quest system | State machine `LOCKED → AVAILABLE → ACTIVE → COMPLETE → CLAIMED`; objective types: `talk, fetch, craft, deliver, photo, visit, wait_until, escort, minigame_score` |
| FR-NPC-03 | NPC schedule | Mỗi NPC có timetable 24h × 7 ngày × mùa; ví dụ: cô bán phở 5:00–10:00 ở Hàng Bồ, 15:00 đi chợ, 20:00 về; trời mưa → trú; lễ → đi hội |
| FR-NPC-04 | NPC memory | Nhớ 12 sự kiện gần nhất với player (đã giúp, đã chụp ảnh, đã mua); ảnh hưởng thoại + giá |
| FR-NPC-05 | Barks & ambient | 8 nhóm câu thoại ngắn theo ngữ cảnh (mưa, Tết, đông người, đêm khuya) |
| FR-NPC-06 | Content scale | 60 quest (20 main "Pieces of the Old Quarter" + 40 side), 120 NPC có tên, 1,200 dòng thoại vi + 1,200 en |
| FR-NPC-07 | Faction & reputation | 5 phe, −100…+100; ngưỡng mở thoại/quest/giá; suy giảm chậm 1 điểm/ngày nếu không tương tác |
| ER-NPC-01 | Lỗi cần chống | Quest deadlock (validator reachability trên graph), NPC kẹt nav, thoại lặp vô hạn (cooldown 30 s) |

### 2.6 P4 — ECONOMY & MONETIZATION (4,500 LoC)

| ID | Chức năng | Chi tiết |
|---|---|---|
| FR-ECO-01 | Hai loại tiền | `Đồng` (kiếm trong game) · `Hoa Sen` (premium, mua bằng VND). **Không** đổi ngược Đồng → Hoa Sen |
| FR-ECO-02 | Ledger | Double-entry bất biến: mỗi giao dịch 2 dòng (debit/credit), `idempotencyKey` unique, không UPDATE — chỉ INSERT + reversal |
| FR-ECO-03 | Faucet/Sink cân bằng | Faucet: nghề, quest, bán đồ, daily. Sink: ăn uống, thuê nhà, nhiên liệu, cosmetic, vé tàu. Mục tiêu: **inflation < 2%/tuần** (dashboard) |
| FR-ECO-04 | Shop | 6 tab: Trang phục, Nội thất, Dụng cụ nghề, Vé trải nghiệm, Season, Bundle; preview 3D trước khi mua |
| FR-ECO-05 | IAP | Gói Hoa Sen: 20k/50k/100k/200k/500k VND (+bonus), VAT 10%, VNPay/MoMo/ZaloPay/Google Play; receipt verify server-side; refund flow |
| FR-ECO-06 | Season Journal | 60 cấp/season (8 tuần), free track + premium track **chỉ cosmetic**; nhiệm vụ tuần, không FOMO quá đà (bù cấp cuối season) |
| FR-ECO-07 | Photo print | In ảnh trong game thành ảnh kỹ thuật số chất lượng cao (premium) + khung |
| FR-ECO-08 | Sponsorship slot | Vị trí biển hiệu "thương hiệu Hà Nội" (cà phê, áo dài, thủ công) — bán cho đối tác, **gắn nhãn rõ "Tài trợ"** |
| ER-ECO-01 | Lỗi cần chống | Race khi mua song song (transaction + row lock), replay receipt, âm quỹ (constraint `balance >= 0`) |

### 2.7 P5 — SOCIAL / REALTIME (4,000 LoC)

| ID | Chức năng | Chi tiết |
|---|---|---|
| FR-SOC-01 | Co-presence | Tối đa 32 người/instance (theo quận, chia shard); sync 4 Hz, interpolation 200 ms; chỉ gửi entity trong 120 m |
| FR-SOC-02 | Chat | Kênh: Khu vực, Nhóm, Bạn bè, IC (in-character); rate limit 5 msg/10 s; filter từ khoá + report |
| FR-SOC-03 | Emote & pose | 24 emote, đồng bộ animation, có thể "ngồi hè phố uống trà đá" cùng nhau |
| FR-SOC-04 | Photo feed | Chia sẻ ảnh trong game, like, comment; moderation queue; chế độ riêng tư |
| FR-SOC-05 | Hội quán (guild) | Nhóm 30 người, tên + mô tả, bảng tin, hoạt động tuần (chụp ảnh nhóm, dọn phố) |
| FR-SOC-06 | Friend & invite | Kết bạn, mời vào instance, "cùng đi cà phê" |
| ER-SOC-01 | Lỗi cần chống | Desync khi lag (client-side prediction + reconciliation), spam, quấy rối (report + mute + block) |

### 2.8 P6 — BACKEND / API / SECURITY (6,000 LoC)

**Nguyên tắc:** *Server authoritative cho mọi thứ có giá trị; client không bao giờ tự cộng tiền/item.*

| Nhóm | Endpoint chính | Ghi chú |
|---|---|---|
| Auth | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `POST /auth/forgot` | JWT access 15 m + refresh 30 d (rotate), bcrypt cost 12, rate limit 5/phút/IP |
| Character | `GET/POST /character`, `PATCH /character/:id`, `POST /character/:id/wardrobe` | Validate bằng zod schema dùng chung `shared/contracts` |
| World | `GET /world/tiles/:x/:z` (CDN, ETag), `GET /world/poi?bbox=`, `GET /world/state` | Không cần auth cho tile tĩnh |
| Quest | `GET /quests`, `POST /quests/:id/accept`, `/progress`, `/claim` | Progress event từ client → server validate theo rule |
| Economy | `GET /wallet`, `POST /shop/purchase`, `POST /iap/verify`, `GET /ledger` | `Idempotency-Key` bắt buộc; transaction + `SELECT … FOR UPDATE` |
| Social | `GET /friends`, `POST /friends/:id`, `GET /feed`, `POST /photos`, `POST /report` | Upload ảnh → S3/R2 + virus scan + strip EXIF GPS |
| Admin | `GET/POST/PATCH /admin/poi`, `/admin/npc`, `/admin/quest`, `/admin/season`, `/admin/flags`, `/admin/moderation` | RBAC + audit log |
| Realtime | `ws /socket` events: `presence:join`, `presence:delta`, `chat:send`, `emote`, `photo:new` | Socket auth bằng JWT, payload ≤ 1 KB |

**RBAC matrix:** `PLAYER` (self) · `CREATOR` (nội dung, không publish) · `SUPPORT` (xem user, không sửa tiền) · `MODERATOR` (ban/chat/report) · `ADMIN` (config, season, refund ≤ 2M) · `SUPER_ADMIN` (role, tiền không giới hạn, có 2FA bắt buộc).

**Bảo mật bắt buộc:** helmet + CSP, CORS allowlist, zod validate 100% input, SQL injection = Prisma parameterized, XSS = sanitize bio/chat, CSRF cho cookie flow, secret qua env (không commit), rate limit Redis, audit log append-only, `SECURITY.md`.

### 2.9 P7 — ADMIN / CMS / ANALYTICS (3,500 LoC)

`POI Editor` (kéo thả trên map, xem trước trong game) · `NPC & Dialogue Editor` (cây thoại + validate node mồ côi) · `Quest Editor` (graph + validator reachability) · `Season/Event Scheduler` (lịch thật + override) · `Moderation Console` (queue report, ban, appeal) · `Economy Dashboard` (faucet/sink, inflation, top whale — **không** lộ PII) · `Feature Flags` · `Content Bible viewer`.

### 2.10 Database Schema (Prisma — phần MỞ RỘNG trên 27 model hiện có)

```prisma
// ===== WORLD =====
model WorldTile {
  id        String   @id            // "t_07_04"
  x         Int
  z         Int
  version   Int      @default(1)
  poiCount  Int
  updatedAt DateTime @updatedAt
  @@unique([x, z])
}

model Poi {
  id           String   @id @default(cuid())
  tileId       String
  type         PoiType
  name         String
  nameEn       String?
  lat          Float
  lng          Float
  radius       Float    @default(2)
  schedule     Json?              // { mon:[["05:00","10:00"]], ... }
  requirements Json?              // { reputation: {merchant: 20} }
  payload      Json?              // menu, loot, dialogueRef
  isActive     Boolean  @default(true)
  @@index([tileId, type])
}

enum PoiType { SHOP FOOD LANDMARK QUEST_GIVER PHOTO_SPOT BENCH SHRINE WORKSHOP TRANSPORT }

model Landmark {
  id        String @id
  name      String
  district  String
  poiId     String @unique
  lore      Json
}

// ===== RP =====
model PlayerProfile {
  id          String  @id @default(cuid())
  userId      String  @unique
  persona     Persona @default(STUDENT)
  bio         String? @db.VarChar(200)
  inCharacter Boolean @default(true)
  homeId      String?
  stats       Json                 // needs, mood, playtime
  updatedAt   DateTime @updatedAt
}

enum Persona { STUDENT SILVERSMITH PHO_VENDOR CYCLO_DRIVER PHOTOGRAPHER FOLK_SINGER }

model ProfessionProgress {
  id        String @id @default(cuid())
  profileId String
  profession Persona
  craftLevel Int    @default(1)
  xp        Int     @default(0)
  @@unique([profileId, profession])
}

model WardrobeItem {
  id        String  @id @default(cuid())
  profileId String
  catalogId String
  dye       String?
  isEquipped Boolean @default(false)
  slot      String
  acquiredAt DateTime @default(now())
  @@index([profileId, slot])
}

model Housing {
  id        String @id @default(cuid())
  profileId String @unique
  district  String
  rentPerDay Int
  layout    Json                 // [{itemId,x,y,rot}]
  comfort   Int    @default(0)
}

// ===== NARRATIVE =====
model Npc {
  id       String @id @default(cuid())
  key      String @unique
  name     String
  district String
  schedule Json
  dialogue Json
  faction  Faction?
  isActive Boolean @default(true)
}

model QuestDef {
  id          String  @id @default(cuid())
  key         String  @unique
  title       String
  titleEn     String?
  type        QuestType
  graph       Json
  rewards     Json
  minLevel    Int     @default(1)
  isPublished Boolean @default(false)
}

enum QuestType { MAIN SIDE DAILY WEEKLY FESTIVAL }

model QuestInstance {
  id        String   @id @default(cuid())
  profileId String
  questKey  String
  state     QuestState @default(AVAILABLE)
  progress  Json
  startedAt DateTime?
  claimedAt DateTime?
  @@index([profileId, state])
}

enum QuestState { LOCKED AVAILABLE ACTIVE COMPLETE CLAIMED FAILED }

model Reputation {
  id        String @id @default(cuid())
  profileId String
  faction   String
  value     Int    @default(0)    // clamp -100..100
  @@unique([profileId, faction])
}

// ===== ECONOMY =====
model Wallet {
  id        String @id @default(cuid())
  profileId String @unique
  dong      BigInt @default(0)
  hoaSen    Int    @default(0)
  @@map("wallets")
}

model LedgerEntry {
  id             String   @id @default(cuid())
  walletId       String
  deltaDong      BigInt   @default(0)
  deltaHoaSen    Int      @default(0)
  reason         String
  refType        String?
  refId          String?
  idempotencyKey String   @unique
  balanceAfter   Json
  createdAt      DateTime @default(now())
  @@index([walletId, createdAt])
}

model Purchase {
  id         String   @id @default(cuid())
  profileId  String
  sku        String
  amountVnd  Int
  currency   String   @default("VND")
  provider   String              // VNPAY | MOMO | ZALOPAY | STORE
  providerRef String?  @unique
  status     PaymentStatus @default(PENDING)
  createdAt  DateTime @default(now())
}

enum PaymentStatus { PENDING PAID FAILED REFUNDED }

// ===== SOCIAL / MOD =====
model PhotoPost {
  id        String   @id @default(cuid())
  profileId String
  url       String
  caption   String?  @db.VarChar(140)
  spotId    String?
  likes     Int      @default(0)
  visibility Visibility @default(PUBLIC)
  createdAt DateTime @default(now())
  @@index([createdAt])
}

enum Visibility { PUBLIC FRIENDS PRIVATE }

model Report {
  id         String   @id @default(cuid())
  reporterId String
  targetType String
  targetId   String
  reason     String
  status     ReportStatus @default(OPEN)
  handledBy  String?
  createdAt  DateTime @default(now())
}

enum ReportStatus { OPEN REVIEWING RESOLVED REJECTED }

model AuditLog {
  id        String   @id @default(cuid())
  actorId   String
  action    String
  entity    String
  entityId  String?
  before    Json?
  after     Json?
  ip        String?
  createdAt DateTime @default(now())
  @@index([actorId, createdAt])
}
```

### 2.11 Business Logic — công thức bắt buộc dùng chung (`packages/shared/formulas`)

```ts
// XP nghề: mượt, không wall
xpToNext(level) = Math.round(120 * Math.pow(level, 1.35))      // L1→2: 120, L10: ~2.6k
// Needs decay (mỗi phút thực)
energy  -= 0.35;  hunger -= 0.55;  mood -= 0.20 + (rain ? 0.1 : 0)
// Mood clamp 0..100, không bao giờ gây chết; mood <25 → thoại NPC ngắn hơn, speed -10%
// Giá quán theo danh tiếng phe Tiểu thương
price = base * (1 - clamp(rep,0,100)/100 * 0.15)   // giảm tối đa 15%
// Faucet cap chống lạm phát
dailyIncomeCap = 800 + craftLevel * 120            // vượt → chỉ nhận 20%
// Anti-cheat movement
if (dist / dt > 12 m/s && !isVehicle) flag(TELEPORT_SUSPECT)
if (totalDongEarned / 3600 > 5 * expected) flag(ECONOMY_ANOMALY)
```

**Nguyên tắc server:** mọi thay đổi `Wallet`, `InventoryItem`, `QuestState`, `Purchase` **chỉ** qua service có transaction + `LedgerEntry`; client chỉ gửi **intent**, không gửi **kết quả**.

### 2.12 Non-Functional Requirements

| Nhóm | Yêu cầu |
|---|---|
| Performance | 60 FPS @ GTX1050/M1; ≤220 draw call; ≤2.5 MB gzip initial; LCP <2.5 s; TTI <4 s; 320 tile không load hết một lúc |
| Scale | 10,000 CCU; 32 người/instance; p95 API <150 ms; socket p95 <80 ms |
| Reliability | Uptime 99.5%; autosave; offline mode đọc/ghi local; retry với backoff |
| Security | OWASP Top 10; JWT rotate; zod; rate limit; audit log; 2FA cho admin; không log PII |
| Testing | Unit ≥70% ở `core`+`shared`; integration cho economy/quest; e2e Playwright 12 critical path; **test cho mọi bug đã fix** |
| Accessibility | WCAG 2.1 AA cho UI; font scale 80–150%; colorblind-safe (không phân biệt item chỉ bằng màu); subtitle, remap, giảm chuyển động, tắt bloom |
| i18n | `vi` (mặc định) + `en`; **font phải render đủ dấu tiếng Việt** (Nunito/Be Vietnam Pro OK); không hardcode string |
| Observability | Sentry (client+server), structured log JSON, metric: fps_p50, tile_load_ms, api_p95, crash_free, funnel step |
| DevOps | CI: typecheck → lint → test → build size gate → tile density gate; preview deploy mỗi PR |

### 2.13 Roadmap 8 Phase (mỗi phase là một "lát cắt dọc" chạy được)

| Phase | Nội dung | LoC ra | Checkpoint |
|---|---|---|---|
| 1 | Core loop + 1 tile Hoàn Kiếm + nhân vật đi bộ + save | 9,000 | Vào game <8 s, đi bộ 60 FPS |
| 2 | POI/shop/dialogue + nghề phở + needs + journal | 9,000 | Chơi được 30 phút có mục tiêu |
| 3 | Quest graph + 15 quest + 30 NPC + reputation | 8,000 | Hoàn thành 1 main quest chain |
| 4 | Economy + ledger + shop + save cloud + auth | 8,000 | Mua bán không thể duplicate |
| 5 | World mở rộng 20 km² + 12 landmark + map | 9,000 | Đi hết map không crash, tile validator pass |
| 6 | Photo mode + album + Pieces + season journal | 6,000 | Vòng lặp D7 có lý do quay lại |
| 7 | Realtime 32 người + chat + hội quán + moderation | 6,000 | 2 client thấy nhau <300 ms |
| 8 | Admin CMS + analytics + polish + a11y + i18n | 5,000 | 60,000 LoC, mọi gate xanh |

---

## 3. STEP 2 === { DESIGN UX/UI SAU } (DỰA TRÊN IMAGE STYLE — 200 OK)

> **YÊU CẦU THỰC THI:** Áp dụng **chính xác** hệ token dưới đây lên các chức năng ở STEP 1. Không tự thêm màu ngoài palette. Không dùng font không hỗ trợ tiếng Việt.

### 3.1 Giải mã Style từ ảnh (Phân tích 3)

| Thuộc tính | Kết quả trích xuất |
|---|---|
| **Mood / Aesthetic** | *Cozy Storybook / Painterly Pastel Forest*. Tranh vẽ tay mềm, màu pastel pha xanh rêu, ánh sáng tán cây ấm, UI giấy kraft/nhãn dán. Cảm giác: bình yên, thủ công, "đồ chơi gỗ", không căng thẳng. |
| **Chất liệu UI** | **Thẻ giấy kem** (cream card) hơi nghiêng, viền đứt nét màu đào, đổ bóng mềm; **nút pill xanh sage** cho item đang chọn; chữ **navy đậm** đậm nét; logo chữ trắng ngà với nét vẽ tay. |
| **Bố cục** | 16:9, thẻ menu **lệch trái** (khoảng 35% chiều rộng), thế giới chiếm 65% còn lại làm "poster sống". HUD góc phải dưới là **chip tối** nhỏ. Rất nhiều khoảng trống (thở). |
| **Tương phản** | Thấp–trung ở nền (pastel), **cao** ở UI (cream ↔ navy). Không dùng viền đen cứng; viền là màu ấm nhạt hơn nền. |
| **Điểm nhấn tương tác** | Chỉ **một** item được highlight tại một thời điểm (pill sage) → luật: *mỗi màn hình chỉ 1 primary action*. |

### 3.2 Design Tokens (trích từ ảnh — `EXACT` = lấy trực tiếp từ pixel, `DERIVED` = suy ra theo quy luật)

```css
:root {
  /* ===== BACKGROUND / WORLD (từ palette ảnh) ===== */
  --c-forest-deep:   #3A544E;  /* EXACT – bóng rừng, dùng cho scrim/tối */
  --c-forest:        #578C4A;  /* EXACT – tán lá trung */
  --c-forest-mid:    #5D995D;  /* EXACT */
  --c-grass:         #80AA4E;  /* EXACT – cỏ nắng */
  --c-grass-sun:     #B7D26E;  /* EXACT – highlight nắng */
  --c-moss:          #438454;  /* EXACT */
  --c-soil:          #907A55;  /* EXACT – đất/nền gỗ */
  --c-sky-haze:      #CBE3D6;  /* DERIVED – sương pastel */

  /* ===== SURFACE (UI) ===== */
  --c-cream:         #FFF4D6;  /* EXACT – thẻ giấy chính */
  --c-cream-2:       #F5F0DD;  /* EXACT – thẻ phụ */
  --c-cream-sunken:  #F1E7C8;  /* DERIVED – vùng chìm/scroll */
  --c-stroke-peach:  #F6D1BC;  /* EXACT – viền đứt nét */
  --c-logo-cream:    #E5E9EA;  /* EXACT – chữ logo */
  --c-paper-edge:    #E8D9B4;  /* DERIVED – mép giấy */

  /* ===== PRIMARY / ACCENT ===== */
  --c-sage:          #A4CA9B;  /* EXACT – pill selected */
  --c-sage-hover:    #B3D6AA;  /* DERIVED */
  --c-sage-press:    #8FBA86;  /* DERIVED */
  --c-sage-deep:     #6E9B67;  /* DERIVED – viền/nút phụ */
  --c-teal:          #3A9C8F;  /* DERIVED từ thân xe – accent phụ */
  --c-coral:         #C97B63;  /* DERIVED – cảnh báo nhẹ */
  --c-mustard:       #D9A441;  /* DERIVED – currency/premium */

  /* ===== INK / TEXT ===== */
  --c-ink:           #0A4062;  /* EXACT – navy đậm của chữ */
  --c-ink-soft:      #3F6A85;  /* DERIVED – text phụ */
  --c-ink-muted:     #6B8798;  /* DERIVED – caption */
  --c-on-color:      #FFFFFF;  /* text trên pill sage / chip tối */

  /* ===== HUD / SCRIM ===== */
  --c-hud-chip:      #35603E;  /* DERIVED – chip góc phải dưới */
  --c-scrim:         rgba(28, 52, 42, 0.62);
  --c-scrim-soft:    rgba(28, 52, 42, 0.35);

  /* ===== FEEDBACK ===== */
  --c-success: #6E9B67;  --c-warning: #D9A441;  --c-error: #C0685C;  --c-info: #3A9C8F;

  /* ===== ELEVATION (bóng ấm, không bóng đen) ===== */
  --sh-1: 0 1px 0 rgba(255,255,255,.55) inset, 0 2px 6px rgba(58,84,78,.16);
  --sh-2: 0 6px 18px rgba(58,84,78,.22), 0 2px 0 rgba(232,217,180,.9);
  --sh-3: 0 16px 40px rgba(58,84,78,.26);

  /* ===== RADIUS ===== */
  --r-xs: 8px; --r-sm: 12px; --r-md: 16px; --r-lg: 24px; --r-xl: 28px; --r-2xl: 36px; --r-pill: 999px;

  /* ===== SPACING (4pt grid) ===== */
  --s-1: 4px; --s-2: 8px; --s-3: 12px; --s-4: 16px; --s-5: 24px; --s-6: 32px; --s-7: 48px; --s-8: 64px;

  /* ===== TYPE ===== */
  --f-display: "Nunito", "Be Vietnam Pro", system-ui, sans-serif;  /* 800/900 */
  --f-body:    "Nunito", "Be Vietnam Pro", system-ui, sans-serif;  /* 500/600/700 */
  --f-hand:    "Kalam", "Caveat", cursive;                          /* nhãn tay, dùng rất ít */
  --t-title:   clamp(28px, 3.2vw, 40px);
  --t-h1:      28px;  --t-h2: 22px;  --t-h3: 18px;
  --t-body:    16px;  --t-small: 14px; --t-caption: 12px;
  --lh-tight:  1.12;  --lh-body: 1.55;
  --ls-title:  -0.01em;

  /* ===== MOTION ===== */
  --e-out: cubic-bezier(.22, 1, .36, 1);
  --e-soft: cubic-bezier(.4, 0, .2, 1);
  --d-fast: 120ms; --d-base: 220ms; --d-slow: 320ms;
}
```

**Quy tắc palette:** nền thế giới dùng họ xanh rêu; **mọi** surface tương tác dùng `--c-cream`; **mọi** primary action dùng `--c-sage`; **mọi** text trên cream dùng `--c-ink`. Không có ngoại lệ. Accent `teal/mustard/coral` chỉ dùng cho icon/status ≤ 10% diện tích.

### 3.3 Component Specs (công thức chính xác)

**A. `CreamCard` — linh hồn của UI (dùng cho menu, dialog, shop, journal)**

```css
.cream-card {
  position: relative;
  background: var(--c-cream);
  border-radius: var(--r-xl);            /* 28px */
  padding: var(--s-6) var(--s-7);         /* 32 48 */
  box-shadow: var(--sh-2);
  transform: rotate(-2.5deg);             /* độ nghiêng "nhãn dán" đặc trưng */
  border: 1px solid var(--c-paper-edge);
}
.cream-card::before {                     /* viền đứt nét bên trong */
  content: "";
  position: absolute; inset: 14px;
  border: 2px dashed var(--c-stroke-peach);
  border-radius: calc(var(--r-xl) - 8px);
  opacity: .85; pointer-events: none;
}
.cream-card__title {
  font: 900 var(--t-title)/var(--lh-tight) var(--f-display);
  color: var(--c-ink); letter-spacing: var(--ls-title);
  text-align: center;
}
```
**Biến thể:** `.cream-card--flat` (bỏ rotate, dùng cho panel lớn/scroll), `.cream-card--tiny` (radius 18, padding 16/20, rotate -1.5deg).

**B. `PillButton` — primary action duy nhất**

```css
.pill {
  display: inline-flex; align-items: center; justify-content: center; gap: var(--s-2);
  min-height: 44px; padding: 10px 28px;
  border-radius: var(--r-pill); border: 0;
  font: 800 18px/1.2 var(--f-display); color: var(--c-on-color);
  background: var(--c-sage);
  box-shadow: 0 2px 0 rgba(110,155,103,.55), 0 6px 14px rgba(58,84,78,.14);
  transition: transform var(--d-fast) var(--e-out), background var(--d-fast) linear;
}
.pill:hover  { background: var(--c-sage-hover); transform: translateY(-1px) scale(1.02); }
.pill:active { background: var(--c-sage-press); transform: translateY(1px) scale(.98); }
.pill:focus-visible { outline: 3px solid var(--c-teal); outline-offset: 3px; }
.pill--ghost {            /* item chưa chọn: chữ navy trên cream, không nền */
  background: transparent; color: var(--c-ink);
  box-shadow: none; font-weight: 900;
}
.pill--danger { background: var(--c-coral); }
```

**C. `HudChip` — chip góc phải dưới (như "Ⓐ Select" trong ảnh)**
`background: var(--c-hud-chip); color: #fff; radius: pill; padding: 6px 14px; font: 700 13px; height: 32px;` + glyph tròn trắng 18px chứa ký tự phím. Bắt buộc hiển thị **theo thiết bị** (Ⓐ/Ⓧ cho gamepad, `E`/`Space` cho bàn phím).

**D. `Toast / Notification`:** cream card tiny, icon trái 24px, 1 dòng + 1 sub, tự tắt 3.5 s, trượt từ phải, **không** chặn input.

**E. `Modal`:** scrim `--c-scrim`, card giữa (rotate 0), enter `scale .94→1 + rotate(-2.5deg→0)` 280 ms `--e-out`.

**F. `TabBar`:** pill sage cho tab active, chữ navy 800; **không** dùng underline.

**G. Icon:** nét 2px, góc tròn, màu `--c-ink` hoặc trắng; kích thước 20/24/32. Phong cách "vẽ tay đều" — cùng bo góc với chữ.

**H. Logo treatment:** chữ khối dày (weight 900), màu `--c-logo-cream`, viền nét mảnh `--c-cream` bên ngoài, có thể thêm nét "cọ vẽ" cong bên dưới. Trên ảnh: logo đặt 1/4 trên-trái, **không** căn giữa.

**I. Scrollbar:** rộng 8px, thumb `--c-paper-edge`, track trong suốt.

**J. Sound design (bắt buộc đi kèm UI):** hover = "gỗ nhẹ" (−28 dB), click = "giấy + gỗ" (−18 dB), mở card = "giấy trượt", thành công = "chuông nhỏ + hơi thở", **không** dùng âm thanh game mobile gắt.

### 3.4 Typography, Grid, Spacing

- **Display:** Nunito 800/900 (đã có sẵn trong repo) — **hỗ trợ đầy đủ dấu tiếng Việt**. Fallback: `Be Vietnam Pro`.
- **Body:** Nunito 500/600, 16 px, line-height 1.55 (dễ đọc tiếng Việt nhiều dấu).
- **Cấm:** font condensed, all-caps cho câu dài, chữ nhỏ <12 px, letter-spacing dương ở tiêu đề.
- **Grid:** 12 cột, gutter 24 px, margin ngoài 5% (min 24 px). Vùng an toàn HUD: 32 px.
- **Thẻ menu chính:** chiếm cột 1–5 (≈ 40%), dọc giữa màn hình, **lệch trái**; thế giới hiển thị cột 6–12 làm poster sống.
- **Breakpoints:** 1280+ (desktop), 900–1279 (laptop), <900 (mobile web: card full-width dưới 92%, HUD co lại, nút ≥ 48 px).
- **Layer z-index:** World 0 · Vignette 10 · HUD 20 · Panel 30 · Modal 40 · Toast 50 · Debug 99.

### 3.5 Motion & Feel

| Hành vi | Thông số |
|---|---|
| Card xuất hiện | `opacity 0→1`, `scale .94→1`, `rotate -6deg→-2.5deg`, 280 ms `--e-out`, stagger 40 ms/item |
| Chọn pill | scale 1 → 1.02 → 1, 160 ms; đổi màu sage→sage-hover |
| Chuyển màn hình | cross-fade 180 ms + world blur 4px (không dùng slide ngang nặng) |
| Photo mode | vignette + letterbox trượt 240 ms; grid rule-of-thirds fade in |
| Giảm chuyển động | `prefers-reduced-motion` → tắt rotate/stagger, chỉ fade 120 ms |

### 3.6 User Flow & Conversion

**First 10 phút (script cứng — dùng làm e2e test):**

```
0:00  Boot (logo 1.5s, có thể skip) → 0:02 Title (CreamCard: Chơi / Cài đặt / Thoát)
0:08  Save slot (3 slot + "Chơi nhanh") → 0:12 Character Creator (4 bước, ≤90s, cho "Ngẫu nhiên")
0:22  Cold open: 5:40 sáng, Phố Đường Tàu — tiếng tàu, hơi nước, camera chậm
0:35  Có điều khiển; HUD chip "W A S D Di chuyển / E Tương tác"
1:00  Quest 1 "Một bát phở buổi sáng": đi 80m tới quán, chọn món (3 lựa chọn), ăn (mini timing 5s)
2:30  Nhận Đồng + Piece #1 + mở Journal (lần đầu, có hướng dẫn)
3:30  Quest 2 "Chụp Hồ Gươm lúc bình minh" → mở Photo Mode (dạy 3 phím)
5:00  NPC chủ quán nhớ mặt: "Mai quay lại nhé" → hook quay lại ngày 2
6:00  Mở bản đồ 20km² (fog-of-war), ghim 1 điểm "Phố cổ"
8:00  Nhiệm vụ ngày (daily) xuất hiện; Season Journal teaser (không bán gì trong 10 phút đầu)
10:00 Tự do — "Hôm nay bạn muốn làm gì?" (3 ý định)
```

**Vòng giữ chân (Retention Loops):**

| Loop | Chu kỳ | Cơ chế | Phần thưởng |
|---|---|---|---|
| Micro | 30–90 s | Gặp POI, bark thoại, tiếng còi xe, mèo | Mood +, khám phá + |
| Session | 18–28 phút | 1 ngày in-game + 3 ý định + journal cuối ngày | Đồng, Piece, rep |
| Daily | 24 h | 3 nhiệm vụ ngày + photo challenge + quán quen | Đồng ×1.2, cosmetic piece |
| Weekly | 7 ngày | Nhiệm vụ hội quán, chợ cuối tuần, lễ hội | Skin, danh hiệu |
| Seasonal | 8 tuần | Season Journal + lễ thật (Tết, Trung Thu) | Cosmetic, lore |

**Monetization flow (không phá cozy):**
`Chơi 30 phút → thấy 1 món cosmetic đẹp trong shop (không popup) → bấm xem → preview trên nhân vật → "Mở khoá 20k Hoa Sen" → thanh toán VNPay/MoMo → nhận ngay + hoá đơn`. **Không** có countdown giả, không lootbox, không paywall nội dung.

### 3.7 Screen Inventory (30 màn hình — mỗi màn phải có: loading / empty / error / offline state)

| # | Screen | Mục tiêu | Thành phần chính |
|---|---|---|---|
| 1 | Boot/Splash | Tải asset | logo, progress "Đang mở cửa phố…" |
| 2 | Title | Vào game nhanh | CreamCard lệch trái (Chơi/Cài đặt/Thoát), world sống sau lưng, HUD chip |
| 3 | Save Select | Chọn/ tạo save | 3 card save + thumbnail + playtime |
| 4 | Character Creator (4 bước) | Đầu tư cảm xúc | preview 3/4, 24 preset, wardrobe, persona card |
| 5 | Cold Open / Cutscene | Hook cảm xúc | letterbox, subtitle, skip |
| 6 | In-World HUD | Không che thế giới | needs mini, compass, quest tracker (thu gọn), HUD chip |
| 7 | Interaction Prompt | 1 hành động rõ | chip "E Nói chuyện" + icon |
| 8 | Dialogue | Nhập vai | hộp cream, avatar NPC, choices pill, log |
| 9 | Journal | Ý nghĩa hành trình | timeline ngày, pieces, stats |
| 10 | Map 20 km² | Định hướng | fog-of-war, filter, pin, route, legend quận |
| 11 | Minimap | Đi lại | vòng tròn, POI icon |
| 12 | Quest List | Chọn việc | main/side/daily, trạng thái, phần thưởng |
| 13 | Quest Detail | Hiểu mục tiêu | objective, gợi ý, "theo dõi" |
| 14 | Inventory | Quản lý | grid 5×6, filter, tooltip |
| 15 | Wardrobe | Tự thể hiện | slot, dye, preview xoay |
| 16 | Shop | Chuyển đổi | 6 tab, giá, preview 3D, badge "Tài trợ" |
| 17 | Crafting/Mini-game | Kỹ năng | timing bar, scoring, feedback |
| 18 | Housing | Sở hữu | grid placement, catalog, comfort meter |
| 19 | Transport | Di chuyển | chọn xe, nhiên liệu, tuyến bus |
| 20 | Photo Mode | Sáng tạo | free-cam, 12 filter, tilt-shift, shutter |
| 21 | Album / Feed | Chia sẻ | grid ảnh, like, report |
| 22 | Pieces Collection | Sưu tầm | 36 bức tranh ghép, lore |
| 23 | Season Journal | Giữ chân | track free/premium, 60 cấp |
| 24 | Social Hub | Cộng đồng | bạn bè, hội quán, chat |
| 25 | Profile / Character Sheet | RP identity | bio, persona, rep, badges |
| 26 | Settings | Kiểm soát | đồ hoạ (auto/low/med/high), âm, phím, ngôn ngữ |
| 27 | Accessibility | Hoà nhập | font scale, colorblind, reduced motion, subtitle size |
| 28 | Payment / IAP | Doanh thu | gói Hoa Sen, provider, hoá đơn VAT |
| 29 | Error / Offline / 404 | Không hoảng | card "Mất kết nối — vẫn chơi offline được" |
| 30 | Admin (CMS) | Vận hành | dashboard, POI/NPC/Quest editor, moderation |

### 3.8 Screen Spec chi tiết (mẫu chuẩn — AI phải theo đúng cấu trúc này cho cả 30 màn)

**#2 Title Screen**
```
┌──────────────────────────────────────────────────────────────┐
│  [LOGO khối cream, 1/4 trên-trái, không căn giữa]            │
│                                                              │
│   ╔══════════════════════════╗        (thế giới sống:        │
│   ║  ┌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┐  ║         tàu chạy, khói,       │
│   ║  ╎   Chơi           ╎  ║         mèo, gió lay lá)      │
│   ║  ╎  ╭─────────────╮ ╎  ║                                │
│   ║  ╎  │  Tiếp tục   │ ╎  ║   ← pill sage = item chọn     │
│   ║  ╎  ╰─────────────╯ ╎  ║                                │
│   ║  ╎    Cài đặt       ╎  ║                                │
│   ║  ╎    Thoát         ╎  ║                                │
│   ║  └╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘  ║                                │
│   ╚══════════════════════════╝                    Ⓐ Chọn     │
└──────────────────────────────────────────────────────────────┘
```
- CreamCard rotate −2.5°, rộng 34–38% viewport, dọc giữa, lệch trái 5%.
- Item: 3 dòng, dòng active là pill sage chữ trắng, dòng khác chữ navy 900 trên cream.
- Vào game qua "Chơi" **không** loading wall; nếu chưa có save → Save Select.
- Phím: ↑↓ chọn, Enter xác nhận, Esc back; gamepad tương đương.
- Trạng thái: hover (pill hover), focus (outline teal), disabled (opacity .45 + cursor not-allowed).
- Không có banner IAP, không có "đăng nhập Facebook" ở màn đầu.

---

## 4. HƯỚNG DẪN TRIỂN KHAI (EXECUTION COMMAND)

### 4.1 Prompt khởi động (gửi kèm khi bắt đầu code)

> "Bạn đã đọc toàn bộ blueprint 60,000 LoC. **Xác nhận hiểu** bằng cách tóm tắt trong 10 dòng: (1) 9 phân hệ + ngân sách LoC, (2) 5 luật chống lỗ cứng, (3) scope fence, (4) style token chính (3 màu + 1 font), (5) phase bạn sẽ làm đầu tiên.
> Sau đó **chỉ thực thi [STEP 1 — DESIGN CHỨC NĂNG] của Phase 1**: tạo skeleton module, contracts, Prisma migration, API auth + save, core loop + 1 tile Hoàn Kiếm + nhân vật đi bộ. **Chưa làm UI đẹp, chưa làm STEP 2.** Dừng lại và chờ tôi duyệt."

### 4.2 Quy tắc thực thi (bắt buộc)

1. **Thứ tự:** Functional → UX/UI. Không được vẽ màn hình trước khi logic + test của màn đó tồn tại.
2. **Lát cắt dọc:** mỗi phase phải *chạy được end-to-end*, không để "TODO" xuyên phase.
3. **Báo cáo mỗi lần bàn giao:** `Phase · LoC_thực/LoC_ngân_sách · file đã tạo · test đã pass · gate đã xanh · rủi ro · việc tiếp theo`.
4. **Không vượt rào:** muốn thêm feature ngoài scope fence → **dừng, hỏi, ghi ADR**, không tự thêm.
5. **Không phá contract:** mọi thay đổi API/DB phải có migration + backward compatibility hoặc version bump.
6. **Test trước khi xong:** bug nào sửa phải có test; economy/quest phải có integration test.
7. **Gate CI:** typecheck → lint → unit → integration → build size ≤ 2.5 MB → tile density → a11y lint.
8. **Ngôn ngữ code:** tiếng Anh; **nội dung game:** tiếng Việt trước, `en` sau, không hardcode.

### 4.3 Checklist review của chủ dự án (dùng để duyệt từng phase)

- [ ] Vào game ≤ 8 s, có điều khiển ≤ 20 s, quest đầu ≤ 60 s?
- [ ] 60 FPS trên máy phổ thông, draw call ≤ 220?
- [ ] Mỗi 150 m có POI? Validator xanh?
- [ ] Không có chỗ nào bán sức mạnh? Không lootbox?
- [ ] Tiền/item chỉ thay đổi qua ledger có idempotency?
- [ ] Font render đủ dấu tiếng Việt? Chuỗi nào còn hardcode?
- [ ] Mọi màn hình có state loading/empty/error/offline?
- [ ] Text trên cream luôn là `#0A4062`? Primary action luôn là pill `#A4CA9B`?
- [ ] Có test cho bug vừa sửa? Coverage `core`+`shared` ≥ 70%?
- [ ] LoC có nằm trong ngân sách phase?

---

**HẾT BLUEPRINT.** — *Bắt đầu từ STEP 1. Không nhảy bước.*
