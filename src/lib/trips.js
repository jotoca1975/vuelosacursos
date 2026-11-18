const api = async (path, options = {}) => {
  const response = await fetch(`/api${path}`, { headers: { 'Content-Type': 'application/json' }, ...options });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'No se pudo completar la operación.');
  return body;
};

export const normalise = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export const getCourses = () => api('/courses');
export const getCourse = id => api(`/courses/${encodeURIComponent(id)}`);
export const getTravelers = id => api(`/courses/${encodeURIComponent(id)}/travelers`);
export const searchCentres = async term => term.length < 2 ? [] : api(`/centres?q=${encodeURIComponent(term)}`);
export const createCourseAndTrip = values => api('/courses', { method: 'POST', body: JSON.stringify(values) });
export const joinCourse = (values, id) => api(`/courses/${encodeURIComponent(id)}/travelers`, { method: 'POST', body: JSON.stringify(values) });
