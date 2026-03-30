-- Assign admin role to the project owner
INSERT INTO public.user_roles (user_id, role) VALUES
  ('81f33beb-a431-418a-ac48-ce98002b2c2a', 'admin'),
  ('73d98c6f-d9ff-4e91-a101-3774dccfea18', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;