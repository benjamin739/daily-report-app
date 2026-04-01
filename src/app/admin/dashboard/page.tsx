"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface Report {
  id: string;
  url: string;
  properties: {
    Name?: { title: Array<{ plain_text: string }> };
    Date?: { date: { start: string } | null };
    "Project Name"?: { rich_text: Array<{ plain_text: string }> };
    "Foreman Name"?: { rich_text: Array<{ plain_text: string }> };
    Status?: { select: { name: string } | null };
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session || session.user.user_metadata?.role !== "admin") {
        router.replace("/admin");
        return;
      }
      setAdminName(session.user.user_metadata?.full_name || session.user.email || "Admin");
      fetchReports();
    });
  }, [router]);

  async function fetchReports() {
    const res = await fetch("/api/admin/reports");
    if (res.ok) {
      const data = await res.json();
      setReports(data.reports || []);
    }
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/admin");
  }

  const statusColors: Record<string, string> = {
    "Working Day": "bg-black text-white",
    "Not Started": "bg-gray-100 text-gray-600",
    "On Hold": "bg-yellow-100 text-yellow-700",
    "No Working Day": "bg-gray-200 text-gray-500",
    "Holiday": "bg-green-100 text-green-700",
    "Rain Day": "bg-blue-100 text-blue-700",
    "Punch List": "bg-orange-100 text-orange-700",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-black text-white px-5 py-4 flex items-center justify-between">
        <div>
          <div className="text-xs tracking-[0.2em] text-white/40 uppercase">Estate Design & Construction</div>
          <h1 className="text-base font-semibold tracking-wide">EDC Admin</h1>
        </div>
        <div className="flex gap-4 items-center">
          <Link href="/admin/foremen" className="text-white/60 text-xs hover:text-white tracking-widest uppercase">
            Foremen
          </Link>
          <button onClick={handleLogout} className="text-white/40 text-xs hover:text-white tracking-widest uppercase">
            Sign Out
          </button>
        </div>
      </div>

      <div className="px-4 py-5 max-w-4xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white border border-gray-100 p-4 text-center">
            <div className="text-3xl font-bold text-black">{reports.length}</div>
            <div className="text-gray-400 text-xs mt-1 tracking-widest uppercase">Total Reports</div>
          </div>
          <Link href="/admin/foremen" className="bg-black p-4 text-center hover:bg-gray-900 transition-colors">
            <div className="text-3xl font-light text-white">→</div>
            <div className="text-white/60 text-xs mt-1 tracking-widest uppercase">Manage Foremen</div>
          </Link>
        </div>

        <h2 className="text-xs font-semibold text-gray-400 tracking-widest uppercase mb-3">Recent Reports</h2>

        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="bg-white border border-gray-100 p-8 text-center text-gray-400 text-sm">
            No reports submitted yet.
          </div>
        ) : (
          <div className="space-y-2">
            {reports.map((report) => {
              const name = report.properties.Name?.title?.[0]?.plain_text || "Untitled";
              const date = report.properties.Date?.date?.start || "";
              const foreman = report.properties["Foreman Name"]?.rich_text?.[0]?.plain_text || "";
              const status = report.properties.Status?.select?.name || "";

              return (
                <a
                  key={report.id}
                  href={report.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white border border-gray-100 p-4 flex items-center justify-between hover:border-black transition-colors block"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800 truncate text-sm">{name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {date}{foreman && ` · ${foreman}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    {status && (
                      <span className={`text-xs px-2 py-1 font-medium ${statusColors[status] || "bg-gray-100 text-gray-600"}`}>
                        {status}
                      </span>
                    )}
                    <span className="text-gray-300 text-sm">↗</span>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
