-- Ejecuta este archivo UNA VEZ si ya creaste la tabla viajes antes de esta actualización.
-- No borra ni modifica los viajes que ya existen.
alter table public.viajes add column if not exists tipo_curso text;
