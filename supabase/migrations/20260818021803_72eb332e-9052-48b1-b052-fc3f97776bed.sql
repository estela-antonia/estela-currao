UPDATE public.works SET featured_media_id = '2c746e5a-81a8-4b82-b399-1d9ecf876653', updated_at = now() WHERE title = 'Evanescence';
UPDATE public.works SET featured_media_id = 'd9282282-d28d-4c9a-accd-de4603f3d574', updated_at = now() WHERE title = 'L''aleph';
UPDATE public.works SET featured_media_id = '7b4b9356-edeb-466d-b90a-4b051256905d', updated_at = now() WHERE title = 'Micro fissure';
UPDATE public.works SET featured_media_id = '2f4d3346-2ea2-4f79-9fc3-e67185ea507f', updated_at = now() WHERE title = 'Le regard dévoré';

DELETE FROM public.work_images wi
USING public.works w, public.media m
WHERE wi.work_id = w.id AND m.id = wi.media_id
  AND w.title IN ('Evanescence','L''aleph','Micro fissure','Le regard dévoré')
  AND m.storage_bucket = 'external';