"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface FormData {
  date: string;
  projectName: string;
  status: string;
  office: string;
  activity: string;
  activityOnSite: string;
  workersNames: string;
  workersHours: string;
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

  const [form, setForm] = useState<FormData>({
    date: new Date().toISOString().split("T")[0],
    projectName: "",
    status: "",
    office: "",
    activity: "",
    activityOnSite: "",
    workersNames: "",
    workersHours: "",
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
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const target = e.target;
    const value =
      target instanceof HTMLInputElement && target.type === "checkbox"
        ? target.checked
        : target.value;
    setForm((prev) => ({ ...prev, [target.name]: value }));
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
      // Upload pictures
      const pictureUrls: string[] = [];
      for (const pic of pictures) {
        const fd = new FormData();
        fd.append("file", pic);
        fd.append("bucket", "photos");
        const res = await fetch("/api/upload-photo", {
          method: "POST",
          body: fd,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Photo upload failed");
        pictureUrls.push(data.url);
      }

      // Upload sign sheet
      let signSheetUrl = "";
      if (signSheet) {
        const fd = new FormData();
        fd.append("file", signSheet);
        fd.append("bucket", "photos");
        const res = await fetch("/api/upload-photo", {
          method: "POST",
          body: fd,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Sign sheet upload failed");
        signSheetUrl = data.url;
      }

      // Submit report to Notion
      const res = await fetch("/api/submit-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          foremanName,
          foremanEmail,
          pictureUrls,
          signSheetUrl,
        }),
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

  const inputClass =
    "w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 text-base bg-white";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1";
  const sectionClass = "bg-white rounded-2xl p-5 shadow-sm space-y-4";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1e3a5f] text-white px-5 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-bold">Daily Report</h1>
          <p className="text-blue-200 text-sm">{foremanName}</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-blue-200 text-sm hover:text-white"
        >
          Sign Out
        </button>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-5 space-y-4 max-w-2xl mx-auto pb-32">
        {/* Section: Basic Info */}
        <div className={sectionClass}>
          <h2 className="font-bold text-gray-800 text-base">Basic Information</h2>

          <div>
            <label className={labelClass}>Date</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Project Name</label>
            <input
              type="text"
              name="projectName"
              value={form.projectName}
              onChange={handleChange}
              required
              placeholder="Enter project name"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              required
              className={inputClass}
            >
              <option value="">Select status...</option>
              <option value="In Progress">In Progress</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
              <option value="Delayed">Delayed</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Office</label>
            <input
              type="text"
              name="office"
              value={form.office}
              onChange={handleChange}
              placeholder="Office / Division"
              className={inputClass}
            />
          </div>
        </div>

        {/* Section: Activities */}
        <div className={sectionClass}>
          <h2 className="font-bold text-gray-800 text-base">Activities</h2>

          <div>
            <label className={labelClass}>Activity</label>
            <textarea
              name="activity"
              value={form.activity}
              onChange={handleChange}
              rows={3}
              placeholder="Describe today's activity..."
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Activity on Site</label>
            <textarea
              name="activityOnSite"
              value={form.activityOnSite}
              onChange={handleChange}
              rows={3}
              placeholder="What was done on site today?"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Tomorrow&apos;s Goal</label>
            <textarea
              name="tomorrowsGoal"
              value={form.tomorrowsGoal}
              onChange={handleChange}
              rows={3}
              placeholder="What is planned for tomorrow?"
              className={inputClass}
            />
          </div>
        </div>

        {/* Section: Workers */}
        <div className={sectionClass}>
          <h2 className="font-bold text-gray-800 text-base">Workers</h2>

          <div>
            <label className={labelClass}>Workers Names</label>
            <textarea
              name="workersNames"
              value={form.workersNames}
              onChange={handleChange}
              rows={4}
              placeholder="One worker per line:&#10;John Smith&#10;Mike Johnson"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Workers Hours</label>
            <textarea
              name="workersHours"
              value={form.workersHours}
              onChange={handleChange}
              rows={4}
              placeholder="One entry per line:&#10;John Smith — 8h&#10;Mike Johnson — 8h"
              className={inputClass}
            />
          </div>
        </div>

        {/* Section: Equipment & Notes */}
        <div className={sectionClass}>
          <h2 className="font-bold text-gray-800 text-base">Equipment & Notes</h2>

          <div>
            <label className={labelClass}>Tools / Equipment Used</label>
            <textarea
              name="tools"
              value={form.tools}
              onChange={handleChange}
              rows={3}
              placeholder="List tools and equipment used today..."
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Unforeseen Events</label>
            <textarea
              name="unforeseen"
              value={form.unforeseen}
              onChange={handleChange}
              rows={3}
              placeholder="Any unexpected issues or delays?"
              className={inputClass}
            />
          </div>

          <div className="flex items-center gap-3 py-1">
            <input
              type="checkbox"
              name="safetyMeeting"
              id="safetyMeeting"
              checked={form.safetyMeeting}
              onChange={handleChange}
              className="w-5 h-5 rounded accent-blue-600"
            />
            <label htmlFor="safetyMeeting" className="font-semibold text-gray-700">
              Safety Meeting held today
            </label>
          </div>
        </div>

        {/* Section: Photos */}
        <div className={sectionClass}>
          <h2 className="font-bold text-gray-800 text-base">Photos</h2>

          <div>
            <label className={labelClass}>Site Pictures</label>
            <button
              type="button"
              onClick={() => picturesRef.current?.click()}
              className="w-full py-3 border-2 border-dashed border-blue-300 rounded-xl text-blue-600 font-medium hover:bg-blue-50 transition-colors"
            >
              + Add Photos
            </button>
            <input
              ref={picturesRef}
              type="file"
              accept="image/*"
              multiple
              capture="environment"
              onChange={handlePicturesChange}
              className="hidden"
            />
            {picturesPreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {picturesPreviews.map((src, i) => (
                  <div key={i} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`Photo ${i + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removePicture(i)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
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
              className="w-full py-3 border-2 border-dashed border-orange-300 rounded-xl text-orange-600 font-medium hover:bg-orange-50 transition-colors"
            >
              {signSheetPreview ? "Replace Sign Sheet Photo" : "+ Take Photo of Sign Sheet"}
            </button>
            <input
              ref={signSheetRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleSignSheetChange}
              className="hidden"
            />
            {signSheetPreview && (
              <div className="mt-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={signSheetPreview}
                  alt="Sign sheet"
                  className="w-full rounded-lg"
                />
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold rounded-xl text-lg transition-colors"
          >
            {submitting ? "Submitting Report..." : "Submit Daily Report"}
          </button>
        </div>
      </form>
    </div>
  );
}
