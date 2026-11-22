/**
 * CONTENT BIBLE — "36 phố phường" (F7).
 *
 * The audit that motivated this file: the world had 311 POIs but only **64
 * distinct names**, and all 29 streets carried a `craft` that surfaced as a single
 * shared toast ("Phố này xưa làm nghề …"). That is the definition of "Hà Nội sáo
 * rỗng": the data was there, nothing read it.
 *
 * Every street below gets four things, which is the Content Bible minimum from the
 * blueprint (§1.3, F7):
 *   1. nghề      — the trade the street is named for
 *   2. thoại     — one line only a Hanoian would write, never a slogan
 *   3. âm thanh  — the sound you hear standing there (CORE-07 ambience)
 *   4. món       — the thing you buy/eat/notice on that street
 *
 * Editorial rules (enforced by content.test.ts):
 *  - no line repeats across streets; no generic filler ("một chỗ nhỏ nhưng có
 *    chuyện để kể" is exactly the sentence this file exists to delete)
 *  - a line is ≤ 120 characters so it fits one toast without truncation
 *  - facts stay deliberately small and sensory (smell, sound, a habit), never
 *    invented history or fake dates — the game is fiction, the texture is not
 *  - diacritics are written properly; no "Hà Nôi", no unaccented Vietnamese
 */

export interface StreetLore {
  /** matches Street.id — one entry per street, tested for completeness */
  id: string
  /** the trade, as it is written on the sign */
  craft: string
  /** one sentence the player hears when they stop on the street */
  line: string
  /** the signature sound of this street (feeds the ambience mix) */
  sound: string
  /** what you can buy, eat or notice here */
  buy: string
  /** a prop the 3D layer can use, so the street is recognisable from far away */
  prop: 'silk' | 'tin' | 'paper' | 'silver' | 'herbs' | 'ice' | 'lantern' | 'books' | 'food' | 'stone'
}

