import { z } from "zod";
import { AssetCondition, AssetStatus } from "@/app/generated/prisma/enums";

const optionalString = z
  .string()
  .trim()
  .transform((val) => (val === "" ? null : val))
  .nullable();

export const assetSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Asset name is required (min 2 chars).").max(100),
  categoryId: z.string().trim().min(1, "Asset category is required."),
  serialNumber: optionalString,
  
  acquisitionDate: z
    .string()
    .trim()
    .transform((val) => (val === "" ? null : new Date(val)))
    .nullable(),

  acquisitionCost: z
    .string()
    .trim()
    .transform((val) => {
      if (val === "") return null;
      const num = parseFloat(val);
      return isNaN(num) ? null : num;
    })
    .nullable(),

  condition: z.nativeEnum(AssetCondition),
  location: optionalString,
  
  sharedResource: z.preprocess(
    (val) => val === "on" || val === "true" || val === true,
    z.boolean()
  ),

  status: z.nativeEnum(AssetStatus),
  imagePath: optionalString,
  documentPath: optionalString,
  locationX: z
    .string()
    .trim()
    .transform((val) => (val === "" ? null : parseFloat(val)))
    .nullable()
    .optional(),
  locationY: z
    .string()
    .trim()
    .transform((val) => (val === "" ? null : parseFloat(val)))
    .nullable()
    .optional(),
});

export type AssetInput = z.infer<typeof assetSchema>;
