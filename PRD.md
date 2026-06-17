# Meridian — Product Requirements Document
> **Para Claude Code:** Este documento contiene todo lo necesario para construir el MVP de Meridian desde cero. Seguí el orden de implementación indicado en cada sección. No improvises dependencias ni estructura de carpetas — seguí exactamente lo definido aquí.

---

## 1. Qué es Meridian

Meridian es un **workspace de delivery intelligence multi-organización**. Resuelve el problema del Delivery Lead, Product Owner o Technical PM que trabaja simultáneamente con múltiples organizaciones (cliente, partner externo, equipo interno, asociaciones) usando sistemas distintos (Jira, Azure DevOps, Notion) y tiene que mantener todo coherente en su cabeza.

La innovación central: no es un task tracker. Gestiona **compromisos bilaterales** (quién le debe qué a quién), no solo tareas, y unifica el trabajo de múltiples orgs en una sola vista inteligente.

**Usuario objetivo (Jeanma):** Delivery Lead en Guatemaltek, coordinando:
- BizibilityHub para CMI Guatemala (ADO)
- Solace Micro-Integrations con equipo canadiense (Jira)
- Equipo interno GTek (ADO)
- Portal ASIGBO (Notion)
- Universidad UVG (personal)

---

## 2. Stack técnico

| Capa | Tecnología | Versión | Notas |
|------|-----------|---------|-------|
| Framework | Next.js | 14.x (App Router) | Usar `app/` directory, no `pages/` |
| Lenguaje | TypeScript | 5.x | Strict mode activado |
| Estilos | Tailwind CSS | 3.x | |
| Componentes | shadcn/ui | latest | Instalar con `npx shadcn@latest init` |
| Auth | Clerk | 5.x | `@clerk/nextjs` |
| ORM | Prisma | 5.x | |
| Base de datos | Neon Postgres | — | Via `DATABASE_URL` |
| AI | Groq SDK | latest | `groq-sdk` |
| Modelo AI | Llama 3.1 70B | — | `llama-3.1-70b-versatile` |
| Email | Resend | latest | `resend` |
| Deploy | Vercel | — | |

### Variables de entorno requeridas (`.env.local`)

