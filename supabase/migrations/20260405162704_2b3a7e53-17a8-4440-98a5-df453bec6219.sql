DROP POLICY IF EXISTS "Allow anon read model_pricing_tiers" ON public.model_pricing_tiers;
DROP POLICY IF EXISTS "Allow authenticated read model_pricing_tiers" ON public.model_pricing_tiers;

CREATE POLICY "Anon can read model_pricing_tiers"
ON public.model_pricing_tiers
FOR SELECT
TO anon
USING (auth.role() = 'anon');

CREATE POLICY "Authenticated can read model_pricing_tiers"
ON public.model_pricing_tiers
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);