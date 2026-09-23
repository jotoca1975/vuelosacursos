import { configurationError, supabase } from './supabase.js';

function ensureClient() { if (!supabase) throw configurationError(); return supabase; }
function keyFor(row) { return `${row.centro}|${row.inicio_curso}|${row.fin_curso}`; }

export async function getUpcomingCourses() {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await ensureClient().from('viajes').select('centro,inicio_curso,fin_curso').gte('fin_curso', today).order('inicio_curso');
  if (error) throw error;
  const groups = new Map();
  data.forEach(row => { const key = keyFor(row); const group = groups.get(key) || { key, center: row.centro, startDate: row.inicio_curso, endDate: row.fin_curso, count: 0 }; group.count += 1; groups.set(key, group); });
  return [...groups.values()];
}

export async function getTravelers(course) {
  const { data, error } = await ensureClient().from('viajes').select('id,nombre,apellidos,ciudad_salida,aeropuerto,llegada_centro,comentarios,consentimiento,telefono,email').eq('centro', course.center).eq('inicio_curso', course.startDate).eq('fin_curso', course.endDate).order('created_at');
  if (error) throw error; return data;
}

export async function addTrip(values) {
  const payload = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, typeof value === 'string' ? value.trim() || null : value]));
  if (!payload.consentimiento) { payload.telefono = null; payload.email = null; }
  const { error } = await ensureClient().from('viajes').insert(payload);
  if (error) throw error;
}
