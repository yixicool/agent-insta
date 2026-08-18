import type { SourceRef } from '../types/provenance';

/**
 * 共享来源常量。整份数据集的采集日期集中在此，
 * 避免同一来源在多处重复书写导致日期漂移。
 */

export const CAPTURED_AT = '2026-08-13';
export const CNY_PRICE_CAPTURED_AT = '2026-08-13';

function official(publisher: string, title: string, url: string): SourceRef {
  return { kind: 'official', publisher, title, url, retrievedAt: CAPTURED_AT };
}

function pressRelease(publisher: string, title: string, url: string): SourceRef {
  return { kind: 'press-release', publisher, title, url, retrievedAt: CAPTURED_AT };
}

function review(publisher: string, title: string, url: string): SourceRef {
  return { kind: 'review', publisher, title, url, retrievedAt: CAPTURED_AT };
}

function community(publisher: string, title: string, url: string): SourceRef {
  return { kind: 'community', publisher, title, url, retrievedAt: CAPTURED_AT };
}

function retailer(publisher: string, title: string, url: string): SourceRef {
  return { kind: 'retailer', publisher, title, url, retrievedAt: CAPTURED_AT };
}

function cnyPrice(publisher: string, title: string, url: string): SourceRef {
  return { kind: 'official', publisher, title, url, retrievedAt: CNY_PRICE_CAPTURED_AT };
}

// ── 大疆 DJI ────────────────────────────────────────────────────────────────

export const DJI_OSMO_PRODUCTS = official(
  'DJI 官方',
  'DJI Handheld Cameras & Gimbals — Osmo 产品线规格总览',
  'https://www.dji.com/uk/products/osmo',
);

export const DJI_ACTION_6_PRODUCT = official(
  'DJI 官方',
  'Osmo Action 6 — Square Up, Nail the Move',
  'https://www.dji.com/global/osmo-action-6',
);

export const DJI_ACTION_6_STORE = official(
  'DJI 官方商城',
  'Osmo Action 6 All-In-One Flagship Action Camera',
  'https://store.dji.com/uk/product/osmo-action-6-adventure-combo',
);

export const DJI_OSMO_360_STORE = official(
  'DJI 官方商城',
  'Osmo 360 8K Revolutionary 360° Camera',
  'https://store.dji.com/product/osmo-360-standard-combo',
);

export const DJI_OSMO_360_PRESS = pressRelease(
  'DJI 官方新闻稿',
  'DJI Revolutionizes 360 Camera Market with the Osmo 360',
  'https://www.prnewswire.com/news-releases/dji-revolutionizes-360-camera-market-with-the-osmo-360-302518486.html',
);

export const DJI_NANO_SUPPORT = official(
  'DJI 官方支持',
  'Support for Osmo Nano',
  'https://www.dji.com/support/product/nano',
);

export const DJI_NANO_STORE = official(
  'DJI 美国官方商城',
  'Osmo Nano Standard Combo (128GB)',
  'https://www.djiusa.com/products/osmo-nano-standard-combo-128gb',
);

// ── 影石 Insta360 ───────────────────────────────────────────────────────────

export const INSTA360_ACE_PRO_2_PRODUCT = official(
  'Insta360 官方',
  'Insta360 Ace Pro 2 — 8K Camera with Leica Lens',
  'https://www.insta360.com/product/insta360-ace-pro2',
);

export const INSTA360_ACE_PRO_2_PRESS = pressRelease(
  'Insta360 官方新闻稿',
  'Ace Pro 2: Redefining Action Cameras With Unrivaled 8K Image Quality & Smarter AI',
  'https://www.insta360.com/blog/news/insta360-ace-pro-2-announcement-ai-action-camera.html',
);

export const INSTA360_ACE_PRO_2_COMPARE = official(
  'Insta360 官方',
  'Insta360 Ace Pro 2 vs. Insta360 Ace Pro 规格对比',
  'https://www.insta360.com/blog/tips/ace-pro-2-vs-ace-pro.html',
);

export const INSTA360_X5_SPECS = official(
  'Insta360 官方',
  'Insta360 X5 Product Specs',
  'https://www.insta360.com/us/specs/x5',
);

export const INSTA360_X5_PRESS = pressRelease(
  'Insta360 官方新闻稿',
  'Insta360 Launches X5: The Smartest, Toughest 360 Camera Ever Made',
  'https://www.insta360.com/blog/news/insta360-launches-X5-360-action-cam.html',
);

