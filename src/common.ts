export type SerializableObject = { [K: string]: SerializableType };
export type SerializableArray = SerializableType[];
export type SerializableType =
  | SerializableObject
  | SerializableArray
  | string
  | number
  | boolean
  | null
  | Set<SerializableType>
  | Map<SerializableType, SerializableType>;

export enum Type {
  Object = "O",
  Array = "A",
  String = "S",
  PositiveInteger = "+",
  NegativeInteger = "-",
  Float = "F",
  Set = "U",
  Null = "N",
  Map = "M",
  True = "1",
  False = "0",
}
