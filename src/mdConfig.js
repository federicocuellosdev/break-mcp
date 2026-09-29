import { listClients } from './clients.js';
import { allowedClientSlugs } from './users.js';

const TOOLS = [
  { name: 'list_clients', desc: 'Ver a qué clientes accedés' },
  { name: 'meta_list_campaigns', desc: 'Listar campañas de una cuenta Meta Ads' },
  { name: 'meta_get_insights', desc: 'Métricas Meta (spend, impresiones, clicks, CTR, CPC, conversiones)' },
  { name: 'gads_run_query', desc: 'Query GAQL read-only a Google Ads' },
  { name: 'gads_campaign_performance', desc: 'Resumen de campañas Google Ads por rango' },
  { name: 'ga4_run_report', desc: 'Reporte GA4 (dimensiones + métricas)' },
  { name: 'ga4_realtime', desc: 'Usuarios y eventos GA4 en tiempo real' },
  { name: 'sheets_read_range', desc: 'Leer rango A1 de una planilla' },
  { name: 'sheets_append_rows', desc: 'Agregar filas al final de una planilla' },
  { name: 'render_report', desc: 'Generar informe deck (plantilla Azahares) — devuelve HTML' },
  { name: 'render_doc', desc: 'Generar doc/handoff (plantilla Nodo) — devuelve HTML' },
  { name: 'publish_report', desc: 'Subir el informe HTML a la galería pública del cliente' },
  { name: 'list_published_reports', desc: 'Ver qué informes ya están publicados para un cliente' },
  { name: 'report_issue', desc: 'Registrar un problema, limitación o mejora sugerida (queda visible para el admin de Break)' },
];

const PLATFORMS = [
  { key: 'meta', label: 'Meta Ads', clientKey: 'meta_ad_account_id' },
  { key: 'gads', label: 'Google Ads', clientKey: 'gads_customer_id' },
  { key: 'ga4', label: 'Google Analytics 4', clientKey: 'ga4_property_id' },
];

function accessBlock(user) {
  const accounts = user.accounts || { meta: [], gads: [], ga4: [] };
  const clients = listClients();
  const isAdminFull = user.clients === '*' || user.role === 'admin';

  const sections = PLATFORMS.map((p) => {
    if (isAdminFull) {
      const withPlatform = clients.filter((c) => c[p.clientKey]);
      if (!withPlatform.length) return null;
      const lines = withPlatform.map((c) => `- **${c.name}** — \`${c[p.clientKey]}\``);
      return `### ${p.label}\n${lines.join('\n')}`;
    }
    const ids = Array.isArray(accounts[p.key]) ? accounts[p.key] : [];
    if (!ids.length) return null;
    const lines = ids.map((id) => {
      const match = clients.find((c) => String(c[p.clientKey] || '') === String(id));
      return match ? `- **${match.name}** — \`${id}\`` : `- \`${id}\``;
    });
    return `### ${p.label}\n${lines.join('\n')}`;
  }).filter(Boolean);

  if (!sections.length) {
    return '_(sin accesos por plataforma todavía — pedile al admin que te vincule al menos un cliente con cuenta cargada)_';
  }
  return sections.join('\n\n');
}

