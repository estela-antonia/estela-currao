UPDATE public.publications
SET description = replace(description, 'Miroir de l''art n° 10, 2008', 'Miroir de l''art n° 10, 2007')
WHERE description LIKE '%Miroir de l''art n° 10, 2008%';