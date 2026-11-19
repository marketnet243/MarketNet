import { supabaseAdmin as cloudAdmin } from "@/integrations/supabase/client.server";
export const supabaseAdmin = cloudAdmin as any;
