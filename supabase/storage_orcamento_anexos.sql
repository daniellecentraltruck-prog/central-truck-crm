-- Execute no SQL Editor do projeto Supabase do CRM Central Truck.
-- Bucket privado: notas fiscais nao ficam publicas.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'orcamento-anexos',
  'orcamento-anexos',
  false,
  10485760,
  ARRAY['application/pdf','image/jpeg','image/png','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']::text[]
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- As permissoes abaixo exigem login no CRM (role authenticated).
DROP POLICY IF EXISTS "centraltruck_anexos_listar" ON storage.objects;
CREATE POLICY "centraltruck_anexos_listar"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'orcamento-anexos');

DROP POLICY IF EXISTS "centraltruck_anexos_enviar" ON storage.objects;
CREATE POLICY "centraltruck_anexos_enviar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'orcamento-anexos');

DROP POLICY IF EXISTS "centraltruck_anexos_atualizar" ON storage.objects;
CREATE POLICY "centraltruck_anexos_atualizar"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'orcamento-anexos')
WITH CHECK (bucket_id = 'orcamento-anexos');
