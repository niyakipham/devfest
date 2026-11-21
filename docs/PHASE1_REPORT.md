# PHASE 1 — Báo cáo bàn giao (STEP 1: Functional / Logic)

> Ngày: 2026-11-21 · Nhánh: `arena/3035de17-devfest`
> Blueprint tham chiếu: [`MASTER_PROMPT_HANOI_60K.md`](./MASTER_PROMPT_HANOI_60K.md)

## 1. Đã làm gì trong lượt này

| # | Việc | Kết quả |
|---|---|---|
| 1 | **Sửa nền tảng build đang đỏ** | Repo trước đó `tsc` fail 20+ lỗi (import sai path, thiếu `@types/react-dom`, biến thừa). Đã archive code cũ sang `src/legacy/` (loại khỏi `tsconfig`) → build xanh |
| 2 | World 20 km² | Lưới 5 000 × 4 000 m, 320 tile 250 m, 29 tuyến phố, 12 di tích, 709 nhà ống (instanced), 121 cây, spawn an toàn tự động |
| 3 | Cổng chống “thế giới rỗng” | 311 POI, trung vị 24 m, max 44 m; validator + script CI `verify:world` |
| 4 | Streaming & đi lại | `TileStreamer` (ring 5×5, budget, hysteresis, event) + collision OBB dùng chung cho renderer và test |
| 5 | Core loop & RP | 6 persona, needs, đồng hồ 24 phút/ngày, 4 mùa, tiền Đồng, XP nghề, danh tiếng |
| 6 | Quest & dialogue | 2 quest nối tiếp, dialogue phân nhánh, phần thưởng + 2 mảnh ký ức |
| 7 | UI/UX theo ảnh | Design system Cozy Storybook + 7 màn hình (Title, Creator, HUD, Dialogue, Journal, Pause, Toasts) |
| 8 | Save | Schema zod v1, offline localStorage, autosave, từ chối save hỏng/version lạ |
| 9 | API | Auth JWT/bcrypt, save 3 slot, world tile/POI, wallet double-entry idempotent, rate limit |
| 10 | Chất lượng | 54 test pass, typecheck sạch, bundle 294 kB gzip |

## 2. Ngân sách LoC (Phase 1: 9 000)

| Khu vực | LoC | Ghi chú |
|---|---|---|
| `src/shared` (contracts + formulas) | 864 | dùng chung client/server |
| `src/world` (grid, data, density, streamer, collision) | 985 | thuần logic, test được |
| `src/game` (scene, ui, store, save) | 3 012 | gồm 1 180 dòng CSS design system |
| `src/server` (app, services, repo) | 502 | tách `createApp()` để test |
| `scripts/verify-world.ts` | 32 | cổng CI |
| **Tổng code production** | **5 395 / 9 000 (60 %)** | |
| `src/__tests__` | 682 | 54 test |

**Phần còn thiếu để đủ 9 000:** profession mini-game (nghề phở/bạc/xích lô), photo mode stub, settings/accessibility
screen, npc schedule 24h, âm thanh (Web Audio bus). Đây là các mục Phase 1 còn lại, không phải nợ kỹ thuật.

## 3. Cổng đã xanh

```
tsc --noEmit .............. OK (strict, src/legacy excluded)
vitest ................... 54/54 pass  (formulas, world, streamer, collision, save, server, UI)
verify:world ............. PASS  (311 POI · median 24 m · max 44 m / limit 150 m)
vite build ............... OK  (294 kB gzip / budget 2 500 kB)
```

Lệnh gộp: `npm run check`

## 4. Quyết định kiến trúc đáng chú ý

1. **Archive, không xoá**: code monster-collector cũ (gacha, lootbox) mâu thuẫn nguyên tắc chống lỗ F5.
   Giữ ở `src/legacy/` để tham chiếu, nhưng không nằm trong build, không nằm trong typecheck.
2. **Bản đồ là dữ liệu, không phải scene**: POI/nhà/cây sinh từ street graph → cùng một nguồn cho
   client, server (`/api/world/*`) và validator CI. Không có “bản đồ viết tay” thứ hai để lệch.
3. **Tiền tệ double-entry ngay từ Phase 1**: dù UI shop chưa có, ledger đã bắt buộc tổng giao dịch = 0 và
   idempotency key — để Phase 4 không phải viết lại.
4. **Save là hợp đồng**: `SaveGameV1` zod schema dùng cho cả localStorage và API; save version lạ bị từ chối
   thay vì crash.
5. **Render budget**: 709 nhà + 121 cây + 40 dân + 26 đèn + 16 ghế đều instanced → khoảng 60 draw call tĩnh.

## 5. Rủi ro còn mở

| Rủi ro | Trạng thái | Kế hoạch |
|---|---|---|
| Chưa verify bằng mắt trên GPU thật (sandbox không có WebGL) | ⚠️ | UI đã test bằng jsdom; scene cần mở preview trên máy thật |
| Bản đồ stylised, chưa dùng OSM thật | Chấp nhận Phase 1 | Phase 5: pipeline Overpass + attribution ODbL |
| Chưa có âm thanh | Chưa làm | Phase 2: Web Audio bus (ambience theo quận + giờ) |
| Chỉ 1 vùng (Hoàn Kiếm) playable | Đúng roadmap | Phase 5 mở 12 quận |
| Chưa có economy UI / thanh toán | Chưa làm | Phase 4 (VNPay/MoMo/ZaloPay, VAT 10 %) |

## 6. Việc tiếp theo (đề xuất thứ tự)

1. Mở preview, chỉnh cảm giác camera/tốc độ đi bộ theo phản hồi thực tế.
2. Phase 2: nghề phở + mini-game timing, NPC schedule 24h, âm thanh ambience.
3. Phase 3: mở rộng dialogue graph + 15 quest.
4. Phase 4: nối `Wallet` UI vào ledger đã có, thêm Prisma repository thay memory store.
