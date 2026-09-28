# Barbería O'Higgins · web y panel

Sitio estático de Barbería O'Higgins (Alcázar 320, Rancagua) con panel `/admin` para que el dueño edite todo sin programar. Las reservas y consultas llegan por WhatsApp.

## Cómo funciona

| Qué | Dónde |
| --- | --- |
| Datos fijos (nombre, SEO, colores, fuentes, repo) | `tienda.config.json` |
| Contacto, redes y horario | `data/ajustes.json` |
| Textos, fotos de portada y preguntas frecuentes | `data/textos.json` |
| Servicios y precios (un archivo por servicio) | `data/servicios/*.json` |
| Categorías de la carta | `data/categorias/*.json` |
| Equipo | `data/equipo/*.json` |
| Galería y reseñas | `data/galeria.json`, `data/resenas.json` |
| Páginas (plantillas con `%%MARCADORES%%`) | `index.html`, `contacto.html`, `partials/` |
| Panel (Sveltia CMS) | `admin/config.yml` |

`scripts/build.mjs` arma `dist/` con los datos: escribe servicios, equipo, galería y reseñas dentro del HTML (para Google), más canonical, Open Graph, datos estructurados, `robots.txt` y `sitemap.xml`. Vercel lo ejecuta en cada cambio (`vercel.json`).

## Probar en local

```bash
node scripts/build.mjs
python -m http.server 5600 --directory dist
```

## Panel /admin

Cada cambio guardado en `/admin` crea un commit en la rama indicada en `tienda.config.json` (`github_rama`) y la web se vuelve a publicar sola. Para entrar sin cuenta de GitHub: token *fine-grained* del dueño del repo (solo este repositorio, permiso **Contents: Read and write**) → `/admin/` → «Iniciar sesión con un token de acceso».

Si se agrega un campo nuevo a algún JSON de `data/`, hay que agregarlo también en `admin/config.yml` (Sveltia descarta al guardar los campos que no conoce).
