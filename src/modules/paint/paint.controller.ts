import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { firstValueFrom, map } from "rxjs";
import { HttpService } from "@nestjs/axios";
import * as sharp from "sharp";
import * as fs from "fs";
import * as path from "path";
import { minBy } from "lodash";
import { ACGuard, UseRoles } from "nest-access-control";
import { ApiBearerAuth, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ConfigService } from "../config/config.service";
import { delay } from "../../helpers/common";
import { PaintService } from "./paint.service";
import { CreatePaintPayload } from "./payload/create.paint.payload";
import { IGenericMessageBody } from "types/common";
import { ScrappingPayload } from "./payload/scrapping.payload";
import { GetAllPaintResponse } from "./response/getAll.paint.response";

interface PaintFloatResponse {
  uuid: string;
}

interface PaintResponse {
  uuid: string;
  item_name: string;
  wear_name: string;
  skin_name: string;
  rarity_name: string;
  uvType: string;
  defindex: number;
  paintindex: number;
  texture: string;
  item: {
    paint_data: {
      paintablematerial0: {
        name: string;
        uvscale: string;
      };
    };
  };
}

@ApiBearerAuth()
@ApiTags("paint")
@Controller("api/paint")
export class PaintController {
  constructor(
    private readonly config: ConfigService,
    private readonly httpService: HttpService,
    private readonly paintService: PaintService,
  ) {}

  @Get(":uuid")
  @ApiResponse({ status: 200, description: "Fetch Paint Request Received" })
  @ApiResponse({ status: 400, description: "Fetch Paint Request Failed" })
  async getPaint(@Param("uuid") uuid: string): Promise<GetAllPaintResponse> {
    const paint = await this.paintService.get(uuid);
    if (!paint) {
      return null;
    }

    const res = {
      uuid: paint.uuid,
      skin_name: paint.skin_name,
      item_name: paint.item_name,
      wear_name: paint.wear_name,
      rarity_name: paint.rarity_name,
      material: paint.material,
      slot: paint.slot,
      texture: paint.texture,
      uv_type: paint.uv_type,
      uvscale: paint.uvscale,
      defindex: paint.defindex,
      paintindex: paint.paintindex,
    };

    return res;
  }

  @Get("/defindex/:defindex")
  @ApiResponse({ status: 200, description: "Fetch Paint Request Received" })
  @ApiResponse({ status: 400, description: "Fetch Paint Request Failed" })
  async getPaints(
    @Param("defindex") defindex: number,
  ): Promise<GetAllPaintResponse[]> {
    const paints = await this.paintService.getManyByDefindex(defindex);

    if (!paints?.length) {
      return [];
    }

    return paints.map((cat) => ({
      uuid: cat.uuid,
      skin_name: cat.skin_name,
      item_name: cat.item_name,
      wear_name: cat.wear_name,
      rarity_name: cat.rarity_name,
      material: cat.material,
      slot: cat.slot,
      texture: cat.texture,
      uv_type: cat.uv_type,
      uvscale: cat.uvscale,
      defindex: cat.defindex,
      paintindex: cat.paintindex,
    }));
  }

  @Post("/scrapping/paintindexes")
  @UseGuards(AuthGuard("jwt"), ACGuard)
  @UseRoles({
    resource: "paints",
    action: "create",
    possession: "any",
  })
  @ApiResponse({
    status: 200,
    description: "Scrapping paints Request Received",
  })
  @ApiResponse({
    status: 400,
    description: "Scrapping paints Request Failed",
  })
  async scrappingPaintindexes(
    @Body() payload: ScrappingPayload,
  ): Promise<IGenericMessageBody<number>> {
    try {
      const { defindex, slot, chunk = 5 } = payload;
      const res = await firstValueFrom<CreatePaintPayload[]>(
        this.httpService
          .get(
            `${this.config.get(
              "EXTERNAL_API_URL",
            )}/skin/paintindexes?defindex=${defindex}`,
          )
          .pipe(map((response) => response.data)),
      );

      if (!res?.length) {
        return {
          message: "No data to process",
          data: 0,
        };
      }

      const paints = res.map((item) => ({ ...item, defindex }));
      const promises = paints.map(async (paint) => {
        const { paintindex } = paint;
        const floatResponse = await firstValueFrom<PaintFloatResponse[]>(
          this.httpService
            .get(
              `${this.config.get(
                "EXTERNAL_API_URL",
              )}/skin/floatlist?defindex=${defindex}&paintindex=${paintindex}`,
            )
            .pipe(map((response) => response.data)),
        );
        const chunkData = floatResponse.slice(0, chunk);
        const resSkins = await Promise.all(
          chunkData.map((item) =>
            firstValueFrom<PaintResponse>(
              this.httpService
                .get(
                  `${this.config.get("EXTERNAL_API_URL")}/skin/uuid?uuid=${
                    item.uuid
                  }`,
                )
                .pipe(map((response) => response.data)),
            ),
          ),
        );
        const item = minBy(
          resSkins.filter((item) => !!item.uvType),
          "floatvalue",
        );

        return {
          ...paint,
          uuid: item.uuid,
          item_name: item.item_name,
          wear_name: item.wear_name,
          skin_name: item.paintindex === 0 ? "Vanilla" : item.skin_name,
          rarity_name: item.rarity_name,
          uv_type: item.uvType,
          defindex: item.defindex,
          paintindex: item.paintindex,
          texture: item.texture,
          material: item.item.paint_data.paintablematerial0.name,
          uvscale: item.item.paint_data.paintablematerial0.uvscale,
        };
      });

      let fetchedPaints = await Promise.all(promises);

      if (slot) {
        fetchedPaints = fetchedPaints.map((item) => ({ ...item, slot }));
      }

      const exists = await this.paintService.getManyByDefindex(defindex);
      if (exists?.length) {
        await this.paintService.deleteAll(defindex);
      }
      const created = await this.paintService.createMany(fetchedPaints);

      return {
        message: "Data has proceeded",
        data: created?.length || 0,
      };
    } catch (err) {
      Logger.log(err);
      return {
        message: "No data to process",
        data: 0,
      };
    }
  }

