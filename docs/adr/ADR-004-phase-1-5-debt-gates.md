# ADR-004 — Trả nợ Phase 1.5: biến mọi "nguyên tắc trong đầu" thành cổng CI

- **Ngày:** 2026-11-21
- **Trạng thái:** Accepted
- **Bối cảnh:** Phase 1 đạt 6.111 LoC và chơi được, nhưng blueprint §2.13 ghi rõ Phase 1.5 phải *trả nợ*
  trước khi mở Phase 2. Audit phát hiện 6 lỗi mà **không cổng nào bắt được**, vì tất cả đều "đúng kiểu
  code" mà "sai kiểu sản phẩm":

  | Mã | Lỗi | Vì sao typechecker/unit test bỏ qua |
  |---|---|---|
  | F4a | `POST /api/shop/purchase` tin `price` do client gửi → áo dài 480đ mua bằng 1đ | request vẫn hợp lệ về kiểu |
  | F4b | `earnedToday` không reset khi sang ngày → mọi phần thưởng từ ngày 2 bị cắt còn 20% | state vẫn "hợp lệ" |
  | F8 | Không có ErrorBoundary, không fallback WebGL, không `<noscript>` → trang trắng | chỉ xảy ra lúc runtime |
  | F8b | 1 chunk 1,07 MB, scene không lazy-load, `@react-three/drei` không dùng ở đâu | build vẫn thành công |
  | F9 | Chữ trắng trên nền xanh 2,33:1; caption 3,65:1; chỉ 2/21 nút có focus ring | CSS không có kiểu |
  | F10 | 3 hệ token song song + 27 hex viết cứng trong component | không ai import sai |
  | F12 | `prisma validate` không chạy được: `CharacterSkill` không tồn tại | schema không thuộc tsconfig |

## Quyết định

1. **Bảy cổng, một lệnh.** `npm run gate` chạy `lint → tsc → tokens → contrast → schema → verify:world → test`.
   Không cổng nào là "kiểm tra thủ công"; mỗi cổng phải **đỏ được** (đã thử bằng cách cố tình vi phạm).
   `.github/workflows/gate.yml` chạy đúng bảy bước đó trên mọi push.

2. **Một nguồn palette, hai đích.** `src/game/ui/styles.css` `:root` là nguồn duy nhất cho màu UI;
   `src/world/palette.ts` là nguồn duy nhất cho màu 3D. Không hex nào được sống ngoài hai file đó.
   `scripts/check-tokens.ts` xoá luôn phương án nếu ai đó dựng lại `designTokens.ts` / `global.css`.

3. **Contrast là số, không phải cảm tính.** `scripts/check-contrast.ts` đo 19 cặp, gồm **worst case**
   (kính trắng đục đặt trên cỏ `#A6D344`, nước `#17B8D9`, cát `#E5E5BD`). Nút primary đổi sang chữ
   `--c-on-primary` `#08221A` trên gradient `#6BDD74 → #3FC24B → #2A9A37` (9,74 / 7,20 / 4,61:1) thay cho
   chữ trắng 2,33:1.

4. **Giá do server quyết.** `src/shared/catalog.ts` là bảng giá duy nhất; `POST /api/shop/purchase` chỉ nhận
   `sku` + `idempotencyKey` (≥ 8 ký tự) và **bỏ qua** `price` trong body. SKU lạ → 404, không fallback.
   Client đọc `GET /api/shop/catalog` để hiển thị giá.

5. **Prisma schema viết lại theo scope fence.** Bỏ 13 model/enum của prototype monster-collector
   (gacha, companion, battle pass). Schema mới 22 model, mọi quan hệ hai chiều, có `LedgerEntry` idempotent.
   `scripts/check-schema.ts` kiểm tra offline để không cần tải query engine.

6. **Bundle cắt theo tầng vẽ.** `three` (799 kB) lazy-load; shell + HUD + React (250 kB) vẽ trước.
   `@react-three/drei` bị gỡ vì không có import nào — 44 package thừa.

7. **`src/legacy/` bị xoá khỏi `main`** (34 file, 388 KB). Lịch sử vẫn còn ở commit `a412d0e` nếu cần tra.

## Hệ quả

- Thêm file mới vào `src/` mà quên token → `npm test` đỏ ở `design-gates.test.ts`.
- Thêm bảng gacha vào Prisma → `npm run schema` đỏ kèm thông điệp scope fence.
- Đổi `--c-primary` mà quên kiểm contrast → `npm run contrast` đỏ trước khi build.
- Đổi luật kiến trúc: sửa `.eslintrc.cjs`, không sửa code cho vừa cổng.

## Số đo sau Phase 1.5

| Chỉ số | Trước | Sau |
|---|---|---|
| Test | 56 | **84** |
| Cổng CI | 0 | **7** |
| Token chết | 36 (+2 file palette thừa) | **0** |
| Hex ngoài palette | 27 trong CSS + 60 trong scene | **0** |
| Cặp contrast dưới AA | 3 (2,33 / 3,65 / 2,9:1) | **0** |
| Chunk lớn nhất | 1.068 kB | **799 kB (lazy)**, shell 104 kB |
| Dependency thừa | `@react-three/drei` + 43 gói | **0** |
| Model Prisma | 37, không validate được | **22, validate offline** |
