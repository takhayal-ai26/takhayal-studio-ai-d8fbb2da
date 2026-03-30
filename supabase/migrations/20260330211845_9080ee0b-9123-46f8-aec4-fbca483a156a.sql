DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'tools' AND policyname = 'Allow authenticated read tools'
  ) THEN
    CREATE POLICY "Allow authenticated read tools"
      ON public.tools
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'templates' AND policyname = 'Allow authenticated read templates'
  ) THEN
    CREATE POLICY "Allow authenticated read templates"
      ON public.templates
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'template_categories' AND policyname = 'Allow authenticated read template_categories'
  ) THEN
    CREATE POLICY "Allow authenticated read template_categories"
      ON public.template_categories
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'tool_providers' AND policyname = 'Allow authenticated read tool_providers'
  ) THEN
    CREATE POLICY "Allow authenticated read tool_providers"
      ON public.tool_providers
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;