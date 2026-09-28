import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, index } from "drizzle-orm/sqlite-core";

export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  tagline: text("tagline").notNull(),
  description: text("description").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  whatsapp: text("whatsapp").notNull(),
  instagram: text("instagram").notNull(),
  facebook: text("facebook").notNull().default(""),
  email: text("email").notNull().default(""),
  logoUrl: text("logo_url").notNull().default(""),
  heroImageUrl: text("hero_image_url").notNull().default(""),
  rating: text("rating").notNull().default("4.9"),
  reviewsCount: integer("reviews_count").notNull().default(0),
  slotMinutes: integer("slot_minutes").notNull().default(15),
});

export const services = sqliteTable("services", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  category: text("category").notNull().default("Barbería"),
  price: integer("price").notNull(),
  durationMin: integer("duration_min").notNull(),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const barbers = sqliteTable("barbers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  role: text("role").notNull().default("Barbero"),
  bio: text("bio").notNull().default(""),
  photoUrl: text("photo_url").notNull().default(""),
  instagram: text("instagram").notNull().default(""),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

/** weekday: 0 = domingo … 6 = sábado */
export const hours = sqliteTable("hours", {
  weekday: integer("weekday").primaryKey(),
  isOpen: integer("is_open", { mode: "boolean" }).notNull().default(true),
  openTime: text("open_time").notNull().default("10:00"),
  closeTime: text("close_time").notNull().default("20:00"),
});

export const bookingStatuses = ["pendiente", "confirmada", "completada", "cancelada", "no_asistio"] as const;
export type BookingStatus = (typeof bookingStatuses)[number];

export const bookings = sqliteTable(
  "bookings",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    serviceId: integer("service_id").references(() => services.id, { onDelete: "set null" }),
    barberId: integer("barber_id").references(() => barbers.id, { onDelete: "set null" }),
    serviceName: text("service_name").notNull(),
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone").notNull(),
    customerEmail: text("customer_email").notNull().default(""),
    notes: text("notes").notNull().default(""),
    date: text("date").notNull(), // YYYY-MM-DD (hora local Chile)
    time: text("time").notNull(), // HH:MM
    durationMin: integer("duration_min").notNull(),
    price: integer("price").notNull(),
    status: text("status", { enum: bookingStatuses }).notNull().default("pendiente"),
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  },
  (t) => [index("bookings_date_idx").on(t.date)],
);

export const gallery = sqliteTable("gallery", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  url: text("url").notNull(),
  caption: text("caption").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const reviews = sqliteTable("reviews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  author: text("author").notNull(),
  text: text("text").notNull(),
  rating: integer("rating").notNull().default(5),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export type Settings = typeof settings.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Barber = typeof barbers.$inferSelect;
export type Hours = typeof hours.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type GalleryItem = typeof gallery.$inferSelect;
export type Review = typeof reviews.$inferSelect;