export const INSTA360_X5_STORE = official(
  'Insta360 官方商城',
  'Insta360 X5 Flagship 360 Action Cam',
  'https://store.insta360.com/product/x5',
);

export const INSTA360_GO_ULTRA_PRESS = pressRelease(
  'Insta360 官方新闻稿',
  'Insta360 Unveils GO Ultra: The Tiny 4K Camera for Capturing Life as You Live it',
  'https://www.insta360.com/blog/insta360-releases-go-ultra.html',
);

export const INSTA360_GO_ULTRA_STORE = official(
  'Insta360 官方商城',
  'Insta360 GO Ultra — New Tiny Hands-Free 4K Pocket Camera',
  'https://store.insta360.com/product/go-ultra/',
);

export const INSTA360_GO_ULTRA_FAQ = official(
  'Insta360 官方',
  'Insta360 GO Ultra: Everything You Need to Know',
  'https://www.insta360.com/blog/tips/insta360-go-ultra-faq.html',
);

// ── GoPro ───────────────────────────────────────────────────────────────────

export const GOPRO_MISSION_1_ANNOUNCE = pressRelease(
  'GoPro 投资者关系',
  'GoPro Announces New MISSION 1 Line of Professional 8K and 4K Open Gate, Compact Cinema Cameras',
  'https://investor.gopro.com/press-releases/press-release-details/2026/GoPro-Announces-New-MISSION-1-Line-of-Professional-8K-and-4K-Open-Gate-Compact-Cinema-Cameras-for-Filmmakers-Creators-and-Aspiring-Enthusiasts/default.aspx',
);

export const GOPRO_MISSION_1_PRICING = pressRelease(
  'GoPro 投资者关系',
  'GoPro Announces Pricing for New MISSION 1 Series, Starting at $499 for Existing GoPro Subscribers',
  'https://investor.gopro.com/press-releases/press-release-details/2026/GoPro-Announces-Pricing-for-New-MISSION-1-Series-Professional-8K-and-4K-Open-Gate-Compact-Cinema-Cameras-Starting-at-499-for-Existing-GoPro-Subscribers/default.aspx',
);

export const GOPRO_MISSION_1_AVAILABLE = pressRelease(
  'GoPro 投资者关系',
  "GoPro's New MISSION 1 Series Cameras Now Available on Retail Shelves Globally and at GoPro.com",
  'https://investor.gopro.com/press-releases/press-release-details/2026/GoPros-New-MISSION-1-Series-Cameras-Mounts-and-Accessories-Now-Available-on-Retail-Shelves-Globally-and-at-GoPro-com/default.aspx',
);

export const GOPRO_MISSION_1_PREORDER = pressRelease(
  'GoPro 投资者关系',
  'MISSION 1 Series Now Available for Pre-Order at GoPro.com, Shipping May 28',
  'https://investor.gopro.com/press-releases/press-release-details/2026/GoPros-New-MISSION-1-Series-Cameras-Mounts-and-Accessories-Now-Available-for-Pre-Order-at-GoPro-com-Shipping-May-28/default.aspx',
);

export const GOPRO_MISSION_1_STORE = official(
  'GoPro 官方',
  'MISSION 1 Series 产品页',
  'https://gopro.com/en/us/shop/buy-cameras/mission-1-series',
);

export const GOPRO_HERO13_SPECS = official(
  'GoPro 官方',
  'HERO13 Black Specs',
  'https://gopro.com/en/do/shop/cameras/buy/hero13black/CHDHX-131-master.html?tab=tech-specs',
);

export const GOPRO_HERO13_ANNOUNCE = pressRelease(
  'GoPro 官方新闻',
  'GoPro Announces the $399 HERO13 Black and the $199 HERO',
  'https://gopro.com/en/ca/news/gopro-announces-hero13-black-and-tiny-hero-camera',
);

// ── 第三方专业评测 ──────────────────────────────────────────────────────────

export const DPREVIEW_MISSION_SERIES = review(
  'DPReview',
  'The biggest name in action cams just announced an unexpected new style of camera',
  'https://www.dpreview.com/news/1520681145/gopro-mission-series-announcement-mount/',
);

export const DPREVIEW_MISSION_PRO_ILS = review(
  'DPReview',
  'GoPro reveals who its interchangeable lens camera is really for',
  'https://www.dpreview.com/articles/3499820161/gopro-mission-pro-1-ils-audience-filmmakers/',
);

