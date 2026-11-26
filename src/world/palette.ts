/**
 * World palette — the ONLY place 3D material colours live.
 *
 * These are sampled from the reference art (see docs/MASTER_PROMPT_HANOI_60K_v3.md §3.2 A).
 * They are *not* CSS tokens: three.js cannot read CSS variables, and the renderer is
 * engine-free of the DOM. Keeping them here means the scene files never carry a hex
 * literal, which is what the design-token gate checks.
 *
 * Reference measurements (ImageMagick, 600×1200 screenshot):
 *   grass lit   #A6D344 / #B7D358 / #C6DA4F
 *   grass mid   #52A731
 *   foliage     #076B26 / #0E6B29
 *   water       #5FD0E0 → #17B8D9 → #044597
 *   sand        #E5E5BD      rock #AFAB95 / #456910
 */
export const WORLD = {
  // ground
  grass: '#7CC63F',
  grassLit: '#A6D344',
  grassMid: '#52A731',
  grassSun: '#C6DA4F',
  grassPatchA: '#97DA55',
  grassPatchB: '#6DBB39',
  grassPatchC: '#84CB46',

  // water
  waterShallow: '#5FD0E0',
  waterMid: '#17B8D9',
  waterDeep: '#044597',
  waterFoam: '#99DAE8',
  waterGlow: '#B6ECFA',
  lakeShore: '#D8CEA6',
  tealDeep: '#0E7FA8',

  // terrain
  sand: '#E5E5BD',
  rock: '#AFAB95',
  rockShade: '#456910',
  rockDark: '#8D9A6E',
  soil: '#7A6247',

  // vegetation
  foliage: '#076B26',
  foliageLit: '#4FBE4A',
  trunk: '#6B4F35',
  leafHueWarm: '#8FD44A',
  leafHueMid: '#63B944',
  leafHueCool: '#4E9F35',

  // architecture (Hoàn Kiếm)
  facadeCream: '#EADFC0',
  facadeWarm: '#E3BE97',
  facadeRose: '#B8735F',
  facadeSlate: '#6B7F92',
  roofA: '#B4674E',
  roofB: '#A25C48',
  roofTile: '#8E3B2E',
  wallWhite: '#F4EFE2',

  // landmarks
  stoneLight: '#9A9084',
  stoneMid: '#8B8276',
  stoneDeep: '#7E7466',
  stoneWarm: '#C4A98A',
  lacquerRed: '#A63A2C',
  lacquerRedDeep: '#8E2F23',
  bridgeRed: '#B4402F',
  bridgeRedDeep: '#8E2F23',
  goldLeaf: '#D9A441',

  // props / life
  lampGlow: '#FFF4D6',
  lampEmissive: '#D9A441',
  metalDark: '#4A443C',
  metalGrey: '#8E7F66',
  awningA: '#F2C14E',
  awningB: '#D9553F',
  personA: '#8B7A63',
  personB: '#6E7F6A',
  personC: '#A07A6B',
  personD: '#7A6C86',

  // scene extras (all colours the render layer references)
  skinWarm: '#DDB894',
  skinDeep: '#C08F63',
  primaryDeep: '#2A9A37',
  hairWarm: '#4A2B22',
  groundShade: '#5C6B48',
  islandGrass: '#93A06F',
  pavilionWall: '#B9A98A',
  pavilionShade: '#8E8064',
  lanternBody: '#3E4A42',
  lanternGlow: '#F7E3B4',
  lanternEmissive: '#F3CE8A',
  lakeWater: '#37AFD6',
  skin: '#E8C39E',
  hairDark: '#8A6A4A',
  kerbStone: '#B9B0A0',
  pavement: '#B7A88C',
  asphalt: '#4B4238',
  hillGreen: '#519B34',
  outfitStudent: '#6C7A89',
  outfitSmith: '#C97B63',
  outfitCyclo: '#7C8B9E',
  outfitCycloGreen: '#5E7E6B',
  outfitSinger: '#9A6F86',
  outfitDefault: '#4E7C6B',
  lacquerDark: '#7C3327',

  /* anime-style face (Genshin-inspired, original shapes — no third-party asset) */
  eyeWhite: '#FEFEF8',
  eyeGlint: '#FFFFFF',
  eyeLine: '#241D18',
  irisAmber: '#8A5A2B',
  irisDeep: '#52301F',
  blush: '#E59B80',
  rimLight: '#CFEAFF',
  shutterGreen: '#3F6B4F',   /* Hà Nội green shutters */
  signCream: '#F2E3BB',      /* shop-sign board cream */
  hullDark: '#1B2A22',       /* inverted-hull outline — dark leaf, not black */
  cloudWhite: '#FFFFFF',
  hoaPhuong: '#C8432B',     /* phượng vỹ — the May-June flame of Hà Nội */

  // sky (handled by atmosphere.ts, kept here for completeness)
  skyNight: '#24425A',
  skyDawn: '#CDEEF3',
  skyDay: '#BFE9F5',
  fogNight: '#2C4E5E',
  fogDawn: '#DCEEEC',
  fogDay: '#CFEAF2',
  sunWarm: '#FFD9A0',
  sunDay: '#FFF7DF',
} as const

export type WorldColor = keyof typeof WORLD
