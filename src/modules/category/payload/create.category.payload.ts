import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class CreateCategoryPayload {
  @ApiProperty()
  @IsNotEmpty()
  uuid: string;

  @ApiProperty()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  type_name: string;

  @ApiProperty()
  @IsNotEmpty()
  defindex: number;
}
