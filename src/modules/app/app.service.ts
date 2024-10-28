import { Injectable, Inject, OnModuleInit } from "@nestjs/common";
import { Logger } from "winston";
import * as fs from "fs";
import * as path from "path";
import { ConfigService } from "../config/config.service";

/**
 * Application Service
 */
@Injectable()
export class AppService implements OnModuleInit {
  /**
   * Constructor
   * @param {ConfigService} config configuration service
   * @param {Logger} logger logger service
   */
  constructor(
    private config: ConfigService,
    @Inject("winston") private readonly logger: Logger,
  ) {}

  onModuleInit() {
    const imagesPath = path.join(__dirname, "..", "..", "public", "images");
    const texturesPath = path.join(__dirname, "..", "..", "public", "textures");
    if (!fs.existsSync(imagesPath)) {
      fs.mkdirSync(imagesPath, { recursive: true });
    }
    if (!fs.existsSync(texturesPath)) {
      fs.mkdirSync(texturesPath, { recursive: true });
    }
  }

  /**
   * Fetches and logs the APP_URL environment variable from the configuration file.
   * @returns {string} the application url
   */
  root(): string {
    const appURL = this.config.get("APP_URL");
    this.logger.info("Logging the APP_URL -> " + appURL);
    return appURL;
  }
}
