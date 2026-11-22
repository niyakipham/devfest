# PHASE 3 — Core Engine P0 Map/Weather (vẫn STEP 1)

> Ngày: 2026-11-22 · Nhánh: `arena/81638032-devfest`
> Blueprint: `docs/MASTER_PROMPT_HANOI_DAY_60K.md` mục 2.2 (Map/Geo · Atmosphere)

## 1. Đã làm

| # | Hạng mục | Số dòng | Nội dung |
|---|---|---|---|
| 1 | **`world/scale.ts`** | 123 | Scale contract: 5 reference legs (Hồ Gươm → Nhà thờ Lớn / Nhà hát Lớn / Cầu Long Biên / Văn Miếu / Lăng Bác), đường đo bằng tọa độ thực, tolerance band 0.5×–4× (cho Phase 1), `formatScaleReport` cho CI. Test: every leg measured, band check, out-of-band flag, purity |
| 2 | **`shared/route.ts`** | 113 | Honest 2D route engine: `findRoute` (straight line + nearest street nearest-street distance), `distanceToStreet` (perpendicular segment distance), `walkSeconds`/`walkInGameMinutes` (1 s = 1 min in-game). **Không A\*** — nav-graph đến Phase 5 (OSM pipeline). Test: 9 tests |
| 3 | **`shared/weather.ts`** | 158 | Deterministic offline weather simulation: 4 seasons × 12 conditions, seeded per `(date, hour)`, `blocksQuest(condition, category)`, `WeatherCache` TTL. Test: 10 tests (determinism, season ranges, photo/sunrise blocked in rain, cache TTL/clear) |
| 4 | **`world/registry.ts`** | 173 | Region registry DERIVED from actual data: 12 districts, street/POI/landmark/quest-giver counts, phase-1 playable flag, `isPhase1Complete` + `PHASE1_SUMMARY` (honest report, no hardcoding). Test: 7 tests |
| 5 | **grid.ts** | +1 | `DistrictRect` export → dùng cho registry |

## 2. Chất lượng

- `tsc --noEmit` xanh
- `vitest run` — **270/270 pass** (từ 239 baseline, +31: 5 scale + 9 route + 10 weather + 7 registry)
- `npm run gate` vẫn xanh

## 3. Ngân sách LoC (Phase 3 slice)

| Khu vực | LoC thật |
|---|---|
| `src/world/scale.ts` | 123 |
| `src/shared/route.ts` | 113 |
| `src/shared/weather.ts` | 158 |
| `src/world/registry.ts` | 173 |
| **Tổng cộng thêm** | **~567 LoC** |

## 4. Design decisions & bất biến

- **Scale contract báo cáo, không ép**: Phase 1 world nén khoảng cách 2–3× (đúng bản phác thảo stylized). Test chỉ fail khi vượt band 4×. Khi OSM pipeline Phase 5 đổi tọa độ, `formatScaleReport` là báo cáo sai phạm đầu tiên.
- **Route không phải A\* (tạm thời)**: streets polyline bị rời rạc (mỗi phố là strip riêng, không chung vertices). Honest route = straight line + nearest street id (`Hàng Đường`) + estimate time. A\* nav-graph khi Phase 5.
- **Weather deterministic**: cùng (date, hour) → cùng snapshot; không roll, không gọi API. Seed từ `hash(YYYY-MM-DD|hour)`.
- **Registry là derived, không hardcode**: số liệu street/POI/landmark mỗi quận là tính từ dữ liệu thực. Muốn quận "lạ" cho registry → bắn honest empty entry (không throw).
- Cuối cùng: `districtRegistry('NOT_A_DISTRICT')` trả về entry rỗng an toàn — UI không bao giờ crash.

## 5. Chưa làm (Phase 4+)

- `MapEngine` spatial queries đầy đủ (`GeoHash` ring + vector streaming)
- Atmosphere 3D/sound hooks (scene/atmosphere)
- OSM pipeline (Phase 5 — export tile JSON + attribution)
- UI/UX STEP 2 (20 màn hình S01–S20)

---

# PHASE 4 — Quest State Machine + Voucher Engine (STEP 1)

> Ngày: 2026-11-22 · Nhánh: `arena/81638032-devfest`

## 1. Đã làm