```env
# Base de datos
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/onboarding"

# Groq
GROQ_API_KEY="gsk_..."

# Resend
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="noreply@meridian.app"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 3. Estructura de carpetas

```
meridian/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   └── sign-up/[[...sign-up]]/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Sidebar + navbar
│   │   ├── page.tsx                # Redirect a /dashboard/items
│   │   ├── dashboard/
│   │   │   ├── items/
│   │   │   │   ├── page.tsx        # Vista unificada de items (Lista/Board/Focus)
│   │   │   │   └── [id]/page.tsx   # Detalle de item
│   │   │   ├── narrate/
│   │   │   │   └── page.tsx        # Parseo de notas con Groq
│   │   │   ├── commitments/
│   │   │   │   └── page.tsx        # Commitment Ledger
│   │   │   ├── stakeholders/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── meetings/
│   │   │   │   └── page.tsx
│   │   │   └── settings/
│   │   │       └── page.tsx        # Orgs, integraciones, perfil
│   │   └── onboarding/
│   │       └── page.tsx            # Setup inicial de orgs
│   └── api/
│       ├── webhooks/clerk/route.ts  # Clerk webhooks
│       ├── items/
│       │   ├── route.ts             # GET (list), POST (create)
│       │   └── [id]/route.ts        # GET, PATCH, DELETE
│       ├── commitments/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       ├── organizations/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       ├── stakeholders/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       ├── meetings/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       ├── narrate/
│       │   └── route.ts             # POST: texto → JSON estructurado via Groq
│       ├── focus/
│       │   └── route.ts             # GET: items priorizados del día
│       └── notifications/
│           └── route.ts
├── components/
│   ├── ui/                          # shadcn/ui (auto-generado)
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── top-bar.tsx
│   │   └── org-filter.tsx
│   ├── items/
│   │   ├── item-card.tsx
│   │   ├── item-list.tsx
│   │   ├── item-board.tsx
│   │   ├── item-form.tsx
│   │   └── item-detail.tsx
│   ├── commitments/
│   │   ├── commitment-card.tsx
│   │   ├── commitment-form.tsx
│   │   └── commitment-ledger.tsx
│   ├── narrate/
│   │   ├── narrate-input.tsx
│   │   └── narrate-results.tsx
│   ├── focus/
│   │   └── focus-list.tsx
│   └── shared/
│       ├── org-badge.tsx
│       ├── priority-badge.tsx
│       ├── status-badge.tsx
│       └── empty-state.tsx
├── lib/
│   ├── ai.ts                        # Groq wrapper (proveedor-agnóstico)
│   ├── db.ts                        # Prisma client singleton
│   ├── auth.ts                      # Clerk helpers
│   └── utils.ts                     # cn(), formatDate(), etc.
├── hooks/
│   ├── use-items.ts
│   ├── use-commitments.ts
│   └── use-organizations.ts
├── types/
│   └── index.ts                     # Tipos globales
├── prisma/
│   └── schema.prisma
├── middleware.ts                    # Clerk auth middleware
└── next.config.ts
```

---

## 4. Schema de base de datos (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ─── Enums ────────────────────────────────────────────────

enum Priority {
  URGENT
  HIGH
  MEDIUM
  LOW
}

enum ItemStatus {
  BLOCKED
  OVERDUE
  IN_PROGRESS
  TODO
  PENDING
  DONE
}

enum CommitmentStatus {
  PENDING
  AT_RISK
  FULFILLED
  OVERDUE
}

enum OrgSystem {
  ADO
  JIRA
  NOTION
  PERSONAL
  OTHER
}

enum IntegrationType {
  JIRA
  ADO
  NOTION
  CLOCKIFY
  GOOGLE_CALENDAR
  MICROSOFT_CALENDAR
  SLACK
}

enum NotificationType {
  DEAD_ZONE        // Item sin movimiento hace X días
  COMMITMENT_DUE   // Compromiso vence pronto
  ESCALATION_RISK  // Stakeholder en riesgo de escalar
  OVERDUE          // Item vencido
  SYNC_ERROR       // Error en integración externa
}

// ─── Tablas ────────────────────────────────────────────────

model User {
  id        String   @id @default(cuid())
  clerkId   String   @unique
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  organizations Organization[]
  notifications Notification[]
  integrations  Integration[]

  @@map("users")
}

model Organization {
  id        String    @id @default(cuid())
  name      String                          // "CMI Guatemala"
  slug      String                          // "cmi"
  color     String    @default("#185FA5")   // Hex color para UI
  system    OrgSystem @default(OTHER)       // Sistema externo principal
  systemUrl String?                         // URL base del sistema externo
  userId    String
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  items        Item[]
  stakeholders Stakeholder[]
  meetings     Meeting[]

  @@unique([userId, slug])
  @@index([userId])
  @@map("organizations")
}

model Item {
  id             String     @id @default(cuid())
  customId       String?                          // "BH-001", "SL-002"
  title          String
  description    String?
  priority       Priority   @default(MEDIUM)
  status         ItemStatus @default(TODO)
  dueDate        DateTime?
  externalId     String?                          // ID en Jira, ADO, etc.
  externalSystem OrgSystem?                       // Sistema de origen
  orgId          String
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt
  lastActivityAt DateTime   @default(now())      // Para dead zone alerts

  organization Organization  @relation(fields: [orgId], references: [id], onDelete: Cascade)
  commitments  Commitment[]
  tags         ItemTag[]
  notifications Notification[]
  meetingItems MeetingItem[]

  @@index([orgId])
  @@index([status])
  @@index([priority])
  @@index([dueDate])
  @@map("items")
}

model Tag {
  id    String    @id @default(cuid())
  name  String
  items ItemTag[]

  @@map("tags")
}

model ItemTag {
  itemId String
  tagId  String

  item Item @relation(fields: [itemId], references: [id], onDelete: Cascade)
  tag  Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([itemId, tagId])
  @@map("item_tags")
}

model Stakeholder {
  id              String   @id @default(cuid())
  name            String
  role            String?
  email           String?
  formalityLevel  Int      @default(50)   // 0-100
  language        String   @default("es") // "es" | "en"
  communicationStyle String[] @default([]) // ["formal", "async-first", etc.]
  orgId           String
  lastContactAt   DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  organization Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  commitments  Commitment[]

  @@index([orgId])
  @@map("stakeholders")
}

model Commitment {
  id            String           @id @default(cuid())
  title         String
  description   String?
  direction     String           @default("outbound") // "outbound" (yo debo) | "inbound" (me deben)
  dueDate       DateTime?
  status        CommitmentStatus @default(PENDING)
  notes         String?
  itemId        String?
  stakeholderId String
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt

  item        Item?       @relation(fields: [itemId], references: [id], onDelete: SetNull)
  stakeholder Stakeholder @relation(fields: [stakeholderId], references: [id], onDelete: Cascade)

  @@index([stakeholderId])
  @@index([status])
  @@index([dueDate])
  @@map("commitments")
}

model Meeting {
  id           String   @id @default(cuid())
  title        String
  scheduledAt  DateTime?
  transcript   String?  @db.Text
  prepBrief    String?  @db.Text  // Generado por AI antes de la reunión
  notes        String?  @db.Text  // Notas post-reunión
  externalCalId String?           // ID en Google Calendar / MS Calendar
  orgId        String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  organization Organization  @relation(fields: [orgId], references: [id], onDelete: Cascade)
  items        MeetingItem[]

  @@index([orgId])
  @@index([scheduledAt])
  @@map("meetings")
}

model MeetingItem {
  meetingId String
  itemId    String

  meeting Meeting @relation(fields: [meetingId], references: [id], onDelete: Cascade)
  item    Item    @relation(fields: [itemId], references: [id], onDelete: Cascade)

  @@id([meetingId, itemId])
  @@map("meeting_items")
}

model Notification {
  id        String           @id @default(cuid())
  type      NotificationType
  message   String
  read      Boolean          @default(false)
  userId    String
  itemId    String?
  createdAt DateTime         @default(now())

  user User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  item Item? @relation(fields: [itemId], references: [id], onDelete: SetNull)

  @@index([userId, read])
  @@map("notifications")
}

model Integration {
  id          String          @id @default(cuid())
  type        IntegrationType
  config      Json            @default("{}")  // Tokens, workspace IDs, etc.
  lastSyncAt  DateTime?
  userId      String
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, type])
  @@map("integrations")
}
```

