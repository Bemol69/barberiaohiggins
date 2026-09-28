import { z } from "zod";

const httpUrl = z
  .string()
  .trim()
  .refine((v) => v === "" || /^https?:\/\/\S+$/i.test(v), "Debe ser un enlace que empiece con https://");

const time = z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida");

export const businessSchema = z.object({
  name: z.string().trim().min(1, "Falta el nombre del negocio"),
  tagline: z.string().trim(),
  description: z.string().trim(),
  address: z.string().trim(),
  city: z.string().trim(),
  whatsapp: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v.length >= 8 && v.length <= 15, "WhatsApp: escribe el número con código de país, ej 56912345678"),
  instagram: z.string().trim().transform((v) => v.replace(/^@/, "")),
  facebook: httpUrl,
  bookingUrl: httpUrl,
  logoUrl: httpUrl,
  heroImageUrl: httpUrl,
  rating: z.string().trim(),
  reviewsCount: z.coerce.number().int().min(0),
});

export const serviceSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, "Hay un servicio sin nombre"),
  description: z.string().trim(),
  category: z.string().trim().min(1),
  price: z.coerce.number().int().min(0),
  durationMin: z.coerce.number().int().min(0),
  featured: z.boolean(),
  visible: z.boolean(),
});

export const memberSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, "Hay un profesional sin nombre"),
  role: z.string().trim(),
  photoUrl: httpUrl,
  visible: z.boolean(),
});

export const hoursSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  isOpen: z.boolean(),
  open: time,
  close: time,
});

export const photoSchema = z.object({
  id: z.string(),
  url: httpUrl.refine((v) => v !== "", "Hay una foto sin imagen"),
  caption: z.string().trim(),
});

export const reviewSchema = z.object({
  id: z.string(),
  author: z.string().trim().min(1, "Hay una reseña sin autor"),
  text: z.string().trim().min(1, "Hay una reseña sin texto"),
  rating: z.coerce.number().int().min(1).max(5),
});

export const contentSchema = z.object({
  business: businessSchema,
  services: z.array(serviceSchema),
  team: z.array(memberSchema),
  hours: z.array(hoursSchema).length(7),
  gallery: z.array(photoSchema),
  reviews: z.array(reviewSchema),
});

export type SiteContent = z.infer<typeof contentSchema>;
export type Business = SiteContent["business"];
export type ServiceItem = SiteContent["services"][number];
export type TeamMember = SiteContent["team"][number];
export type OpeningHours = SiteContent["hours"][number];
export type Photo = SiteContent["gallery"][number];
export type Review = SiteContent["reviews"][number];
