import Hashids from 'hashids'
import type { NumberLike } from 'hashids/util'
const secret = import.meta.env.VITE_SECRET_KEY || 'secret4324'
const hashBase62Generator = new Hashids(secret, 7)
export class HashGenerator {
  static encodeHash(id: number): string {
    return hashBase62Generator.encode(id)
  }
  static encode(id: number): string {
    return this.encodeHash(id)
  }
  static decodeHash(hash: string): NumberLike[] {
    return hashBase62Generator.decode(hash)
  }
  static decode(hash: string): NumberLike[] {
    return this.decodeHash(hash)
  }
}
