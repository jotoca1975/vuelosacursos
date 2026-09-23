import './styles.css';
import { getUpcomingCourses, addTrip, getTravelers } from './lib/trips.js';
import { escapeHtml, formatDate, formatDateRange, formatDuration, pluralize } from './lib/format.js';

const app = document.querySelector('#app');
let courses = [];

function layout(content) {
  app.innerHTML = `
    <header class="site-header"><a class="brand" href="#/">✈ <span>Vuelos a Cursos</span></a>
      <a class="header-link" href="#/nuevo">Añadir mi viaje</a></header>
    <main class="container">${content}</main>
    <footer>Una herramienta comunitaria para compartir viajes a cursos de Vipassana.</footer>`;
}

function notice(message, kind = 'info') {
  return `<p class="notice ${kind}" role="status">${escapeHtml(message)}</p>`;
}

async function home() {
  layout(`<section class="hero"><p class="eyebrow">VIAJES COMPARTIDOS</p><h1>¿Vas a un curso fuera de España?</h1>
  <p>Encuentra a otras personas que asistirán al mismo curso y, si os apetece, organizad juntos parte del viaje.</p>
  <a class="button primary" href="#/nuevo">Añadir mi viaje</a></section>
  <section aria-labelledby="courses-title"><div class="section-heading"><h2 id="courses-title">Próximos cursos</h2><p>Los viajes se agrupan automáticamente por centro y fechas.</p></div><div id="course-list" class="course-list"><div class="loading">Cargando cursos…</div></div></section>`);
  try {
    courses = await getUpcomingCourses();
    const list = document.querySelector('#course-list');
    list.innerHTML = courses.length ? courses.map(course => `<article class="course-card">
      <div><p class="center">🧘 ${escapeHtml(course.center)}</p><h3>${formatDateRange(course.startDate, course.endDate)}</h3><p class="muted">${formatDuration(course.startDate, course.endDate)}</p></div>
      <div class="course-actions"><p class="travelers-count">👥 ${course.count} ${pluralize(course.count, 'viajero')}</p><a class="button secondary" href="#/curso/${encodeURIComponent(course.key)}">Ver viajeros</a></div>
    </article>`).join('') : `<div class="empty"><h3>Aún no hay viajes publicados</h3><p>Sé la primera persona en añadir el tuyo.</p><a class="button primary" href="#/nuevo">Añadir mi viaje</a></div>`;
  } catch (error) { document.querySelector('#course-list').innerHTML = notice(error.message, 'error'); }
}

async function travelers(key) {
  const course = courses.find(item => item.key === key);
  if (!course) { await home(); return; }
  layout(`<a class="back" href="#/">← Volver a cursos</a><section class="page-heading"><p class="eyebrow">${escapeHtml(course.center)}</p><h1>${formatDateRange(course.startDate, course.endDate)}</h1><p>${formatDuration(course.startDate, course.endDate)} · ${course.count} ${pluralize(course.count, 'viajero')}</p></section><div id="traveler-list" class="traveler-list"><div class="loading">Cargando viajeros…</div></div>`);
  try {
    const people = await getTravelers(course);
    document.querySelector('#traveler-list').innerHTML = people.map(person => travelerCard(person)).join('');
    document.querySelectorAll('[data-contact]').forEach(button => button.addEventListener('click', () => {
      const contact = document.querySelector(`#${button.dataset.contact}`); contact.hidden = !contact.hidden;
      button.textContent = contact.hidden ? 'Mostrar contacto' : 'Ocultar contacto';
    }));
  } catch (error) { document.querySelector('#traveler-list').innerHTML = notice(error.message, 'error'); }
}

