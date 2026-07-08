import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rsdafkietitmzqamgznt.supabase.co'

const supabaseKey = 'sb_publishable_XU6Sq2xlZHsz4bOdOHPgsA_dKp-f7wV'

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
)