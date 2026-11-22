# PHASE 2 — Bước 1: Core Engine (Streak · Companion · Quest · Gamification)

> Ngày: 2026-11-22 · Nhánh: `arena/81638032-devfest`
> Master blueprint: [`MASTER_PROMPT_HANOI_DAY_60K.md`](./MASTER_PROMPT_HANOI_DAY_60K.md) (mục 2.2 Core Engine)

## 1. Đã làm

| # | Hạng mục | Kết quả |
|---|---|---|
| 1 | **`streak`** (streak.ts) | Consecutive ICT days, milestone mỗi 7 ngày, weekly freeze Pro, freeze không thể nuốt 2 ngày miss, idempotent cùng ngày. ~223 dòng + tests |
| 2 | **`companion`** (companion.ts) | 4 loài theo Content Bible (Cò Hồ Gươm / Yến Hồ Tây / Mèo Phố Cổ / Con Rùa Gốm), 3 care action (feed/groom/walk), idempotent per day, level-up có cap, decay hằng ngày, vẫn floor ở 5 (không chết —RP-03). ~178 dòng + tests |
| 3 | **`quest-engine`** (quest-engine.ts) | `selectDailyQuests` (score: cùng quận +0.45, khoảng cách +0.40, dễ +0.05; ra 3 candidate), claim budget Free=3/Pro=6/ngày, expiry check, can-claim. ~108 dòng + tests |
| 4 | **`gamification`** (gamification.ts) | 5 phe (resident/merchant/craftsman/youth/heritage, clamp ±100), buildLeaderboardSnapshot (sort desc + tie-break by userId), 1 piece/phố, reputationSum/topFaction. ~119 dòng + tests |
| 5 | **Contracts & migration v2 → v3** (contracts/index.ts) | `SAVE_VERSION = 3`, `StreakStateSchema`, `CompanionStateSchema` (nullable), migrateSave v1/v2 → v3 in place; SavePushRequest outer shape `z.unknown()` cho save → migration hoạt động. ~210 dòng |
| 6 | **Store wiring** (store.ts) | `streak`/`companion` state, load từ save, `adoptCompanion` / `careCompanion` / `claimStreakDay` actions, rollover → decay companion + auto-claim streak, saveNow persist streak/companion |
| 7 | **Save contract fix** | `SavePushRequest` outer shape chấp nhận v1/v2 push; `SaveService` migrate trước khi upsert (route trước đó chặn ngay parse → v2 payload bị 400) |

## 2. Chất lượng

- `tsc --noEmit` **xanh** (strict, `.eslint` warnings 0)
- `vitest run` — **239/239 pass** (từ 194 baseline, +45: 15 streak/companion/quest/gamification, +2 migration v2→v3, +9 store-side save v3)
- `npm run gate` (lint + tsc + tokens + contrast + schema + verify:world + test) **xanh hoàn toàn**
- Test budget: 4 file test mới (~230 dòng tests) — ~40% coverage cho các module mới

## 3. Ngân sách LoC (Phase 2 slice)

| Khu vực | LoC thật | LoC mục tiêu (P0 Core) |
|---|---|---|
| `src/shared/streak.ts` | 223 | (P0-Quest/Atmosphere) |
| `src/shared/companion.ts` | 178 | (P0-Companion) |
| `src/shared/quest-engine.ts` | 108 | (P0-Quest) |
| `src/shared/gamification.ts` | 119 | (P0-Gamification) |
| `src/shared/contracts/index.ts` (+streak/companion schema) | +20 | |
| `src/game/store.ts` (wiring) | ~60 | |
| **Tổng cộng thêm** | **~708 LoC** | ~3.000 P0-Core slice (Phase 2) |

## 4. Chưa làm (để Phase 3+)

- UI render streak/companion/claim (sẽ làm ở STEP 2 UX/UI)
- Map/GeoEngine + TileStreamer nâng cấp (P0-Map), RegionRegistry
- Atmosphere/WeatherCache (P0-Atmosphere)
- 3D/Optional layer polish + Quest list UI
- Migration v3 → 4 (nếu contract thêm field sau này)

## 5. Luật bất biến mới áp dụng

- `SavePushRequest.save` phải `z.unknown()` — **không** validate literal trong route. Mọi validation ở `migrateSave`.
- `StreakStateSchema.count` tăng dần (không cap ở 7). Milestone ở multiple-of-7.
- Companion **không** bao giờ dưới 5 (RP-03 — needs never kill).
- Claim streak idempotent per ICT day — `same-day` no-op.
- Migration `v2 → v3` phải tick `CompanionStateSchema` nullable; `streak` chỉ có freeze của Pro (free luôn 0).
