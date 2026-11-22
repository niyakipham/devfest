# SYSTEM PROMPT: ARCHITECTURE & UX/UI BLUEPRINT (60,000 LoC)

> **MÃ DỰ ÁN:** `hanoi-day` — *"HanoiDay — Game hóa chuyến khám phá Hà Nội trên Web"*
> **LOẠI:** Web-first game-like exploration platform (PWA) · 20 km² · Vietnamese-first · 1 người chơi + hộ gia đình/nhóm bạn (social nhẹ)
> **NGÔN NGỮ THI HÀNH:** TypeScript (strict) · React 18 + Vite 5 · Three.js/R3F cho 3D optional layer · Zustand · Express · zod · Prisma / PostgreSQL · CDN static assets
> **BASELINE HIỆN CÓ (đo):** repo `/home/user/devfest` (Hanoi Legends Phase 1) — ~6.111 LoC production · 701 LoC test (56 test xanh) · bundle 297,58 kB gzip · cổng `verify:world` chỉ phủ 22/320 tile · Prisma schema cũ có 7 model gacha/companion đã archive · `lint` từng exit 2. Master prompt này **mở rộng, không viết lại**.
> **CÁCH DÙNG:** Copy toàn bộ tài liệu này làm System Prompt. AI **chỉ thực thi STEP 1 trước**, dừng lại xin duyệt, rồi mới sang STEP 2.

---

## 1. ĐỊNH DANH DỰ ÁN & CHIẾN LƯỢC CHỐNG LỖ (ANTI-FAILURE)

### 1.1 Product Thesis (một câu, không được viết lại)

> Một nền tảng web **cozy, game hóa, dành cho Hà Nội** — nơi người dân địa phương, du khách, và creator đi bộ phố cổ, hồ, di tích như chơi một trò chơi nhập vai: **đi ra đường, gặp NPC có thật, hoàn thành nhiệm vụ ngắn đúng 1 khu phố, chụp ảnh, nhận "mảnh ký ức", voucher cho quán local — rồi quay lại lần sau**.

**Moat của `HanoiDay` không phải đồ hoạ AAA, không phải 20 km².** Moat là: **độ chân thực văn hoá Hà Nội + cảm giác "ra đường, có việc để làm" + phễu giữ chân qua micro-quest hàng ngày**. Nếu mất 3 thứ này, dự án chết dù code chạy.

### 1.2 Định danh dự án (Chuẩn hoá từ USER)

| Trụ cột | Nội dung |
|---|---|
| **Tên dự án** | **HanoiDay** — *một ngày khám phá Hà Nội*. Tên gói gọn một lần trải nghiệm, gợi nhớ cảm giác "đi chơi Hà Nội" mà người dùng thật muốn |
| **Dành cho ai (Target Audience)** | (1) Người dân Hà Nội & người trẻ Gen Z (18–35) — dùng hằng ngày để quay lại HN nhiều hơn sau mỗi chuyến đi; (2) Du khách & travel creator quốc tế, expat, sinh viên đổi thực tập (25–40) — muốn "đi có mục đích" thay vì "đi xem ảnh"; (3) Người yêu văn hoá, thích nghề, thích khám phá không gacha |
| **Hành vi** | Mobile-first (85%+ truy cập trên mobile), dùng map + social share, chụp ảnh chia sẻ, đọc tin ngắn, không chờ load > 3 s |
| **Vấn đề cụ thể (Pain Point — từ USER)** | **Chưa có game Việt Nam nào là khám phá Hà Nội.** Hiện người dân & du khách đến Hà Nội chỉ là "đi bộ rời rạc" — lỡ mất phố, hỡ mất món ăn, hỡ mất doanh nghiệp địa phương; không có lý do quay lại vào hôm sau; không có "phễu" từ trải nghiệm đi chơi sang giữ chân sống dài |
| **Giải pháp (Core Solution)** | **Game hóa chuyến khám phá Hà Nội trên Web**: bản đồ tương tác 20 km² + nhiệm vụ theo khu phố (sáng — "Một bát phở", chiều — "Khoảnh khắc Hồ Gươm", tối — "Đi bar nghe nhạc") + companion animal + badge / streak + voucher quán local + social share = "đi bộ 1 buổi tối, hiểu 1 khu phố, quay lại 1 tuần sau" |

### 1.3 Chiến lược chống lỗ — "Tư duy ngược"

**Giả định: nếu 60,000 dòng code này thất bại, nguyên nhân là gì?**

