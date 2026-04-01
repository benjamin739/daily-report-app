"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Invalid email or password.");
      setLoading(false);
      return;
    }

    const role = data.user?.user_metadata?.role;
    if (role !== "admin") {
      setError("This account does not have admin access.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    router.push("/admin/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-12">
          <div className="text-white text-4xl font-serif tracking-widest font-light">ESTATE</div>
          <div className="text-white text-xs tracking-[0.3em] font-light mt-1">DESIGN &amp; CONSTRUCTION</div>
          <div className="w-16 h-px bg-white/30 mx-auto mt-6 mb-6" />
          <p className="text-white/50 text-xs tracking-widest uppercase">Admin Panel</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/60 mb-2 tracking-widest uppercase">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/5 text-white placeholder-white/20 border border-white/20 focus:outline-none focus:border-white/60 text-base transition-colors"
              placeholder="admin@estatedc.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/60 mb-2 tracking-widest uppercase">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/5 text-white placeholder-white/20 border border-white/20 focus:outline-none focus:border-white/60 text-base transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="border border-red-400/50 text-red-300 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-white hover:bg-white/90 disabled:bg-white/50 text-black font-semibold tracking-widest uppercase text-sm transition-colors"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
