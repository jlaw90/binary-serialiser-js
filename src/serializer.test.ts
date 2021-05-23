import serialize, { SerializationResult } from "./serializer";
import { Type } from "./common";

const expectResult = (
  result: SerializationResult,
  data: (string | number)[]
) => {
  expect(new Uint8Array(result.buffer.slice(0, result.size))).toEqual(
    new Uint8Array(
      data.flatMap((d) => {
        if (typeof d === "string") return [...d].map((c) => c.charCodeAt(0));
        return d;
      })
    )
  );
};

describe(serialize, () => {
  it("correctly serializes true", () => {
    const result = serialize(true);
    expect(result.size).toEqual(1);
    expectResult(result, [Type.True]);
  });

  it("correctly serializes false", () => {
    const result = serialize(false);
    expect(result.size).toEqual(1);
    expectResult(result, [Type.False]);
  });

  it("correctly serializes null", () => {
    const result = serialize(null);
    expect(result.size).toEqual(1);
    expectResult(result, [Type.Null]);
  });

  it("correctly serializes positive integers", () => {
    const result = serialize(65535);
    expect(result.size).toEqual(4);
    expectResult(result, [Type.PositiveInteger, 0x83, 0xff, 0x7f]);
  });

  it("correctly serializes negative integers", () => {
    const result = serialize(-65535);
    expect(result.size).toEqual(4);
    expectResult(result, [Type.NegativeInteger, 0x83, 0xff, 0x7f]);
  });

  it("correctly serializes floating point numbers", () => {
    const result = serialize(523.1231231);
    expect(result.size).toEqual(5);
    expectResult(result, [Type.Float, 68, 2, 199, 225]);
  });

  it("correctly serializes sets", () => {
    const result = serialize(new Set([1, -3, "l", 9, 6]));
    expect(result.size).toEqual(13);
    expectResult(result, [
      Type.Set,
      5,
      Type.PositiveInteger,
      1,
      Type.NegativeInteger,
      3,
      Type.String,
      1,
      "l",
      Type.PositiveInteger,
      9,
      Type.PositiveInteger,
      6,
    ]);
  });

  it("correctly serializes arrays", () => {
    const result = serialize([1, -3, "l", 9, 6]);
    expect(result.size).toEqual(13);
    expectResult(result, [
      Type.Array,
      5,
      Type.PositiveInteger,
      1,
      Type.NegativeInteger,
      3,
      Type.String,
      1,
      "l",
      Type.PositiveInteger,
      9,
      Type.PositiveInteger,
      6,
    ]);
  });

  it("correctly serializes maps", () => {
    const result = serialize(
      new Map([
        [1, 2],
        [2, 4],
        [3, 6],
      ])
    );
    expect(result.size).toEqual(14);
    expectResult(result, [
      Type.Map,
      3,
      Type.PositiveInteger,
      1,
      Type.PositiveInteger,
      2,
      Type.PositiveInteger,
      2,
      Type.PositiveInteger,
      4,
      Type.PositiveInteger,
      3,
      Type.PositiveInteger,
      6,
    ]);
  });

  it("correctly serializes objects", () => {
    const result = serialize({
      what: 1,
      the: [null],
      thing: false,
    });
    expect(result.size).toEqual(23);
    expectResult(result, [
      Type.Object,
      3,
      4,
      "what",
      Type.PositiveInteger,
      1,
      3,
      "the",
      Type.Array,
      1,
      Type.Null,
      5,
      "thing",
      Type.False,
    ]);
  });
});
