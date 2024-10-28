import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { Injectable } from "@nestjs/common";
import { ICategory } from "./category.model";
import { CreateCategoryPayload } from "./payload/create.category.payload";
import { IGenericMessageBody } from "types/common";

/**
 * Category Service
 */
@Injectable()
export class CategoryService {
  constructor(
    @InjectModel("Category") private readonly categoryModel: Model<ICategory>,
  ) {}

  getAll(): Promise<ICategory[]> {
    return this.categoryModel.find().exec();
  }

  get(id: string): Promise<ICategory> {
    return this.categoryModel.findById(id).exec();
  }

  getByDefindex(defindex: number): Promise<ICategory> {
    return this.categoryModel.findOne({ defindex }).exec();
  }

  async create(payload: CreateCategoryPayload): Promise<ICategory> {
    const createdCategory = new this.categoryModel(payload);
    return createdCategory.save();
  }

  async createMany(payload: CreateCategoryPayload[]): Promise<ICategory[]> {
    const createdCategories = this.categoryModel.create(payload);
    return createdCategories;
  }

  async deleteAll(): Promise<IGenericMessageBody> {
    const res = await this.categoryModel.deleteMany({});
    if (res.deletedCount === 0) {
      throw new Error("No categories to delete.");
    } else {
      return { message: `Deleted` };
    }
  }
}