export const DPREVIEW_MISSION_PRICING = review(
  'DPReview',
  'GoPro reveals the pricing for its most exciting cameras in years',
  'https://www.dpreview.com/news/1577851101/gopro-mission-1-pricing-announcements/',
);

export const DPREVIEW_OSMO_NANO = review(
  'DPReview',
  'DJI takes on Insta360 with a wearable, modular action camera',
  'https://www.dpreview.com/news/9109322543/dji-osmo-nano-action-camera-announcement/',
);

export const PCMAG_BEST_ACTION_CAMERAS = review(
  'PCMag',
  'The Best Action Cameras for 2026',
  'https://au.pcmag.com/video-cameras/26064/the-best-action-cameras',
);

export const PCMAG_OSMO_ACTION_6 = review(
  'PCMag',
  'DJI Osmo Action 6 Review',
  'https://uk.pcmag.com/cameras-1/164662/dji-osmo-action-6',
);

export const TECHRADAR_OSMO_ACTION_6 = review(
  'TechRadar',
  'DJI Osmo Action 6 arrives with two big action camera firsts',
  'https://www.techradar.com/cameras/action-cameras/dji-osmo-action-6-arrives-with-two-big-action-camera-firsts-including-a-gopro-eclipsing-sensor',
);

export const TECHRADAR_OSMO_NANO = review(
  'TechRadar',
  'DJI Osmo Nano review: a tiny modular action cam that’s big on quality',
  'https://www.techradar.com/cameras/action-cameras/dji-osmo-nano-review',
);

export const TOMSGUIDE_OSMO_ACTION_6 = review(
  "Tom's Guide",
  'DJI Osmo Action 6 review: Better than anything GoPro or Insta360 can offer',
  'https://www.tomsguide.com/cameras-photography/gopro-action-cameras/dji-osmo-action-6-review',
);

export const TOMSGUIDE_GO_ULTRA = review(
  "Tom's Guide",
  'Insta360 Go Ultra review: Ultra features, Ultra price',
  'https://www.tomsguide.com/cameras-photography/gopro-action-cameras/insta360-go-ultra-review',
);

export const REDSHARK_SUMMER_2026 = review(
  'RedShark News',
  'Best action cameras summer 2026: Mission 1 Pro vs Osmo Action 6 vs Ace Pro 2',
  'https://www.redsharknews.com/best-action-cameras-summer-2026-mission-1-pro-osmo-action-6-ace-pro-2',
);

export const DIGITALCAMERAWORLD_MISSION_1 = review(
  'Digital Camera World',
  'GoPro Mission 1 series crams a one-inch sensor into the smallest 8K open gate cameras yet',
  'https://www.digitalcameraworld.com/cameras/gopro-mission-1-series-crams-a-one-inch-sensor-into-the-smallest-8k-open-gate-cameras-yet-including-gopros-first-ever-mirrorless-camera',
);

export const CINED_OSMO_NANO = review(
  'CineD',
  'DJI Osmo Nano Released — Modular 52g Camera with 4K120 and 10-Bit D-Log M',
  'https://www.cined.com/dji-osmo-nano-released-modular-52g-0-1lb-camera-with-4k120-and-10-bit-d-log-m/',
);

export const PETAPIXEL_OSMO_NANO = review(
  'PetaPixel',
  "52-Gram Osmo Nano Is DJI's Smallest Action Camera",
  'https://petapixel.com/2025/09/23/52-gram-osmo-nano-is-djis-smallest-action-camera/',
);

// ── 零售渠道报价（用于交叉核对，不作为规格依据） ────────────────────────────

export const BH_OSMO_ACTION_6 = retailer(
  'B&H Photo',
  'DJI Osmo Action 6 Adventure Combo',
  'https://www.bhphotovideo.com/c/product/1928319-REG/dji_cp_os_00000506_02_osmo_action_6_adventure.html',
);

export const BH_OSMO_360 = retailer(
  'B&H Photo',
  'DJI Osmo 360 Action Camera Standard Combo',
  'https://www.bhphotovideo.com/c/product/1900217-REG/dji_cp_os_00000441_02_osmo_360_adventure_combo.html',
);

export const BH_MISSION_1_PRO = retailer(
  'B&H Photo',
  'GoPro MISSION 1 PRO',
  'https://www.bhphotovideo.com/c/product/1964094-REG/gopro_mission_1_pro.html',
);

export const BH_GO_ULTRA = retailer(
  'B&H Photo',
  'Insta360 GO Ultra Standard Bundle',
  'https://www.bhphotovideo.com/c/product/1910074-REG/insta360_cinsabea_goultra02_go_ultra_standard_bundle.html',
);

