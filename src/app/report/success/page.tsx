"use client";
import { useRouter } from "next/navigation";

export default function SuccessPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black px-6 text-center">
      <div className="mb-8">
        <div className="text-white text-4xl font-serif tracking-widest font-light">ESTATE</div>
        <div className="text-white text-xs tracking-[0.3em] font-light mt-1">DESIGN &amp; CONSTRUCTION</div>
      </div>
      <div className="w-16 h-px bg-white/20 mx-auto mb-8" />
      <div className="text-5xl mb-6">✓</div>
      <h1 className="text-2xl font-light text-white tracking-widest uppercase mb-3">Report Submitted</h1>
      <p className="text-white/50 text-sm mb-10 tracking-wide">
        Your daily report has been saved to Notion.
      </p>
      <button
        onClick={() => router.push("/report")}
        className="w-full max-w-xs py-4 bg-white hover:bg-white/90 text-black font-semibold tracking-widest uppercase text-sm transition-colors"
      >
        Submit Another Report
      </button>
    </div>
  );
}
