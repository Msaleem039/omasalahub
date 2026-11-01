"use client";

import React, { useEffect, useState } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { apiFetch } from "../../lib/clientApi";
import type { PublicReview } from "../../lib/types";

type Report = { id: string; reviewId: string; reason: string; createdAt: string };

export function ReviewsPanel() {
  const { t } = useLanguage();
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [reports, setReports] = useState<Report[]>([]);

  const load = () => {
    apiFetch("/api/food/reviews/admin")
      .then((response) => response.json())
      .then((data) => {
        setReviews(data.reviews ?? []);
        setReports(data.reports ?? []);
      })
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const moderate = async (id: string, status: string) => {
    await apiFetch(`/api/food/reviews/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  };

  return (
    <div>
      <h1 className="mb-6 hidden font-serif text-4xl md:block">{t("Reviews", "Avis")}</h1>
      {reports.length > 0 && (
        <section className="mb-6 space-y-2">
          <h2 className="font-serif text-2xl">{t("Reports", "Signalements")}</h2>
          {reports.map((report) => (
            <div key={report.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e4d8c4] bg-card p-3 text-sm">
              <p>{report.reason}</p>
              <button type="button" onClick={async () => { await apiFetch(`/api/food/reviews/reports/${report.id}`, { method: "PATCH" }); load(); }} className="font-bold">{t("Resolve", "Clore")}</button>
            </div>
          ))}
        </section>
      )}
      <ul className="space-y-3">
        {reviews.map((review) => (
          <li key={review.id} className="rounded-3xl border border-[#e4d8c4] bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-bold">{review.productName} · {review.rating}/5 · {review.author}</p>
              <span className="text-xs font-bold uppercase text-sage">{review.status}</span>
            </div>
            <p className="mt-2 text-sm">{review.body}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["approved", "rejected", "hidden", "pending"].map((status) => (
                <button key={status} type="button" onClick={() => moderate(review.id, status)} className="rounded-full border border-[#e4d8c4] px-3 py-1.5 text-xs font-bold">
                  {status}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
      {reviews.length === 0 && <p className="rounded-3xl border border-[#e4d8c4] bg-card p-8 text-muted">{t("No reviews yet.", "Aucun avis.")}</p>}
    </div>
  );
}