// ── 社区讨论 ────────────────────────────────────────────────────────────────

export const REDDIT_MOTO_TOURING = community(
  'Reddit 讨论汇总（RedditRecs）',
  'Top Action Cameras for Long-Distance Motorcycle Touring：续航与散热是首要约束',
  'https://redditrecs.com/action-camera/filters/best-for-long-distance-motorcycle-touring/',
);

export const REDDIT_HERO13_THREADS = community(
  'Reddit 讨论汇总（RedditRecs）',
  'GoPro HERO13 Black 用户讨论：发热与低光表现对比',
  'https://redditrecs.com/action-camera/model/gopro-hero13-black/',
);

export const REDDIT_GO_2_THREADS = community(
  'Reddit 讨论汇总（RedditRecs）',
  'Insta360 GO 2 用户讨论：连续录制不到一小时即过热',
  'https://redditrecs.com/action-camera/model/insta360-go-2/',
);

export const REDDIT_ACTION_5_PRO_THREADS = community(
  'Reddit 讨论汇总（RedditRecs）',
  'DJI Osmo Action / Nano 用户讨论：脱离扩展坞后续航明显缩短',
  'https://redditrecs.com/action-camera/model/dji-osmo-action-5-pro',
);

export const REDDIT_HELMET_CAM_THREADS = community(
  'Reddit 讨论汇总（RedditRecs）',
  '头盔机位讨论：头部晃动幅度远超预期，构图难以稳定',
  'https://redditrecs.com/action-camera/model/gopro-hero4-session-chdhs-101/',
);

export const REDDIT_MAX2_WIND_NOISE = community(
  'Reddit 讨论汇总（RedditRecs）',
  '摩托与骑行风噪讨论：不加配件也非常吵，且需考虑事故风险',
  'https://redditrecs.com/action-camera/model/gopro-max2/',
);

export const REDDIT_EXTERNAL_POWER = community(
  'Reddit 讨论汇总（RedditRecs）',
  '长时间录制讨论：建议接车电供电而非依赖机内电池',
  'https://redditrecs.com/action-camera/model/drift-innovation-ghost-xl-pro/',
);

// ── 中国市场价格 ─────────────────────────────────────────────────────────────

export const DJI_ACTION_6_CN_PRICE = cnyPrice(
  '京东/天猫/DJI官网',
  'DJI Osmo Action 6 中国市场价格',
  'https://store.dji.com/cn/product/osmo-action-6',
);

export const DJI_OSMO_360_CN_PRICE = cnyPrice(
  '京东/天猫/DJI官网',
  'DJI Osmo 360 中国市场价格',
  'https://store.dji.com/cn/product/osmo-360',
);

export const DJI_NANO_CN_PRICE = cnyPrice(
  '京东/天猫/DJI官网',
  'DJI Osmo Nano 中国市场价格',
  'https://store.dji.com/cn/product/osmo-nano',
);

export const INSTA360_ACE_PRO_2_CN_PRICE = cnyPrice(
  '京东/天猫/Insta360官网',
  'Insta360 Ace Pro 2 中国市场价格',
  'https://www.insta360.com/cn/product/insta360-ace-pro2',
);

export const INSTA360_X5_CN_PRICE = cnyPrice(
  '京东/天猫/Insta360官网',
  'Insta360 X5 中国市场价格',
  'https://store.insta360.com/cn/product/x5',
);

export const INSTA360_GO_ULTRA_CN_PRICE = cnyPrice(
  '京东/天猫/Insta360官网',
  'Insta360 GO Ultra 中国市场价格',
  'https://store.insta360.com/cn/product/go-ultra',
);

export const GOPRO_MISSION_1_PRO_CN_PRICE = cnyPrice(
  '京东/天猫/GoPro官网',
  'GoPro MISSION 1 Pro 中国市场价格',
  'https://gopro.com/zh-cn/shop/cameras/mission-1-pro',
);

export const GOPRO_MISSION_1_CN_PRICE = cnyPrice(
  '京东/天猫/GoPro官网',
  'GoPro MISSION 1 中国市场价格',
  'https://gopro.com/zh-cn/shop/cameras/mission-1',
);

export const GOPRO_HERO13_CN_PRICE = cnyPrice(
  '京东/天猫/GoPro官网',
  'GoPro HERO13 Black 中国市场价格',
  'https://gopro.com/zh-cn/shop/cameras/hero13-black',
);
