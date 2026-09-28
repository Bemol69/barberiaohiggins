import type { SiteContent } from "./schema";

/**
 * Contenido inicial. La web lo muestra hasta que se guarden cambios desde /admin.
 * Datos reales (perfil de AgendaPro): dirección, WhatsApp, horario, calificación,
 * equipo, "Corte de Cabello" y "Corte Premium". El resto son precios de referencia
 * que hay que confirmar con el local.
 */
export const defaultContent: SiteContent = {
  business: {
    name: "Barbería O'Higgins",
    tagline: "Tradición y estilo en el corazón de Rancagua",
    description:
      "Barbería O'Higgins es un espacio donde la tradición y el estilo se unen. Ofrecemos cortes clásicos y modernos, perfilado de barba y masajes de relajación, en un ambiente cálido y profesional. Inspirados en el carácter del Libertador, buscamos reflejar elegancia, respeto y distinción en cada servicio.",
    address: "Alcázar 320",
    city: "Rancagua, Chile",
    whatsapp: "56961619679",
    instagram: "barberiaohiggins",
    facebook: "",
    bookingUrl: "",
    logoUrl: "",
    heroImageUrl: "",
    rating: "4.9",
    reviewsCount: 101,
  },
  services: [
    { id: "s1", name: "Corte de Cabello", description: "Corte clásico o moderno a tu medida, con máquina y tijera. Terminación prolija y lavado.", category: "Barbería", price: 13000, durationMin: 45, featured: true, visible: true },
    { id: "s2", name: "Corte Premium", description: "La experiencia completa: asesoría de estilo, corte detallado, toalla caliente y styling final.", category: "Barbería", price: 15990, durationMin: 60, featured: true, visible: true },
    { id: "s3", name: "Perfilado de Barba", description: "Diseño y perfilado con navaja, toalla caliente y aceites para barba.", category: "Barbería", price: 8000, durationMin: 30, featured: false, visible: true },
    { id: "s4", name: "Corte + Barba", description: "Corte de cabello y perfilado de barba en una sola sesión.", category: "Barbería", price: 18000, durationMin: 75, featured: true, visible: true },
    { id: "s5", name: "Masaje de Relajación", description: "Masaje de cuello, hombros y cuero cabelludo para desconectarte.", category: "Otros", price: 10000, durationMin: 30, featured: false, visible: true },
    { id: "s6", name: "Perfilado de Cejas", description: "Limpieza y definición de cejas con navaja.", category: "Otros", price: 3000, durationMin: 15, featured: false, visible: true },
  ],
  team: [
    { id: "t1", name: "Criss", role: "Barbero", photoUrl: "", visible: true },
    { id: "t2", name: "Daylan", role: "Barbero", photoUrl: "", visible: true },
    { id: "t3", name: "Benja", role: "Barbero", photoUrl: "", visible: true },
    { id: "t4", name: "Alejandro", role: "Barbero", photoUrl: "", visible: true },
  ],
  hours: [
    { weekday: 0, isOpen: false, open: "10:00", close: "14:00" },
    { weekday: 1, isOpen: true, open: "10:00", close: "20:00" },
    { weekday: 2, isOpen: true, open: "10:00", close: "20:00" },
    { weekday: 3, isOpen: true, open: "10:00", close: "20:00" },
    { weekday: 4, isOpen: true, open: "10:00", close: "20:00" },
    { weekday: 5, isOpen: true, open: "10:00", close: "20:00" },
    { weekday: 6, isOpen: true, open: "10:00", close: "17:00" },
  ],
  gallery: [],
  reviews: [],
};
