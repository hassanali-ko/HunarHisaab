"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/data";

/** Both of these run as database functions scoped to the signed in user. */
export async function loadSampleData() {
  const { supabase } = await requireUser();
  await supabase.rpc("load_sample_data");
  revalidatePath("/", "layout");
}

export async function clearAllData() {
  const { supabase } = await requireUser();
  await supabase.rpc("clear_all_data");
  revalidatePath("/", "layout");
}
