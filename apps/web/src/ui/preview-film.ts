// Один реальный пример props для изолированной витрины, не источник каталога.
import type { Film } from "../content/types"
export const previewFilm: Film = {
  "id": "home-alone-1990",
  "title": "Один дома",
  "originalTitle": "Home Alone",
  "year": 1990,
  "genres": [
    "cozy",
    "comedy",
    "family"
  ],
  "origin": "research",
  "note": "Забытый дома на Рождество Кевин готовит хитрые ловушки для незваных грабителей.",
  "source": "https://www.wikidata.org/w/index.php?title=Q105031&oldid=2568295076&uselang=ru",
  "checkedAt": "2026-11-13",
  "poster": {
    "src": "images/films/home-alone-1990.webp",
    "alt": "Постер фильма «Один дома» (1990)",
    "width": 480,
    "height": 720,
    "source": "https://www.themoviedb.org/movie/771?language=ru-RU",
    "credit": "TMDB",
    "checkedAt": "2026-11-13"
  },
  "noteSource": "https://family.20thcenturystudios.com/movies/home-alone",
  "noteCheckedAt": "2026-11-13"
}
