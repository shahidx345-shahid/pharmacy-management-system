-- Add 20 sample medicines for testing and selection
-- Replace 'YOUR_USER_ID' with your actual user ID from the auth.users table

INSERT INTO medicines (user_id, name, generic_name, manufacturer, quantity_in_stock, unit_price, expiry_date, batch_number, reorder_level, category, created_at, updated_at)
VALUES
  ('YOUR_USER_ID', 'Aspirin', 'Acetylsalicylic Acid', 'Bayer', 500, 2.50, '2026-12-31', 'BATCH001', 50, 'Pain Relief', NOW(), NOW()),
  ('YOUR_USER_ID', 'Ibuprofen', 'Ibuprofen', 'Pfizer', 300, 3.00, '2026-11-30', 'BATCH002', 40, 'Pain Relief', NOW(), NOW()),
  ('YOUR_USER_ID', 'Paracetamol', 'Acetaminophen', 'GSK', 400, 1.50, '2026-10-31', 'BATCH003', 60, 'Pain Relief', NOW(), NOW()),
  ('YOUR_USER_ID', 'Amoxicillin', 'Amoxicillin', 'Novartis', 200, 5.00, '2026-09-30', 'BATCH004', 30, 'Antibiotic', NOW(), NOW()),
  ('YOUR_USER_ID', 'Ciprofloxacin', 'Ciprofloxacin', 'Cipla', 150, 4.50, '2026-08-31', 'BATCH005', 25, 'Antibiotic', NOW(), NOW()),
  ('YOUR_USER_ID', 'Metformin', 'Metformin', 'Merck', 600, 2.00, '2026-12-31', 'BATCH006', 100, 'Diabetes', NOW(), NOW()),
  ('YOUR_USER_ID', 'Lisinopril', 'Lisinopril', 'AstraZeneca', 250, 3.50, '2026-11-30', 'BATCH007', 50, 'Blood Pressure', NOW(), NOW()),
  ('YOUR_USER_ID', 'Atorvastatin', 'Atorvastatin', 'Pfizer', 180, 4.00, '2026-10-31', 'BATCH008', 40, 'Cholesterol', NOW(), NOW()),
  ('YOUR_USER_ID', 'Omeprazole', 'Omeprazole', 'AstraZeneca', 220, 2.75, '2026-09-30', 'BATCH009', 35, 'Gastric', NOW(), NOW()),
  ('YOUR_USER_ID', 'Loratadine', 'Loratadine', 'Schering-Plough', 350, 1.80, '2026-12-31', 'BATCH010', 50, 'Allergy', NOW(), NOW()),
  ('YOUR_USER_ID', 'Cetirizine', 'Cetirizine', 'UCB Pharma', 280, 2.20, '2026-11-30', 'BATCH011', 45, 'Allergy', NOW(), NOW()),
  ('YOUR_USER_ID', 'Salbutamol', 'Salbutamol', 'GSK', 120, 6.50, '2026-10-31', 'BATCH012', 20, 'Respiratory', NOW(), NOW()),
  ('YOUR_USER_ID', 'Fluticasone', 'Fluticasone', 'GSK', 90, 7.00, '2026-09-30', 'BATCH013', 15, 'Respiratory', NOW(), NOW()),
  ('YOUR_USER_ID', 'Sertraline', 'Sertraline', 'Pfizer', 160, 3.25, '2026-12-31', 'BATCH014', 30, 'Mental Health', NOW(), NOW()),
  ('YOUR_USER_ID', 'Fluoxetine', 'Fluoxetine', 'Eli Lilly', 140, 3.50, '2026-11-30', 'BATCH015', 25, 'Mental Health', NOW(), NOW()),
  ('YOUR_USER_ID', 'Diclofenac', 'Diclofenac', 'Novartis', 210, 2.80, '2026-10-31', 'BATCH016', 35, 'Pain Relief', NOW(), NOW()),
  ('YOUR_USER_ID', 'Naproxen', 'Naproxen', 'Bayer', 190, 3.10, '2026-09-30', 'BATCH017', 30, 'Pain Relief', NOW(), NOW()),
  ('YOUR_USER_ID', 'Vitamin C', 'Ascorbic Acid', 'Nature Made', 800, 1.20, '2026-12-31', 'BATCH018', 100, 'Vitamin', NOW(), NOW()),
  ('YOUR_USER_ID', 'Vitamin D3', 'Cholecalciferol', 'Carlson Labs', 400, 2.50, '2026-11-30', 'BATCH019', 60, 'Vitamin', NOW(), NOW()),
  ('YOUR_USER_ID', 'Multivitamin', 'Multivitamin Complex', 'Centrum', 500, 4.00, '2026-10-31', 'BATCH020', 80, 'Vitamin', NOW(), NOW());
