-- Create the 'operations' bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('operations', 'operations', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files to 'operations'
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'operations');

-- Allow authenticated users to view files from 'operations'
CREATE POLICY "Allow authenticated downloads"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'operations');

-- Allow authenticated users to update their own files
CREATE POLICY "Allow authenticated updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'operations' AND auth.uid() = owner);

-- Allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'operations' AND auth.uid() = owner);
