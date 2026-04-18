UPDATE storage.objects 
SET metadata = jsonb_set(metadata, '{mimetype}', '"video/mp4"')
WHERE bucket_id = 'tool-covers' AND name = 'hero-v3.mp4';

UPDATE storage.objects 
SET metadata = jsonb_set(metadata, '{mimetype}', '"video/webm"')
WHERE bucket_id = 'tool-covers' AND name = 'hero-v3.webm';