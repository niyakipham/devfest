/** World data types shared by generator, validator, renderer and server. */

export type PoiType =
  | 'SHOP'
  | 'FOOD'
  | 'LANDMARK'
  | 'QUEST_GIVER'
  | 'PHOTO_SPOT'
  | 'BENCH'
  | 'SHRINE'
  | 'WORKSHOP'
  | 'TRANSPORT'

export interface Poi {
  id: string
  type: PoiType
  name: string
  nameEn: string
  /** world metres, x = east, z = south */
  x: number
  z: number
  /** interaction radius in metres */
  radius: number
  tileId: string
  district: string
  street?: string
  /** 36-streets craft, e.g. "Bạc" (silver) */
  craft?: string
  /** optional dialogue / interaction key resolved by the game */
  action?: string
  /** opening hours in in-game minutes, e.g. [300, 600] */
  hours?: [number, number]
  /** free-form payload: food key, price, chapter... */
  payload?: Record<string, string | number | boolean>
}

export interface Street {
  id: string
  name: string
  nameEn: string
  craft: string
  /** polyline in world metres */
  points: Array<[number, number]>
  width: number
}

export interface Tile {
  id: string
  tx: number
  tz: number
  x0: number
  z0: number
  x1: number
  z1: number
  district: string
  hasRoad: boolean
}

export interface Building {
  id: string
  x: number
  z: number
  w: number
  d: number
  h: number
  /** degrees, around Y */
  rotY: number
  /** facade palette index 0..5 */
  palette: number
  street: string
}

export interface TreeInstance {
  x: number
  z: number
  scale: number
  hue: number
}
