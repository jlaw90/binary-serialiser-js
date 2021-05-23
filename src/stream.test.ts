import { DynamicDataStream } from './stream';

const variableLengthEncoded: [number, number[]][] = [
  [0, [0]],
  [1, [1]],
  [127, [127]],
  [128, [0x81, 0]],
  [255, [0x81, 0x7f]],
  [256, [0x82, 0]],
  [16383, [0xff, 0x7f]],
  [16384, [0x81, 0x80, 0]],
];

const encodedStrings: [string, number[]][] = [
  ['', [0]],
  ['h', [1, 'h'.charCodeAt(0)]],
  ['hello', [5, 'h'.charCodeAt(0), 'e'.charCodeAt(0), 'l'.charCodeAt(0), 'l'.charCodeAt(0), 'o'.charCodeAt(0)]]
];

describe(DynamicDataStream, () => {
  test('putVariableLength', () => {
    for(const [value, expected] of variableLengthEncoded) {
      const stream = new DynamicDataStream();
      stream.putVariableLength(value);
      expect(stream.position).toEqual(expected.length)
      expect(new Uint8Array(stream.buffer.slice(0, expected.length))).toEqual(new Uint8Array(expected));
    }
  });

  test('getVariableLength', () => {
    for(const [expected, data] of variableLengthEncoded) {
      const uint8Array = new Uint8Array(data);
      const stream = new DynamicDataStream({ buffer: uint8Array.buffer });
      expect(stream.getVariableLength()).toEqual(expected);
    }
  });

  test('putString', () => {
    for(const [string, expected] of encodedStrings) {
      const stream = new DynamicDataStream({ buffer: new ArrayBuffer(0) });
      stream.putString(string);
      expect(stream.position).toEqual(expected.length);
      expect(new Uint8Array(stream.buffer.slice(0, expected.length))).toEqual(new Uint8Array(expected));
    }
  });

  test('getString', () => {
    for(const [expected, data] of encodedStrings) {
      const uint8Array = new Uint8Array(data);
      const stream = new DynamicDataStream({ buffer: uint8Array.buffer });
      expect(stream.getString()).toEqual(expected);
    }
  });
})
