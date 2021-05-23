import deserialize from "./deserializer";
import { Type } from "./common";
import serialize from "./serializer";

const bufferFor = (data: (number | string)[]) =>
  new Uint8Array(
    data.flatMap((d) => {
      if (typeof d === "string") return [...d].map((c) => c.charCodeAt(0));
      return d;
    })
  ).buffer;

describe(deserialize, () => {
  it("correctly deserializes true", () => {
    expect(deserialize(bufferFor([Type.True]))).toEqual(true);
  });

  it("correctly deserializes false", () => {
    expect(deserialize(bufferFor([Type.False]))).toEqual(false);
  });

  it("correctly deserializes null", () => {
    expect(deserialize(bufferFor([Type.Null]))).toEqual(null);
  });

  it("correctly deserializes positive integers", () => {
    expect(
      deserialize(bufferFor([Type.PositiveInteger, 0x83, 0xff, 0x7f]))
    ).toEqual(65535);
  });

  it("correctly deserializes negative integers", () => {
    expect(
      deserialize(bufferFor([Type.NegativeInteger, 0x83, 0xff, 0x7f]))
    ).toEqual(-65535);
  });

  it("correctly deserializes floating point numbers", () => {
    expect(deserialize(bufferFor([Type.Float, 68, 2, 199, 225]))).toEqual(
      523.1231079101562
    );
  });

  it("correctly deserializes sets", () => {
    expect(
      deserialize(
        bufferFor([
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
        ])
      )
    ).toEqual(new Set([1, -3, "l", 9, 6]));
  });

  it("correctly deserializes arrays", () => {
    expect(
      deserialize(
        bufferFor([
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
        ])
      )
    ).toEqual([1, -3, "l", 9, 6]);
  });

  it("correctly deserializes maps", () => {
    expect(
      deserialize(
        bufferFor([
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
        ])
      )
    ).toEqual(
      new Map([
        [1, 2],
        [2, 4],
        [3, 6],
      ])
    );
  });

  it("correctly deserializes objects", () => {
    expect(
      deserialize(
        bufferFor([
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
        ])
      )
    ).toEqual({
      what: 1,
      the: [null],
      thing: false,
    });
  });

  it("correctly deserializes the serialized kitchen sink", () => {
    const kitchenSink = {
      i: "am an object",
      with: ["lots", "of", { things: "in it" }],
      sets: new Set([5, 7, 9, "lol"]),
      maps: new Map<any, any>([
        ["with", "indeterminate"],
        ["types", 11],
        [8, { something: "would you do this" }],
        [53, true],
        [17, false],
      ]),
      something: null,
      aNumber: 612961283,
      anotherNumber: -3000,
      aFloat: 908123.125,
    };

    const result = serialize(kitchenSink);
    expect(deserialize(result.buffer.slice(0, result.size))).toEqual(
      kitchenSink
    );
  });
});
