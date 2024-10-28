import { Schema, Document } from "mongoose";

export const Category = new Schema({
  uuid: { type: String, required: true },
  name: { type: String, required: true },
  type_name: { type: String, required: true },
  defindex: { type: Number, required: true },
});

export class ICategory extends Document {
  readonly _id: Schema.Types.ObjectId;
  readonly uuid: string;
  readonly name: string;
  readonly type_name: string;
  readonly defindex: number;
}
