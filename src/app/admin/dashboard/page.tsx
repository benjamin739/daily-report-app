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

  function getStatusColor(status: string) {
    const map: Record<string, string> = {
      "In Progress": "bg-blue-100 text-blue-700",
      "On Hold": "bg-yellow-100 text-yellow-700",
      Completed: "bg-green-100 text-green-700",
      Delayed: "bg-red-100 text-red-700",
    };
    return map[status] || "bg-gray-100 text-gray-600";
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gray-900 text-white px-5 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Admin Dashboard</h1>
          <p className="text-gray-400 text-sm">{adminName}</p>
        </div>
        <div className="flex gap-4 items-center">
          <Link href="/admin/foremen" className="text-blue-400 text-sm hover:text-blue-300">
            Manage Foremen
          </Link>
          <button onClick={handleLogout} className="text-gray-400 text-sm hover:text-white">
            Sign Out
          </button>
        </div>
      </div>

      <div className="px-4 py-5 max-w-4xl mx-auto">
        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <div className="text-3xl font-bold text-[#1e3a5f]">{reports.length}</div>
            <div className="text-gray-500 text-sm mt-1">Total Reports</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <Link
              href="/admin/foremen"
              className="text-3xl font-bold text-orange-500 block hover:text-orange-600"
            >
              →
            </Link>
            <div className="text-gray-500 text-sm mt-1">Manage Foremen</div>
          </div>
        </div>

        {/* Reports list */}
        <h2 className="font-bold text-gray-800 text-base mb-3">Recent Reports</h2>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400 shadow-sm">
            No reports submitted yet.
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => {
              const name =
                report.properties.Name?.title?.[0]?.plain_text || "Untitled";
              const date = report.properties.Date?.date?.start || "";
              const foreman =
                report.properties["Foreman Name"]?.rich_text?.[0]?.plain_text || "";
              const status = report.properties.Status?.select?.name || "";

              return (
                <a
                  key={report.id}
                  href={report.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow block"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-800 truncate">{name}</div>
                    <div className="text-sm text-gray-500 mt-0.5">
                      {date} {foreman && `• ${foreman}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    {status && (
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(status)}`}>
                        {status}
                      </span>
                    )}
                    <span className="text-gray-400 text-sm">↗</span>
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
