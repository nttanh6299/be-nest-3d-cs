import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "modules/config/config.module";
import { PaintService } from "./paint.service";
import { PaintController } from "./paint.controller";
import { Paint } from "./paint.model";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: "Paint", schema: Paint }]),
    ConfigModule,
    HttpModule,
  ],
  providers: [PaintService],
  exports: [PaintService],
  controllers: [PaintController],
})
export class PaintModule {}