| # | Kịch bản thất bại | Luật bất biến áp vào code/quy trình |
|---|---|---|
| **L1** | **60k LoC nhưng 80% không dùng** — team viết feature rỗng, feature "đủ" mà không ai cần | **Scope Fence**: 25% năng lực ban đầu chỉ nhắm **P0 Core** (map + quest + companion + 1 baseline economy). Mỗi phase trễ > 4 tuần ⇒ feature phải ra `legacy` hoặc loại. **Content gate**: mỗi km² ≥ 90 phút internal unique content (dialogue/quest/POI action), thiếu thì CI đỏ |
| **L2** | **Chi phí vận hành cao** — server tick/physics đồng bộ vị trí liên mạch | **Client-authoritative cho thế giới**, **server-authoritative cho tiền**. Static tile + CDN; server **không** tick physics, chỉ 4 Hz presence sau 32 CCU. Ngân sách ≤ **$0.004 / CCU / giờ** |
| **L3** | **Không có phễu thu tiền** — 0% monetization, D7 chết | **Phễu 3 tầng**: (1) Free = daily quest + companion + shareable result — hoàn toàn "giá trị thật"; (2) Premium `HanoiDay Pro` = streak freeze + unlimited vouchers + daily photo mode (9,99 USD/tháng); (3) **Partner funnel**: quán local nhận voucher theo lượt hoàn thành quest tại đúng địa điểm (3–8% margin). **KHÔNG lootbox, KHÔNG gacha, KHÔNG pay-to-win** — premium chỉ bán *cảm xúc & lựa chọn*, không sức mạnh |
| **L4** | **10 phút đầu tệ → D1 sập** | "90-second hook": vào app ≤ 8 s (không logo wall), **có điều khiển trong 20 s**, **quest đầu trong 60 s**, **cảm xúc đầu tiên ≤ 5 phút**. Không tutorial dài, không popup chặn |
| **L5** | **UX quá rối — người dùng bỏ cuộc** | **Anti-Churn UX Rules** (mục 1.4) — 15 quy tắc bắt buộc, kiểm tra auto bởi test + CI |
| **L6** | **Vi phạm pháp lý VN / pháp lý dữ liệu** | NĐ 356/2025 (đăng ký tài khoản yêu cầu họ tên + ngày sinh + SĐT VN), dưới 16 tuổi do giám hộ đăng ký, giới hạn giờ chơi cho người dưới 18, OSM attribution ODbL, VAT 10% cho hoá đơn, consent cho GPS, không bán PII |
| **L7** | **"Hanoi" nhưng sáo rỗng, sai văn hoá** | **Content Bible** bắt buộc: 36 phố – 36 nghề; mỗi phố phải có nghề + 1 thoại + 1 âm thanh + 1 biểu tượng ẩm thực. **Văn hoá review** trước khi merge nội dung. Không lấy "Hà Nội" = "phở + Hồ Gươm" làm toàn bộ — có thêm nghệ thuật, chợ đêm, làng nghề, lễ hội |
| **L8** | **Perf chết trên máy phổ thông** | Budget cứng: 60 FPS @ GTX 1050 / M1 / Chrome; ≤ 220 draw call; ≤ 2.5 MB gzip initial; LCP < 2.5 s. **3D là optional layer** (yêu cầu WebGL + GPU → tắt, UI vẫn hoạt động). **CI perf gate** fail nếu bundle > ngân sách |
| **L9** | **Nội dung hết sau 3 ngày** | **Nội dung là hệ thống**: quest theo lịch thật (lễ hội, hè, 7/30/4/4), companion hatch/care theo ngày, "Pieces" sưu tầm, photo challenge hằng ngày, seasonal badges |
| **L10** | **Cộng đồng độc hại / bot / cheat** | Chat rate-limit + filter + report; tài sản server-authoritative + ledger double-entry; **anti-cheat** phát hiện teleport/speed; RBAC 6 role; audit log mọi hành động admin; economic abuse detection |
| **L11** | **Trôi dạt thiết kế** — 3 hệ token song song, mọi CSS hard-code hex | **Một** nguồn token duy nhất (`designTokens.ts` + CSS custom properties). CI cấm mã hex/rgba trong component CSS. **Mọi token** đi qua `npm run tokens` (checker trước CI) |
| **L12** | **Không có CI / lint là kịch** | `lint` chạy thực, **CI bắt buộc**: lint + tsc + test + design-gates + perf + verify:world + LoC budget. Tối thiểu ≥ 5% LoC chết/phase phải bị xoá ("xoá là tính năng") |

### 1.4 Anti-Churn UX Rules — "Luật sống còn"

Không chỉ thiết kế UX: **mọi UX rời bỏ phải chết vì vi phạm quy tắc nào, test nào**.

| # | Quy tắc | Giữ gì | Kiểm tra |
|---|---|---|---|
| A1 | **3-Click Rule**: mọi tác vụ chính (mở app → tìm quest → xem hướng dẫn → hoàn thành) trong **tối đa 3 thao tác** | Giúp UX lo âu | Test: `user-journey` E2E đo số click từ cold-start tới quest hoàn thành |
| A2 | **One-screen hierarchy**: 1 màn hình = 1 mục tiêu chính, ≤ 3 nút chính, ≤ 2 sheet trôi | Tránh "mớ hỗn độn" | Review + snapshot test: mỗi màn chỉ có 1 primary CTA |
| A3 | **First-screen = hero quest**: banner quest nổi bật đầu tiên trên Home, kể từ giây thứ 3 | Giữ chân ngay lúc mở app | Snapshot test + Sentry banner impression |
| A4 | **Streak = cảm xúc gắn kết**: 7-day streak có badge + 1 "freeze"; day-7 có "reward lớn" | D7 retention | Unit test streak logic + A/B |
| A5 | **Companion = friend**: status hiển thị trên Home (sleep → lời nhắc gently); chăm sóc → companion XP | Emotional anchor | UI snapshot + e2e |
| A6 | **Push cadence ≤ 3/day**, context-aware (gần spot, màn chờ) | Tránh spam | E2E: push ≤ 3/ngày/session |
| A7 | **Sol share = 1-tap**: kết quả quest có 1-tap share (FB/TikTok/Zalo/X) | Social distribution | Snapshot + server-side count ab |
| A8 | **Voucher counter = nút "nhận" ngay trên result card**: không để user phải đi lại 1 màn nữa | Chuyển đổi / retention | Unit test: 1 quest hoàn thành → 1 voucher |
| A9 | **Offline-first PWA**: map + quest + companion cache offline; sync khi online | Không sợ mất kết nối | E2E offline test |
| A10 | **Không paywall trong 3 ngày đầu**: free tier luôn ≥ 3 quest/ngày có reward thật | D1 | A/B cohort |
| A11 | **Day-3 hook + Day-7 reset**: ngày 3 có 1 quest cực-ngớ ngẩn-gần, ngày 7 có voucher lớn | D7/D30 | Unit test |
| A12 | **Accessibility AA**: contrast ≥ 4.5:1; 44px hit; focus ring 3px; aria-label cho mọi icon; safe-area | Mọi người dùng dùng được | `check-contrast.ts` + `check-tokens.ts` CI gate |
| A13 | **Không dark patterns**: không spinner fake, không button giả, không skip popup, không countdown giả | Trust | Code review + lint rule |
| A14 | **Localisation không bị "hàn the"**: VN-first; EN + FR + ja + ta sau (EN là fallback) | Giữ được du khách | `i18n` completeness gate |
| A15 | **Performance aware**: map tiles lazy, lazy-loading, code-split 3D layer | Chạy mượt | `verify:world` + bundle gate |

