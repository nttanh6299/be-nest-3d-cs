import * as winston from "winston";
import * as rotateFile from "winston-daily-rotate-file";
import * as path from "path";
import { Module } from "@nestjs/common";
import { AccessControlModule } from "nest-access-control";
import { MongooseModule, MongooseModuleAsyncOptions } from "@nestjs/mongoose";
import { ServeStaticModule } from "@nestjs/serve-static";

import { ConfigModule } from "../config/config.module";
import { AuthModule } from "../auth/auth.module";
import { ProfileModule } from "../profile/profile.module";
import { WinstonModule } from "../winston/winston.module";
import { CategoryModule } from "../category/category.module";
import { PaintModule } from "../paint/paint.module";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { roles } from "./app.roles";
import { ConfigService } from "../config/config.service";

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        ({
          uri: configService.get("DB_URL"),
          useNewUrlParser: true,
          useUnifiedTopology: true,
        } as MongooseModuleAsyncOptions),
    }),
    WinstonModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return configService.isEnv("dev")
          ? {
              level: "info",
              format: winston.format.json(),
              defaultMeta: { service: "user-service" },
              transports: [
                new winston.transports.Console({
                  format: winston.format.simple(),
                }),
              ],
            }
          : {
              level: "info",
              format: winston.format.json(),
              defaultMeta: { service: "user-service" },
              transports: [
                new winston.transports.File({
                  filename: "logs/error.log",
                  level: "error",
                }),
                new winston.transports.Console({
                  format: winston.format.simple(),
                }),
                new rotateFile({
                  filename: "logs/application-%DATE%.log",
                  datePattern: "YYYY-MM-DD",
                  zippedArchive: true,
                  maxSize: "20m",
                  maxFiles: "14d",
                }),
              ],
            };
      },
    }),
    ServeStaticModule.forRoot({
      rootPath: path.join(__dirname, "..", "..", "public"),
      serveRoot: "/static",
    }),
    AccessControlModule.forRoles(roles),
    ConfigModule,
    AuthModule,
    ProfileModule,
    CategoryModule,
    PaintModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
