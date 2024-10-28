import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { firstValueFrom, map } from "rxjs";
import { HttpService } from "@nestjs/axios";
import { ACGuard, UseRoles } from "nest-access-control";
import { ApiBearerAuth, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ConfigService } from "modules/config/config.service";
import { CategoryService } from "./category.service";
import { ICategory } from "./category.model";
import { CreateCategoryPayload } from "./payload/create.category.payload";
import { IGenericMessageBody } from "types/common";
import { GetAllCategoryResponse } from "./response/getAll.category.response";

@ApiBearerAuth()
@ApiTags("category")
@Controller("api/category")
export class CategoryController {
  constructor(
    private readonly config: ConfigService,
    private readonly httpService: HttpService,
    private readonly categoryService: CategoryService,
  ) {}

  @Get("/")
  @ApiResponse({
    status: 200,
    description: "Fetch Categories Request Received",
  })
  @ApiResponse({ status: 400, description: "Fetch Categories Request Failed" })
  async getCategories(): Promise<GetAllCategoryResponse[]> {
    const categories = await this.categoryService.getAll();

    if (!categories?.length) {
      return [];
    }

    return categories.map((cat) => ({
      uuid: cat.uuid,
      name: cat.name,
      defindex: cat.defindex,
      type_name: cat.type_name,
    }));
  }

  @Get(":defindex")
  @UseGuards(AuthGuard("jwt"))
  @ApiResponse({ status: 200, description: "Fetch Category Request Received" })
  @ApiResponse({ status: 400, description: "Fetch Category Request Failed" })
  async getCategory(@Param("defindex") defindex: number): Promise<ICategory> {
    const category = await this.categoryService.getByDefindex(defindex);
    if (!category) {
      throw new BadRequestException(
        "The category with that defindex could not be found.",
      );
    }
    return category;
  }

  @Post("/scrapping/defindexes")
  @UseGuards(AuthGuard("jwt"), ACGuard)
  @UseRoles({
    resource: "categories",
    action: "create",
    possession: "any",
  })
  @ApiResponse({
    status: 200,
    description: "Scrapping categories Request Received",
  })
  @ApiResponse({
    status: 400,
    description: "Scrapping categories Request Failed",
  })
  async scrapping(): Promise<IGenericMessageBody<CreateCategoryPayload[]>> {
    const res = await firstValueFrom<CreateCategoryPayload[]>(
      this.httpService
        .get(`${this.config.get("EXTERNAL_API_URL")}/skin/defindexes`)
        .pipe(map((response) => response.data)),
    );

    if (res?.length) {
      const data = res
        .filter((d) => !["Agent", "Gloves"].includes(d.type_name))
        .map((d) => (d.type_name ? d : { ...d, type_name: "Equipment" }));

      const exists = await this.categoryService.getAll();
      if (exists?.length) {
        await this.categoryService.deleteAll();
      }
      await this.categoryService.createMany(data);

      return {
        message: "Data has proceeded",
        data,
      };
    }

    return {
      message: "No data to process",
      data: [],
    };
  }
}
