import { pgTable, text, timestamp, uuid, boolean, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const contributors = pgTable("contributors", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  isAdmin: boolean("is_admin").default(false).notNull(),
});

export const photos = pgTable("photos", {
  id: uuid("id").defaultRandom().primaryKey(),
  storagePath: text("storage_path").notNull(),
  thumbPath: text("thumb_path").notNull(),
  caption: text("caption"),
  contributorId: uuid("contributor_id").references(() => contributors.id),
  width: integer("width"),
  height: integer("height"),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  approved: boolean("approved").default(false).notNull(),
  softDeleted: boolean("soft_deleted").default(false).notNull(),
});

export const tributes = pgTable("tributes", {
  id: uuid("id").defaultRandom().primaryKey(),
  displayName: text("display_name"),
  message: text("message").notNull(),
  contributorId: uuid("contributor_id").references(() => contributors.id),
  associatedPhotoId: uuid("associated_photo_id").references(() => photos.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  approved: boolean("approved").default(false).notNull(),
  softDeleted: boolean("soft_deleted").default(false).notNull(),
});

// Relations
export const contributorsRelations = relations(contributors, ({ many }) => ({
  photos: many(photos),
  tributes: many(tributes),
}));

export const photosRelations = relations(photos, ({ one, many }) => ({
  contributor: one(contributors, {
    fields: [photos.contributorId],
    references: [contributors.id],
  }),
  tributes: many(tributes),
}));

export const tributesRelations = relations(tributes, ({ one }) => ({
  contributor: one(contributors, {
    fields: [tributes.contributorId],
    references: [contributors.id],
  }),
  associatedPhoto: one(photos, {
    fields: [tributes.associatedPhotoId],
    references: [photos.id],
  }),
}));

// Types
export type Contributor = typeof contributors.$inferSelect;
export type NewContributor = typeof contributors.$inferInsert;

export type Photo = typeof photos.$inferSelect;
export type NewPhoto = typeof photos.$inferInsert;

export type Tribute = typeof tributes.$inferSelect;
export type NewTribute = typeof tributes.$inferInsert;
