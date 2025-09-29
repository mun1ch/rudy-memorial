import { z } from "zod";

// Tribute validation
export const tributeSchema = z.object({
  displayName: z.string().max(100).optional().transform(val => val === "" ? undefined : val),
  message: z.string().min(10).max(2000),
  email: z.string().email().optional(),
});

export type TributeInput = z.infer<typeof tributeSchema>;

// Photo upload validation
export const photoUploadSchema = z.object({
  caption: z.string().max(500).optional(),
  file: z.instanceof(File).refine(
    (file) => file.size <= 10 * 1024 * 1024, // 10MB max
    "File size must be less than 10MB"
  ).refine(
    (file) => ["image/jpeg", "image/png", "image/heic", "image/heif"].includes(file.type),
    "Only JPEG, PNG, HEIC, and HEIF files are allowed"
  ),
});

export type PhotoUploadInput = z.infer<typeof photoUploadSchema>;

// Admin actions validation
export const approveContentSchema = z.object({
  id: z.string().uuid(),
  approved: z.boolean(),
});

export type ApproveContentInput = z.infer<typeof approveContentSchema>;

// Pagination validation
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