### 1.5 Scope Fence

| MVP (Phase 1–4) | V1.1 (Phase 5–6) | **NEVER** |
|---|---|---|
| 1 quận lõi Hoàn Kiếm (3.2 km²) + 3 nghề + 25 quest + 40 NPC | Mở rộng 20 km² (12 quận), 6 nghề + 60 quest + 120 NPC + mùa lễ hội + social hub + Season Journal | Lootbox / gacha / pay-to-win / PvP combat / voice chat / NFT / crypto / mobile native app / 4K textures |
| Server: auth + save + economy + voucher partner | Realtime co-presence 32 CCU + photo feed | Server-side physics tick |

### 1.6 KPI sống–chết

| # | Chỉ số | Ngưỡng sống | Ngưỡng chết |
|---|---|---|---|
| 1 | Time-to-first-control | ≤ 20 s | > 45 s |
| 2 | D1 / D7 / D30 | 35% / 15% / 6% | < 20% / < 8% / < 2% |
| 3 | Session length | 18–28 phút | < 6 phút |
| 4 | FPS p50 (thiết bị phổ thông) | ≥ 60 | < 40 |
| 5 | Crash-free session | ≥ 99.5% | < 98% |
| 6 | Conversion cosmetic-only | 3–5% | > 12% (sign of pay-to-win) |
| 7 | Cost/CCU/giờ | ≤ $0.004 | > $0.012 |
| 8 | Tile density CI gate | 100% pass | bất kỳ tile fail |
| 9 | 3-click journey success | ≥ 80% | < 60% |
| 10 | Free→Pro conversion | 3–8% | < 1.5% hoặc > 15% |

---

## 2. STEP 1 === { DESIGN CHỨC NĂNG TRƯỚC } (FUNCTIONAL ARCHITECTURE - 60K LoC)

> **THỰC THI:** Design & code **toàn bộ** luồng logic, kiến trúc, schema, API dưới đây **TRƯỚC**. **Chưa** vẽ UI đẹp, chưa làm animation — chỉ logic chạy được + test.

### 2.0 Ngân sách 60,000 LoC (bắt buộc — quá là fail)

| # | Phân hệ | Thư mục | LoC | % | Ghi chú |
|---|---|---|---|---|---|
| P0 | Core Engine | `src/core/**` | 16,000 | 26.7% | Map/Geo, tile, quest engine, companion engine, gamification, atmosphere |
| P1 | Client/User Portal | `src/client/**` | 22,000 | 36.7% | Onboarding, Home, Quests, Companion, Rewards, Social, Profile, Notifications, Settings |
| P2 | Admin/CMS | `src/admin/**` | 8,000 | 13.3% | Dashboard, Spots CMS, Quests CMS, Companions CMS, Localization, Reports |
| P3 | Billing/Monetization | `src/billing/**` | 4,000 | 6.7% | Plans/sub, VNPay/MoMo/ZaloPay, voucher engine, partner payouts, invoice/coupon |
| P4 | Security/RBAC | `src/server/services/auth/**`, `src/server/services/audit/**` | 3,000 | 5.0% | OTP, JWT, RBAC 6 role, rate limit, audit log, privacy consent, abuse |
| P5 | API/Webhooks | `src/server/**`, `src/shared/**` | 7,000 | 11.7% | REST + OpenAPI, JS SDK, webhooks, geocoding, OSM pipeline |
| | **TỔNG** | | **60,000** | 100% | |

**Luật ngân sách:** mỗi phase phải báo cáo `LoC_actual / LoC_budget`. Vượt > 10% → cắt feature, không cắt CI. Thiếu > 20% → không gọi là Done. **Test budget (ngoài 60k): ≥ 12.000 LoC test**; coverage `shared` + `server` + `billing` ≥ 75%.

### 2.1 Luật phụ thuộc (bọc bằng ESLint cứng)

```
shared/contracts  ←  core  ←  client  ←  game/ui        (1 chiều)
shared/contracts  ←  admin  ←  server/api               (1 chiều)
shared/contracts  ←  billing/server                     (1 chiều)
shared/contracts  ←  server/services                    (server chỉ import shared)
```

Không file > 350 LoC. Mọi feature sau `featureFlag`. Mỗi quyết định kiến trúc ghi `docs/adr/ADR-XXX.md`.

### 2.2 Core Engine Detail (16,000 LoC)

**P0-Map/Geo Engine (≈ 5,000 LoC)**
- `MapEngine`: spatial queries (lat/lng → tile → zone → district), `GeoHash`-index 5×5 ring, vector tile streaming
- `TileStreamer` (đã có): ring 5×5, budget 2 tile/frame, hysteresis, event load/unload
- `RegionRegistry`: 12 quận + 36 phố + 1 lõi Hoàn Kiếm 3,2 km²; mỗi region có `POISet` + `street set`
- `ScaleContract`: 1 hệ số tỉ lệ `COMPRESS = 1:3`; bảng khoảng cách chuẩn; test "đi bộ 5 phút từ Hồ Gươm tới Nhà thờ Lớn"
- `OSMPipeline`: Overpass query → filter tag → làm sạch topology → sinh tile JSON; attribution ODbL; kết quả commit dạng JSON (không query server theo bước chân)
- `RouteEngine`: đường đi (walk/bicycle/taxi) bằng A* trên nav graph; time + energy cost

**P0-Quest/Campaign Engine (≈ 3,000 LoC)**
- `QuestStateMachine`: `LOCKED → AVAILABLE → ACTIVE → COMPLETE → CLAIMED` (+ `FAILED` cho timed quest)
- `QuestEngine`: điều kiện (talk / visit / craft / photo / fetch / escort / minigame_score); reward (xp / points / voucher / piece / badge); time limit + replayability
- `DailyRoutine`: mỗi sáng 3 quest gợi ý theo quận user gần nhất
- `StreakTracker`: 7-day streak + 1 freeze/week; reset qua `rolloverDay()` duy nhất

