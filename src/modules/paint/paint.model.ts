import { Schema, Document } from "mongoose";

export const Paint = new Schema({
  uuid: { type: String, required: true },
  item_name: { type: String, required: true },
  wear_name: { type: String, required: true },
  skin_name: { type: String, required: true },
  rarity_name: { type: String, required: true },
  uv_type: { type: String, required: true },
  texture: { type: String, required: true },
  defindex: { type: Number, required: true },
  paintindex: { type: Number, required: true },
  material: { type: String, required: true },
  uvscale: { type: String, required: true },
  slot: { type: String },
});

export class IPaint extends Document {
  readonly _id: Schema.Types.ObjectId;
  readonly uuid: string;
  readonly item_name: string;
  readonly wear_name: string;
  readonly skin_name: string;
  readonly rarity_name: string;
  readonly uv_type: string;
  readonly texture: string;
  readonly defindex: number;
  readonly paintindex: number;
  readonly material: string;
  readonly uvscale: string;
  readonly slot: string;
}
