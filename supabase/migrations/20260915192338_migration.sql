INSERT INTO schools (name, director_name, accountant_name, sales_manager_name, sales_manager_role) VALUES
('مدرسة النور الأساسية', 'أحمد محمد', 'سارة علي', 'محمود حسن', 'مسؤول المبيعات')
ON CONFLICT DO NOTHING;

INSERT INTO levels (school_id, level_name) 
SELECT id, 'الصف الأول' FROM schools WHERE name = 'مدرسة النور الأساسية'
ON CONFLICT DO NOTHING;

INSERT INTO levels (school_id, level_name) 
SELECT id, 'الصف الثاني' FROM schools WHERE name = 'مدرسة النور الأساسية'
ON CONFLICT DO NOTHING;

INSERT INTO levels (school_id, level_name) 
SELECT id, 'الصف الثالث' FROM schools WHERE name = 'مدرسة النور الأساسية'
ON CONFLICT DO NOTHING;

INSERT INTO books (level_id, barcode, title, unit_price, total_quantity)
SELECT l.id, 'ms00001/00', 'لغتي الجميلة', 25.50, 50
FROM levels l 
JOIN schools s ON l.school_id = s.id
WHERE s.name = 'مدرسة النور الأساسية' AND l.level_name = 'الصف الأول'
ON CONFLICT DO NOTHING;

INSERT INTO books (level_id, barcode, title, unit_price, total_quantity)
SELECT l.id, 'ms00002/00', 'الرياضيات', 30.00, 50
FROM levels l 
JOIN schools s ON l.school_id = s.id
WHERE s.name = 'مدرسة النور الأساسية' AND l.level_name = 'الصف الأول'
ON CONFLICT DO NOTHING;

INSERT INTO books (level_id, barcode, title, unit_price, total_quantity)
SELECT l.id, 'ms00003/00', 'العلوم', 28.75, 50
FROM levels l 
JOIN schools s ON l.school_id = s.id
WHERE s.name = 'مدرسة النور الأساسية' AND l.level_name = 'الصف الأول'
ON CONFLICT DO NOTHING;

INSERT INTO books (level_id, barcode, title, unit_price, total_quantity)
SELECT l.id, 'ms00004/00', 'الدراسات الاجتماعية', 22.00, 50
FROM levels l 
JOIN schools s ON l.school_id = s.id
WHERE s.name = 'مدرسة النور الأساسية' AND l.level_name = 'الصف الأول'
ON CONFLICT DO NOTHING;