---

## 5. AI Layer — Groq (proveedor-agnóstico)

```typescript
// lib/ai.ts
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const MODEL = 'llama-3.1-70b-versatile'

/**
 * Función base. Todas las features de AI pasan por aquí.
 * Para migrar a Claude u otro proveedor, solo tocás este archivo.
 */
export async function callAI(
  systemPrompt: string,
  userContent: string,
  jsonMode = true
): Promise<string> {
  const res = await groq.chat.completions.create({
    model: MODEL,
    response_format: jsonMode ? { type: 'json_object' } : undefined,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent }
    ],
    temperature: 0.2,
    max_tokens: 2048
  })
  return res.choices[0].message.content ?? '{}'
}

// ── Prompts específicos de Meridian ──────────────────────

export const PROMPTS = {

  narrate: `Eres un asistente de delivery intelligence. Extrae del texto de reunión:
- decisions: cosas que se acordaron o decidieron
- commitments: quién debe qué a quién y para cuándo (person, action, deadline, risk: low|medium|high, direction: outbound|inbound)
- risks: riesgos o bloqueos identificados (text, severity: low|medium|high)
- actions: próximos pasos inmediatos (person, task, priority: low|medium|high)

Responde ÚNICAMENTE con JSON válido, sin texto previo ni markdown:
{"decisions":[{"text":"..."}],"commitments":[{"person":"...","action":"...","deadline":"...","risk":"low","direction":"outbound"}],"risks":[{"text":"...","severity":"medium"}],"actions":[{"person":"...","task":"...","priority":"high"}]}`,

  focus: `Eres un asistente de delivery intelligence. Dado el estado actual del backlog, 
seleccioná los 5 items más críticos para trabajar HOY. 
Criterios: urgencia, riesgo de escalamiento, compromisos vencidos, reuniones próximas, dependencias bloqueadas.
Para cada item explicá brevemente por qué es prioritario hoy (máx 2 oraciones, directo, no genérico).
Responde ÚNICAMENTE con JSON:
{"focus":[{"id":"...","reason":"..."}]}`,

  meetingPrep: `Eres un asistente de delivery intelligence. Dado el contexto de una reunión próxima 
(participantes, items relacionados, compromisos pendientes), generá un brief de preparación conciso.
Incluye: qué acordar, qué reportar, qué pedir, qué riesgos levantar.
Responde ÚNICAMENTE con JSON:
{"brief":{"agenda":["..."],"toReport":["..."],"toAsk":["..."],"risks":["..."]}}`,

  draftEmail: `Eres un asistente de comunicación profesional. Redactá un correo de seguimiento 