**P0-Companion Engine (≈ 3,500 LoC)**
- `CompanionSpecies`: 4 loài / 4 quận (Linh Long Quý Hồ Gươm, Phượng Lan Hồ Tây, Mèo Ninh Khánh phố cổ, Cu Gốm làng nghề); sprite + audio + trait + behavior
- `CompanionTrait`: `level` (XP), `care level` (ăn/giờ giấc/health), `status` (sleep/play/hunt/work), `emotion` (happy/sad/bored)
- `CompanionCare`: 3 cử chỉ mỗi ngày (feed / groom / walk); care → companion XP; care thiếu → companion sad → gentle push notification
- `CompanionBond`: social - baby companion = content trigger UX hook (giữ chân)

**P0-Gamification Engine (≈ 2,500 LoC)**
- `XPSystem`: 3 trục không sức mạnh (tay nghề 1–20 / danh tiếng 5 phe −100…+100 / bộ sưu tập 480 Pieces)
- `BadgeSystem`: 36 phố-36 nghề là nguồn badge; 1 badge = 1 mảnh ký ức về quận
- `Leaderboard`: 4 bảng (global / district / weekly / neighbors); weekly reset = Sunday 00:00 ICT
- `Achievements`: 50 badge schema-versioned

**P0-Atmosphere/Narrative Engine (≈ 2,000 LoC)**
- `AtmosphereEngine`: 1 giây thực = 1 phút in-game (đã có); 4 mùa theo lịch thật (Tết âm lịch, mùa mưa, mùa hè, mùa thu); mưa/nồm/nắng gắt; đói/đông-mùa/mưa-bão affect quest
- `WeatherCache`: 24-hour weather cache (VN weather API) → quest + companion + sound change; EN localisation
- NPC skeleton schedule (chưa full Phase 1 — engineering skeleton)

### 2.3 Client/User Portal Detail (22,000 LoC)

**P1-Onboarding (≈ 3,000 LoC)**
- 3 bước ≤ 90 s: (1) Tên + avatar (theo gender preset + custom) → (2) Chọn quận Hà Nội gần nhất + companion (4 species) → (3) Quest đầu tiên ("Tối đa 3 bước tới 1 quest")
- `TodayCheck`: xác nhận "Lúc này khoảng X, bạn đang ở đâu?" — location prompt 1 lần; không spam
- Sau đó vào Home; Home có hero quest ngay

**P1-Home/Explore (≈ 6,000 LoC) — Core experience**
- `ExploreMapScreen`: full-screen map view (2D default, 3D optional); bottom-right companion card; top pill quest banner; left vertical icon rail
- `QuestBanner`: 1 quest gợi ý (quest của quận/user ban đầu); arrow → quest detail
- `CompanionCard`: avatar + status + energy bar (green) + 2 buffs; 1-tap care mini-action
- `BottomHUD`: 3 nút chính (Quest / Map / Rewards) ≤ 3; không sidebar
- `QuestQuickAction`: complete via quest result card

**P1-Quests (≈ 2,500 LoC)**
- `QuestListScreen`: filter by quận / difficulty / day; sort by deadline / XP; card + preview thumbnail
- `QuestDetailScreen`: objectives, reward preview, location marker, difficulty, time-left, 1-tap "Go" (opens route), 1-tap "Start" (save quest start)
- `QuestResultScreen`: shareable result card (1-tap share FB/TikTok/Zalo); voucher claim; companion care result

**P1-Companion (≈ 2,500 LoC)**
- `CompanionScreen`: avatar, status timeline, emotion, XP/level bar; care mini-game
- `CarePanel`: feed / groom / walk
- `CompanionGallery`: 4 loài + ảnh + history

**P1-Rewards/Wallet (≈ 3,000 LoC)**
- `WalletScreen`: balance (points / vouchers), daily progress bar, streak card, claim vouchers
- `VoucherListScreen`: filter by category / area; voucher detail + claim + show QR
- `RedemptionEngine` (server): voucher double-entry + idempotency

**P1-Social (≈ 2,000 LoC)**
- `SocialFeedScreen`: posts (photo + caption) 1 storyline, likes, comments, replies; creator badge; share-to-social
- `LeaderboardScreen`: 4 charts; weekly reset countdown; your rank highlight
- `NeighborsScreen`: 3 nearest explorers within 2 km (sharing marker radius)

**P1-Profile (≈ 1,500 LoC)**
- `ProfileScreen`: stats (quests completed, km traveled, companion level, badges, piece collection)
- `AchievementsScreen`: badge grid; locked/unlocked
- `HistoryScreen`: timeline

**P1-Notifications/Settings (≈ 2,000 LoC)**
- `NotificationCenterScreen`: daily push + in-app; suggestion to skip
- `SettingsScreen`: account, language (VN/EN), haptics, map style, accessibility, 3D mode toggle (auto/on/off), privacy consent, delete account

### 2.4 Admin/CMS Detail (8,000 LoC)

**P2-Dashboard (≈ 1,500 LoC)**
- KPI dashboard: DAU / WAU / MAU, retention D1/D7/D30, quest completion, companion care, partner voucher redemption rate
- Alerts: low density tile, balance anomaly, free→Pro conversion cliff

**P2-Spots CMS (≈ 2,500 LoC) — Spots Content**
- CRUD spot: name (vi/en), type (4 category: sightseeing / food / art / craft), lat/lng, address, ward/district, description (vi/en), cover image (upload), partner ref, hours, min distance (m), quest affinity
- Bulk import CSV/XLSX (validate → preview → commit)
- `CulturalChecklist`: mỗi spot phải có ≥ 1 nghề + 1 dish + 1 điêu khắc/bất động

**P2-Quests CMS (≈ 2,000 LoC) — Quest Content**
- CRUD quest: title, description, locale, category, difficulty, time limit, objective (talk/visit/craft/photo/fetch/escort), reward (xp/points/voucher/piece/badge), availability (districts + months), schedule (time-of-day)
- Preview before publish; A/B test framework