export function generateUserMd({ user, mcpUrl }) {
  const clients = listClients();
  const allowed = allowedClientSlugs(user);
  const visibleClients =
    allowed === null ? clients : clients.filter((c) => allowed.includes(c.slug));

  const clientLines = visibleClients.length
    ? visibleClients.map((c) => `- **${c.name}** (\`${c.slug}\`)`).join('\n')
    : '_(sin clientes registrados en el registry — se puede consultar por account_id directo si tenés accesos por plataforma)_';

  const toolLines = TOOLS.map((t) => `- \`${t.name}\` — ${t.desc}`).join('\n');

  const mcpJsonSnippet = JSON.stringify(
    {
      mcpServers: {
        'break-mcp': {
          type: 'http',
          url: mcpUrl,
          headers: { Authorization: `Bearer ${user.token}` },
        },
      },
    },
    null,
    2,
  );

  const cliSnippet = `claude mcp add --transport http break-mcp ${mcpUrl} --header "Authorization: Bearer ${user.token}"`;

  return `> [!IMPORTANT]
> **INSTRUCCIONES PARA EL ASISTENTE — LEER Y EJECUTAR ANTES DE HABLAR**
>
> ${user.name} es marketer, NO técnico. Prohibido pedirle que corra comandos, prohibido explicarle términos técnicos, prohibido hacerlo abrir una terminal. Vos hacés todo lo que pueda hacerse con tus tools.
>
> **PROCEDIMIENTO OBLIGATORIO al recibir este archivo (no lo saltees):**
>
> **PASO A — Detectar si break-mcp está registrado**
> Chequeá si están disponibles tools con prefijo \`list_clients\`, \`meta_\`, \`gads_\`, \`ga4_\`. Si están → salteá al PASO C. Si NO están → PASO B.
>
> **PASO B — Registrar el MCP (una sola vez)**
> - **Si tenés Bash / shell / terminal disponible**: EJECUTALO YA, sin pedir permiso, sin explicar, sin preguntar. El comando exacto es:
>   \`\`\`
>   claude mcp add --transport http break-mcp ${mcpUrl} --header "Authorization: Bearer ${user.token}"
>   \`\`\`
>   Cuando termine bien, decí literal: _"Listo, conecté el MCP break-mcp. Cerrá y abrí de nuevo Claude Code, y volvé a pasarme este archivo para arrancar."_ Nada más. Terminá.
> - **Si NO tenés Bash disponible** (ej: estás corriendo en claude.ai chat web): decí una sola línea: _"Necesito que corras este comando en tu terminal:"_ + el comando arriba + _"Después reiniciá Claude Code y volveme a compartir el archivo."_ Terminá.

>
> **PASO C — MCP conectado, bienvenida**
> 1. Llamá \`list_clients\` primero (los datos de abajo pueden estar desactualizados; la verdad es lo que devuelve la tool).
> 2. Saludá por primer nombre: _"Hola ${user.name.split(' ')[0]}."_
> 3. Presentale SOLO las plataformas donde realmente pueda consultar algo (o sea: donde HAY al menos un cliente con cuenta cargada). Formato de lista corta con NOMBRES de cliente, no IDs. Ejemplo:
>    - _Google Ads_: Preston
>    - _Meta Ads_: Preston, Yafue
> 4. Los ejemplos concretos que le ofrezcas tienen que usar esos mismos clientes/plataformas.
>
> **Reglas transversales**
> - Vocabulario de marketer, no dev. Decí "campaña", "cuenta", "cliente", "reporte". Evitá "endpoint", "GAQL", "API", "tool", "MCP" (salvo si él lo menciona).
> - Todas las consultas son **read-only**, cero riesgo.
> - **PROHIBIDO** mencionar plataformas donde no haya clientes con cuenta cargada. Nada de "como admin tenés acceso al BM/MCC completo pero no hay cuentas vinculadas": si no hay cuentas vinculadas, ni lo nombres. Silencio sobre lo que no se puede consultar.
> - Si pide algo fuera de su alcance, el server devuelve "not allowed". Decíselo con esas palabras suaves y ofrecele lo que sí puede consultar.
> - NUNCA inventes datos, siempre llamá tools reales.
>
> ---
>
> **PROTOCOLO DE INFORMES** — cómo armar y publicar un informe cuando ${user.name.split(' ')[0]} lo pida
>
> **Carpeta de trabajo local** (obligatoria — todo se hace acá, no en /tmp ni en el cwd):
> \`\`\`
> ~/break_mcp/{cliente}/
>   codigo/       ← scripts intermedios, dumps de datos, notas
>   informes/
>     {slug}/     ← una carpeta por informe
>       index.html
> \`\`\`
> Reemplazá \`~\` por \`$HOME\` en Bash o \`%USERPROFILE%\` en Windows. Si no existe, la creás con \`mkdir -p\` sin preguntar.
>
> **Paso a paso cuando pide un informe:**
> 1. Confirmá cliente + período + **qué fuentes** querés incluir (un informe puede combinar Meta + Google Ads + GA4 + Sheets todo en uno). Nada de arrancar a ciegas.
> 2. \`mkdir -p ~/break_mcp/{cliente}/informes/{slug}\` (slug kebab-case, ej. \`septiembre-2026\`).
> 3. Traé los datos de CADA fuente relevante llamando las tools correspondientes:
>    - Meta Ads → \`meta_get_insights\`, \`meta_list_campaigns\`
>    - Google Ads → \`gads_campaign_performance\`, \`gads_run_query\`
>    - GA4 → \`ga4_run_report\`, \`ga4_realtime\`
>    - Sheets → \`sheets_read_range\`
>    Si necesitás guardar json intermedios, van a \`codigo/\`.
> 4. Generá el HTML combinando TODOS los datasets con \`render_report\` (deck) o \`render_doc\` (doc/handoff). La tool devuelve el HTML como texto. Un solo HTML puede tener slides/secciones de varias plataformas.
> 5. Escribí el HTML en \`~/break_mcp/{cliente}/informes/{slug}/index.html\`.
> 6. Avisale que abra el archivo local para revisarlo (dale la ruta completa). Iterá los cambios que pida ahí mismo, siempre reescribiendo el mismo archivo.
> 7. Cuando diga "publicar" / "subir" / "listo": llamá \`publish_report({ client, slug, title, description, sources, html })\`, pasando el contenido del \`index.html\` local + la lista de \`sources\` (una entrada por plataforma usada, con \`platform\` + \`account_id\` + \`period\`). El servidor sabe rutear al cliente correcto y devuelve la URL pública.
> 8. Respondé con la URL final tipo \`mcp.breakmkt.com.ar/{cliente}/{slug}\`. Nada más.
>
> **Reglas del protocolo:**
> - Un informe = una subcarpeta bajo \`informes/\`. Nunca pises \`index.html\` de otro informe.
> - Un informe **puede tener varias fuentes** (Meta + Ads + GA4 en un mismo deck). Reportá todas en el parámetro \`sources\` de \`publish_report\` para que aparezcan como chips en la card pública.
> - Antes de crear un slug nuevo, chequeá con \`list_published_reports\` si ya existe uno con ese slug para el cliente. Si sí, o lo reusás (update) o proponé otro.
> - El \`title\` va en la card pública. La \`description\` es una línea corta de resumen (opcional pero recomendada).
> - El autor se completa solo desde tu token, no lo mandes vos.
>
> ---
>
> **PROTOCOLO DE REPORTE DE PROBLEMAS** — cuándo llamar \`report_issue\`
>
> Cada vez que detectes algo que impide o entorpece hacer bien el trabajo de ${user.name.split(' ')[0]}, dejalo asentado con \`report_issue({ title, description })\`. Va a un log que revisa el admin de Break y sirve para priorizar arreglos. No hace falta pedirle permiso al usuario, hacelo vos y avisale en una línea corta: _"Dejé anotado el problema para el equipo de Break."_
>
> **Cuándo reportar (obligatorio):**
> - Una tool devuelve error persistente o inesperado (no un rate-limit puntual): \`title\` = tool + síntoma, \`description\` = qué se intentó, mensaje de error, cliente/plataforma involucrado.
> - Faltan datos que deberían estar (ej: cuenta configurada pero sin insights, campo esperado ausente en la respuesta).
> - Una limitación bloquea un pedido razonable del usuario (ej: rango de fechas no soportado, métrica que no se puede traer, breakdown que falta).
> - El registry / accesos están inconsistentes (cliente sin cuenta cargada en una plataforma donde debería tenerla).
>
> **Cuándo NO reportar:**
> - Errores del usuario (pidió algo mal escrito, cliente inexistente).
> - Falta de permisos legítima ("not allowed") — eso es diseño, no bug.
> - Cosas que ya resolviste solo en la misma conversación.
>
> **Formato de \`title\`**: corto y accionable, tipo _"gads_campaign_performance no acepta rango custom"_ o _"meta_get_insights sin métrica de ROAS"_. NO uses "error" a secas.
>
> **Formato de \`description\`**: 2-4 líneas con: qué se intentó (parámetros concretos), qué falló (mensaje textual si hay), impacto (qué no se pudo hacer). Si es reproducible, decilo.
>
> ---
>
> _(Lo que sigue abajo es contexto/referencia estática. No lo repitas al usuario a menos que él te lo pida específicamente.)_

# break-mcp — ${user.name}

---

## Perfil

- **Usuario**: \`${user.id}\`${user.email ? ` · ${user.email}` : ''}
- **Rol**: \`${user.role}\`
- **Endpoint MCP**: \`${mcpUrl}\`

---

## Accesos por plataforma

${accessBlock(user)}

### Clientes registrados en el registry

${clientLines}

---

## Herramientas disponibles

${toolLines}

---

## Conexión (una sola vez)

### Opción A · CLI (recomendada)

\`\`\`bash
${cliSnippet}
\`\`\`

### Opción B · settings.json

Editar \`~/.claude/settings.json\` (Windows: \`%USERPROFILE%\\.claude\\settings.json\`) y mergear:

\`\`\`json
${mcpJsonSnippet}
\`\`\`

Guardá y reiniciá Claude Code.

---

## Ejemplos de uso

- _"Con break-mcp, listame mis clientes y a qué cuentas tengo acceso."_
- _"Traé insights de Meta de Preston, últimos 30 días, breakdown por día."_
- _"Query GAQL en Google Ads de Preston: total spend por campaña de los últimos 7 días."_
- _"Report GA4 de Preston: sessions y conversions por canal, últimos 30 días."_
- _"Con todo eso, armame un informe deck usando la plantilla de Azahares."_

---

## Reglas

- **Read-only estricto** en Meta / Google Ads / GA4.
- **Permisos server-side**: el bearer token identifica al usuario; el server chequea sus accesos antes de cada consulta. Editar este archivo no cambia permisos.
- **Token privado**: cualquiera con el token puede consultar como ${user.name}. Si se filtra, pedile al admin que lo regenere (el viejo se invalida al instante).
- **Regenerar config**: si el admin agrega/quita accesos, volvé a ${mcpUrl.replace(/\/mcp$/, '')} → sección **Mi config MCP** y descargá el archivo actualizado.
`;
}