en español natural (NO AI-sounding, NO frases genéricas como "espero que estés bien").
Directo, profesional, concreto. Adaptá el tono al nivel de formalidad indicado (0=informal, 100=muy formal).
Responde ÚNICAMENTE con JSON:
{"subject":"...","body":"..."}`
}
```

---

## 6. Features del MVP (Phase 1)

### Feature 1: Autenticación y onboarding
**Prioridad:** P0 — Construir primero

**Acceptance criteria:**
- Usuario puede registrarse y hacer login con Clerk (email + Google OAuth)
- Al primer login, se redirige a `/onboarding`
- Onboarding crea al menos una organización inicial
- Webhook de Clerk crea el registro en `users` tabla automáticamente
- Middleware protege todas las rutas `/dashboard/*`

**Implementación:**
```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)', '/api/webhooks(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) await auth.protect()
})

export const config = {
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)']
}
```

---

### Feature 2: Gestión de organizaciones
**Prioridad:** P0

**Acceptance criteria:**
- CRUD completo de organizations
- Cada org tiene: nombre, slug único, color (picker), sistema externo (ADO/Jira/Notion/Personal)
- Organizaciones predeterminadas sugeridas en onboarding: CMI, Solace, GTek Interno, Personal
- Org filter en top bar filtra toda la UI globalmente

**Colores predeterminados por org:**
```typescript
const DEFAULT_ORGS = [
  { name: 'CMI Guatemala', slug: 'cmi', color: '#185FA5', system: 'ADO' },
  { name: 'Solace', slug: 'solace', color: '#0F6E56', system: 'JIRA' },
  { name: 'GTek Interno', slug: 'gtek', color: '#BA7517', system: 'ADO' },
  { name: 'ASIGBO', slug: 'asigbo', color: '#534AB7', system: 'NOTION' },
  { name: 'Personal', slug: 'personal', color: '#888780', system: 'PERSONAL' },
]
```

---

### Feature 3: Items (tracker multi-org)
**Prioridad:** P0

**Acceptance criteria:**
- CRUD completo de items
- Campos: título, descripción, org, prioridad, status, fecha límite, ID custom (BH-001, etc.), tags
- Vista Lista con 3 grupos: Urgente/Bloqueado, Esta semana, Backlog
- Vista Board con 3 columnas: Bloqueado, En curso, Pendiente
- Vista Focus (delegada a Feature 6)
- Filtro por org funcional en todas las vistas
- Click en item abre panel lateral con detalle completo
- Botón "+ Agregar" con form inline
- Items se marcan como `OVERDUE` automáticamente si `dueDate < now() && status != DONE`

**API routes:**
```
GET    /api/items?orgId=&status=&priority=    → lista filtrada
POST   /api/items                              → crear item
GET    /api/items/[id]                         → detalle
PATCH  /api/items/[id]                         → actualizar
DELETE /api/items/[id]                         → eliminar
```

---

### Feature 4: Stakeholder profiles
**Prioridad:** P1

**Acceptance criteria:**
- CRUD de stakeholders, asociados a una org
- Campos: nombre, rol, email, nivel de formalidad (0–100 slider), idioma, tags de estilo (array)
- Vista tipo cards con avatar de iniciales
- `lastContactAt` se actualiza cuando se crea un commitment o meeting con ese stakeholder

---

### Feature 5: Commitment Ledger
**Prioridad:** P1 — Es la feature diferenciadora

**Acceptance criteria:**
- CRUD de commitments
- Campos: título, descripción, dirección (outbound = yo debo | inbound = me deben), stakeholder, item relacionado (opcional), fecha límite, status, notas
- Vista agrupada: "Yo debo" vs "Me deben"
- Status visual: PENDING (gris), AT_RISK (amber), OVERDUE (rojo), FULFILLED (verde)
- Un commitment puede marcarse como fulfilled con un clic
- Commitments `OVERDUE` generan una `Notification`

---

### Feature 6: Narrate (AI via Groq)
**Prioridad:** P1

**Acceptance criteria:**
- Textarea donde el usuario pega notas de reunión, transcripciones o voz
- Botón "Parsear" llama a `POST /api/narrate`
- El API procesa con Groq Llama 3.1 70B usando el prompt definido en `lib/ai.ts`
- Muestra resultados en 4 columnas: Decisiones, Compromisos, Riesgos, Actions
- Botones de acción: "Crear items en backlog", "Agregar commitments", "Redactar email de seguimiento"
- Manejo de error si Groq falla: mostrar mensaje, no crashear

