DROP POLICY IF EXISTS "Allow authenticated read model_pricing_tiers" ON public.model_pricing_tiers;
CREATE POLICY "Allow authenticated read model_pricing_tiers"
ON public.model_pricing_tiers
FOR SELECT
TO authenticated
USING (true);