-- 005_normalizar_categorias.sql
-- Unifica nombres de categorías a los valores canónicos del desplegable

UPDATE productos SET categoria = 'Reposeras'           WHERE categoria = 'Reposera';
UPDATE productos SET categoria = 'Sillones'            WHERE categoria = 'Sillon';
UPDATE productos SET categoria = 'Tendederos y Tablas' WHERE categoria = 'Tender y Tablas';
