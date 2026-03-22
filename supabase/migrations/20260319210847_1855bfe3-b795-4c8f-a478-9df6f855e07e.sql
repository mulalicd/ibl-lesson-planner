
-- Add is_favourite column to plans if not exists
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS is_favourite boolean DEFAULT false;

-- Add updated_at column if not exists
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create trigger for updated_at if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_plans_updated_at') THEN
    CREATE TRIGGER update_plans_updated_at
      BEFORE UPDATE ON public.plans
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END
$$;