  @Post("/scrapping/paintindex/thumbnail")
  @UseGuards(AuthGuard("jwt"), ACGuard)
  @UseRoles({
    resource: "paints",
    action: "update",
    possession: "any",
  })
  @ApiResponse({
    status: 200,
    description: "Scrapping paint thumbnail Request Received",
  })
  @ApiResponse({
    status: 400,
    description: "Scrapping paint thumbnail Request Failed",
  })
  async scrappingThumbnail(
    @Body() payload: ScrappingPayload,
  ): Promise<IGenericMessageBody<{ paintCount: number }>> {
    const { defindex } = payload;
    const paints = await this.paintService.getManyByDefindex(defindex);

    if (paints?.length) {
      const imagePaths = paints.map(
        (item) =>
          `${this.config.get("EXTERNAL_IMAGE_URL")}/${item.uuid}_icon.png`,
      );

      const promises = imagePaths.map(async (url) => {
        const name = url.split("/").pop().replace(".png", "");
        const outputFilePath = path.join(
          __dirname,
          "..",
          "..",
          "public",
          "images",
          `${name}.webp`,
        );

        const response = await firstValueFrom(
          this.httpService
            .get(url, { responseType: "stream" })
            .pipe(map((response) => response)),
        );

        await delay(500);

        const transformer = sharp().resize(256, 256).webp({ quality: 100 });
        response.data
          .pipe(transformer)
          .pipe(fs.createWriteStream(outputFilePath));

        await new Promise((resolve, reject) => {
          transformer.on("end", resolve);
          transformer.on("error", reject);
        });
      });

      await Promise.all(promises);

      return {
        message: "Success",
        data: {
          paintCount: paints.length,
        },
      };
    }

    return {
      message: "No data to process",
      data: {
        paintCount: 0,
      },
    };
  }

  @Post("/scrapping/paintindex/texture")
  @UseGuards(AuthGuard("jwt"), ACGuard)
  @UseRoles({
    resource: "paints",
    action: "update",
    possession: "any",
  })
  @ApiResponse({
    status: 200,
    description: "Scrapping paint texture Request Received",
  })
  @ApiResponse({
    status: 400,
    description: "Scrapping paint texture Request Failed",
  })
  async scrappingTexture(
    @Body() payload: ScrappingPayload,
  ): Promise<IGenericMessageBody<{ paintCount: number }>> {
    const { defindex } = payload;
    const paints = await this.paintService.getManyByDefindex(defindex);

    if (paints?.length) {
      const defindexPath = path.join(
        __dirname,
        "..",
        "..",
        "public",
        "textures",
        `${defindex}`,
      );
      if (!fs.existsSync(defindexPath)) {
        fs.mkdirSync(defindexPath, { recursive: true });
      }
      const promises = paints.map(async (item) => {
        const imagePath = `${this.config.get("EXTERNAL_TEXTURE_URL")}/${
          item.texture
        }_component1_texture1.png`;
        const response = await firstValueFrom(
          this.httpService
            .get(imagePath, { responseType: "stream" })
            .pipe(map((response) => response)),
        );

        await delay(500);

        const paintindexPath = path.join(defindexPath, `${item.texture}.webp`);
        const transformer = sharp().webp({ quality: 100 });
        response.data
          .pipe(transformer)
          .pipe(fs.createWriteStream(paintindexPath));

        await new Promise((resolve, reject) => {
          transformer.on("end", resolve);
          transformer.on("error", reject);
        });
      });

      await Promise.all(promises);

      return {
        message: "Success",
        data: {
          paintCount: paints.length,
        },
      };
    }

    return {
      message: "No data to process",
      data: {
        paintCount: 0,
      },
    };
  }
}
