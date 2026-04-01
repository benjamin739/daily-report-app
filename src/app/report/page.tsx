"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const TIME_OPTIONS = (() => {
  const options: string[] = [];
  for (let h = 5; h <= 20; h++) {
    ["00", "30"].forEach((m) => {
      if (h === 20 && m === "30") return;
      const ampm = h < 12 ? "AM" : "PM";
      const hour = h <= 12 ? h : h - 12;
      options.push(`${hour}:${m} ${ampm}`);
    });
  }
  return options;
})();

interface WorkerEntry {
  name: string;
  startTime: string;
  endTime: string;
}

const PROJECTS = [
  "Will Roberts - ADU Renovation 2025",
  "West Hollywood - WEHO Plummer Park Dog",
  "UC Riverside - Library Renovation",
  "Senior Center Rehabilitation",
  "Pico Rivera - Council Chambers Upgrades and Accessibility",
  "Palo Alto - University Underpass Refurbishment",
  "Orange County - Sanitation Department Control Room Reconfiguration",
  "New Port - Skylight Screen Installation",
  "Hollister - Bathroom Remodel at the Community Center",
  "Fontana - Old Timers Foundation Renovation Project",
  "Debbie Sobol - Home Remodel",
  "David and Loren Teolis Remodel",
  "Culver - Police Department Restroom Renovation Project PF-020",
  "Camarillo - Wash Water Recovery Unit Cover Addition",
  "Burbank - ACF Burbank Youth Center Solar Improvements",
  "Randy Urista - General Remodel",
  "City Hall Interior Renovation / Signal Hill",
  "Adrienne Mitchell Park Restroom Addition",
  "Anaheim Union HS District - Gilbert HS Sewer Line Repair",
  "Mono County - Crowley Lake Park Sport Courts",
  "Pomona - Water Resources Yard Onsite Utility",
  "Riverside - Owned Parking Lot and Alley",
  "Roof Replacement - Fire Station 36",
  "San Bernardino - 19th St. Storm Drain Improvements",
  "Santa Monica - Bodega Conversion",
  "Santa Clarita - Meditation Garden",
];

const STATUSES = [
  "Working Day",
  "Not Started",
  "On Hold",
  "No Working Day",
  "Holiday",
  "Rain Day",
  "Punch List",
];

interface FormData {
  date: string;
  projectName: string;
  status: string;
  activity: string;
  tools: string;
  tomorrowsGoal: string;
  unforeseen: string;
  safetyMeeting: boolean;
}

