const dateFormatter = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
export const formatDate = date => dateFormatter.format(new Date(`${date}T12:00:00`));
export function formatDateRange(start, end) { const a = new Date(`${start}T12:00:00`), b = new Date(`${end}T12:00:00`); return `${formatDate(start)} – ${formatDate(end)}`; }
export function formatDuration(start, end) { const days = Math.round((new Date(`${end}T12:00:00`) - new Date(`${start}T12:00:00`)) / 86400000); return `${days} ${days === 1 ? 'día' : 'días'}`; }
export const pluralize = (count, word) => `${word}${count === 1 ? '' : 'es'}`;
export const escapeHtml = value => String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char]));
