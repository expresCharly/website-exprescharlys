-- Ejecutar después de subir los archivos a product-images.
begin;
update public.products as p
set image_url = v.public_url
from (values
('xlsx-8-7501048100200', '/product-images/7501048100200.jpg', 'https://xwtecoynixesfwkhuuwe.supabase.co/storage/v1/object/public/product-images/7501048100200-7a6d81fc23743adf.jpg'),
('xlsx-10-7506192507349', '/product-images/7506192507349.jpg', 'https://xwtecoynixesfwkhuuwe.supabase.co/storage/v1/object/public/product-images/7506192507349-cae4808024136f2c.jpg'),
('xlsx-90-7506475104722', '/product-images/7506475104722.jpg', 'https://xwtecoynixesfwkhuuwe.supabase.co/storage/v1/object/public/product-images/7506475104722-b719b0cb07ef84a3.jpg'),
('xlsx-225-7500810011126', '/product-images/7500810011126.jpg', 'https://xwtecoynixesfwkhuuwe.supabase.co/storage/v1/object/public/product-images/7500810011126-3da482bcca901988.jpg'),
('xlsx-270-7501055310968', '/product-images/7501055310968.jpg', 'https://xwtecoynixesfwkhuuwe.supabase.co/storage/v1/object/public/product-images/7501055310968-3ba994b6190cf0c9.jpg'),
('xlsx-274-7501055313525', '/product-images/7501055313525.jpg', 'https://xwtecoynixesfwkhuuwe.supabase.co/storage/v1/object/public/product-images/7501055313525-ce7857aecb3352b1.jpg'),
('xlsx-275-7501055313532', '/product-images/7501055313532.jpg', 'https://xwtecoynixesfwkhuuwe.supabase.co/storage/v1/object/public/product-images/7501055313532-5c5374425c039297.jpg'),
('xlsx-276-7501055355310', '/product-images/7501055355310.jpg', 'https://xwtecoynixesfwkhuuwe.supabase.co/storage/v1/object/public/product-images/7501055355310-1617098cc16516bd.jpg'),
('xlsx-277-7501055302086', '/product-images/7501055302086.jpg', 'https://xwtecoynixesfwkhuuwe.supabase.co/storage/v1/object/public/product-images/7501055302086-7d060f587e558505.jpg'),
('xlsx-278-75007614', '/product-images/75007614.jpg', 'https://xwtecoynixesfwkhuuwe.supabase.co/storage/v1/object/public/product-images/75007614-0d6dd73592aadf10.jpg'),
('xlsx-279-7501055302925', '/product-images/7501055302925.jpg', 'https://xwtecoynixesfwkhuuwe.supabase.co/storage/v1/object/public/product-images/7501055302925-bbf8318a6b98567e.jpg'),
('xlsx-448-7501000624683', '/product-images/7501000624683.jpg', 'https://xwtecoynixesfwkhuuwe.supabase.co/storage/v1/object/public/product-images/7501000624683-b025812b9a2daf63.jpg'),
('xlsx-449-7500478021598', '/product-images/7500478021598.jpg', 'https://xwtecoynixesfwkhuuwe.supabase.co/storage/v1/object/public/product-images/7500478021598-4715b03569cae953.jpg'),
('xlsx-450-7500810022801', '/product-images/7500810022801.jpg', 'https://xwtecoynixesfwkhuuwe.supabase.co/storage/v1/object/public/product-images/7500810022801-57729585eb5c9f03.jpg'),
('xlsx-451-7500478043804', '/product-images/7500478043804.jpg', 'https://xwtecoynixesfwkhuuwe.supabase.co/storage/v1/object/public/product-images/7500478043804-ae5346b6388c5534.jpg'),
('xlsx-452-7500478037421', '/product-images/7500478037421.jpg', 'https://xwtecoynixesfwkhuuwe.supabase.co/storage/v1/object/public/product-images/7500478037421-d592a5b887cf63ce.jpg'),
('xlsx-453-7500478022885', '/product-images/7500478022885.jpg', 'https://xwtecoynixesfwkhuuwe.supabase.co/storage/v1/object/public/product-images/7500478022885-448d38608b5416ac.jpg'),
('xlsx-454-7500478014569', '/product-images/7500478014569.jpg', 'https://xwtecoynixesfwkhuuwe.supabase.co/storage/v1/object/public/product-images/7500478014569-33a2b0bf136bbb32.jpg'),
('xlsx-455-7500478021581', '/product-images/7500478021581.jpg', 'https://xwtecoynixesfwkhuuwe.supabase.co/storage/v1/object/public/product-images/7500478021581-b63698cd7d51d6db.jpg'),
('xlsx-457-7500478015870', '/product-images/7500478015870.jpg', 'https://xwtecoynixesfwkhuuwe.supabase.co/storage/v1/object/public/product-images/7500478015870-a977dde5025efa1a.jpg')
) as v(id, local_url, public_url)
where p.id = v.id and (p.image_url is null or p.image_url = v.local_url);
commit;

select count(*) as fotos_en_storage from public.products where image_url like 'https://xwtecoynixesfwkhuuwe.supabase.co/storage/v1/object/public/product-images/%';
