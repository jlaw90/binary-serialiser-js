type Allocator = (minSize: number) => ArrayBufferLike;

export interface DataWriterOptions {
  allocator?: Allocator;
  buffer?: ArrayBufferLike;
  byteOffset?: number;
}

type DataViewFunctions<F extends Function> = { [K in keyof DataView]: DataView[K] extends F ? K: never }[keyof DataView];

type DataViewReadFunctions = DataViewFunctions<(offset: number) => number>;
type DataViewWriteFunctions = DataViewFunctions<(offset: number, value: number) => void>;

export class DynamicDataStream {
  private _buf: ArrayBuffer;
  private options: DataWriterOptions;
  private allocator: Allocator;
  private view: DataView;
  private offset = 0;

  constructor(options: DataWriterOptions = {}) {
    this._buf = options.buffer ?? new ArrayBuffer(5000);
    this.options = options;
    // @ts-ignore
    this.allocator = this.options.allocator ?? (size => new this._buf.__proto__.constructor(Math.floor((size * 3) / 2)));
    this.view = new DataView(this._buf, options.byteOffset);
  }

  // As the buffer can be re-allocated during writing, provide access to it
  get buffer() {
    return this._buf;
  }

  get byteLength() {
    return this._buf.byteLength;
  }

  get position() {
    return this.offset;
  }

  /* region reading */
  private readAndIncrement(method: DataViewReadFunctions, size: number): number {
    const value = this.view[method](this.offset);
    this.offset += size;
    return value;
  }

  getInt8() {
    return this.readAndIncrement('getInt8', 1);
  }

  getUint8() {
    return this.readAndIncrement('getUint8', 1);
  }

  getInt16() {
    return this.readAndIncrement('getInt16', 2);
  }

  getUint16() {
    return this.readAndIncrement('getUint16', 2);
  }

  getInt32() {
    return this.readAndIncrement('getInt32', 4);
  }

  getUint32() {
    return this.readAndIncrement('getUint32', 4);
  }

  getFloat32() {
    return this.readAndIncrement('getFloat32', 4);
  }

  getFloat64() {
    return this.readAndIncrement('getFloat64', 8);
  }

  getBytes(length: number) {
    const bytes = this._buf.slice(this.offset, this.offset + length);
    this.offset += length;
    return bytes;
  }

  getVariableLength() {
    // We encode 7-bits of numeric data in each byte, plus a continuation bit if there is more to read
    let read = 0, value = 0;
    do {
      read = this.getUint8();
      value = (value << 7) | (read & 0x7f);
    } while((read & 0x80) != 0);
    return value;
  }

  getString() {
    const data = new Uint16Array(this.getVariableLength());
    for(let i = 0; i < data.length; i++) {
      data[i] = this.getVariableLength();
    }
    // @ts-ignore
    return String.fromCharCode.apply(null, data);
  }
  /* endregion */

  /* region writing */
  private _ensureCapacity(length: number) {
    const neededCapacity = this.offset + length;
    if(this._buf.byteLength < neededCapacity) {
      // Re-allocate
      const data = this._buf;
      this._buf = this.allocator(neededCapacity);
      this.view = new DataView(this._buf, this.view.byteOffset);

      // Copy...
      new Uint8Array(this._buf).set(new Uint8Array(data));
    }
  }

  private writeAndIncrement(method: DataViewWriteFunctions, size: number, value: number): DynamicDataStream {
    this._ensureCapacity(size);
    this.view[method](this.offset, value);
    this.offset += size;
    return this;
  }

  putInt8(value: number) {
    return this.writeAndIncrement('setInt8', 1, value);
  }

  putUint8(value: number) {
    return this.writeAndIncrement('setUint8', 1, value);
  }

  putInt16(value: number) {
    return this.writeAndIncrement('setInt16', 2, value);
  }

  putUint16(value: number) {
    return this.writeAndIncrement('setUint16', 2, value);
  }

  putInt32(value: number) {
    return this.writeAndIncrement('setInt32', 4, value);
  }

  putUint32(value: number) {
    return this.writeAndIncrement('setUint32', 4, value);
  }

  putFloat32(value: number) {
    return this.writeAndIncrement('setFloat32', 4, value);
  }

  putFloat64(value: number) {
    return this.writeAndIncrement('setFloat64', 8, value);
  }

  putBytes(length: number) {
    const bytes = this._buf.slice(this.offset, this.offset + length);
    this.offset += length;
    return bytes;
  }

  putVariableLength(value: number) {
    let isWriting = false;
    // You can't shift more than 32 bits in javascript... (see https://stackoverflow.com/questions/6729122/javascript-bit-shift-number-wraps)
    // 64-bit numbers are out
    for(let i = 28; i >= 0; i -= 7) {
      let nibble = (value >>> i) & 0x7f;
      isWriting = isWriting || (nibble != 0) || i === 0;
      if (!isWriting) continue;
      if (i > 0) nibble |= 0x80; // If this isn't the LSB, set the continuation bit
      this.putUint8(nibble);
    }
    return this;
  }

  putString(value: string) {
    this.putVariableLength(value.length);
    for(let i = 0; i < value.length; i++) {
      this.putVariableLength(value.charCodeAt(i));
    }
    return this;
  }
  /* endregion */
}
