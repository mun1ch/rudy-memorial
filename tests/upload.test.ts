import { describe, it, expect, vi } from "vitest";
import { submitPhoto, submitTribute } from "@/lib/actions";

// Mock the dependencies
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { id: "test-id" },
            error: null,
          })),
        })),
      })),
    })),
  })),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn(() => ({ success: true, remaining: 9, resetTime: Date.now() + 60000 })),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(() => Promise.resolve(new Headers())),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

describe("Upload Actions", () => {
  it("should submit tribute successfully", async () => {
    const formData = new FormData();
    formData.append("name", "John Doe");
    formData.append("message", "This is a test memory about Rudy.");

    await expect(submitTribute(formData)).resolves.not.toThrow();
  });

  it("should submit photo successfully", async () => {
    const formData = new FormData();
    const file = new File(["test content"], "test.jpg", { type: "image/jpeg" });
    formData.append("photo", file);
    formData.append("caption", "Test caption");
    formData.append("name", "John Doe");

    await expect(submitPhoto(formData)).resolves.not.toThrow();
  });

  it("should handle missing photo file", async () => {
    const formData = new FormData();
    formData.append("caption", "Test caption");
    formData.append("name", "John Doe");

    await expect(submitPhoto(formData)).rejects.toThrow("Please select a photo to upload.");
  });

  it("should handle empty message", async () => {
    const formData = new FormData();
    formData.append("name", "John Doe");
    formData.append("message", "");

    await expect(submitTribute(formData)).rejects.toThrow();
  });
});
