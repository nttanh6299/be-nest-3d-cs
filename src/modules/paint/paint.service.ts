import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { Injectable } from "@nestjs/common";
import { IPaint } from "./paint.model";
import { CreatePaintPayload } from "./payload/create.paint.payload";
import { IGenericMessageBody } from "types/common";

/**
 * Paint Service
 */
@Injectable()
export class PaintService {
  constructor(
    @InjectModel("Paint") private readonly paintModel: Model<IPaint>,
  ) {}

  getAll(): Promise<IPaint[]> {
    return this.paintModel.find().exec();
  }

  get(id: string): Promise<IPaint> {
    return this.paintModel.findOne({ uuid: id }).exec();
  }

  getByPaintindex(paintindex: number): Promise<IPaint> {
    return this.paintModel.findOne({ paintindex }).exec();
  }

  getManyByDefindex(defindex: number): Promise<IPaint[]> {
    return this.paintModel.find({ defindex }).exec();
  }

  async create(payload: CreatePaintPayload): Promise<IPaint> {
    const createdPaint = new this.paintModel(payload);
    return createdPaint.save();
  }

  async createMany(payload: CreatePaintPayload[]): Promise<IPaint[]> {
    const createdPaints = this.paintModel.create(payload);
    return createdPaints;
  }

  async deleteAll(defindex: number): Promise<IGenericMessageBody> {
    const res = await this.paintModel.deleteMany({ defindex });
    if (res.deletedCount === 0) {
      throw new Error("No paints to delete.");
    } else {
      return { message: `Deleted` };
    }
  }
}
