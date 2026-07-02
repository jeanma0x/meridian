import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const MODEL = 'llama-3.3-70b-versatile'

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
      { role: 'user', content: userContent },
    ],
    temperature: 0.2,
    max_tokens: 2048,
  })
  return res.choices[0].message.content ?? '{}'
}

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
{"subject":"...","body":"..."}`,

  nextStep: `Eres un asistente de delivery intelligence. Dado el título de un item de trabajo,
describí el siguiente paso concreto e inmediato para avanzarlo o cerrarlo.
Sé específico, accionable, y breve (1-2 oraciones). No uses frases genéricas.
Responde ÚNICAMENTE con JSON:
{"nextStep":"..."}`,
}