| # | Hạng mục | Số dòng | Nội dung |
|---|---|---|---|
| 1 | **`shared/quest-machine.ts`** | 150 | Pure machine: LOCKED → AVAILABLE → ACTIVE → COMPLETE → CLAIMED / FAILED. Add-minutes tick injection, `applyObjective` (only ACTIVE, clamped 0..1), `completeQuest` requires every objective at 1.0, `canClaimQuest(record, now)` combining machine + expiry check. Every transition `{record, replayed}`, idempotent, throws `QuestMachineError` with explicit `code` (NO_TRANSITION / BAD_STATE / EXPIRED / NOT_COMPLETE / ALREADY_CLAIMED) |
| 2 | **`shared/voucher.ts`** | 140 | Pure voucher engine: `issueVoucher` (validity clamped 1–365d, default 14d; code upper-cased) → `claimVoucher` (idempotent; expired returns expired record + reason rather than throwing) → `redeemVoucher` (only from claimed). `computePartnerPayout(vouchers, marginBps=500)` — percent → discountValue×50 nominal; `dailyCapRemaining` Free=3/Pro=6. Never debits the wallet — status move only; money never landed, vouchers are redeemable marks at partners |
| 3 | **`server/services/quests.ts`** | 120 | `QuestServiceImpl`: QUEST_REWARDS table (q-pho {0đ, 45xp}, q-photo {120đ, 60xp}, q-pho-thap {40đ, 60xp, voucher 10%/14d}). claim with `claimBudget` per ICT day (Free=3/Pro=6 from `@shared/quest-engine`). `claim()` grants dong only via ledger `.grant(userId, dong, reason, idempotencyKey)` — never debits |
| 4 | **`server/services/vouchers.ts`** | 60 | List/Claim/Replay ledger-side; `claim()` re-checks budget and issuance vouchers; idempotent; no wallet debit |
| 5 | **`server/repo/memory.ts`** | +14 | `quests`, `vouchers`, `questClaimsToday` maps + `questKey`/`voucherKey`/`claimKey` helpers |
| 6 | **`shared/contracts/index.ts`** | +30 | zod: `QuestStartRequest` (questId + optional expiry), `QuestClaimRequest` (questId), `QuestCompleteRequest`, `VoucherClaimRequest`. SAVE_VERSION unchanged (3) |
| 7 | **`server/app.ts`** | +74 | 7 new endpoints: POST `/api/quests/:id/start`, `/complete`, `/claim`; GET `/api/quests/:id`; GET `/api/vouchers`; POST `/api/vouchers/:id/claim`. Errors → 400/404/410/429 with `{code}` |
| 8 | **Tests** | +32 | quest-machine 15, voucher 11, quests-server 7 (HTTP happy paths, expiry, claim guards, voucher award flow) |

## 2. Chất lượng

- `vitest run` — **303/303** (từ 270 baseline, +33: 15 quest-machine + 11 voucher + 7 quests-server)
- `npm run gate` — lint + tsc + tokens + contrast + schema + verify:world + 303/303 vitest

## 3. Quyết định / anti-cheat

- **Never debit wallet** — voucher claim is status-move only; partner payout is a pure `(vouchers, marginBps) → netPayout` computation. Never grant "cash" — money stays in the ledger; vouchers are state, not spendable currency.
- **Idempotent claims** — quest `claim()` grants dong via ledger grant with `idempotencyKey = quest-${id}-${userId}`; double-claim → ledger replay → reward `.replayed = true`, `rewards.dong = 0` (claimed record still returned).
- **Expiry is lazy** — `expireQuest` is called inside `claim` before decision; an expired quest can't bridge → claimed.
- **Vertical slice** — HTTP layer returns plain records, no client-side computation of reward amounts.
- **Server-side reward table** — q-* reward policy lives in `services/quests.ts`, not in client — so changing numbers never requires app-update ship.

## 4. Deferred (post-Phase 4)

- Quest CREATION endpoint (client-authored quests / creator mode) — needs auth/identity context.
- Partner partner-side claim/redeem flows — needs partner portal (Phase 8).
- Quest giver ↔ distribution rules (50% / 40% / 10%) — distribution logic not wired this phase (the voucher engine documents payout honestly; live partner billing is roadmap).
- Multi-objective persistence across session — current implementation stores the full record (LOCKED→CLAIMED) in MemoryStore, not Postgres. DB persistence deferred to Phase 6 (G5).
- Real partner payout settlement — mocked in `computePartnerPayout` — honest labels, NOT actually wired to bank/payment gateway.
