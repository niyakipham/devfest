/** 36 phố phường — stylised street graph of the Hoàn Kiếm core. */
import type { Street } from '../types'

export const STREETS: Street[] = [
  { id: 'dinh-tien-hoang', name: 'Đinh Tiên Hoàng', nameEn: 'Dinh Tien Hoang', craft: 'Hồ Gươm', width: 16, points: [[2290, 1280], [2290, 1940]] },
  { id: 'le-thai-to', name: 'Lê Thái Tổ', nameEn: 'Le Thai To', craft: 'Cà phê', width: 12, points: [[2250, 1340], [2250, 1900]] },
  { id: 'hang-dao', name: 'Hàng Đào', nameEn: 'Hang Dao', craft: 'Lụa', width: 10, points: [[2250, 1240], [2250, 980]] },
  { id: 'hang-ngang', name: 'Hàng Ngang', nameEn: 'Hang Ngang', craft: 'Đồ gỗ', width: 10, points: [[2250, 1000], [2550, 1000]] },
  { id: 'hang-duong', name: 'Hàng Đường', nameEn: 'Hang Duong', craft: 'Bánh kẹo', width: 9, points: [[2250, 950], [2550, 950]] },
  { id: 'hang-ma', name: 'Hàng Mã', nameEn: 'Hang Ma', craft: 'Đồ giấy', width: 9, points: [[2550, 950], [2550, 1210]] },
  { id: 'ma-may', name: 'Mã Mây', nameEn: 'Ma May', craft: 'Nhà cổ', width: 8, points: [[2350, 1080], [2520, 1080]] },
  { id: 'ta-hien', name: 'Tạ Hiện', nameEn: 'Ta Hien', craft: 'Bia hơi', width: 8, points: [[2300, 1150], [2500, 1180]] },
  { id: 'hang-bac', name: 'Hàng Bạc', nameEn: 'Hang Bac', craft: 'Bạc', width: 8, points: [[2300, 880], [2600, 880]] },
  { id: 'hang-gai', name: 'Hàng Gai', nameEn: 'Hang Gai', craft: 'Lụa', width: 9, points: [[2200, 1050], [2360, 1060]] },
  { id: 'cau-go', name: 'Cầu Gỗ', nameEn: 'Cau Go', craft: 'Đồ đồng', width: 8, points: [[2350, 1120], [2500, 1120]] },
  { id: 'thuoc-bac', name: 'Thuốc Bắc', nameEn: 'Thuoc Bac', craft: 'Thuốc bắc', width: 8, points: [[2200, 920], [2450, 920]] },
  { id: 'cha-ca', name: 'Chả Cá', nameEn: 'Cha Ca', craft: 'Chả cá', width: 8, points: [[2450, 900], [2700, 900]] },
  { id: 'dong-xuan', name: 'Đồng Xuân', nameEn: 'Dong Xuan', craft: 'Chợ', width: 14, points: [[2300, 800], [2700, 800]] },
  { id: 'duong-tau', name: 'Phố Đường Tàu', nameEn: 'Train Street', craft: 'Cà phê', width: 6, points: [[2055, 900], [2055, 1300]] },
  { id: 'nha-chung', name: 'Phố Nhà Chung', nameEn: 'Nha Chung', craft: 'Sách', width: 8, points: [[2100, 1400], [2210, 1400]] },
  { id: 'nha-tho-lon', name: 'Nhà thờ Lớn', nameEn: 'St Joseph Cathedral', craft: 'Di sản', width: 10, points: [[2150, 1450], [2260, 1520]] },
  { id: 'trang-thi', name: 'Tràng Thi', nameEn: 'Trang Thi', craft: 'Thời trang', width: 12, points: [[2005, 1600], [2005, 2050]] },
  { id: 'quang-trung', name: 'Quang Trung', nameEn: 'Quang Trung', craft: 'Sách', width: 11, points: [[2050, 1660], [2250, 1700]] },
  { id: 'trang-tien', name: 'Tràng Tiền', nameEn: 'Trang Tien', craft: 'Kem', width: 11, points: [[2100, 1950], [2285, 1980]] },
  { id: 'hang-bai', name: 'Hàng Bài', nameEn: 'Hang Bai', craft: 'Thời trang', width: 12, points: [[2450, 2005], [2760, 2005]] },
  { id: 'ly-thuong-kiet', name: 'Lý Thường Kiệt', nameEn: 'Ly Thuong Kiet', craft: 'Di sản', width: 12, points: [[2010, 2110], [2450, 2110]] },
  { id: 'le-phung-hieu', name: 'Lê Phụng Hiểu', nameEn: 'Le Phung Hieu', craft: 'Cà phê', width: 8, points: [[2550, 1360], [2700, 1400]] },
  { id: 'ngo-quyen', name: 'Ngô Quyền', nameEn: 'Ngo Quyen', craft: 'Nhà hàng', width: 9, points: [[2550, 1600], [2700, 1650]] },
  { id: 'phan-chu-trinh', name: 'Phan Chu Trinh', nameEn: 'Phan Chu Trinh', craft: 'Khách sạn', width: 10, points: [[2500, 1850], [2700, 1900]] },
  { id: 'hai-ba-trung', name: 'Hai Bà Trưng', nameEn: 'Hai Ba Trung', craft: 'Thời trang', width: 12, points: [[2760, 1300], [2760, 2100]] },
  { id: 'pho-hue', name: 'Phố Huế', nameEn: 'Pho Hue', craft: 'Đồ điện', width: 11, points: [[2810, 1850], [2810, 2120]] },
  { id: 'ba-trieu', name: 'Bà Triệu', nameEn: 'Ba Trieu', craft: 'Thời trang', width: 11, points: [[2760, 1950], [2900, 2200]] },
  { id: 'nguyen-du', name: 'Nguyễn Du', nameEn: 'Nguyen Du', craft: 'Sách', width: 10, points: [[2600, 2060], [2900, 2110]] },
]

export const streetById = (id: string): Street | undefined => STREETS.find((s) => s.id === id)