**P2-Companions/Events CMS (≈ 1,000 LoC)**
- Companion species config: sprite URL, trait, audio, level thresholds; event feed (seasonal quests / partner offers) 

**P2-Localization & Reports (≈ 1,000 LoC)**
- `i18n` management VN/EN; missing key gate
- `Reports`: DAU curve, cohort retention, maps heatmap; CSV export

### 2.5 Billing/Monetization Detail (4,000 LoC)

**P3-Plans/Subscriptions (≈ 1,000 LoC)**
- `Plans`: Free / Pro / Premium; Free: daily quests + companion + shareable result; Pro `HanoiDay Pro` 9,99 USD/tháng (unlimited vouchers, photo mode, streak freeze, ad-free); Premium `HanoiDay Day Pass` 29.000đ/ngày (for 1-day visitors, NO monthly required)
- `BillingService`: Stripe + VNPay + MoMo + ZaloPay (real-time reconcile) — VN-specific
- `InvoiceService`: VAT 10%, invoice number, receipt email

**P3-Voucher Engine (≈ 1,200 LoC)**
- `VoucherService`: create voucher (amount / discount); claim via quest result; redeem by partner proof (QR); double-entry; idempotency key; anti-abuse (max 3/ngày/user)
- `PartnerPayouts`: monthly payout for local businesses (margin 3–8%); report + invoice; KYC for partners

**P3-Coupons/Refunds (≈ 500 LoC)**
- Coupons: percentage off, amount off; expiry; usage cap; refund flow within 24h

**P3-Analytics (≈ 1,300 LoC)**
- `AnalyticsService`: DAU/WAU/MAU, free→Pro conversion, voucher redemption rate, partner payout; events pipeline (event → kafka-lite → dashboard)
- `PaywallTrigger`: paywall appears **ONLY** at delight moment (day 6-7 of streak / voucher at 7-day threshold) — không bao giờ trong 10 phút đầu

### 2.6 Security/RBAC Detail (3,000 LoC)

**P4-Auth (≈ 1,000 LoC)**
- Passwordless OTP (phone + email); JWT access (15 min) + refresh (7 days); password optional; 2FA optional
- **NĐ 356/2025**: registration требует họ tên + ngày sinh + SĐT VN; dưới 16 tuổi do giám hộ đăng ký; IP-age check for under-18

**P4-RBAC (≈ 500 LoC)**
- 6 roles: `user` / `creator` / `partner` / `editor` / `support` / `admin`
- Permission matrix in `shared/contracts`; middleware per role; admin UI hides by role

**P4-Rate Limit/Anti-abuse (≈ 500 LoC)**
- Rate limit per-route (login: 5/min; quests: 30/min; voucher claim: 10/day/user); geo-fence for non-Hanoi; fail-closed
- `TamperDetection`: voucher claim fast-loop / impossible route = block + audit

**P4-Audit & Privacy (≈ 1,000 LoC)**
- `AuditLogService`: every admin action, payment, voucher issue → immutable log (PII hashed)
- `PrivacyConsentService`: 3 consent types (GPS + marketing + analytics); NĐ 356/2025 compliance; data export + delete account
- `AbusePipeline`: blocks, reports, ban lists

### 2.7 API/Webhooks Detail (7,000 LoC)

**P5-REST API (≈ 2,500 LoC) — OpenAPI 3.0 spec**
- Endpoints (tối thiểu): `POST /auth/register` `/auth/otp/send` `/auth/otp/verify` `/auth/refresh` · `GET /spots?district=&type=&q=` · `POST /spots` `PATCH /spots/:id` `DELETE /spots/:id` · `GET /quests?district=&day=` · `POST /quests/:id/progress` · `GET /quests/:id/result` · `GET /companion/:id` `POST /companion/:id/care` · `GET /wallet` · `POST /vouchers/:id/claim` · `GET /social/feed` `POST /social/posts` · `GET /leaderboard?range=weekly` · `POST /payments/create-intent` `POST /payments/confirm` · `GET /admin/dashboard` `GET /admin/reports` `GET /admin/users/:id` — `GET /health`
- OpenAPI spec file: generated from `shared/contracts` (Zod → openapi); example requests in spec
- Idempotency-Key required on every money-mutating endpoint

**P5-JS SDK (≈ 1,500 LoC)**
- `@hanoi-day/sdk`: JS client with types + pagination + retries + offline-aware queue
- Browser / Node / React hooks; v0.1.0

**P5-Webhooks (≈ 1,500 LoC)**
- Events: `quest.completed` · `quest.claimed` · `voucher.issued` · `voucher.redeemed` · `partner.payout.created` · `companion.level.up`
- HMAC signature; retries 3×; dead-letter; UI webhooks page in Admin

**P5-OSM/Geocoding (≈ 500 LoC)**
- `geocode.ts`: Postal → lat/lng (VN-first: GOOGLE Places + OSM Nominatim fallback); reverse geocoding; result caching
- OSM attribution on map; show "© OpenStreetMap contributors"

**P5-Observability (≈ 500 LoC)**
- `/health` + `/ready`; Prometheus metrics; structured logs (JSON); CDN tile cache hit-rate

### 2.8 Database Schema (cốt lõi ~25 bảng)

