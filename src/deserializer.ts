import { DynamicDataStream } from "./stream";
import { SerializableType, Type } from "./common";

export interface DeserializerOptions {
  position?: number;
}

const deserializeArray = (stream: DynamicDataStream) => {
  const arr = new Array(stream.getVariableLength());
  const l = arr.length;
  for (let i = 0; i < l; i++) {
    arr[i] = deserializeEntry(stream);
  }

  return arr;
};

const deserializeMap = (stream: DynamicDataStream) => {
  const length = stream.getVariableLength();
  const map = new Map();
  for (let i = 0; i < length; i++) {
    const key = deserializeEntry(stream);
    const value = deserializeEntry(stream);
    map.set(key, value);
  }
  return map;
};

const deserializeObject = (stream: DynamicDataStream) => {
  const length = stream.getVariableLength();
  const obj: any = {};
  for (let i = 0; i < length; i++) {
    const key = stream.getString();
    obj[key] = deserializeEntry(stream);
  }
  return obj;
};

const deserializeEntry = (stream: DynamicDataStream): SerializableType => {
  const typ = String.fromCharCode(stream.getUint8()) as Type;
  switch (typ) {
    case Type.Null:
      return null;
    case Type.True:
      return true;
    case Type.False:
      return false;
    case Type.NegativeInteger:
      return -stream.getVariableLength();
    case Type.PositiveInteger:
      return stream.getVariableLength();
    case Type.Float:
      return stream.getFloat32();
    case Type.String:
      return stream.getString();
    case Type.Array:
      return deserializeArray(stream);
    case Type.Set:
      return new Set(deserializeArray(stream));
    case Type.Map:
      return deserializeMap(stream);
    case Type.Object:
      return deserializeObject(stream);
    default:
      throw new Error(`We do not know how to deserialize type ${typ}`);
  }
};

const deserialize = (
  buffer: ArrayBufferLike,
  options: DeserializerOptions = {}
) => {
  const { position = 0 } = options;
  const stream = new DynamicDataStream({ buffer, byteOffset: position });

  return deserializeEntry(stream);
};

export default deserialize;
