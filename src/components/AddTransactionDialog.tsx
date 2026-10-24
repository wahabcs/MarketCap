"use client";

import { useEffect, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { usePortfolio } from "@/lib/portfolio";
import type { TxType } from "@/lib/portfolio/holdings";

const today = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local time

const TYPES: { id: TxType; label: string }[] = [
  { id: "buy", label: "Buy" },
  { id: "sell", label: "Sell" },
  { id: "dividend", label: "Dividend" },
];

export function AddTransactionDialog({
  symbol: fixedSymbol,
  defaultPrice,
  onClose,
}: {
  symbol?: string;
  defaultPrice?: number;
  onClose: () => void;
}) {
  const { portfolios, selectedId, createPortfolio, ensurePortfolio, addTransaction } = usePortfolio();
  const [type, setType] = useState<TxType>("buy");
  const [symbol, setSymbol] = useState(fixedSymbol ?? "");
  const [portfolioId, setPortfolioId] = useState(selectedId ?? "");
  const [newName, setNewName] = useState("");
  const [shares, setShares] = useState("");
  const [price, setPrice] = useState(defaultPrice ? String(defaultPrice) : "");
  const [fees, setFees] = useState("0");
  const [date, setDate] = useState(today());
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);

    let pid = portfolioId;
    if (pid === "__new") {
      const r = await createPortfolio(newName);
      if ("error" in r) return fail(r.error);
      pid = r.id;
    } else if (!pid) {
      const r = await ensurePortfolio();
      if ("error" in r) return fail(r.error);
      pid = r.id;
    }

    const err = await addTransaction({
      portfolioId: pid, symbol, type, shares: Number(shares), price: Number(price),
      fees: Number(fees || 0), executedAt: date, notes,
    });
    if (err) return fail(err);
    onClose();

    function fail(message: string) {
      setError(message);
      setBusy(false);
    }
  };

  const field = "w-full rounded-xl border border-border bg-background px-3 py-2.5 outline-none focus:border-brand";
  const label = "mb-1 block text-sm text-muted";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-label="Add transaction"
        className="max-h-full w-full max-w-md overflow-y-auto rounded-3xl border border-border bg-surface p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{fixedSymbol ? `Add ${fixedSymbol} to portfolio` : "Add transaction"}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-muted hover:bg-muted-surface">
            <X size={18} />
          </button>
        </div>

        <div className="mb-4 flex gap-1 rounded-2xl bg-muted-surface p-1" role="tablist">
          {TYPES.map((t) => (
            <button
              key={t.id} type="button" role="tab" aria-selected={type === t.id} onClick={() => setType(t.id)}
              className={`flex-1 rounded-xl py-2 text-sm font-medium ${type === t.id ? "bg-surface shadow-sm" : "text-muted"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {!fixedSymbol && (
            <div className="col-span-2">
              <label className={label} htmlFor="tx-symbol">Ticker</label>
              <input id="tx-symbol" required value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} placeholder="AAPL" className={field} />
            </div>
          )}
          <div>
            <label className={label} htmlFor="tx-shares">Shares</label>
            <input id="tx-shares" required type="number" min="0" step="any" inputMode="decimal" value={shares} onChange={(e) => setShares(e.target.value)} className={field} />
          </div>
          <div>
            <label className={label} htmlFor="tx-price">{type === "dividend" ? "Dividend per share" : "Price per share"}</label>
            <input id="tx-price" required type="number" min="0" step="any" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} className={field} />
          </div>
          <div>
            <label className={label} htmlFor="tx-fees">Fees</label>
            <input id="tx-fees" type="number" min="0" step="any" inputMode="decimal" value={fees} onChange={(e) => setFees(e.target.value)} className={field} />
          </div>
          <div>
            <label className={label} htmlFor="tx-date">Date</label>
            <input id="tx-date" required type="date" max={today()} value={date} onChange={(e) => setDate(e.target.value)} className={field} />
          </div>
          <div className="col-span-2">
            <label className={label} htmlFor="tx-portfolio">Portfolio</label>
            <select id="tx-portfolio" value={portfolioId} onChange={(e) => setPortfolioId(e.target.value)} className={field}>
              {!portfolios.length && <option value="">My Portfolio (new)</option>}
              {portfolios.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              {!!portfolios.length && <option value="__new">+ New portfolio…</option>}
            </select>
            {portfolioId === "__new" && (
              <input required maxLength={60} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Portfolio name" aria-label="New portfolio name" className={`${field} mt-2`} />
            )}
          </div>
          <div className="col-span-2">
            <label className={label} htmlFor="tx-notes">Notes (optional)</label>
            <input id="tx-notes" maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} className={field} />
          </div>
        </div>

        {error && <p role="alert" className="mt-4 rounded-xl bg-down-soft px-4 py-2 text-sm text-down">{error}</p>}
        <button disabled={busy} className="mt-5 w-full rounded-full bg-brand py-3 font-medium text-white transition hover:opacity-90 disabled:opacity-60">
          {busy ? "Saving…" : "Save transaction"}
        </button>
      </form>
    </div>
  );
}