export const STREET_LORE: StreetLore[] = [
  {
    id: 'dinh-tien-hoang',
    craft: 'Hồ Gươm',
    line: 'Sáng nào cũng có người tập dưỡng sinh quay lưng vào hồ, mắt nhắm, tay vẽ theo nhịp.',
    sound: 'Nhạc dưỡng sinh rỉ ra từ chiếc loa nhỏ, xa xa là tiếng chuông Tháp Rùa',
    buy: 'Một tờ báo gấp, một cốc trà nóng',
    prop: 'stone',
  },
  {
    id: 'le-thai-to',
    craft: 'Cà phê',
    line: 'Quán cà phê ở đây không có cửa kính: ghế nhựa xếp ra vỉa hè, mặt hướng ra hồ.',
    sound: 'Thìa quấy cốc, đá va thành thuỷ tinh, một xe máy nổ máy rồi tắt',
    buy: 'Cà phê trứng — lòng đỏ đánh bông như kem',
    prop: 'ice',
  },
  {
    id: 'hang-dao',
    craft: 'Lụa',
    line: 'Vải lụa treo thành dãy, gió thổi qua là cả phố gợn sóng một lượt.',
    sound: 'Kéo cắt vải, và tiếng sột soạt của cả tấm lụa gấp lại',
    buy: 'Một mét lụa Hà Đông, màu nào cũng có',
    prop: 'silk',
  },
  {
    id: 'hang-ngang',
    craft: 'Đồ gỗ',
    line: 'Mùi gỗ tươi ngọt hơn mùi nước hoa. Thợ ngồi bên trong, đục từng nhát đều như đếm.',
    sound: 'Tiếng đục gỗ, tiếng giấy nhám trên mặt bàn',
    buy: 'Một chiếc ghế nhỏ đóng vội trong buổi chiều',
    prop: 'stone',
  },
  {
    id: 'hang-duong',
    craft: 'Bánh kẹo',
    line: 'Đường phèn, mứt sen, kẹo lạc — người bán cân bằng chiếc cân đồng đã mòn vạch.',
    sound: 'Giấy gói sột soạt, tiếng quả cân đặt xuống đĩa',
    buy: 'Một gói mứt sen, buộc bằng lạt',
    prop: 'food',
  },
  {
    id: 'hang-ma',
    craft: 'Đồ giấy',
    line: 'Phố bán cả những thứ không dùng ở cõi này: nhà giấy, ngựa giấy, quần áo giấy.',
    sound: 'Nan tre bẻ gãy, tiếng hồ dán giấy',
    buy: 'Một con ngựa giấy đỏ, nhỏ bằng bàn tay',
    prop: 'paper',
  },
  {
    id: 'ma-may',
    craft: 'Nhà cổ',
    line: 'Nhà ống, sâu hun hút. Đứng ở cửa nhìn vào thấy ba lớp sân, cuối cùng là một khoảng trời.',
    sound: 'Cửa gỗ khép, tiếng dép lê trên gạch bát tràng',
    buy: 'Một chỗ ngồi trong sân, nếu chủ nhà đồng ý',
    prop: 'stone',
  },
  {
    id: 'ta-hien',
    craft: 'Bia hơi',
    line: 'Bảy giờ tối thì hết chỗ. Người ta đứng ra tận lòng đường, cốc bia đặt lên ghế nhựa.',
    sound: 'Cốc chạm nhau, tiếng cười của một bàn mười người',
    buy: 'Một cốc bia hơi, và đĩa lạc rang muối',
    prop: 'ice',
  },
  {
    id: 'hang-bac',
    craft: 'Bạc',
    line: 'Tiếng búa nện rất nhỏ, đều, nghe như tiếng mưa rơi trên mái tôn.',
    sound: 'Búa nện bạc — hàng trăm nhát mỗi phút',
    buy: 'Một chiếc vòng tay mảnh, khắc tên',
    prop: 'silver',
  },
  {
    id: 'hang-gai',
    craft: 'Lụa',
    line: 'Cửa hàng nào cũng treo một tấm áo dài mẫu ở sát cửa, chỉ để ánh đèn chiếu vào.',
    sound: 'Máy khâu chạy, tiếng thước dây bật',
    buy: 'Một chiếc khăn lụa quàng cổ',
    prop: 'silk',
  },
  {
    id: 'cau-go',
    craft: 'Đồ đồng',
    line: 'Nồi đồng xếp chồng ngay mặt phố, ánh lên như vàng nhưng nặng hơn vàng.',
    sound: 'Thử nồi: một tiếng "boong" ngân rất lâu',
    buy: 'Một chiếc nồi nhỏ, đáy dày',
    prop: 'tin',
  },
  {
    id: 'thuoc-bac',
    craft: 'Thuốc bắc',
    line: 'Đi ngang không thể không ngửi: quế, hồi, thục địa, và một mùi gì đó rất cũ.',
    sound: 'Cân tiểu ly leng keng, giấy gói thuốc',
    buy: 'Một thang thuốc, hoặc chỉ một chén trà ngồi nhờ',
    prop: 'herbs',
  },
  {
    id: 'cha-ca',
    craft: 'Chả cá',
    line: 'Chiều nào cũng vậy: mùi thì là và mắm tôm cháy vàng, ai đi ngang cũng chậm lại một nhịp.',
    sound: 'Chảo dầu réo, tiếng trở cá',
    buy: 'Một suất chả cá, ăn kèm bún và lạc rang',
    prop: 'food',
  },
  {
    id: 'dong-xuan',
    craft: 'Chợ',
    line: 'Chợ không có lối đi thẳng bao giờ. Đi vào bằng một ngách, ra bằng ngách khác.',
    sound: 'Hàng trăm người nói cùng lúc, tiếng mời rẻ, tiếng trả giá',
    buy: 'Bất cứ thứ gì, từ con ốc đến bộ quần áo',
    prop: 'lantern',
  },
  {
    id: 'duong-tau',
    craft: 'Cà phê',
    line: 'Tàu qua thì phải ép sát vào tường, và mọi cốc cà phê trên bàn cùng rung một nhịp.',
    sound: 'Còi tàu kéo dài, rồi tiếng sắt rỉ lên',
    buy: 'Một cà phê muối, đứng sát vạch',
    prop: 'tin',
  },
  {
    id: 'nha-chung',
    craft: 'Sách',
    line: 'Nhà sách mở cửa muộn hơn mọi hàng khác trên phố, như thể người bán cũng phải đọc.',
    sound: 'Bánh xe đẩy qua, một trang sách lật',
    buy: 'Một cuốn sách mỏng, bìa đã bạc',
    prop: 'books',
  },
  {
    id: 'nha-tho-lon',
    craft: 'Di sản',
    line: 'Đứng ở sân nhà thờ, phố ồn tới đâu cũng bị chặn lại ở bậc thang.',
    sound: 'Chuông nhà thờ, ngắn và rất tròn',
    buy: 'Không mua gì — chỉ được im lặng một lát',
    prop: 'stone',
  },
  {
    id: 'trang-thi',
    craft: 'Thời trang',
    line: 'Phố dài, cửa hàng san sát, người đi nhanh hơn các phố khác, ai cũng có việc.',
    sound: 'Biển hiệu kéo lên, tiếng còi xe liên tục',
    buy: 'Một chiếc áo sơ mi là phẳng, gấp gọn trong túi giấy',
    prop: 'paper',
  },
  {
    id: 'quang-trung',
    craft: 'Sách',
    line: 'Cuối tuần, sách cũ bày trên vải trải vỉa hè, bán theo cân chứ không theo tên.',
    sound: 'Trang giấy lật nhanh, người thu gom sách gọi giá',
    buy: 'Ba cuốn tiểu thuyết cũ, buộc dây chun',
    prop: 'books',
  },
  {
    id: 'trang-tien',
    craft: 'Kem',
    line: 'Kem ăn phải đứng mới đúng điệu. Không ngồi, không đợi, không mang đi.',
    sound: 'Thìa kem nạo, tiếng cười của một đứa trẻ được chọn hai que',
    buy: 'Một que kem cốm, xanh và thơm',
    prop: 'ice',
  },
  {
    id: 'hang-bai',
    craft: 'Thời trang',
    line: 'Một phố mà buổi sáng bán quần áo, buổi tối bán nước chè ngay trên cùng một vỉa hè.',
    sound: 'Kéo cửa cuốn, tiếng dép chạm ghế nhựa',
    buy: 'Một chiếc áo len, hoặc một cốc trà chanh',
    prop: 'paper',
  },
  {
    id: 'ly-thuong-kiet',
    craft: 'Di sản',
    line: 'Người đi bộ hiếm hơn xe máy. Ai băng qua được đường thì đứng lại thở một cái.',
    sound: 'Dòng xe liền mạch, không có khoảng lặng nào',
    buy: 'Không mua gì — chỉ đứng lại một lát',
    prop: 'stone',
  },
  {
    id: 'le-phung-hieu',
    craft: 'Cà phê',
    line: 'Quán cà phê nằm trên tầng hai, không biển hiệu, khách quen tự biết cầu thang.',
    sound: 'Bậc thang gỗ dưới chân, tiếng điều hoà',
    buy: 'Một ly đen đá, ngồi nhìn xuống ngã tư',
    prop: 'ice',
  },
  {
    id: 'ngo-quyen',
    craft: 'Nhà hàng',
    line: 'Bàn kê sát cửa, người phục vụ bưng mâm đi giữa hai dãy khách mà không cần nhìn.',
    sound: 'Bát đĩa, tiếng gọi thêm một đĩa nữa',
    buy: 'Một đĩa bún chả, than hoa nướng ngay cửa',
    prop: 'food',
  },
  {
    id: 'phan-chu-trinh',
    craft: 'Khách sạn',
    line: 'Khách du lịch ngồi bệt trước cửa khách sạn, ăn phở ngay trên vỉa hè, vali để bên cạnh.',
    sound: 'Bánh xe vali trên gạch, tiếng chào bằng ba thứ tiếng',
    buy: 'Một tấm bưu thiếp, tem dán sẵn',
    prop: 'paper',
  },
  {
    id: 'hai-ba-trung',
    craft: 'Thời trang',
    line: 'Cửa hàng nào cũng mở tới khuya, đèn trắng chiếu thẳng ra đường như ban ngày.',
    sound: 'Nhạc từ hai cửa hàng cạnh nhau, chồng lên nhau',
    buy: 'Một chiếc túi vải, in hình con phố này',
    prop: 'paper',
  },
  {
    id: 'pho-hue',
    craft: 'Đồ điện',
    line: 'Quạt trần trong nhà xoay chậm; ngoài phố thì mũ bảo hiểm bày kín vỉa hè.',
    sound: 'Máy khoan bắt vít, tiếng quạt số',
    buy: 'Một chiếc mũ bảo hiểm, có kính chắn',
    prop: 'tin',
  },
  {
    id: 'ba-trieu',
    craft: 'Thời trang',
    line: 'Phố này dậy sớm nhất thành phố: năm giờ sáng đã có xe hàng đỗ trước cửa.',
    sound: 'Cửa cuốn kéo lên, xe tải nhỏ lùi chuồng',
    buy: 'Một bộ quần áo công sở, còn nguyên bao',
    prop: 'paper',
  },
  {
    id: 'nguyen-du',
    craft: 'Sách',
    line: 'Đi hết phố này thì hết phố cổ. Phía trước là một Hà Nội khác, rộng hơn và vắng hơn.',
    sound: 'Cây cổ thụ, gió qua lá, xe đạp',
    buy: 'Một quyển sổ tay bìa da, mở khóe',
    prop: 'books',
  },
]

const BY_ID = new Map(STREET_LORE.map((entry) => [entry.id, entry]))

export const loreFor = (streetId: string | undefined): StreetLore | undefined =>
  streetId ? BY_ID.get(streetId) : undefined

/** Fallback is deliberately *not* a generic sentence: it names the street. */
export const loreLine = (streetName: string | undefined, streetId: string | undefined): string => {
  const lore = loreFor(streetId)
  if (lore) return lore.line
  if (streetName) return `Phố ${streetName}: một đoạn phố nằm trong phố cổ, không có gì đặc biệt nổi bật.`
  return 'Một đoạn phố nhỏ trong phố cổ.'
}

/** Coverage numbers printed by content.test.ts so drift is visible. */
export const loreCoverage = (streetIds: readonly string[]): { covered: number; total: number; missing: string[] } => ({
  covered: streetIds.filter((id) => BY_ID.has(id)).length,
  total: streetIds.length,
  missing: streetIds.filter((id) => !BY_ID.has(id)),
})
