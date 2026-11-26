# Hà Nội Legends · Phố cổ 20 km²

> Game nhập vai **cozy** thế giới mở lấy bối cảnh Hà Nội. Bạn là một người Hà Nội bình thường —
> đi bộ phố cổ, ăn bát phở sáng, chụp hồ Gươm lúc bình minh, và ghép lại từng mảnh ký ức của thành phố.

**Trạng thái: Phase 1 — vertical slice Hoàn Kiếm** (blueprint đầy đủ: [`docs/MASTER_PROMPT_HANOI_60K.md`](docs/MASTER_PROMPT_HANOI_60K.md))

![style](https://img.shields.io/badge/style-cozy%20storybook-A4CA9B) ![stack](https://img.shields.io/badge/stack-React%20%2B%20R3F%20%2B%20Express-0A4062) ![tests](https://img.shields.io/badge/tests-303%20passing-6E9B67)

---

## Chạy thử

```bash
npm install
npm run dev       # client  → http://localhost:3000
npm run server    # API     → http://localhost:4000
npm run check     # typecheck + 303 test + cổng mật độ thế giới
```

Điều khiển: `W A S D` di chuyển · `Shift` chạy · `E` tương tác · `Q`/`R` đổi công cụ · `J` nhật ký ·
`M` bản đồ · `Esc` tạm dừng · kéo chuột xoay camera · lăn chuột zoom · `F9` debug.

---

## Đã có trong Phase 1

| Hệ thống | Nội dung |
|---|---|
| **World** | Lưới 5 × 4 km = **20 km²**, 320 tile 250 m; 29 tuyến phố của 36 phố phường; hồ Gươm, Tháp Rùa, Đền Ngọc Sơn, Cầu Thế Húc, Ô Quan Chưởng; 12 di tích; 709 nhà ống instanced; 121 cây; chu kỳ ngày 24 phút + 4 mùa |
| **Density gate** | 311 POI, trung vị **24 m**/POI, max 44 m — cổng CI `npm run verify:world` fail nếu tile đường nào < 4 POI hoặc có đoạn phố > 150 m không có gì để tương tác |
| **Streaming** | `TileStreamer` thật: ring 5×5, priority theo khoảng cách, budget/tick, unload hysteresis, event load/unload |
| **RP** | 6 persona, creator, needs (năng lượng / no bụng / an yên) không bao giờ gây chết, đồng hồ + mùa, tiền Đồng, XP tay nghề, danh tiếng |
| **Quest** | “Một bát phở buổi sáng” → “Chụp Hồ Gươm lúc bình minh”, dialogue có lựa chọn, phần thưởng + mảnh ký ức #1/#2 |
| **UI** | HUD “Phố cổ Legends” (ADR-005): target pill lá cây đậm giữa trên, rail icon trắng nổi trái, **dock chân dung** (persona + companion) lơ lửng trên **party wheel** 3 công cụ + thanh `L…R` segment xanh HP, needs chip tối, Creator màn chọn nhân vật kiểu Genshin với 6 chân dung anime nguyên bản; Title có ấn dấu giọt teap màu azure; Title, Creator, HUD, Dialogue (chân dung NPC), Journal, **Map 20 km²**, Pause, Toasts |
| **Save** | Zod-validated schema v1, localStorage offline-first, từ chối save hỏng/version lạ, autosave 3 phút |
| **API** | Auth JWT + bcrypt, save 3 slot, world tile/POI, wallet **double-entry ledger** với idempotency, rate limit, RBAC sẵn khung |

**Đã có trong Phase 4 — Quest State Machine + Voucher Engine (STEP 1 tiếp tục):** `shared/quest-machine.ts` (LOCKED→AVAILABLE→ACTIVE→COMPLETE→CLAIMED/FAILED, idempotent, chỉ transition hợp lệ, objectives phải đạt 1.0) · `server/services/quests.ts` (rewards table, ledger-grant dong idempotent, daily cap Free=3/Pro=6) · `shared/voucher.ts` (issue→claim→redeem, payout, cap; jamais wallet debit — status-move only) · HTTP endpoints `POST /api/quests/:id/start|complete|claim` + `GET /api/quests/:id` + `GET /api/vouchers` + `POST /api/vouchers/:id/claim`. Chi tiết: `docs/PHASE3_MAP_ATMOSPHERE.md` (phần Phase 4).

**Đã có trong Phase 3 — Map/Atmosphere (STEP 1 tiếp tục):** `world/scale.ts` (5 reference legs, tolerance band — báo cáo sai phải trong CI) · `shared/route.ts` (honest 2D route — thẳng + nearest street + walk-time) · `shared/weather.ts` (deterministic offline weather — 4 mùa × điều kiện + `blocksQuest` + TTL cache) · `world/registry.ts` (12 quận derived từ data thật — streets/POI/landmark counts + phase-1 completion report). Chi tiết: `docs/PHASE3_MAP_ATMOSPHERE.md`

**Đã có trong Phase 2 — Core Engine (STEP 1):** `streak.ts` (consecutive-day + milestone day-7 + Pro weekly freeze) · `companion.ts` (4 loài theo Content Bible, 3 care action, idempotent, never dies) · `quest-engine.ts` (daily quest selection, claim budget free=3/Pro=6, expiry check) · `gamification.ts` (5 phe reputation clamp ±100, leaderboard snapshot, 36 pieces/phố) · save schema v2→v3 (migration in place) · game store wiring (`adoptCompanion` / `careCompanion` / `claimStreakDay`). Chi tiết: `docs/PHASE2_CORE_ENGINE.md`

**Chưa có (theo roadmap):** nghề & mini-game (Phase 2+ UI), economy UI + thanh toán (Phase 4), mở rộng đủ 12 quận
(Phase 5), photo mode + Pieces (Phase 6), multiplayer 32 người (Phase 7), CMS (Phase 8).

---

## Kiến trúc

```
src/
├── shared/         contracts (zod) + formulas — dùng chung client/server
│   ├── contracts/  SaveGameV1, PlayerSnapshot, AuthRegister…
│   └── formulas/   xpToNext, decayNeeds, priceWithReputation, income cap, anti-cheat
├── world/          dữ liệu & hệ thống thế giới (không phụ thuộc React)
│   ├── grid.ts     20 km², tile id, quận, vùng Phase 1
│   ├── data/       streets.ts (36 phố), hoanKiem.ts (POI, nhà, cây, spawn an toàn)
│   ├── density.ts  validator chống “thế giới rỗng”
│   └── streamer.ts TileStreamer
├── game/           React + R3F (chỉ tầng này biết three.js)
│   ├── scene/      Scene, City (instanced), Lake, Player, atmosphere
│   ├── ui/         TitleScreen, Creator, Hud, DialogueBox, Journal, Overlays, styles.css
│   ├── store.ts    zustand: phase, needs, quests, dialogue, save
│   └── save.ts     localStorage + schema guard
├── server/         Express API (app.ts tách khỏi index.ts để test được)
│   ├── services/   auth, ledger (double-entry), save
│   └── repo/       memory store (thay bằng Prisma ở Phase 4)
├── legacy/         ⚠️ code monster-collector cũ, đã archive, KHÔNG build
└── __tests__/      303 test: formulas, world, streamer, save, server, UI
```

**Luật phụ thuộc:** `shared ← world ← game` · `server` chỉ import `shared`. Không module nào import chéo.

---

## Cổng chất lượng (chạy trong `npm run check`)

1. `tsc --noEmit` — strict, không `any` ẩn.
2. `vitest` — 303 test, gồm test UI (jsdom) và API thật (http listen + fetch).
3. `verify:world` — mật độ POI.
4. `vite build` — bundle **294 kB gzip** (ngân sách 2.5 MB).

## Ghi chú

- Code cũ (monster collecting / gacha) nằm ở `src/legacy/`, bị loại khỏi `tsconfig`. Nó **mâu thuẫn** với
  nguyên tắc chống lỗ của blueprint (không lootbox, không pay-to-win) nên không được nối vào build mới.
- `IMPLEMENTATION_SUMMARY.md` và `STEP2_COMPLETE.md` (thư mục gốc) là tài liệu lịch sử của bản cũ.
- Dữ liệu bản đồ thật sẽ lấy từ OSM (ODbL) ở Phase 5; Phase 1 dùng layout stylised để giữ đúng cảm giác cozy.
