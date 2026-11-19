// Compatibility boundary for the source archive, which shipped without database DDL.
// Replace with generated Cloud types once the original schema is supplied.
import { supabase as cloudClient } from "@/integrations/supabase/client";
import type { Json as CloudJson } from "@/integrations/supabase/types";
export type Json = CloudJson;
export type Database = any;
export type Tables<T extends string = string> = any;
export const supabase = cloudClient as any;
