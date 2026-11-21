/** Dialogue content. Text is Vietnamese-first; English fields follow later. */

export type DialogueEffect =
  | 'eat-pho'
  | 'accept-photo'
  | 'close'
  | 'lore-pho'
  | 'hint-silver'
  | 'hint-cyclo'

export interface DialogueChoice {
  id: string
  label: string
  /** dong cost, checked before applying */
  cost?: number
  effect: DialogueEffect
}

export interface Dialogue {
  key: string
  speaker: string
  role: string
  lines: string[]
  choices: DialogueChoice[]
}

export const DIALOGUES: Record<string, Dialogue> = {
  'co-hoa': {
    key: 'co-hoa',
    speaker: 'Cô Hoa',
    role: 'Quán phở vỉa hè Lê Thái Tổ',
    lines: [
      'Cháu dậy sớm thế? Hà Nội sáng nay có sương, ngồi xuống ăn bát phở cho ấm bụng đã.',
      'Nước dùng cô ninh từ 4 giờ sáng. Hành lá cắt lúc trời còn tối, thơm lắm.',
    ],
    choices: [
      { id: 'eat', label: 'Ăn một bát phở bò (45đ)', cost: 45, effect: 'eat-pho' },
      { id: 'lore', label: 'Hỏi cô chuyện phố phường quanh hồ', effect: 'lore-pho' },
      { id: 'leave', label: 'Để cháu quay lại sau', effect: 'close' },
    ],
  },
  'chu-bay': {
    key: 'chu-bay',
    speaker: 'Chú Bảy',
    role: 'Thợ bạc Hàng Bạc',
    lines: [
      'Phố này ngày xưa cả phố làm bạc. Giờ còn mấy nhà giữ nghề, chú là một trong số đó.',
      'Muốn học chạm bạc thì phải kiên nhẫn. Mỗi đường nét là một lần thở.',
    ],
    choices: [
      { id: 'ask', label: 'Hỏi chú về nghề chạm bạc', effect: 'hint-silver' },
      { id: 'leave', label: 'Cháu chào chú', effect: 'close' },
    ],
  },
  'chi-lan': {
    key: 'chi-lan',
    speaker: 'Chị Lan',
    role: 'Nhiếp ảnh gia',
    lines: [
      'Sáng nay hồ Gươm đẹp lắm. Sương còn trên mặt nước, tháp Rùa như đang ngủ.',
      'Chụp đi. Ảnh đẹp không cần máy xịn, cần đúng lúc.',
    ],
    choices: [
      { id: 'accept', label: 'Nhận lời: chụp Hồ Gươm lúc bình minh', effect: 'accept-photo' },
      { id: 'leave', label: 'Để em suy nghĩ đã', effect: 'close' },
    ],
  },
  'anh-hung': {
    key: 'anh-hung',
    speaker: 'Anh Hùng',
    role: 'Xích lô ven hồ',
    lines: [
      'Lên xe không? Một vòng hồ mất hai mươi phút, anh kể chuyện phố cổ cho nghe.',
      'Đạp xích lô ở Hà Nội phải nhớ: chậm thôi, để người ta còn kịp nhìn.',
    ],
    choices: [
      { id: 'ask', label: 'Hỏi anh về nghề xích lô', effect: 'hint-cyclo' },
      { id: 'leave', label: 'Hẹn anh lần khác', effect: 'close' },
    ],
  },
}

export const dialogueByKey = (key: string): Dialogue | undefined => DIALOGUES[key]
