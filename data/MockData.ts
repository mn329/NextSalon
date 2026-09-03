import type { Shop } from "@/types/shops"
import type { Menu } from "@/types/menu"
import type { Staff } from "@/types/staff"

export const MOCK_SHOPS: Shop[] = [
    {
        id: "1",
        name: "atelier toi",
        area: "渋谷",
        rating: 4.8,
        reviewCount: 128,
        tags: ["似合わせカット", "透明感カラー", "ヘッドスパ"],
        description: "柔らかな光が入る路面店。骨格に合わせたカットと、赤みを抑えたカラー提案が強みです。",
        address: "東京都渋谷区神南1-8-12",
        phone: "03-1234-5678",
        instagramUrl: "https://instagram.com/atelier_toi",
        coverImage: "/images/shop-atelier.jpg",
        businessHours: ["Mon-Fri 10:00-20:00", "Sat-Sun 09:00-19:00"],
        leadMessage: "春の質感は、輪郭の余白から整える。",
    },
    {
        id: "2",
        name: "nook by linen",
        area: "代官山",
        rating: 4.7,
        reviewCount: 89,
        tags: ["パーマ", "ショート", "メンズ歓迎"],
        description: "ミニマルな空間で、ショートとニュアンスパーマを中心に提案するプライベートサロンです。",
        address: "東京都渋谷区代官山町16-4",
        phone: "03-2222-8844",
        instagramUrl: "https://instagram.com/nook_by_linen",
        coverImage: "/images/shop-nook.jpg",
        businessHours: ["Tue-Fri 11:00-20:00", "Sat-Sun 10:00-18:00"],
        leadMessage: "素の雰囲気に、少しだけ意志を足す。",
    },
    {
        id: "3",
        name: "morrow skin hair",
        area: "表参道",
        rating: 4.9,
        reviewCount: 164,
        tags: ["髪質改善", "トリートメント", "静かな空間"],
        description: "髪質改善と頭皮ケアに特化。長く通えるメンテナンス設計で、忙しい大人世代から支持されています。",
        address: "東京都港区北青山3-10-2",
        phone: "03-4400-9900",
        instagramUrl: "https://instagram.com/morrow_skin_hair",
        coverImage: "/images/shop-morrow.jpg",
        businessHours: ["Daily 10:00-21:00"],
        leadMessage: "整えるだけでなく、扱いやすさまで設計する。",
    },
]

export const MOCK_SHOP_MENUS: Record<string, Menu[]> = {
  "1": [
    { id: "1", name: 'カット', description: '骨格と毛流れに合わせたデザインカット。', price: 6600, durationMinutes: 60 },
    { id: "2", name: 'カット + 透明感カラー', description: 'ダメージを抑えながら赤みをコントロール。', price: 14300, durationMinutes: 150 },
    { id: "3", name: 'カット + ヘッドスパ', description: '頭皮ケアとリフト感を重視した30分スパ。', price: 9900, durationMinutes: 90 },
  ],
  "2": [
    { id: "4", name: 'ショートカット', description: '再現性重視。襟足の収まりまで設計。', price: 7200, durationMinutes: 60 },
    { id: "5", name: 'カット + パーマ', description: 'ラフな動きをつくる水パーマ。', price: 15400, durationMinutes: 150 },
  ],
  "3": [
    { id: "6", name: '髪質改善トリートメント', description: 'うねりや乾燥に向けた集中ケア。', price: 13200, durationMinutes: 90 },
    { id: "7", name: 'カット + 髪質改善', description: 'まとまりとフォルムを同時に整える人気コース。', price: 17600, durationMinutes: 150 },
  ],
}

export const MOCK_SHOP_STAFF: Record<string, Staff[]> = {
  "1": [
    { id: "1", name: "Mio", specialty: "柔らかなボブと顔まわりレイヤー", bio: "生活に馴染む質感づくりが得意です。", imageUrl: "/images/staff-mio.avif" },
    { id: "2", name: "Ren", specialty: "透け感カラーと地毛風ストレート", bio: "肌映えする色設計を一緒に考えます。", imageUrl: "/images/staff-ren.jpg" },
  ],
  "2": [
    { id: "3", name: "Aoi", specialty: "ショートとメンズパーマ", bio: "乾かすだけで決まるラインにこだわります。", imageUrl: "/images/staff-aoi.jpg" },
  ],
  "3": [
    { id: "4", name: "Sena", specialty: "髪質改善と艶カラー", bio: "ホームケアまで含めて提案します。", imageUrl: "/images/staff-sena.jpg" },
    { id: "5", name: "Kai", specialty: "大人レイヤーと頭皮ケア", bio: "年単位で扱いやすい髪を目指します。", imageUrl: "/images/staff-kai.jpg" },
  ],
}