# Manual de marca — Sistema Break (2 variantes)

El sistema Break tiene **dos variantes** derivadas de la misma familia visual:

| Variante | Cuándo usar | Referencia |
|---|---|---|
| **Deck** (Azahares) | Informes de resultados para clientes. Formato full-viewport con scroll-snap. Impactante, con gradiente signature. | [azahares-embudo-sep2026-v1.netlify.app](https://azahares-embudo-sep2026-v1.netlify.app/) |
| **Doc** (Nodo) | Docs, handoffs, guías internas, "cómo hacer X". Columna angosta de lectura, tono explicativo, un solo accent pink. | [performance-nodo-conexion-claude.netlify.app](https://performance-nodo-conexion-claude.netlify.app/) |

Ambas comparten el mismo lenguaje editorial (español rioplatense, declarativo, corto). Cambian el peso visual: deck es cinemático, doc es lectura sostenida.

Los tokens machine-readable viven en [tokens.json](tokens.json). Las secciones 1–11 describen la variante **deck**; la sección **12** describe la variante **doc**.

---

## 1. Identidad general

El informe se presenta como un **deck web scrolleable** de una sola página, con `scroll-snap` que engancha cada sección a viewport completo. No es un dashboard interactivo: es una narrativa cerrada — portada → embudo → pauta → venta → pipeline → próximos pasos — que se lee de arriba hacia abajo.

Voz editorial:
- Español rioplatense, declarativo, corto y punzante
- Títulos con dos tiempos: afirmación en negro + remate en gradient text (ej: *"Primer lote vendido. Dos más, en la mesa."*)
- Fechas: `25 jun → 10 sep 2026` (meses en minúscula, flecha unicode como separador)
- Cifras: siempre `font-variant-numeric: tabular-nums`
- Moneda principal ARS con equivalencia USD en línea secundaria

---

## 2. Logo y firma

No hay logo bitmap. La firma es **tipográfica**:

```
azahares·  ×  break·
```

- Wordmark en Inter, weight 400, `letter-spacing: -0.01em`, tamaño `1.2rem`
- Cada wordmark cierra con un **punto de 6×6 px** con el gradiente principal (`border-radius:50%`, `vertical-align:super`)
- La `×` entre clientes/agencia es gris (`--gray`), tamaño `0.8rem`
- Después de la firma va el contexto en microtipo uppercase: `INFORME COMERCIAL · META + PLANILLA`

**Adaptar a nuevo cliente:** cambiar solo el wordmark de la izquierda. Mantener `break·` a la derecha y el `×` como conector.

**Favicon:** SVG 32×32 con cuadrado `--black` de fondo y círculo de radio 8 con el gradiente. Definido inline en el `<link rel="icon">` como `data:image/svg+xml`.

---

## 3. Header y navegación

Estructura fija arriba, siempre visible:

```
┌────────────────────────────────────────────────────────┐
│ ▬▬▬▬▬▬▬▬▬▬▬ 2px gradient bar ▬▬▬▬▬▬▬▬▬▬▬               │
│ azahares· × break·  INFORME ...    ▬ ▬ ▬ ▬ ▬ ▬         │
└────────────────────────────────────────────────────────┘
```

- Barra superior de **2px** con el gradiente principal (elemento `.gb`)
- `nav`: flex space-between, padding `0.9rem clamp(16px,4vw,3rem)`
- Fondo `rgba(245,243,247,0.92)` + `backdrop-filter: blur(14px)`
- Borde inferior `1px solid #DDDDDD`

**No hay menú tradicional.** A la derecha se muestra un **pager** (mini indicador de progreso):
- Cada slide es un tramo de 22×3 px, gap 6 px
- Inactivo: gris `#B9B5BF`
- Activo: gradient primary (se actualiza por scroll via JS)
- Focus: outline azul 2px, offset 3px

En mobile (≤540 px) el pager se oculta.

---

## 4. Paleta

### 4.1. Neutros
| Rol | Hex | Uso |
|---|---|---|
| `--bg` | `#F5F3F7` | Fondo por defecto de secciones "de descanso" |
| `--black` | `#1B1B1D` | Texto principal y fondos de secciones de impacto |
| `--dark` | `#2A292A` | Alternativa a `--black` |
| `--gray` | `#656467` | Texto secundario, meta, eyebrows |
| `--light` | `#DDDDDD` | Bordes, tracks vacíos |
| `--border` | `#DDDDDD` | Bordes explícitos entre bloques |
| `--white` | `#FFFFFF` | Texto sobre negro, fondo de sección `.s-white` |

### 4.2. Marca (gradiente)
Los colores puros no se usan solos casi nunca — se usan como stops del gradiente signature.

| Rol | Hex | Uso puntual |
|---|---|---|
| Azul | `#0087F2` | Banda 3 del embudo (leads calificados) |
| Púrpura | `#BF4FCD` | Barras "best", subrayado de acciones |
| Rosa | `#E13B7D` | Banda final del embudo, viñetas de hotcard |
| Coral | `#EE394D` | `.pill` de alerta, conversiones "bad", barras "worst" |

### 4.3. Gradiente signature
```css
background: linear-gradient(135deg, #0087F2 0%, #BF4FCD 50%, #E13B7D 100%);
```

Aplicaciones:
- Barra superior del header (2 px)
- Punto del logo (6×6)
- Números destacados (con `background-clip: text`)
- Fills de gráficos "positivos" (barras `.best`, tracks `.done`)
- Orbes decorativos con `blur(90px)` y `opacity 0.09–0.14`
- Marcador final del timeline

### 4.4. Bandas del embudo (gradiente discreto)
Cuando se necesitan 7 pasos secuenciales, se usa una escala interpolada del propio gradiente:

```
#E4DFEA → #D2C9DC → #0087F2 → #5B6FE6 → #9658D6 → #C44BB8 → #E13B7D
```

Las dos primeras son lavandas claras (texto negro), las cinco siguientes son colores saturados (texto blanco).

### 4.5. Sobre fondo negro
- Texto fuerte: `#FFFFFF`
- Texto dim: `rgba(255,255,255,0.45)`
- Bordes: `rgba(255,255,255,0.14)`
- Superficie caliente (destacada): `#221F25` (KPI ganador), `#232026` (columna hot del pipeline)

---

## 5. Tipografía

**Familia única: Inter.** Cargada desde Google Fonts con weights 300, 400, 500, 600, 700, 800, 900. Fallback: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`.

| Rol | Tamaño | Weight | Tracking | Line-height |
|---|---|---|---|---|
| `h1` | `clamp(2.6rem, 6.6vw, 6rem)` | 900 | `-0.045em` | 0.93 |
| `h2` | `clamp(1.9rem, 3.8vw, 3.2rem)` | 800 | `-0.035em` | 1.04 |
| `h3` | `1.02rem` | 700 | `-0.01em` | — |
| Body | `15px` | 400 | — | 1.55 |
| Lede | `clamp(1rem, 1.3vw, 1.12rem)` | 300 | — | — |
| Eyebrow | `0.68rem` | 600 | `0.16em` UPPER | — |
| KPI number | `clamp(2.2rem, 4.2vw, 3.8rem)` | 900 | `-0.045em` | 1 |
| KPI label | `0.68rem` | 600 | `0.14em` UPPER | — |
| Meta / small | `0.72–0.85rem` | 400 | — | 1.4 |

Reglas:
- Todos los títulos llevan `text-wrap: balance`
- Los tracking negativos son fuertes (letra "apretada"): forma parte del look
- Los eyebrows y labels van en UPPERCASE con tracking amplio (`0.14–0.16em`)
- Los números siempre con `tabular-nums` para que las columnas alineen

**Gradient text:**
```css
.grad-text {
  background: var(--grad);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}
```
Reservado para: cierre de títulos (segunda frase), KPI ganador, remates de énfasis. No abusar — pierde impacto si aparece más de una vez por slide.

---

## 6. Layout y grilla

- **Container:** `.inner` con `max-width: 1180px`, `margin: 0 auto`
- **Slide:** `min-height: 100svh`, padding vertical `clamp(88px,11vh,116px) / clamp(40px,6vh,60px)`, padding horizontal `clamp(16px,5vw,4.5rem)`
- **3 fondos de sección:**
  - `.s-black` — fondo negro, texto blanco (portada, pipeline)
  - `.s-white` — fondo blanco, texto negro (venta, próximos pasos)
  - `.s-bg` — fondo lavanda claro `#F5F3F7` (embudo, pauta)

Rotar los fondos slide a slide crea el ritmo visual. La secuencia canónica es: **black → bg → bg → white → black → white**.

### Grillas típicas
- **KPIs (4 columnas):** `grid-template-columns: repeat(4,1fr)`, gap de 1px sobre fondo faint white
- **Facts (3 columnas):** `repeat(3,1fr)`, gap 1px sobre `--border`
- **Keys / hallazgos:** `repeat(3,1fr)` con gap `2rem`, cada card con `border-top: 2px solid --black`
- **Pipeline kanban:** `1.25fr 1fr 1fr 1fr` (columna hot ligeramente más ancha)
- **Timeline:** `repeat(6,1fr)` con línea horizontal en `top:7px`

### Breakpoints
- `≤900px` — colapsa a 1–2 columnas, oculta contexto secundario del header, timeline pasa a 3 columnas
- `≤540px` — todo a 1 columna, pager oculto, timeline a 2 columnas
- `prefers-reduced-motion` — todas las animaciones y `scroll-behavior:smooth` se apagan

---

## 7. Componentes clave

### 7.1. KPI card
Grid de KPIs sobre fondo negro. Cada card:
- Padding `1.5rem 1.5rem 1.3rem`
- Número grande (weight 900, tracking apretado)
- Label uppercase small
- Subtítulo opcional (equivalencia en USD, etc.) en `rgba(255,255,255,0.7)`
- Variante `.kpi.win` con fondo `#221F25` y número en `.grad-text`

### 7.2. Embudo trapezoidal
Layout de 3 columnas: costo por etapa (derecha alineada) | bandas (centro) | conversión (izquierda alineada).
- 7 bandas de altura fija `62px`, gap `5px`
- Cada banda usa `clip-path: polygon(...)` para dibujar un trapecio que se estrecha ~7% por paso
- Anchos: `100% → 86% → 72% → 60% → 49% → 39% → 30%`
- Animación `drop` con stagger `0.06s` por banda
- Colores de la banda: escala interpolada del gradient (ver 4.4)
- Bandas 1–2 llevan texto negro; 3–7 llevan texto blanco

### 7.3. Barra comparativa (`.cbar`)
Para comparar campañas / conjuntos:
- Row: nombre + valor grande a la derecha
- Track de `10px` con fill que anima con `grow 1.2s`
- Fill negro por defecto; `.best` → gradient; `.worst` → coral
- Divisores top/bottom con `--border`

### 7.4. Timeline
Cronología horizontal de hitos:
- Línea guía de 2 px en `top:7px` sobre `--light`
- Nodos de 16×16 px, redondos, fondo `--bg` con borde negro
- Nodo final `.end` con fill gradient y sin borde

### 7.5. Pipeline (kanban vertical)
Columnas sobre negro con separadores de 1 px de blanco faint. Una columna `.hot`:
- Fondo `#232026`
- Borde superior de 2 px con el gradient
- Contiene una hotcard destacada con monto grande y viñetas prefijadas con `—` en `--pink`

### 7.6. Pill
Etiqueta chica en coral para marcar atención (ej: "riesgo", "urgente"):
```css
.pill { font-size:.66rem; font-weight:700; letter-spacing:.14em; text-transform:uppercase; padding:.35rem .6rem; background:var(--coral); color:var(--white); }
```

### 7.7. Orbes decorativos
Blobs radiales para dar profundidad a secciones oscuras:
- `position: absolute`, `border-radius: 50%`
- `background: var(--grad)`, `opacity: 0.09–0.14`
- `filter: blur(90px)`
- `pointer-events: none`
- Se colocan fuera del container principal (right/top negativos)

---

## 8. Motion

- **Scroll-snap** vertical mandatory con `scroll-behavior: smooth`
- Dos keyframes reutilizables:
  - `@keyframes grow` — `scaleX(0) → scaleX(1)`, para fills de barras
  - `@keyframes drop` — `translateY(-8px) opacity 0.001 → 0`, para aparición de bandas y cards
- Timings estándar: `0.6s ease` (drops), `1.2s cubic-bezier(0.16,1,0.3,1)` (grows)
- Stagger de `0.06s` para elementos hermanos que aparecen juntos
- Media query `prefers-reduced-motion: reduce` desactiva todo

---

## 9. Estructura de un informe (6 slides canónicas)

| # | Fondo | Rol | Componentes típicos |
|---|---|---|---|
| 1 | `.s-black` | Portada + KPIs headline | orbes, 4 kpis, eyebrow con rango de fechas |
| 2 | `.s-bg` | Embudo | trapezoide 7 pasos, costo por etapa, conversión |
| 3 | `.s-bg` | Pauta / gasto | barras `.cbar` (best/worst), boxes laterales |
| 4 | `.s-white` | Venta / hito | timeline 6 pasos, 3 facts, 3 keys |
| 5 | `.s-black` | Pipeline | 4 columnas, una `.hot` con hotcard |
| 6 | `.s-white` | Próximos pasos | goal + gtrack (3 tercios), lista de actions, decisiones sobre negro |

Cada slide incluye:
- `.stag` eyebrow (contexto)
- `h1` (slide 1) o `h2` (resto) con cierre en `.grad-text`
- `.pnum` abajo a la derecha (`01 / 06`, `02 / 06`, ...) con tracking amplio

---

## 10. Reglas de uso para reportes dinámicos

Al generar un informe nuevo con este modelo:

1. **Sustitución de marca:** solo cambiar el wordmark izquierdo del header, el título del `<title>` y `<meta og:title>`, y el rango de fechas del `.stag` de portada. Todo el resto del sistema se preserva.
2. **KPIs de portada:** siempre 4. Si sobra uno, sacarlo — no rellenar con métricas de segundo orden. El 4to puede ser el "ganador" (`.kpi.win`).
3. **Título de portada:** dos frases. Primera en `--white`, segunda en `.grad-text`. Máximo ~7 palabras por frase.
4. **Gradient text:** una sola aparición por slide. Es el "punto de mira" de la sección.
5. **Números:** siempre con `tabular-nums`. Miles con punto, decimales con coma (locale es-AR).
6. **Fechas:** minúsculas, `→` como separador de rango. No usar `-`.
7. **Voz:** frases cortas y afirmativas. Cero adjetivos publicitarios ("increíble", "espectacular"). Los datos hablan solos.
8. **Density:** cada slide se lee en <15 segundos. Si un slide requiere scroll interno, hay que partirlo en dos.
9. **Colores puros vs gradiente:** los hex puros aparecen solo en gráficos (conversion bad/good, bandas de embudo). Fuera de gráficos, siempre gradiente o neutro.
10. **Mobile:** verificar el colapso — el pager desaparece, el eyebrow contextual del header se oculta, todo pasa a 1 columna.

---

## 11. Snippet de arranque

Bloque mínimo listo para copiar y llenar de contenido:

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>{{cliente}} · {{tipo_informe}}</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap">
  <style>
    :root{
      --bg:#F5F3F7; --black:#1B1B1D; --gray:#656467; --light:#DDDDDD; --white:#FFFFFF; --border:#DDDDDD;
      --blue:#0087F2; --purple:#BF4FCD; --pink:#E13B7D; --coral:#EE394D;
      --grad:linear-gradient(135deg,#0087F2 0%,#BF4FCD 50%,#E13B7D 100%);
    }
    body{margin:0;background:var(--bg);color:var(--black);font-family:'Inter',system-ui,sans-serif;font-size:15px;line-height:1.55}
    /* … resto de tokens en tokens.json … */
  </style>
</head>
<body>
  <div class="top">
    <div class="gb"></div>
    <nav>
      <div class="brand">
        <span class="logo">{{cliente_slug}}<span class="dot"></span></span>
        <span class="x">×</span>
        <span class="logo">break<span class="dot"></span></span>
        <span class="ctx">{{contexto}}</span>
      </div>
      <div class="pager"></div>
    </nav>
  </div>
  <!-- slides 1..N -->
</body>
</html>
```

---

Para el generador de informes: consumí siempre [tokens.json](tokens.json) como fuente de verdad. Este `.md` es la explicación de por qué está cada cosa; el `.json` es lo que un template engine debe interpolar.

---

## 12. Variante B — Doc / Handoff (modelo Nodo)

Complementaria al deck. Se usa cuando el output es un **documento explicativo** (guía de proceso, handoff técnico, playbook interno) y no un informe de resultados.

### 12.1. Diferencias clave con la variante deck

| | Deck (variante A) | Doc (variante B) |
|---|---|---|
| Formato | Slides full-viewport + scroll-snap | Columna angosta 860 px |
| Fuente | Inter 300-900 (Google Fonts) | System stack |
| Accent | Gradiente `#0087F2 → #BF4FCD → #E13B7D` | Pink sólido `#E8177A` |
| Fondos | Alternan black/white/lavender | Off-white (`#fafafa`) uniforme |
| h1 | 900, `-0.045em`, clamp hasta 6rem | 800, `-0.02em`, 34 px fijo |
| line-height body | 1.55 | 1.65 (más aireado, para lectura larga) |
| Componentes eje | KPI grid, embudo trapezoidal, timeline | Card, callout, flow, steps, table, tabs |

### 12.2. Paleta doc

| Rol | Hex | Uso |
|---|---|---|
| `--pink` | `#E8177A` | Único accent — kickers, arrow, active tab, border-left de callout, tag |
| `--pink-soft` | `#fce8f1` | Fondo del tag pill |
| `--ink` | `#1a1a1e` | Texto principal, badge de step |
| `--muted` | `#6b6b76` | Texto secundario, headers de tabla, meta |
| `--bg` | `#fafafa` | Fondo de la página |
| `--card` | `#ffffff` | Fondo de card |
| `--line` | `#e8e8ec` | Bordes |
| `--soft` | `#f4f4f7` | Fondo de callout, nodo de flow, código inline |
| `--ok` | `#0f8a5f` | Marca de éxito, checks |

No hay gradiente en esta variante. La cohesión con el deck la da el uso de pink (`#E13B7D` del deck y `#E8177A` del doc son perceptualmente muy cercanos: mismo hue, saturación levemente distinta).

### 12.3. Tipografía doc

```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif;
```

- Body `15px` / line-height `1.65`
- `.kicker` (13px, 700, `0.12em` uppercase, pink) — precede al h1
- `h1` 34px, weight 800, `-0.02em`
- `h2` 21px, weight 750, `-0.01em`
- `h3` 16px, weight 700
- `.sub` 16px, muted, `max-width 640px`

### 12.4. Componentes doc

- **Card:** `background: #fff; border: 1px solid --line; border-radius: 12px; padding: 24px 26px`. Es el contenedor base. Cada sección lógica va en su card.
- **Callout:** `border-left: 3px solid --pink; background: --soft; border-radius: 0 10px 10px 0; padding: 14px 18px`. El `<strong>` dentro se pinta pink. Se usa para "por qué así", "atajo", "si algo falla".
- **Flow:** grilla horizontal de nodos + flechas pink. Cada nodo: `background: --soft; border: 1px solid --line; border-radius: 10px; padding: 14px; text-align: center`. Arrow: `color: --pink; font-weight: 800; font-size: 18px`.
- **Steps:** filas con badge circular negro de 34 px + h3 + párrafo. Border-bottom entre ítems. Numeración manual desde 1.
- **Tabs:** botones con `border-bottom: 2.5px solid pink` en el activo. Los paneles se togglean con JS mínimo (`.panel.active`).
- **Table:** headers `12px uppercase` con `letter-spacing: 0.06em` en muted, `border-bottom: 2px solid --line`; cells `border-bottom: 1px solid --line`; primera columna en weight 600.
- **Tag pill:** `background: --pink-soft; color: --pink; border-radius: 20px; padding: 2px 10px; font-size: 11.5px; font-weight: 700`. Aparece al lado de un h2 para adjetivar la sección.
- **Code inline:** `background: --soft; border: 1px solid --line; border-radius: 5px; padding: 1.5px 6px; font-family: 'SF Mono', Menlo, Consolas, monospace`. Para nombres de archivos, fórmulas, valores literales.
- **.ok:** color `#0f8a5f` weight 700. Se usa junto a un `✓` para confirmar estado.

### 12.5. Estructura típica de un doc

```
header (kicker + h1 + sub)
tabs (opcional)
  panel 1
    card [h2 + flow]
    card [h2 + ul]
  panel 2
    card [h2 + steps]
    callout
  panel N
    card [h2 + table]
footer (mini, muted)
```

### 12.6. Voz para docs

- Se escribe en segunda persona ("Creá la planilla", "Verificá el acceso")
- Cada card responde una pregunta implícita ("cómo fluye la data", "qué necesitás antes")
- Los callouts explican el **por qué** o dan un **atajo**
- Se citan comandos, nombres de archivo, atajos de menú como `code inline`
- Cierre con footer minimalista: `Break · <tema> · <mes año>`

### 12.7. Cuándo elegir cuál

- Va al cliente y quiere ver **resultados** → **deck**
- Va al equipo y quiere **entender un proceso** → **doc**
- Mixto (reporte con explicación extensa) → deck, pero acortando texto de body a titulares
- One-pager comercial → doc (más rápido de generar, se lee lineal)

El renderer expone dos tools separadas: `render_report` (variante deck) y `render_doc` (variante doc).

