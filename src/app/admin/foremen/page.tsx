"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface Foreman {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

export default function ForemenPage() {
  const router = useRouter();
  const [foremen, setForemen] = useState<Foreman[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session || session.user.user_metadata?.role !== "admin") {
        router.replace("/admin");
        return;
      }
      fetchForemen();
    });
  }, [router]);

  async function fetchForemen() {
    const res = await fetch("/api/admin/foremen");
    if (res.ok) {
      const data = await res.json();
      setForemen(data.foremen || []);
    }
    setLoading(false);
  }

  async function handleAddForeman(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setError("");
    setSuccess("");

    const res = await fetch("/api/admin/foremen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: newEmail,
        password: newPassword,
        full_name: newName,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Failed to add foreman");
    } else {
      setSuccess(`${newName} has been added successfully.`);
      setNewEmail("");
      setNewName("");
      setNewPassword("");
      setShowAdd(false);
      fetchForemen();
    }
    setAdding(false);
  }

  async function handleRemove(id: string, name: string) {
    if (!confirm(`Remove ${name}? They will no longer be able to log in.`)) return;

    const res = await fetch(`/api/admin/foremen?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setForemen((prev) => prev.filter((f) => f.id !== id));
      setSuccess(`${name} has been removed.`);
    } else {
      setError("Failed to remove foreman.");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gray-900 text-white px-5 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Manage Foremen</h1>
          <p className="text-gray-400 text-sm">{foremen.length} accounts</p>
        </div>
        <Link href="/admin/dashboard" className="text-gray-400 text-sm hover:text-white">
          ← Dashboard
        </Link>
      </div>

      <div className="px-4 py-5 max-w-2xl mx-auto">
        {success && (
          <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded-xl text-sm mb-4">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
            {error}
          </div>
        )}

        {/* Add foreman button */}
        {!showAdd && (
          <button
            onClick={() => setShowAdd(true)}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl mb-5 transition-colors"
          >
            + Add New Foreman
          </button>
        )}

        {/* Add foreman form */}
        {showAdd && (
          <div className="bg-white rounded-2xl p-5 shadow-sm mb-5">
            <h2 className="font-bold text-gray-800 mb-4">New Foreman Account</h2>
            <form onSubmit={handleAddForeman} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Full Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  placeholder="John Smith"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  placeholder="john@company.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Temporary Password
                </label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Min 8 characters"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={adding}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl transition-colors"
                >
                  {adding ? "Adding..." : "Add Foreman"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Foremen list */}
        <h2 className="font-bold text-gray-800 text-base mb-3">Current Foremen</h2>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : foremen.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400 shadow-sm">
            No foremen added yet.
          </div>
        ) : (
          <div className="space-y-3">
            {foremen.map((foreman) => (
              <div
                key={foreman.id}
                className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-gray-800">{foreman.full_name}</div>
                  <div className="text-sm text-gray-500">{foreman.email}</div>
                </div>
                <button
                  onClick={() => handleRemove(foreman.id, foreman.full_name)}
                  className="text-red-400 hover:text-red-600 text-sm font-medium px-3 py-1"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
