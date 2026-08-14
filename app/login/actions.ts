"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { DEMO_EMAIL, DEMO_ORDERS, DEMO_PASSWORD } from "@/lib/demo";

export type AuthState = { error?: string } | undefined;

export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Email aur password dono chahiye." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const display_name = String(formData.get("display_name") ?? "").trim();
  const business_name = String(formData.get("business_name") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();

  if (!email || password.length < 6)
    return { error: "Password kam az kam 6 characters ka hona chahiye." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name, business_name, city } },
  });
  if (error) return { error: error.message };

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError)
    return {
      error:
        "Account ban gaya, lekin login nahi hua. Supabase mein 'Confirm email' band karein, phir log in karein.",
    };

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

/** Creates (once) and signs into a pre-seeded demo account. */
export async function demoLogin(): Promise<AuthState> {
  const supabase = await createClient();

  let signedIn = await supabase.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  });

  if (signedIn.error) {
    let admin;
    try {
      admin = createAdminClient();
    } catch {
      return {
        error:
          "Demo account ke liye SUPABASE_SERVICE_ROLE_KEY chahiye. Apna account bana kar log in karein.",
      };
    }

    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: {
          display_name: "Ayesha (Demo)",
          business_name: "Ayesha Stitching Studio",
          city: "Lahore",
        },
      });

    if (createError && !createError.message.toLowerCase().includes("already"))
      return { error: createError.message };

    if (created?.user) await seedDemoOrders(created.user.id);

    signedIn = await supabase.auth.signInWithPassword({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    });
    if (signedIn.error) return { error: signedIn.error.message };
  }

  const userId = signedIn.data.user?.id;
  if (userId) await seedDemoOrders(userId);

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

/** Inserts sample orders once; safe to call on every demo login. */
async function seedDemoOrders(userId: string) {
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return;
  }

  await admin
    .from("profiles")
    .upsert(
      {
        id: userId,
        display_name: "Ayesha (Demo)",
        business_name: "Ayesha Stitching Studio",
        city: "Lahore",
      },
      { onConflict: "id" },
    );

  const { count } = await admin
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if ((count ?? 0) > 0) return;

  const now = Date.now();
  const rows = DEMO_ORDERS.map(({ daysAgo, confirmed, ...order }) => {
    const created = new Date(now - daysAgo * 86_400_000).toISOString();
    return {
      ...order,
      user_id: userId,
      source_text: null,
      created_at: created,
      confirmed_at: confirmed ? created : null,
    };
  });

  await admin.from("orders").insert(rows);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