```prisma
// AUTH / IDENTITY
users(id, phone, email, name, avatar_url, registered_at, locale, last_login_at)
profiles(user_id PK FK, xp_total, level, streak, last_check_in_date, ward, companion_species_id, bio)
ecosystem(user_id PK FK, points, streak_freeze_remaining, freeze_week)

// SPOTS / LOCATIONS
regions(id, code, name_vi, name_en, district_id, lat, lng, bbox)
districts(id, code, name_vi, name_en, bbox, center_lat, center_lng)
streets(id, name_vi, name_en, district_id, craft, image_url)
spots(id, name_vi, name_en, type, lat, lng, address, ward, district_id, street_id,
      description_vi, description_en, cover_image_url, partner_id, hours_json,
      min_distance_m, quest_affinity_json, is_verified, created_at, updated_at)

// QUESTS
quest_templates(id, slug, title_vi, title_en, description_vi, description_en,
                category, difficulty, time_limit_s, objective_json, reward_json,
                availability_json, is_active, created_at)
user_quests(user_id, quest_template_id, status, started_at, completed_at,
            claimed_at, payload_json, idempotency_key)
quest_progress(user_id, quest_template_id, objective_index, objective_state_json)

// COMPANIONS
companion_species(id, code, name_vi, name_en, sprite_url, trait_json, audio_url)
user_companions(user_id, species_id, level, care_level, status, emotion,
                last_care_at, created_at, updated_at)
companion_care_log(user_id, species_id, care_type, timestamp)

// PROGRESSION / GAMIFICATION
achievements(id, code, title_vi, title_en, badge_url, unlock_json, category)
user_achievements(user_id, achievement_id, unlocked_at)
leaderboard_snapshots(id, range, district_id, rank, user_id, score, created_at)

// REWARDS / WALLET
wallets(user_id PK FK, balance_points, vouchers_active, updated_at)
transactions(id, user_id, type, amount, reason, idempotency_key, created_at)
vouchers(id, code, partner_id, title_vi, title_en, discount_type, discount_value,
         valid_from, valid_to, is_active)
user_vouchers(user_id, voucher_id, status (claimed/redeemed), claimed_at, redeemed_at)

// PROFITABILITY / PARTNER
partner_businesses(id, name_vi, name_en, category, lat, lng, logo_url, contact_email,
                   status, reward_margin_bps, created_at)
payout_reports(id, partner_id, period, amount_vni, status, created_at)

// SOCIAL
posts(id, user_id, lat, lng, image_url, caption_vi, caption_en, created_at, likes_count)
post_likes(post_id, user_id, created_at)
follows(follower_id, followee_id, created_at)

// BILLING
plans(id, code, name_vi, name_en, price_cents, interval, entitlements_json)
subscriptions(user_id, plan_id, status, started_at, renews_at, canceled_at)
payments(id, user_id, order_id, gateway, status, amount_cents, currency, paid_at, provider_ref)
invoices(id, user_id, payment_id, vat_amount_cents, total_cents, issued_at)
coupons(id, code, discount_type, discount_value, max_uses, expires_at, is_active)
coupon_usages(coupon_id, user_id, created_at)

// ADMIN / REPORTS / FLAGS
admin_audit_log(id, actor_id, action, target_type, target_id, ip, created_at)
report_flags(id, user_id, kind, description, status, created_at)
localization_keys(key, locale, value, updated_at)
```

**Bảng schema phụ trợ:** `quest_templates.availability_json` cần `Json` field; `spots.quest_affinity_json` cần `Json`; cân nhắc `pg_trgm` index cho `spots.name` (search); `gin` index cho `quest_templates.title`.

### 2.9 API Endpoints (chi tiết tham chiếu /v1)

**User-facing (Public, JWT):**
| Method | Endpoint | Auth | Rate | Mục đích |
|---|---|---|---|---|
| POST | `/auth/register` | No | 5/min | Tạo tài khoản OTP |
| POST | `/auth/otp/send` | No | 5/min | Gửi OTP (phone/email) |
| POST | `/auth/otp/verify` | No | 5/min | Xác minh OTP |
| POST | `/auth/refresh` | No | 10/min | Refresh access token |
| GET | `/spots?type=&district=&q=&limit=` | JWT | 60/min | Tìm điểm đến |
| GET | `/spots/:id` | JWT | 60/min | Chi tiết điểm |
| GET | `/quests?district=&day=&difficulty=` | JWT | 60/min | Danh sách quest |
| GET | `/quests/:id` | JWT | 60/min | Chi tiết quest |
| POST | `/quests/:id/progress` | JWT | 30/min | Cập nhật tiến trình (idempotency) |
| POST | `/quests/:id/claim` | JWT | 10/min | Nhận phần thưởng → voucher + points + companion care |
| GET | `/companion` | JWT | 30/min | Companion hiện tại |
| POST | `/companion/care` | JWT | 10/day | Cử chỉ care (feed/groom/walk) |
| GET | `/wallet` | JWT | 30/min | Số dư & streak |
| GET | `/vouchers?status=` | JWT | 30/min | Voucher user |
| POST | `/vouchers/:id/claim` | JWT | 5/day | Nhận voucher (idempotency bắt buộc) |
| GET | `/wallet/transactions` | JWT | 30/min | Lịch sử giao dịch |
| GET | `/social/feed?limit=&cursor=` | JWT | 30/min | Feed |
| POST | `/social/posts` | JWT | 10/day | Đăng bài có ảnh |
| GET | `/leaderboard?range=weekly&district=` | JWT | 30/min | BXH |
| POST | `/payments/create-intent` | JWT | 5/min | Tạo thanh toán |
| POST | `/payments/confirm` | JWT | 5/min | Xác nhận thanh toán (idempotency) |
| GET | `/admin/dashboard` | JWT (editor+) | 30/min | KPI dashboard |
| GET | `/health` · `/ready` | No | - | Health |

**Admin (Editor +):**
| Method | Endpoint | Mục đích |
|---|---|---|
| POST/PATCH/DELETE | `/admin/spots/:id` | CRUD điểm |
| POST/PATCH/DELETE | `/admin/quests/:id` | CRUD quest |
| GET/POST | `/admin/users/:id` | Xem user (audit) |
| POST | `/admin/reports/export` | Tải CSV |
| GET/PATCH | `/admin/localization` | Quản lý khoá i18n |

**Webhooks (outbound):**
| Event | Payload | Retry |
|---|---|---|
| `quest.completed` | `{user_id, quest_id, completed_at, lat, lng}` | 3× backoff |
| `quest.claimed` | `{user_id, quest_id, reward_json}` | 3× backoff |
| `voucher.issued` | `{user_id, voucher_id, code}` | 3× |
| `voucher.redeemed` | `{user_id, voucher_id, partner_id, amount}` | 3× |
| `partner.payout.created` | `{partner_id, amount_vni, period}` | 3× |

