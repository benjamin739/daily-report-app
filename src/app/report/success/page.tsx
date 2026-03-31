"use client";
import { useRouter } from "next/navigation";

export default function SuccessPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#1e3a5f] px-6 text-center">
      <div className="text-7xl mb-6">✅</div>
      <h1 className="text-3xl font-bold text-white mb-3">Report Submitted!</h1>
      <p className="text-blue-200 text-lg mb-10">
        Your daily report has been saved to Notion successfully.
      </p>
      <button
        onClick={() => router.push("/report")}
        className="w-full max-w-xs py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-lg transition-colors"
      >
        Submit Another Report
      </button>
    </div>
  );
}
