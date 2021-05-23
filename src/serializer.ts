import { DynamicDataStream } from "./stream";
import { SerializableObject, SerializableType, Type } from "./common";

export interface SerializerOptions {
  buffer?: ArrayBufferLike;
}

export interface SerializationResult {
  buffer: ArrayBufferLike;
  size: number;
}

const serializeType = (stream: DynamicDataStream, type: Type) =>
  stream.putUint8(type.charCodeAt(0));

const serializeString = (stream: DynamicDataStream, item: string) => {
  serializeType(stream, Type.String);
  stream.putString(item);
};

const serializeNumber = (stream: DynamicDataStream, item: number) => {
  if (Number.isInteger(item)) {
    serializeType(
      stream,
      item > 0 ? Type.PositiveInteger : Type.NegativeInteger
    );
    stream.putVariableLength(item > 0 ? item : -item);
  } else {
    serializeType(stream, Type.Float);
    stream.putFloat32(item);
  }
};

const serializeArrayLike = (
  stream: DynamicDataStream,
  item: ArrayLike<SerializableType>,
  type: Type
) => {
  serializeType(stream, type);
  const l = item.length;
  stream.putVariableLength(l);
  for (let i = 0; i < l; i++) {
    serializeEntry(stream, item[i]);
  }
};

const serializeMap = (
  stream: DynamicDataStream,
  map: Map<SerializableType, SerializableType>
) => {
  serializeType(stream, Type.Map);
  stream.putVariableLength(map.size);
  for (const [key, value] of map.entries()) {
    serializeEntry(stream, key);
    serializeEntry(stream, value);
  }
};

const serializeObject = (
  stream: DynamicDataStream,
  item: SerializableObject
) => {
  serializeType(stream, Type.Object);
  const items = Object.entries(item);
  stream.putVariableLength(items.length);
  for (const [key, value] of Object.entries(item)) {
    stream.putString(key);
    serializeEntry(stream, value);
  }
};

const serializeEntry = (stream: DynamicDataStream, item: SerializableType) => {
  if (item == null) {
    serializeType(stream, Type.Null);
    return;
  }

  switch (typeof item) {
    case "boolean":
      serializeType(stream, item ? Type.True : Type.False);
      break;
    case "string":
      serializeString(stream, item);
      break;
    case "number":
      serializeNumber(stream, item);
      break;
    case "object":
      if (item instanceof Set) {
        serializeArrayLike(stream, Array.from(item), Type.Set);
      } else if (item instanceof Array) {
        serializeArrayLike(stream, item, Type.Array);
      } else if (item instanceof Map) {
        serializeMap(stream, item);
      } else {
        serializeObject(stream, item);
      }
      break;
    default:
      throw new Error(
        `We do not know how to serialize an item of type ${typeof item}`
      );
  }
};

const serialize = (
  thing: SerializableType,
  options: SerializerOptions = {}
): SerializationResult => {
  const { buffer } = options;
  const stream = new DynamicDataStream({ buffer });

  serializeEntry(stream, thing);

  return {
    buffer: stream.buffer,
    size: stream.position,
  };
};

export default serialize;
