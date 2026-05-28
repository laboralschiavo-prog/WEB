-- 004_seed_productos.sql
-- Catálogo completo POSTA SRL — 35 artículos
-- IMPORTANTE: precio_base = 0 en todos los registros → actualizar desde /admin/productos antes de publicar
-- Ejecutar solo si la tabla productos está vacía o sin estos artículos

INSERT INTO productos (nombre, descripcion, precio_base, categoria, activo, stock, unidades_por_bulto, unidades_por_pallet, destacado, oferta_relamago, nueva_linea)
VALUES

-- ─── SILLONES ───────────────────────────────────────────────────────────────

('402',  'Banco Camping — Caño de acero 5/8". Increíblemente ligero y fácil de transportar, ideal para camping, playas y festivales.',              0, 'Sillones', true, 0, 10,   null, false, false, false),
('304',  'Sillón Alto Rayado — Acero 3/4" y 7/8". Cinta nilón. Plegable, resistente a la corrosión. Colores: Azul, Negro.',                        0, 'Sillones', true, 0,  5,   null, false, false, false),
('305',  'Sillón Coversol Rayado — Caño de acero 3/4" y 7/8". Tapizado Coversol. Pintura epoxi.',                                                  0, 'Sillones', true, 0,  5,   null, false, false, false),
('705',  'Sillón Alto Coversol — Aluminio 3/4" y 7/8". Tapizado Coversol. Ligero y fácil de transportar.',                                         0, 'Sillones', true, 0,  5,   null, false, false, false),
('704',  'Sillón de Aluminio Alto — Aluminio y cinta nilón. Diseño práctico para exteriores.',                                                      0, 'Sillones', true, 0,  5,   null, false, false, false),
('322',  'Sillón Reforzado — Caño de acero 1" (25mm). Cinta nilón. Alta capacidad. Color verde.',                                                   0, 'Sillones', true, 0,  2,   null, false, false, false),
('309',  'Sillón 5 Posiciones Outdoor — Caño de acero 1" y 7/8". Cinta nilón. 5 posiciones ajustables. Colores múltiples.',                        0, 'Sillones', true, 0,  2,   null, false, false, false),
('319',  'Sillón Brazo Madera — Caño de acero 7/8" (22mm). Cinta nilón. Diseño que combina metal y madera natural.',                               0, 'Sillones', true, 0,  2,   null, false, false, false),
('719',  'Sillón de Aluminio — Caño de aluminio 7/8" y 1". Cinta nilón. Liviano y contemporáneo.',                                                 0, 'Sillones', true, 0,  5,   null, false, false, false),
('715',  'Sillón Aluminio Coversol — Aluminio 1" y 7/8". Tapizado Coversol. Pintura epoxi negro. Color negro.',                                    0, 'Sillones', true, 0,  5,   null, false, false, false),
('718',  'Sillón de Aluminio Coversol — Aluminio 1" y 7/8". Tapizado Coversol. Plegable, resistente a la oxidación. Colores: Azul, Negro.',        0, 'Sillones', true, 0,  5,   null, false, false, false),
('318',  'Sillón Brazo de Madera Coversol — Acero con pintura epoxi 7/8" y 1". Tapizado Coversol. Larga vida útil.',                               0, 'Sillones', true, 0,  2,   null, false, false, false),
('717',  'Sillón Brazo de Madera con Manija — Aluminio 1" y 7/8". Tapizado Coversol. Manija de madera en apoyabrazos para traslado.',              0, 'Sillones', true, 0,  5,   null, false, false, false),
('329',  'Sillón Director Coversol 14x30 — Acero caño 14x30. Tapizado Coversol. Diseño elegante para publicidad y eventos.',                       0, 'Sillones', true, 0,  2,   null, false, false, false),
('326',  'Base Sillón Director Caño 1" — Caño de acero 1" 7/8". Estructura para sillón director. Sin tela incluida.',                              0, 'Sillones', true, 0,  1,   null, false, false, false),
('327',  'Base Sillón Director Caño 14x30 — Acero caño 14x30. Estructura para sillón director. Sin tela incluida.',                                0, 'Sillones', true, 0,  1,   null, false, false, false),
('331',  'Base Sillón Director Metal Símil Madera — Caño de acero 20x30, 20x40, 30x30. Símil madera. Sin tela incluida.',                          0, 'Sillones', true, 0,  1,   null, false, false, false),

-- ─── REPOSERAS ───────────────────────────────────────────────────────────────