### 2.10 Business Logic (core rules in code)

- **`DailyCapLogic`**: tối đa 3 voucher claim/user/ngày (premium = 6). Reset lúc 04:00 ICT (đêm trước) qua `rolloverDay()` duy nhất.
- **`StreakLogic`**: 7-day streak; day 1/7 = reset window; freeze 1 cái/tuần (Pro).
- **`VoucherLogic`**: claim = double-entry (debit wallet, credit partner_payout); prizes = partner reward margin 3–8%.
- **`XPLogic`**: 3 trục (Tay nghề 1–20 / Danh tiếng 5 phe −100…+100 / Pieces). Không có "level sức mạnh".
- **`CompanionCareLogic`**: needs monotonic decay (hunger, tiredness, mood); care resets; companion sad → push notification (≤ 3/ngày).
- **`WeatherQuestLogic`**: quest availability depends on weather (rain → hide "Фото Hồ Gươm"; sunny → "Photo at Sunrise").
- **`LeaderboardReset`**: weekly, ICT Sunday 00:00; snapshot rows to `leaderboard_snapshots`.
- **`PartnerPayoutLogic`**: monthly payout = sum(redeemed_vouchers × reward_margin); KYC trước; margin 3–8%.

### 2.11 Tone/style content (Content Bible)

- 36 phố – 36 nghề: mỗi phố có ≥ 1 nghề, 1 dish, 1 icon, 1 thoại riêng.
- Cultural check: 4 checklist review trước khi merge: (a) ngôn ngữ VN dấu chuẩn; (b) không nhắc thương hiệu cụ thuộc; (c) không stereotype; (d) lịch âm đúng (Tết âm 2026 = 17–19/02/2026).

---

## 3. STEP 2 === { DESIGN UX/UI SAU } (CHUẨN STYLE IMAGE & ĐÚNG Ý USER)

> **THỰC THI:** Sau khi STEP 1 hoàn thành và test xanh, mới bắt đầu STEP 2. **Không** được "vẽ trước" UI mà bỏ qua luồng + schema.

### 3.1 Visual Design Tokens (từ ảnh tham chiếu)

**Phong cách chủ đạo:** 3D stylized / storybook vibrant — tươi, ngập trời xanh, thế giới mở nhỏ gọn, render cartoon 3D mượt, HUD trắng- kính tròn góc lớn, mascot/companion dễ thương.

**Bảng màu (HEX):**

| Token | HEX / gradient | Dùng |
|---|---|---|
| `bg.sky` | `#7ED9E8 → #4BC6E8` (gradient) | Background Home/Explore, top-center pill, banner |
| `bg.grass.main` | `#7ED85C` | Surface grass cards, badge green |
| `bg.grass.deep` | `#4FA24A` | Secondary green, streak border |
| `bg.sand` | `#F4E4B0` | Onboarding step bg, path |
| `bg.water` | `#4BC6E8` → deep `#1FA8CE` | River/water elements, info |
| `bg.cliff` | `#6B7E72` | Sidebar edge, card shade |
| `bg.dark` | `#163A2C` | Primary pill (quest banner, companion card bg) |
| `card.surface` | `#FFFFFF` | Cards, modals |
| `card.tint` | `#EAF6E6` | Tinted background on detail screens |
| `accent.yellow` | `#F2B53A` | Yellow backpack-style CTA, badge, star |
| `accent.red` | `#E5484D` | Cap-style CTA, error, streak day-7 |
| `accent.pink` | `#FF7BAC` | Butterfly accent, badge rare |
| `accent.teal` | `#5ECDF5` | Companion accent |
| `accent.lavender` | `#C9B1F0` | Premium / streak list |
| `text.primary` | `#17211C` | Heading, primary body |
| `text.muted` | `#5B6B5F` | Caption, secondary |
| `text.onDark` | `#FFFFFF` | Text trên nền dark-forest |
| `success` | `#2FD6A0` | Voucher claim, complete |
| `warning` | `#FFC53D` | Day-7 banner, notification badge |
| `error` | `#F45252` | Voucher expired, error |

**Typography:**
- **Font:** `Nunito` (Rounded) fallback: `Quicksand`, `Baloo 2`, `Inter`; weights 400/600/700/800
- **Display:** 800, 22–32px, letter-spacing -0.02em, color `text.primary`
- **H1/H2:** 700, 18–24px, `text.primary`
- **Body:** 400/500, 14–16px, line-height 1.5, `text.primary`
- **Chip/label:** 700, uppercase, 11–12px, tracking 0.08em
- **Mono:** `JetBrains Mono` cho code/ID/transaction

**Effects & Effects:**
- **Border radius:** cards `28px`, pills `999px`, chips `16px`, inputs `14px`, images `18px`
- **Shadow:** `0 8px 24px rgba(22,58,44,0.18)` cho card nổi; `0 12px 32px rgba(22,58,44,0.28)` cho modal/CTA; focus ring `3px solid #5ECDF5`
- **Glass:** `rgba(255,255,255,0.78)` + `backdrop-filter: blur(16px)` cho HUD
- **Glow:** CTA yellow Glow `#F2B53A 40%` translate-y -2px + shadow

**Shadow/Motion:**
- 150ms ease-out hover-lift (y: -2px)
- 200ms enter/exit (fade + scale 0.97 → 1)
- `prefers-reduced-motion`: tất cả transition → instant

### 3.2 Cấu trúc & Luồng trải nghiệm (UX)

**Thiết bị mục tiêu:** Mobile-first PWA (375–430px). Responsive tới desktop ≥ 1024px (rail + map + bottom HUD). 3D mode is OPTIONAL — không bắt buộc WebGL.