**API route:**
```typescript
// app/api/narrate/route.ts
import { auth } from '@clerk/nextjs/server'
import { callAI, PROMPTS } from '@/lib/ai'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { text } = await req.json()
  if (!text?.trim()) return Response.json({ error: 'No text provided' }, { status: 400 })

  try {
    const raw = await callAI(PROMPTS.narrate, text)
    const parsed = JSON.parse(raw)
    return Response.json(parsed)
  } catch (e) {
    return Response.json({ error: 'AI parsing failed' }, { status: 500 })
  }
}
```

---

### Feature 7: Focus view (AI via Groq)
**Prioridad:** P1

**Acceptance criteria:**
- Vista accesible desde la navegación principal
- Muestra los 5 items más críticos para HOY con razonamiento (generado por Groq)
- El contexto enviado a Groq incluye: todos los items del usuario con status, priority, dueDate, commitments vencidos próximos, reuniones del día
- Cada item tiene botón "Siguiente paso ↗" que abre el AI para generar el próximo paso concreto
- Se regenera al hacer clic en "Actualizar"

---

### Feature 8: Artifact Engine (email drafts)
**Prioridad:** P2

**Acceptance criteria:**
- Dado un item o commitment, botón "Redactar email" 
- Abre modal con: selección de destinatario (stakeholder), tono auto-calculado por formalidad del stakeholder
- Llama a Groq con el contexto y genera asunto + cuerpo
- Usuario puede copiar al portapapeles o abrir en cliente de correo via `mailto:`

---

### Feature 9: Notificaciones in-app
**Prioridad:** P2

**Acceptance criteria:**
- Bell icon en top bar con contador de notificaciones no leídas
- Tipos de notificaciones:
  - `DEAD_ZONE`: item sin actividad por más de 7 días (cron diario)
  - `COMMITMENT_DUE`: commitment que vence en 48h
  - `OVERDUE`: item cuyo dueDate pasó sin completarse
- Las notificaciones se marcan como leídas al hacer clic
- Cron job diario via Vercel Cron (`vercel.json`) que revisa y genera notificaciones

---

## 7. Features Phase 2 (post-MVP)

| Feature | Descripción | Complejidad |
|---------|-------------|-------------|
| Sync Engine — Jira | Read-only sync de issues desde Jira REST API. OAuth con Atlassian. | Alta |
| Sync Engine — ADO | Read-only sync de work items desde Azure DevOps REST API. PAT auth. | Alta |
| Sync Engine — Notion | Read-only sync de páginas y databases desde Notion API. | Media |
| Meeting Prep Brief | Genera brief de preparación antes de cada reunión con Groq | Media |
| Commitment Radar | Vista de red (grafo) de stakeholders y compromisos | Media |
| Bandwidth tracker | Vista de distribución de tiempo por org por semana | Baja |
| Clockify sync | Log automático de tiempo en Clockify según items cerrados | Media |
| Escalation Risk Score | Score 0-100% de probabilidad de escalamiento por stakeholder | Alta |

---

## 8. Features Phase 3 (producto completo)

- Write-back a Jira (crear/actualizar issues desde Meridian)
- Write-back a ADO (crear/actualizar work items)
- Google Calendar / Microsoft Calendar integration (sync bidireccional)
- Mobile app (React Native o PWA mejorada)
- Multi-user (compartir workspace con equipo)
- Venta / SaaS (Stripe integration, tier plans)

---

## 9. Orden de implementación para Claude Code

Seguir este orden exacto. No saltar pasos.

```
Paso 1:  Setup inicial del proyecto (Next.js 14, TypeScript, Tailwind, shadcn)
Paso 2:  Configurar Clerk + middleware + webhook handler
Paso 3:  Configurar Neon Postgres + Prisma (correr migraciones)
Paso 4:  Crear lib/db.ts, lib/ai.ts, lib/auth.ts, lib/utils.ts
Paso 5:  Onboarding flow (crear primera org)
Paso 6:  Sidebar + layout del dashboard
Paso 7:  API routes de organizations (CRUD)
Paso 8:  API routes de items (CRUD)
Paso 9:  Componentes de items (item-card, item-list, item-board)
Paso 10: Vista /dashboard/items completa (Lista + Board + filtros)
Paso 11: API routes de stakeholders (CRUD)
Paso 12: Vista /dashboard/stakeholders completa
Paso 13: API routes de commitments (CRUD)
Paso 14: Vista /dashboard/commitments (Commitment Ledger)
Paso 15: API route /api/narrate + componentes narrate
Paso 16: Vista /dashboard/narrate completa
Paso 17: API route /api/focus + vista /dashboard/focus
Paso 18: Sistema de notificaciones in-app
Paso 19: Cron jobs (Vercel Cron) para dead zones y alertas
Paso 20: Artifact engine (email drafts con Groq)
```

