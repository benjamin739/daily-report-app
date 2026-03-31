import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) throw error;

    const foremen = data.users
      .filter((u) => u.user_metadata?.role === "foreman")
      .map((u) => ({
        id: u.id,
        email: u.email || "",
        full_name: u.user_metadata?.full_name || u.user_metadata?.name || u.email || "",
        created_at: u.created_at,
      }));

    return NextResponse.json({ foremen });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch foremen";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, full_name } = await req.json();

    if (!email || !password || !full_name) {
      return NextResponse.json(
        { error: "Email, password, and name are required" },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();
    const { error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { role: "foreman", full_name },
      email_confirm: true,
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create foreman";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const supabase = getServiceClient();
    const { error } = await supabase.auth.admin.deleteUser(id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete foreman";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