export default function ReportPage() {
  const router = useRouter();
  const [foremanName, setForemanName] = useState("");
  const [foremanEmail, setForemanEmail] = useState("");
  const [pictures, setPictures] = useState<File[]>([]);
  const [signSheet, setSignSheet] = useState<File | null>(null);
  const [picturesPreviews, setPicturesPreviews] = useState<string[]>([]);
  const [signSheetPreview, setSignSheetPreview] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const picturesRef = useRef<HTMLInputElement>(null);
  const signSheetRef = useRef<HTMLInputElement>(null);
  const [workers, setWorkers] = useState<WorkerEntry[]>([
    { name: "", startTime: "7:00 AM", endTime: "3:30 PM" },
  ]);

  const [form, setForm] = useState<FormData>({
    date: new Date().toISOString().split("T")[0],
    projectName: "",
    status: "",
    activity: "",
    tools: "",
    tomorrowsGoal: "",
    unforeseen: "",
    safetyMeeting: false,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/login");
        return;
      }
      const meta = session.user.user_metadata;
      setForemanName(meta?.full_name || meta?.name || session.user.email || "");
      setForemanEmail(session.user.email || "");
    });
  }, [router]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const target = e.target;
    const value =
      target instanceof HTMLInputElement && target.type === "checkbox"
        ? target.checked
        : target.value;
    setForm((prev) => ({ ...prev, [target.name]: value }));
  }

  const calcHours = useCallback((start: string, end: string): string => {
    const toMinutes = (t: string) => {
      const [time, ampm] = t.split(" ");
      const [rawH, m] = time.split(":").map(Number);
      let h = rawH;
      if (ampm === "PM" && h !== 12) h += 12;
      if (ampm === "AM" && h === 12) h = 0;
      return h * 60 + m;
    };
    const diff = toMinutes(end) - toMinutes(start);
    if (diff <= 0) return "";
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
  }, []);

  function updateWorker(index: number, field: keyof WorkerEntry, value: string) {
    setWorkers((prev) => prev.map((w, i) => i === index ? { ...w, [field]: value } : w));
  }

  function addWorker() {
    setWorkers((prev) => [...prev, { name: "", startTime: "7:00 AM", endTime: "3:30 PM" }]);
  }

  function removeWorker(index: number) {
    setWorkers((prev) => prev.filter((_, i) => i !== index));
  }

  function handlePicturesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    setPictures((prev) => [...prev, ...files]);
    const previews = files.map((f) => URL.createObjectURL(f));
    setPicturesPreviews((prev) => [...prev, ...previews]);
  }

  function handleSignSheetChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSignSheet(file);
      setSignSheetPreview(URL.createObjectURL(file));
    }
  }

  function removePicture(index: number) {
    setPictures((prev) => prev.filter((_, i) => i !== index));
    setPicturesPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const pictureUrls: string[] = [];
      for (const pic of pictures) {
        const fd = new FormData();
        fd.append("file", pic);
        const res = await fetch("/api/upload-photo", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Photo upload failed");
        pictureUrls.push(data.url);
      }

      let signSheetUrl = "";
      if (signSheet) {
        const fd = new FormData();
        fd.append("file", signSheet);
        const res = await fetch("/api/upload-photo", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Sign sheet upload failed");
        signSheetUrl = data.url;
      }

      const workersNames = workers.filter((w) => w.name.trim()).map((w) => w.name.trim()).join("\n");
      const workersHours = workers
        .filter((w) => w.name.trim())
        .map((w) => {
          const hours = calcHours(w.startTime, w.endTime);
          return `${w.name.trim()} — ${w.startTime} to ${w.endTime}${hours ? ` (${hours})` : ""}`;
        })
        .join("\n");

      const res = await fetch("/api/submit-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, workersNames, workersHours, foremanName, foremanEmail, pictureUrls, signSheetUrl }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit report");

      router.push("/report/success");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const inputClass = "w-full px-4 py-3 border border-gray-200 focus:outline-none focus:border-black text-gray-800 text-base bg-white transition-colors";
  const labelClass = "block text-xs font-semibold text-gray-500 mb-1 tracking-widest uppercase";
  const sectionClass = "bg-white border border-gray-100 p-5 space-y-4";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-black text-white px-5 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <div className="text-xs tracking-[0.2em] text-white/50 uppercase">Estate Design & Construction</div>
          <h1 className="text-base font-semibold tracking-wide">EDC Daily Report</h1>
        </div>
        <div className="text-right">
          <div className="text-xs text-white/60">{foremanName}</div>
          <button onClick={handleLogout} className="text-xs text-white/40 hover:text-white mt-0.5">
            Sign Out
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-5 space-y-4 max-w-2xl mx-auto pb-32">

        {/* Basic Info */}
        <div className={sectionClass}>
          <h2 className="font-semibold text-gray-800 text-sm tracking-widest uppercase">Basic Information</h2>

          <div>
            <label className={labelClass}>Date</label>
            <input type="date" name="date" value={form.date} onChange={handleChange} required className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Project Name</label>
            <select name="projectName" value={form.projectName} onChange={handleChange} required className={inputClass}>
              <option value="">Select project...</option>
              {PROJECTS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Status</label>
            <select name="status" value={form.status} onChange={handleChange} required className={inputClass}>
              <option value="">Select status...</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Activities */}
        <div className={sectionClass}>
          <h2 className="font-semibold text-gray-800 text-sm tracking-widest uppercase">Activities</h2>

          <div>
            <label className={labelClass}>Activity</label>
            <textarea name="activity" value={form.activity} onChange={handleChange} rows={3} placeholder="Describe today's activity..." className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Tomorrow&apos;s Goal</label>
            <textarea name="tomorrowsGoal" value={form.tomorrowsGoal} onChange={handleChange} rows={3} placeholder="What is planned for tomorrow?" className={inputClass} />
          </div>
        </div>

        {/* Workers */}
        <div className={sectionClass}>
          <h2 className="font-semibold text-gray-800 text-sm tracking-widest uppercase">Workers</h2>

          <div className="space-y-3">
            {workers.map((worker, i) => {
              const hours = calcHours(worker.startTime, worker.endTime);
              return (
                <div key={i} className="border border-gray-100 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-400 tracking-widest uppercase">Worker {i + 1}</span>
                    {workers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeWorker(i)}
                        className="text-xs text-gray-400 hover:text-red-500 font-medium"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Worker name"
                    value={worker.name}
                    onChange={(e) => updateWorker(i, "name", e.target.value)}
                    className={inputClass}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Start Time</label>
                      <select
                        value={worker.startTime}
                        onChange={(e) => updateWorker(i, "startTime", e.target.value)}
                        className={inputClass}
                      >
                        {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">End Time</label>
                      <select
                        value={worker.endTime}
                        onChange={(e) => updateWorker(i, "endTime", e.target.value)}
                        className={inputClass}
                      >
                        {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  {hours && (
                    <div className="text-xs text-gray-500 font-medium">Total: {hours}</div>
                  )}
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={addWorker}
            className="w-full py-3 border-2 border-dashed border-gray-300 text-gray-500 font-medium hover:border-black hover:text-black transition-colors text-sm mt-1"
          >
            + Add Worker
          </button>
        </div>

        {/* Equipment & Notes */}
        <div className={sectionClass}>
          <h2 className="font-semibold text-gray-800 text-sm tracking-widest uppercase">Equipment & Notes</h2>

          <div>
            <label className={labelClass}>Tools / Equipment Used</label>
            <textarea name="tools" value={form.tools} onChange={handleChange} rows={3} placeholder="List tools and equipment used today..." className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Unforeseen Events</label>
            <textarea name="unforeseen" value={form.unforeseen} onChange={handleChange} rows={3} placeholder="Any unexpected issues or delays?" className={inputClass} />
          </div>

          <div className="flex items-center gap-3 py-1">
            <input
              type="checkbox"
              name="safetyMeeting"
              id="safetyMeeting"
              checked={form.safetyMeeting}
              onChange={handleChange}
              className="w-5 h-5 accent-black"
            />
            <label htmlFor="safetyMeeting" className="font-semibold text-gray-700 text-sm">
              Safety Meeting held today
            </label>
          </div>
        </div>

        {/* Photos */}
        <div className={sectionClass}>
          <h2 className="font-semibold text-gray-800 text-sm tracking-widest uppercase">Photos</h2>

          <div>
            <label className={labelClass}>Site Pictures</label>
            <button
              type="button"
              onClick={() => picturesRef.current?.click()}
              className="w-full py-3 border-2 border-dashed border-gray-300 text-gray-500 font-medium hover:border-black hover:text-black transition-colors text-sm"
            >
              + Add Photos
            </button>
            <input ref={picturesRef} type="file" accept="image/*" multiple onChange={handlePicturesChange} className="hidden" />
            {picturesPreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {picturesPreviews.map((src, i) => (
                  <div key={i} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Photo ${i + 1}`} className="w-full h-24 object-cover" />
                    <button
                      type="button"
                      onClick={() => removePicture(i)}
                      className="absolute top-1 right-1 bg-black text-white w-5 h-5 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className={labelClass}>Sign Sheet</label>
            <button
              type="button"
              onClick={() => signSheetRef.current?.click()}
              className="w-full py-3 border-2 border-dashed border-gray-300 text-gray-500 font-medium hover:border-black hover:text-black transition-colors text-sm"
            >
              {signSheetPreview ? "Replace Sign Sheet Photo" : "+ Take Photo of Sign Sheet"}
            </button>
            <input ref={signSheetRef} type="file" accept="image/*" onChange={handleSignSheetChange} className="hidden" />
            {signSheetPreview && (
              <div className="mt-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={signSheetPreview} alt="Sign sheet" className="w-full" />
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="border border-red-300 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-black hover:bg-gray-900 disabled:bg-gray-400 text-white font-semibold tracking-widest uppercase text-sm transition-colors"
          >
            {submitting ? "Submitting Report..." : "Submit Daily Report"}
          </button>
        </div>
      </form>
    </div>
  );
}