('458',  'Playera Coversol — Acero 3/4" (19mm). Tapizado Coversol. Diseño práctico y ligero, plegado compacto.',                                   0, 'Reposeras', true, 0, 6,   null, false, false, false),
('758',  'Playera de Aluminio Coversol — Aluminio caño 7/8" (22mm). Tapizado Coversol. Confort y durabilidad para exteriores.',                    0, 'Reposeras', true, 0, 6,   null, false, false, false),
('714',  'Reposera Liviana Aluminio Coversol — Aluminio caño 7/8" (22mm). Tapizado Coversol. Anticorrosiva y fácil de transportar.',               0, 'Reposeras', true, 0, 5,   null, false, false, false),
('720',  'Reposera Reforzada Aluminio Coversol — Aluminio caño 1" (25mm). Tapizado Coversol. Ideal para uso intensivo en exteriores.',             0, 'Reposeras', true, 0, 5,   null, false, false, false),
('506',  'Reposera con Ruedas Tela Coversol — Caño de acero 1¼" (31mm). Tapizado Coversol. Múltiples posiciones reclinables y ruedas.',           0, 'Reposeras', true, 0, 1,   null, false, false, false),

-- ─── TENDEDEROS Y TABLAS ─────────────────────────────────────────────────────

('601',  'Tabla de Planchar Super Económica — Caño de acero 3/4" (19mm). Tela Plavilon. Superficie segura, diseño plegable.',                      0, 'Tendederos y Tablas', true, 0, 2,   null, false, false, false),
('604',  'Tabla de Planchar D''Luxe — Acero caño 20x30. Tela aluminizada gris. Diseño elegante, estructura robusta.',                              0, 'Tendederos y Tablas', true, 0, 2,   null, false, false, false),
('608',  'Tendedero Plegable de Pie — Caño de acero 5/8" (15mm). Sin alas. Almacenamiento compacto, armazón metálico ligero.',                    0, 'Tendederos y Tablas', true, 0, 5,   null, false, false, false),
('609',  'Tendedero Plegable de Pie Con Alas — Caño de acero 5/8" (15mm) recubierto. Con alas laterales para mayor espacio.',                     0, 'Tendederos y Tablas', true, 0, 5,   null, false, false, false),
('614',  'Tendedero Reforzado de Pie Plegable — Caño de acero 5/8" (15mm), pintura epoxi. Uso interior y exterior.',                              0, 'Tendederos y Tablas', true, 0, 2,   null, false, false, false),
('624',  'Tendedero Reforzado de Pie Plegable Con Alas — Caño de acero 5/8" (15mm) reforzado. Estable bajo cargas. Interior y exterior.',         0, 'Tendederos y Tablas', true, 0, 2,   null, false, false, false),
('724',  'Tendedero Liviano Plegable de Pie Con Alas — Caño de acero 5/8" (15mm). Liviano con alas laterales, mayor capacidad.',                  0, 'Tendederos y Tablas', true, 0, 2,   null, false, false, false),

-- ─── MESAS ───────────────────────────────────────────────────────────────────

('110',  'Mesa Plegable Liviana Redonda Tapa Plástica — Caño de acero 3/4" (19mm). Tapa redonda. Cómoda y portátil.',                             0, 'Mesas', true, 0, 2,   null, false, false, false),
('104',  'Mesa Plegable Redonda Tapa Plástica — Caño de acero 1" (25mm). Tapa redonda. Diseño elegante y funcional.',                             0, 'Mesas', true, 0, 2,   null, false, false, false),
('118',  'Mesa Plegable Alta Tapa Plástica — Caño de acero 3/4" (19mm). Tapa alta. Materiales de calidad superior.',                             0, 'Mesas', true, 0, 2,   null, false, false, false),
('116',  'Mesa Plegable Cuadrada Tapa Plástica — Caño de acero 1" (25mm). Tapa cuadrada. Versátil y adaptable.',                                 0, 'Mesas', true, 0, 2,   null, false, false, false),
('121',  'Mesa Plegable Cuadrada Tapa de Vidrio — Caño de acero 1" y 7/8". Tapa de vidrio 70×70 cm. Ideal para exhibición.',                    0, 'Mesas', true, 0, 2,   null, false, false, false),
('117',  'Base de Mesa Plegable — Caño de acero perfil 1" 3/4". Base para tapa de publicidad. Sin tapa incluida.',                               0, 'Mesas', true, 0, 1,   null, false, false, false);