---

## 10. Comandos de inicialización del proyecto

```bash
# 1. Crear proyecto
npx create-next-app@latest meridian --typescript --tailwind --eslint --app --src-dir=false

# 2. Instalar dependencias principales
npm install @clerk/nextjs groq-sdk prisma @prisma/client resend

# 3. Instalar shadcn/ui
npx shadcn@latest init
# Elegir: Default style, Zinc base color, CSS variables: yes

# 4. Instalar componentes shadcn necesarios
npx shadcn@latest add button input select textarea badge card dialog
npx shadcn@latest add dropdown-menu separator sheet skeleton toast

# 5. Inicializar Prisma
npx prisma init

# 6. Copiar schema.prisma del PRD → prisma/schema.prisma

# 7. Correr migración inicial
npx prisma migrate dev --name init

# 8. Generar cliente Prisma
npx prisma generate
```

---

## 11. Notas críticas para Claude Code

1. **No usar `pages/` directory** — exclusivamente App Router (`app/`).

2. **Server Components por defecto** — solo agregar `"use client"` cuando se necesiten hooks o interactividad. El fetching de datos va en Server Components.

3. **Prisma client como singleton:**
```typescript
// lib/db.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const db = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
```

4. **Auth en API routes:**
```typescript
import { auth } from '@clerk/nextjs/server'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  // ...
}
```

5. **El AI layer es 100% intercambiable** — si en algún momento hay que migrar de Groq a Claude API u otro proveedor, solo se modifica `lib/ai.ts`. El resto del código no toca el proveedor directamente.

6. **Groq tiene rate limits** — implementar retry con exponential backoff en `lib/ai.ts` para producción. Para MVP no es necesario.

7. **Los colores de org son críticos para la UX** — siempre aplicar el `color` de la organización como borde izquierdo en los item cards (`border-left: 3px solid org.color`).

8. **El `customId` de items** (BH-001, SL-002) se genera automáticamente con un prefijo por org:
```typescript
function generateCustomId(orgSlug: string, count: number): string {
  const prefix = orgSlug.slice(0, 2).toUpperCase()
  return `${prefix}-${String(count).padStart(3, '0')}`
}
```

9. **Dark mode** — Tailwind está configurado con `darkMode: 'class'`. Clerk maneja su propio tema. Usar variables CSS de Tailwind, no hardcodear colores.

10. **Tipos globales** — definir en `types/index.ts` los tipos extendidos de Prisma con relaciones incluidas para evitar repetición.

---

## 12. Tipos globales sugeridos

```typescript
// types/index.ts
import type { Item, Organization, Commitment, Stakeholder, Tag } from '@prisma/client'

export type ItemWithOrg = Item & {
  organization: Organization
  tags: Array<{ tag: Tag }>
  commitments: Commitment[]
}

export type CommitmentWithStakeholder = Commitment & {
  stakeholder: Stakeholder & { organization: Organization }
  item: Item | null
}

export type OrgWithCounts = Organization & {
  _count: {
    items: number
    stakeholders: number
    meetings: number
  }
}

export type NarrateResult = {
  decisions: Array<{ text: string }>
  commitments: Array<{
    person: string
    action: string
    deadline: string
    risk: 'low' | 'medium' | 'high'
    direction: 'outbound' | 'inbound'
  }>
  risks: Array<{ text: string; severity: 'low' | 'medium' | 'high' }>
  actions: Array<{ person: string; task: string; priority: 'low' | 'medium' | 'high' }>
}

export type FocusItem = {
  id: string
  reason: string
  item: ItemWithOrg
}
```

---

*Meridian PRD v1.0 — Generado para Jean Marco Portillo, Guatemaltek*
*Stack: Next.js 14 + Groq (Llama 3.1 70B) + Neon Postgres + Clerk + Resend*
