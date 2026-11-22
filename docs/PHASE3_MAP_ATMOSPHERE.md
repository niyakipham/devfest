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
