import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class CreatePaintPayload {
  @ApiProperty()
  @IsNotEmpty()
  uuid: string;

  @ApiProperty()
  @IsNotEmpty()
  skin_name: string;

  @ApiProperty()
  @IsNotEmpty()
  defindex: number;

  @ApiProperty()
  @IsNotEmpty()
  paintindex: number;
}
