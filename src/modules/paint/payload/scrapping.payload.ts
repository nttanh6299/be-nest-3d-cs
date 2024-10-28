import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class ScrappingPayload {
  /**
   * Scrapping Payload Class
   */
  @ApiProperty({
    required: true,
  })
  @IsNumber()
  @IsNotEmpty()
  defindex: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  slot: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  chunk: number;
}
