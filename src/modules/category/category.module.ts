import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "../config/config.module";
import { CategoryService } from "./category.service";
import { CategoryController } from "./category.controller";
import { Category } from "./category.model";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: "Category", schema: Category }]),
    ConfigModule,
    HttpModule,
  ],
  providers: [CategoryService],
  exports: [CategoryService],
  controllers: [CategoryController],
})
export class CategoryModule {}
