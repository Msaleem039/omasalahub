"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { apiFetch } from "../lib/clientApi";
import { errorText } from "../lib/errors";
import type { PublicReview } from "../lib/types";

type Summary = { average: number | null; count: number; distribution: Record<string, number> };

export function ProductReviews({ productId }: { productId: string }) {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [sort, setSort] = useState<"newest" | "highest">("newest");
  const [page, setPage] = useState(1);
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [pageCount, setPageCount] = useState(1);
  const [eligible, setEligible] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    apiFetch(`/api/food/reviews?productId=${encodeURIComponent(productId)}&sort=${sort}&page=${page}`)
      .then((response) => response.json())
      .then((data) => {
        setReviews(data.reviews ?? []);
        setSummary(data.summary ?? null);
        setPageCount(data.pageCount ?? 1);
        setEligible(data.eligibleOrderItemId ?? null);
      })
      .catch(() => setError(t("Could not load reviews.", "Impossible de charger les avis.")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    apiFetch(`/api/food/reviews?productId=${encodeURIComponent(productId)}&sort=${sort}&page=${page}`)
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return;
        setReviews(data.reviews ?? []);
        setSummary(data.summary ?? null);
        setPageCount(data.pageCount ?? 1);
        setEligible(data.eligibleOrderItemId ?? null);
      })
      .catch(() => {
        if (!cancelled) setError(lang === "fr" ? "Impossible de charger les avis." : "Could not load reviews.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productId, sort, page, user?.id, lang]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    const response = await apiFetch("/api/food/reviews", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productId, orderItemId: eligible, rating, body }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(errorText(data.error || "generic", lang));
      return;
    }
    setBody("");
    setMessage(t("Your review is waiting for approval.", "Votre avis sera publié après validation."));
    setEligible(null);
    load();
  };

  const report = async (id: string) => {
    const reason = window.prompt(t("Why are you reporting this review?", "Pourquoi signalez-vous cet avis ?"));
    if (!reason) return;
    const response = await apiFetch("/api/food/reviews/report", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reviewId: id, reason }),
    });
    const data = await response.json();
    setMessage(response.ok ? t("Report sent.", "Signalement envoyé.") : errorText(data.error || "generic", lang));
  };

  const count = summary?.count ?? 0;

  return (
    <section className="mt-12">
      <h2 className="font-serif text-4xl">{t("Verified reviews", "Avis vérifiés")}</h2>
      {count > 0 && summary ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
          <p className="font-serif text-5xl text-terra">{summary.average?.toFixed(1)}</p>
          <div className="space-y-1">
            <p className="text-sm text-muted">{t(`${count} approved reviews`, `${count} avis approuvés`)}</p>
            {[5, 4, 3, 2, 1].map((score) => {
              const votes = summary.distribution[String(score)] ?? 0;
              return (
                <div key={score} className="flex items-center gap-2 text-xs">
                  <span className="w-3">{score}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-cream-deep">
                    <div className="h-full bg-terra" style={{ width: `${count ? (votes / count) * 100 : 0}%` }} />
                  </div>
                  <span className="w-6 text-right">{votes}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted">{t("No approved reviews yet.", "Aucun avis approuvé pour le moment.")}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="text-sm font-bold">
          {t("Sort", "Trier")}
          <select className="field ml-2 w-auto" value={sort} onChange={(event) => { setPage(1); setSort(event.target.value as "newest" | "highest"); }}>
            <option value="newest">{t("Newest", "Plus récents")}</option>
            <option value="highest">{t("Highest rated", "Mieux notés")}</option>
          </select>
        </label>
      </div>

      {loading ? (
        <div className="mt-4 h-24 animate-pulse rounded-3xl bg-card" />
      ) : reviews.length === 0 ? null : (
        <ul className="mt-4 space-y-3">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-3xl border border-[#e5dcc8] bg-card p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-bold">{review.author}</p>
                <span className="inline-flex items-center gap-1 text-sm font-bold text-amber-700">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {review.rating}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed">{review.body}</p>
              <div className="mt-3 flex items-center justify-between text-xs text-muted">
                <time dateTime={review.createdAt}>{new Intl.DateTimeFormat(lang === "fr" ? "fr-FR" : "en-GB", { dateStyle: "medium" }).format(new Date(review.createdAt))}</time>
                {user && (
                  <button type="button" onClick={() => report(review.id)} className="font-bold text-sage">
                    {t("Report", "Signaler")}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {pageCount > 1 && (
        <div className="mt-4 flex gap-2">
          <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="rounded-full border border-[#e5dcc8] px-4 py-2 text-sm font-bold disabled:opacity-40">
            {t("Previous", "Précédent")}
          </button>
          <button type="button" disabled={page >= pageCount} onClick={() => setPage((current) => current + 1)} className="rounded-full border border-[#e5dcc8] px-4 py-2 text-sm font-bold disabled:opacity-40">
            {t("Next", "Suivant")}
          </button>
        </div>
      )}

      {user && eligible && (
        <form onSubmit={submit} className="mt-6 space-y-3 rounded-3xl border border-[#e5dcc8] bg-card p-5">
          <h3 className="font-serif text-2xl">{t("Leave a verified review", "Laisser un avis vérifié")}</h3>
          <label className="block text-sm font-bold">
            {t("Rating", "Note")}
            <select className="field mt-1" value={rating} onChange={(event) => setRating(Number(event.target.value))}>
              {[5, 4, 3, 2, 1].map((score) => (
                <option key={score} value={score}>{score}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-bold">
            {t("Your review", "Votre avis")}
            <textarea className="field mt-1" rows={4} value={body} onChange={(event) => setBody(event.target.value)} required minLength={10} maxLength={1000} />
          </label>
          <button type="submit" className="rounded-full bg-terra px-5 py-2.5 text-sm font-bold text-ink">{t("Send", "Envoyer")}</button>
        </form>
      )}
      {!user && (
        <p className="mt-4 text-sm text-muted">
          <Link href="/login" className="font-bold text-terra">{t("Log in", "Connexion")}</Link>
          {" "}
          {t("to review a dish from a completed order.", "pour noter un plat d'une commande terminée.")}
        </p>
      )}
      {message && <p className="mt-3 text-sm font-semibold text-sage">{message}</p>}
      {error && <p className="mt-3 text-sm font-semibold text-terra-deep">{error}</p>}
    </section>
  );
}