function travelerCard(person) {
  const name = [person.nombre, person.apellidos].filter(Boolean).join(' ');
  const contactId = `contact-${person.id}`;
  const details = [person.ciudad_salida && `📍 Sale desde ${person.ciudad_salida}`, person.aeropuerto && `✈️ Aeropuerto: ${person.aeropuerto}`, person.llegada_centro && `📅 Llega al centro: ${formatDate(person.llegada_centro)}`].filter(Boolean);
  return `<article class="traveler-card"><h2>${escapeHtml(name || 'Viajero/a')}</h2>${details.length ? `<ul class="details">${details.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}${person.comentarios ? `<p class="comment">“${escapeHtml(person.comentarios)}”</p>` : ''}${person.consentimiento && (person.telefono || person.email) ? `<div class="contact"><button class="link-button" data-contact="${contactId}">Mostrar contacto</button><div id="${contactId}" hidden>${person.telefono ? `<p>Teléfono: <a href="tel:${escapeHtml(person.telefono)}">${escapeHtml(person.telefono)}</a></p>` : ''}${person.email ? `<p>Email: <a href="mailto:${escapeHtml(person.email)}">${escapeHtml(person.email)}</a></p>` : ''}</div></div>` : `<p class="private">Esta persona no ha compartido sus datos de contacto.</p>`}</article>`;
}

function formPage() {
  const minDate = new Date().toISOString().slice(0, 10);
  layout(`<a class="back" href="#/">← Volver a cursos</a><section class="form-wrap"><p class="eyebrow">AÑADIR MI VIAJE</p><h1>Comparte tu viaje</h1><p>Solo se mostrará la información que indicas a continuación. Tus datos de contacto permanecerán ocultos salvo que des tu permiso.</p><form id="trip-form">
  <fieldset><legend>El curso</legend><label>Centro <input name="centro" required maxlength="120" placeholder="Por ejemplo, Dhamma Padhāna"></label><div class="two-cols"><label>Inicio del curso <input type="date" name="inicio_curso" required min="${minDate}"></label><label>Fin del curso <input type="date" name="fin_curso" required min="${minDate}"></label></div></fieldset>
  <fieldset><legend>Sobre ti</legend><div class="two-cols"><label>Nombre <input name="nombre" required maxlength="80"></label><label>Apellidos <input name="apellidos" maxlength="120"></label></div><label>Ciudad de salida <input name="ciudad_salida" maxlength="100" placeholder="Por ejemplo, Barcelona"></label><label>Aeropuerto <input name="aeropuerto" maxlength="120" placeholder="Opcional"></label><label>Llegada al centro <input type="date" name="llegada_centro"></label><label>Comentarios <textarea name="comentarios" maxlength="800" placeholder="Por ejemplo: llego el día antes y me gustaría compartir taxi."></textarea></label></fieldset>
  <fieldset><legend>Contacto (opcional)</legend><label>Teléfono <input type="tel" name="telefono" maxlength="40"></label><label>Email <input type="email" name="email" maxlength="254"></label><label class="checkbox"><input type="checkbox" name="consentimiento"> <span>Autorizo a mostrar mi teléfono y/o correo a las personas que consulten este curso.</span></label></fieldset>
  <p class="form-note">Al enviar, confirmas que los datos son correctos y aceptas que se muestren en esta página con la finalidad de organizar el viaje.</p><button class="button primary" type="submit">Publicar mi viaje</button><div id="form-status"></div></form></section>`);
  document.querySelector('#trip-form').addEventListener('submit', submitTrip);
}

async function submitTrip(event) {
  event.preventDefault(); const form = event.currentTarget; const status = document.querySelector('#form-status');
  const data = Object.fromEntries(new FormData(form)); data.consentimiento = form.consentimiento.checked;
  if (data.fin_curso < data.inicio_curso) { status.innerHTML = notice('La fecha de fin debe ser posterior a la de inicio.', 'error'); return; }
  const button = form.querySelector('button'); button.disabled = true; button.textContent = 'Publicando…';
  try { await addTrip(data); window.location.hash = '#/'; } catch (error) { status.innerHTML = notice(error.message, 'error'); button.disabled = false; button.textContent = 'Publicar mi viaje'; }
}

async function router() {
  const [route, parameter] = (window.location.hash.slice(1) || '/').split('/').filter(Boolean);
  if (route === 'nuevo') return formPage();
  if (route === 'curso' && parameter) return travelers(decodeURIComponent(parameter));
  return home();
}
window.addEventListener('hashchange', router); router();
