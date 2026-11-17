const json = (value, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'no-store' } });
const clean = value => typeof value === 'string' ? value.trim() || null : value;
const types = new Set(['Curso de 1 día', 'Curso de 2 días', 'Curso de 3 días', 'Curso de 10 días', 'Curso de 15 días', 'Curso de 20 días', 'Curso de 30 días', 'Curso de 45 días', 'Curso de 60 días', 'Satipaṭṭhāna']);

function validateTraveler(data) {
  if (!clean(data.nombre)) throw new Error('El nombre es obligatorio.');
  return { nombre: clean(data.nombre), apellidos: clean(data.apellidos), ciudad_salida: clean(data.ciudad_salida), aeropuerto: clean(data.aeropuerto), llegada_centro: clean(data.llegada_centro), comentarios: clean(data.comentarios), consentimiento: data.consentimiento ? 1 : 0, telefono: data.consentimiento ? clean(data.telefono) : null, email: data.consentimiento ? clean(data.email) : null };
}

async function insertTraveler(db, courseId, data) {
  const t = validateTraveler(data);
  await db.prepare('INSERT INTO viajes (course_id,nombre,apellidos,ciudad_salida,aeropuerto,llegada_centro,comentarios,consentimiento,telefono,email) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(courseId, t.nombre, t.apellidos, t.ciudad_salida, t.aeropuerto, t.llegada_centro, t.comentarios, t.consentimiento, t.telefono, t.email).run();
}
async function readCourse(db, id) {
  const row = await db.prepare(`SELECT c.id,c.course_type,c.start_date,c.end_date,ce.name AS centre_name,ce.country AS centre_country,COUNT(v.id) AS traveler_count FROM courses c JOIN centres ce ON ce.id=c.centre_id LEFT JOIN viajes v ON v.course_id=c.id WHERE c.id=? GROUP BY c.id`).bind(id).first();
  if (!row) throw new Error('Curso no encontrado.');
  return { id: row.id, course_type: row.course_type, start_date: row.start_date, end_date: row.end_date, centre: { name: row.centre_name, country: row.centre_country }, travelerCount: row.traveler_count };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url); const parts = url.pathname.split('/').filter(Boolean);
    if (parts[0] !== 'api') return env.ASSETS.fetch(request);
    try {
      if (request.method === 'GET' && parts[1] === 'courses' && parts.length === 2) {
        const { results } = await env.DB.prepare(`SELECT c.id,c.course_type,c.start_date,c.end_date,ce.name AS centre_name,ce.country AS centre_country,COUNT(v.id) AS traveler_count FROM courses c JOIN centres ce ON ce.id=c.centre_id LEFT JOIN viajes v ON v.course_id=c.id WHERE c.end_date>=date('now') GROUP BY c.id ORDER BY c.start_date`).all();
        return json(results.map(r => ({ id:r.id, course_type:r.course_type,start_date:r.start_date,end_date:r.end_date,centre:{name:r.centre_name,country:r.centre_country},travelerCount:r.traveler_count })));
      }
      if (request.method === 'GET' && parts[1] === 'centres') {
        const q = `%${String(url.searchParams.get('q') || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}%`;
        const { results } = await env.DB.prepare('SELECT id,name,country FROM centres WHERE search_name LIKE ? ORDER BY name LIMIT 8').bind(q).all(); return json(results);
      }
      if (parts[1] === 'courses' && parts[2] && !parts[3] && request.method === 'GET') return json(await readCourse(env.DB, parts[2]));
      if (parts[1] === 'courses' && parts[2] && parts[3] === 'travelers' && request.method === 'GET') { const { results } = await env.DB.prepare('SELECT id,nombre,apellidos,ciudad_salida,aeropuerto,llegada_centro,comentarios,consentimiento,telefono,email FROM viajes WHERE course_id=? ORDER BY created_at').bind(parts[2]).all(); return json(results); }
      if (request.method === 'POST' && parts[1] === 'courses' && parts.length === 2) {
        const data = await request.json(); if (!data.centre_id || !types.has(data.course_type) || !data.start_date || !data.end_date || data.end_date < data.start_date) throw new Error('Revisa los datos del curso.');
        const id = crypto.randomUUID(); await env.DB.prepare('INSERT INTO courses (id,centre_id,course_type,start_date,end_date) VALUES (?,?,?,?,?)').bind(id,data.centre_id,data.course_type,data.start_date,data.end_date).run(); await insertTraveler(env.DB,id,data); return json({ id },201);
      }
      if (request.method === 'POST' && parts[1] === 'courses' && parts[2] && parts[3] === 'travelers') { await readCourse(env.DB,parts[2]); await insertTraveler(env.DB,parts[2],await request.json()); return json({ ok:true },201); }
      return json({ error:'Ruta no encontrada.' },404);
    } catch (error) { return json({ error: error.message || 'Error inesperado.' },400); }
  }
};