**Layout mẫu (mobile):**
```
┌─────────────────────────────────────────┐
│       [Quest Banner - pill top-center]   │  (top-center, 1 CTA, 80% width)
├─────┬───────────────────────────────────┤
│     │                                    │
│ Rail│       MAP VIEW (full-bleed)        │
│(icon│       (2D default; 3D optional)    │
│ rail│       pan / zoom / marker)         │
│top) │                                    │
├─────┴───────┬───────────────────────────┤
│  Bottom HUD │  Companion Card (right)    │
│  (3 buttons)│  - avatar / status         │
│             │  - energy bar (green)      │
│             │  - 2 care mini-actions     │
└─────────────┴───────────────────────────┘
```

**Layout desktop (≥ 1024px):** Rail (left, 64px) + 3D map (center, 70% width) + Right sidebar (Companion card + active quest + streak). Bottom HUD đầy 4 buttons.

**Cấu trúc luồng trải nghiệm:**
1. **Splash** (≤ 8s) → **Onboarding** (≤ 90s) → **Home/Explore** (hero quest)
2. Home → tap quest banner → Quest detail (objectives + go)
3. Quest detail → tap "Go" → route nav (Map + breadcrumb)
4. Quest complete → Quest result card (share + voucher claim + companion care)
5. Quest result → tap "Back" → Home (streak +1, toast)
6. Home/companion tap → Companion/Rewards/Social/Profile (deep-link)
7. Settings/Notifications reachable từ rail (max 2 levels deep)

**Anti-Churn UX in UX:**
- **3-click Rule**: cold-start → first quest ≤ 3 thao tác
- **One primary CTA per screen**
- **Không paywall lần đầu**
- **Streak = sticky emotion** (never hide)
- **Companion = friend** (status visible)
- **No data entry**: name ≤ 1 field, auth = OTP only

### 3.3 Ánh xạ Chức năng (Step 1) sang Màn hình

| # | Màn hình | Component chính | Token / UI | Chức năng Step 1 |
|---|---|---|---|---|
| S01 | Splash/Onboarding | Hero, name+avatar, quận, companion picker, CTA | Sky bg, pill top, rounded cards | P1-Onboarding |
| S02 | Home/Explore | `MapView` + `QuestBanner` + `CompanionCard` + `BottomHUD` + `Rail` | Sky + grass + pill; bottom right companion card | P1-Home (MapEngine, Quest banner, Companion HUD) |
| S03 | Quest List | Card list (quận/day filter, difficulty, time-left) | Grass tint + white cards | P1-Quests (QuestEngine) |
| S04 | Quest Detail | Objectives, route CTA, reward preview, map pin | White surface + accent yellow CTA | P1-Quests (route nav) + P0-Quest state machine |
| S05 | Quest Result | Result card, confetti, share 1-tap, voucher claim, companion care | Celebration dark backdrop + accent yellow | QuestEngine + Billing (Voucher claim) |
| S06 | Companion | Avatar, status, emotion, XP/level bar, care panel | Companion card + tint | P0-Companion Engine + P1-Companion |
| S07 | Rewards/Wallet | Balance, streak card, daily progress bar, claim voucher list | Violet tint + white cards | Billing (VoucherEngine) |
| S08 | Voucher Detail + Claim | Voucher detail, QR code, countdown | Yellow tint + white | Billing Service + VoucherEngine |
| S09 | Social Feed | Posts (photo + caption), like, comment, share | Grass tint + white card | P1-Social (Post service) |
| S10 | Leaderboard | 4 charts, weekly reset countdown, your rank | Lavender tint + white | Gamification (Leaderboard) |
| S11 | Profile | Stats, badges grid, timeline | White card + pills | `ProfileScreen` + P0-Gamification |
| S12 | Notifications | Push list + in-app, clear | Tinted surface + clear CTA | Notifications + Notification engine |
| S13 | Settings | Account, i18n, 3D toggle, accessibility, privacy, delete | White surface + list | P1-Settings |
| S14 | Admin Dashboard | KPI cards, daily curve, alert cards | Violet tint + dark header | P2-Dashboard |
| S15 | Spots CMS | CRUD list + detail, image upload, CSV import | White card + dark rail | P2-Spots CMS |
| S16 | Quests CMS | CRUD list + detail, preview | White card | P2-Quests CMS |
| S17 | Partner Dashboard | Voucher redemption rate, payout report, KYC status | Tinted surface + white | P3-PartnerPayouts |
| S18 | Plans/Billing | Free/Pro/Pass + day-pass description, Stripe/VNPay checkout | White card + yellow CTA | P3-Plans + PaymentService |
| S19 | Replay/History | Timeline, km traveled, streak, achievements | Tinted surface + white cards | History logic (journal) |
| S20 | Admin Reports | DAU/WAU/MAU curves, heatmap, CSV export | White card + dark rail | P2-Reports |

---

## 4. WORKFLOW COMMAND (LỆNH ĐIỀU KHIỂN)

Bạn phải xác nhận bạn đã nắm rõ toàn bộ kiến trúc của dự án **HanoiDay** (cấu trúc, schema, API, business logic nêu trong STEP 1) trước khi bắt đầu STEP 2.

**Lệnh bắt đầu:**
1. **STEP 1 (Design Chức năng)**: Hoàn thành toàn bộ chức năng core engine + client + admin + billing + security + API/webhooks — viết logic + test tại mỗi phase (mỗi phase trễ > 4 tuần ⇒ cắt feature).
2. **Sau STEP 1 (kiểm tra xanh, không có file > 350 LoC, CI xanh)**: mới sang **STEP 2 (Design UX/UI)** — bám theo visual tokens 3.1 và cấu trúc screens 3.3.
3. **Sau STEP 2**: deploy lên staging, test PWA offline, verify 3-click journey, kiểm tra perf (bundle, LCP, FPS).
4. **Báo cáo tiến độ**: `LoC_actual / budget`, gate status, screenshot preview, 3-click success rate, retention D1 baseline (target ≥ 35%).

**Không được:** vẽ UI trước khi STEP 1 hoàn thành; nhúng 3D trước khi 2D + PWA green; import code legacy; dùng hard-coded hex trong component CSS; phá schema contract (`shared/contracts`); không được bỏ qua `check-contrast`, `check-tokens`, `verify:world`, `check-schema`, `check-contrast` kiểm tra CI.
