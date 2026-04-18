-- ============================================================
-- MediLedger — Seed Data
-- Run this AFTER schema.sql to populate sample transactions
-- ============================================================

INSERT INTO public.transactions (date, type, category, amount, client, notes) VALUES
  ('2026-04-14', 'income',  'Medical Equipment Sales', 45000,  'Metro General Hospital',      'MRI Scanner units'),
  ('2026-04-13', 'expense', 'Laboratory Supplies',      8500,  'BioSupply Co.',               'Monthly reagent order'),
  ('2026-04-12', 'income',  'Laboratory Services',     12300,  'HealthFirst Clinic',           'Monthly diagnostic services'),
  ('2026-04-11', 'expense', 'Equipment Maintenance',    3200,  'TechMed Services',             'Quarterly maintenance contract'),
  ('2026-04-10', 'income',  'Clinical Trials',         78000,  'PharmaCorp International',    'Phase 2 trial completion'),
  ('2026-04-09', 'expense', 'Salaries',                42000,  'Internal',                    'Bi-weekly payroll'),
  ('2026-04-08', 'income',  'Consultation Fees',        5500,  'Regional Medical Center',     'Strategic planning consultation'),
  ('2026-04-07', 'expense', 'Research & Development',  15000,  'Internal',                    'New protocol development'),
  ('2026-04-05', 'income',  'Research Grants',        125000,  'University Research Lab',     'NIH Grant Q2 disbursement'),
  ('2026-04-05', 'expense', 'Utilities',                4800,  'PowerGrid Utilities',         'Monthly electricity bill'),
  ('2026-04-03', 'income',  'Software Licensing',       8900,  'BioTech Solutions',           'Annual license renewal'),
  ('2026-04-02', 'expense', 'Insurance',               12500,  'MedInsure Corp',              'Liability insurance premium');
