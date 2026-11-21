"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ShieldCheck,
  LogOut,
  RefreshCw,
  Download,
  KeyRound,
  Lock,
  AlertCircle,
  CheckCircle2,
  Package,
  TrendingUp,
} from "lucide-react";
import { withBasePath } from "@/lib/site";
import {
  decodeJwtClaims,
  getSupabaseClient,
  hasAuthMethod,
  isSupabaseConfigured,
} from "@/lib/supabase";
import {
  computeReleaseSummary,
  type ReleaseSnapshotRow,
} from "@/lib/adminStats";

type AuthStage =
  | "loading"
  | "unconfigured"
  | "set_password"
  | "login"
  | "totp_enroll"
  | "totp_verify"
  | "dashboard"
  | "denied";

export function AdminDashboard() {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [stage, setStage] = useState<AuthStage>("loading");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Set-password form (invite session)
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Login form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // TOTP enroll / verify
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCodeSvg, setQrCodeSvg] = useState<string | null>(null);
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");

  // Stats
  const [rows, setRows] = useState<ReleaseSnapshotRow[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!supabase) return;
    setStatsLoading(true);
    setError(null);
    const { data, error: queryError } = await supabase
      .from("release_snapshots")
      .select("snapshot_date, release_tag, asset_name, asset_ext, download_count, fetched_at")
      .order("snapshot_date", { ascending: true });

    setStatsLoading(false);
    if (queryError) {
      setStage("denied");
      setError("Brak uprawnień do odczytu statystyk lub sesja wygasła.");
      return;
    }
    setRows((data ?? []) as ReleaseSnapshotRow[]);
  }, [supabase]);

  const startTotpFlow = useCallback(async () => {
    if (!supabase) return;
    setError(null);
    const { data: factors, error: listErr } = await supabase.auth.mfa.listFactors();
    if (listErr) {
      setError(listErr.message);
      setStage("login");
      return;
    }

    const verifiedTotp = factors?.totp?.find((f) => f.status === "verified");
    if (verifiedTotp) {
      setFactorId(verifiedTotp.id);
      setQrCodeSvg(null);
      setTotpSecret(null);
      setTotpCode("");
      setStage("totp_verify");
      return;
    }

    // Remove any unverified stale TOTP factors before enrolling a fresh one
    for (const stale of factors?.totp ?? []) {
      if (stale.status !== "verified") {
        await supabase.auth.mfa.unenroll({ factorId: stale.id }).catch(() => {});
      }
    }

    const { data: enrolled, error: enrollErr } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Google Authenticator",
    });
    if (enrollErr || !enrolled) {
      setError(enrollErr?.message ?? "Nie udało się przygotować konfiguracji TOTP.");
      setStage("login");
      return;
    }

    setFactorId(enrolled.id);
    setQrCodeSvg(enrolled.totp.qr_code);
    setTotpSecret(enrolled.totp.secret);
    setTotpCode("");
    setStage("totp_enroll");
  }, [supabase]);

  const evaluateSession = useCallback(
    async (isInviteUrl = false) => {
      if (!supabase) {
        setStage("unconfigured");
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setStage("login");
        return;
      }

      const claims = decodeJwtClaims(session.access_token);
      const hasPassword = hasAuthMethod(claims, "password");
      const hasTotp = hasAuthMethod(claims, "totp");
      const hasInviteMethod =
        isInviteUrl ||
        hasAuthMethod(claims, "invite") ||
        hasAuthMethod(claims, "otp") ||
        hasAuthMethod(claims, "magiclink");

      // Invite session: require setting password first
      if (hasInviteMethod && !hasPassword) {
        setStage("set_password");
        return;
      }

      // Full AAL2 session (password + totp)
      if (claims.aal === "aal2" && hasPassword && hasTotp) {
        setStage("dashboard");
        void fetchStats();
        return;
      }

      // Password verified (aal1) -> require TOTP enrollment or verification
      if (hasPassword) {
        await startTotpFlow();
        return;
      }

      setStage("login");
    },
    [fetchStats, startTotpFlow, supabase]
  );

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setStage("unconfigured");
      return;
    }

    const rawHash = typeof window !== "undefined" ? window.location.hash : "";
    const rawSearch = typeof window !== "undefined" ? window.location.search : "";
    const isInviteUrl =
      rawHash.includes("type=invite") || rawSearch.includes("type=invite");

    void evaluateSession(isInviteUrl);

    if (!supabase) return;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setRows([]);
        setFactorId(null);
        setQrCodeSvg(null);
        setTotpSecret(null);
        setTotpCode("");
      }
    });

    return () => subscription.unsubscribe();
  }, [evaluateSession, supabase]);

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setError(null);
    setNotice(null);

    if (newPassword.length < 8) {
      setError("Hasło musi mieć co najmniej 8 znaków.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Hasła nie są identyczne.");
      return;
    }

    setBusy(true);
    const { error: updateErr } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (updateErr) {
      setBusy(false);
      setError(updateErr.message);
      return;
    }

    // End the invite session and require a full email + password + TOTP login
    await supabase.auth.signOut();
    if (typeof window !== "undefined" && window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }

    setBusy(false);
    setNewPassword("");
    setConfirmPassword("");
    setNotice("Hasło zostało ustawione. Zaloguj się e-mailem i nowym hasłem.");
    setStage("login");
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setError(null);
    setNotice(null);
    setBusy(true);

    const { error: signErr } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setBusy(false);
    if (signErr) {
      setError("Nieprawidłowy e-mail lub hasło.");
      return;
    }

    setPassword("");
    await startTotpFlow();
  }

  async function handleVerifyTotp(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !factorId) return;
    setError(null);
    const cleanCode = totpCode.replace(/\s+/g, "");
    if (!/^\d{6}$/.test(cleanCode)) {
      setError("Wpisz poprawny 6-cyfrowy kod z Google Authenticatora.");
      return;
    }

    setBusy(true);
    const { error: verifyErr } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: cleanCode,
    });
    setBusy(false);

    if (verifyErr) {
      setError("Nieprawidłowy lub wygasły kod TOTP. Spróbuj ponownie.");
      return;
    }

    setTotpCode("");
    setQrCodeSvg(null);
    setTotpSecret(null);
    await evaluateSession(false);
  }

  async function handleSignOut() {
    if (!supabase) return;
    setBusy(true);
    await supabase.auth.signOut();
    setBusy(false);
    setRows([]);
    setNotice(null);
    setError(null);
    setStage("login");
  }

  const summary = useMemo(() => computeReleaseSummary(rows), [rows]);

  return (
    <div className="max-w-5xl mx-auto px-5 md:px-8">
      {stage === "loading" && (
        <div className="rounded-2xl border border-white/[0.08] bg-[#111318] p-8 text-center text-sm text-[#9496a0]">
          Sprawdzanie sesji…
        </div>
      )}

      {stage === "unconfigured" && (
        <div className="max-w-lg mx-auto rounded-2xl border border-white/[0.09] bg-[#111318] p-7 space-y-3">
          <div className="inline-flex items-center gap-2 text-xs text-amber-300">
            <AlertCircle className="w-4 h-4" />
            Konfiguracja Supabase
          </div>
          <h1 className="text-xl font-semibold text-[#f0f0f4]">
            Brak zmiennych środowiskowych Supabase
          </h1>
          <p className="text-sm text-[#9496a0] leading-relaxed">
            Ustaw <code className="font-mono text-xs text-[#e5e7eb]">NEXT_PUBLIC_SUPABASE_URL</code> i{" "}
            <code className="font-mono text-xs text-[#e5e7eb]">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> w środowisku
            budowania, aby uruchomić panel administratora.
          </p>
        </div>
      )}

      {(stage === "set_password" ||
        stage === "login" ||
        stage === "totp_enroll" ||
        stage === "totp_verify" ||
        stage === "denied") && (
        <div className="max-w-md mx-auto rounded-2xl border border-white/[0.1] bg-[#111318] p-7 shadow-[0_24px_70px_rgba(0,0,0,0.65)]">
          <div className="flex items-center gap-3 mb-6">
            <img
              src={withBasePath("/app-icon.png")}
              alt="MCP Code"
              width={36}
              height={36}
              className="w-9 h-9 rounded-xl object-cover"
            />
            <div>
              <div className="text-sm font-semibold text-[#f0f0f4]">
                MCP Code Admin
              </div>
              <div className="text-xs text-[#7d808c]">
                Prywatny panel statystyk
              </div>
            </div>
          </div>

          {notice && (
            <div className="mb-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-300 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{notice}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-xl border border-red-500/25 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {stage === "set_password" && (
            <form onSubmit={(e) => void handleSetPassword(e)} className="space-y-4">
              <div>
                <h1 className="text-lg font-semibold text-[#f0f0f4] mb-1">
                  Ustaw hasło
                </h1>
                <p className="text-xs text-[#9496a0]">
                  Zaproszenie przyjęte. Wybierz hasło do konta właściciela.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#b4b7c2]">
                  Nowe hasło
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 znaków"
                  className="w-full rounded-xl border border-white/[0.1] bg-[#0d0e12] px-3.5 py-2.5 text-sm text-[#f0f0f4] placeholder:text-[#5a5c68] focus:outline-none focus:border-white/[0.28]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#b4b7c2]">
                  Potwierdź hasło
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Powtórz hasło"
                  className="w-full rounded-xl border border-white/[0.1] bg-[#0d0e12] px-3.5 py-2.5 text-sm text-[#f0f0f4] placeholder:text-[#5a5c68] focus:outline-none focus:border-white/[0.28]"
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-full bg-[#f0f0f4] text-[#0d0e12] py-2.5 text-sm font-semibold hover:bg-white transition-colors disabled:opacity-50"
              >
                {busy ? "Zapisywanie…" : "Zapisz hasło"}
              </button>
            </form>
          )}

          {stage === "login" && (
            <form onSubmit={(e) => void handlePasswordLogin(e)} className="space-y-4">
              <div>
                <h1 className="text-lg font-semibold text-[#f0f0f4] mb-1">
                  Logowanie właściciela
                </h1>
                <p className="text-xs text-[#9496a0]">
                  Wymagany e-mail, hasło i kod 2FA z Google Authenticatora.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#b4b7c2]">
                  E-mail
                </label>
                <input
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-white/[0.1] bg-[#0d0e12] px-3.5 py-2.5 text-sm text-[#f0f0f4] placeholder:text-[#5a5c68] focus:outline-none focus:border-white/[0.28]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#b4b7c2]">
                  Hasło
                </label>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/[0.1] bg-[#0d0e12] px-3.5 py-2.5 text-sm text-[#f0f0f4] placeholder:text-[#5a5c68] focus:outline-none focus:border-white/[0.28]"
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-full bg-[#f0f0f4] text-[#0d0e12] py-2.5 text-sm font-semibold hover:bg-white transition-colors disabled:opacity-50"
              >
                {busy ? "Logowanie…" : "Dalej"}
              </button>
            </form>
          )}

          {stage === "totp_enroll" && (
            <form onSubmit={(e) => void handleVerifyTotp(e)} className="space-y-4">
              <div>
                <h1 className="text-lg font-semibold text-[#f0f0f4] mb-1">
                  Skonfiguruj Google Authenticator
                </h1>
                <p className="text-xs text-[#9496a0]">
                  Zeskanuj kod QR w aplikacji Google Authenticator i wpisz pierwszy 6-cyfrowy kod.
                </p>
              </div>

              {qrCodeSvg && (
                <div className="rounded-xl bg-white p-3 w-fit mx-auto">
                  <img
                    src={qrCodeSvg}
                    alt="Kod QR do Google Authenticatora"
                    width={176}
                    height={176}
                    className="w-44 h-44 block"
                  />
                </div>
              )}

              {totpSecret && (
                <div className="rounded-xl border border-white/[0.08] bg-[#0d0e12] px-3 py-2 text-center">
                  <div className="text-[11px] text-[#7d808c] mb-0.5">
                    Klucz ręczny
                  </div>
                  <code className="font-mono text-xs text-[#e5e7eb] select-all">
                    {totpSecret}
                  </code>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#b4b7c2]">
                  Kod 6-cyfrowy (TOTP)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  required
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  placeholder="000000"
                  className="w-full rounded-xl border border-white/[0.1] bg-[#0d0e12] px-3.5 py-2.5 text-center font-mono text-base tracking-[0.25em] text-[#f0f0f4] placeholder:text-[#5a5c68] focus:outline-none focus:border-white/[0.28]"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="flex-1 rounded-full bg-[#f0f0f4] text-[#0d0e12] py-2.5 text-sm font-semibold hover:bg-white transition-colors disabled:opacity-50"
                >
                  {busy ? "Weryfikacja…" : "Potwierdź i wejdź"}
                </button>
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  className="px-4 py-2.5 rounded-full border border-white/[0.1] text-xs text-[#9496a0] hover:text-[#f0f0f4]"
                >
                  Wyloguj
                </button>
              </div>
            </form>
          )}

          {stage === "totp_verify" && (
            <form onSubmit={(e) => void handleVerifyTotp(e)} className="space-y-4">
              <div>
                <h1 className="text-lg font-semibold text-[#f0f0f4] mb-1">
                  Weryfikacja 2FA
                </h1>
                <p className="text-xs text-[#9496a0]">
                  Wpisz 6-cyfrowy kod z Google Authenticatora.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#b4b7c2]">
                  Kod TOTP
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  required
                  autoFocus
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  placeholder="000000"
                  className="w-full rounded-xl border border-white/[0.1] bg-[#0d0e12] px-3.5 py-2.5 text-center font-mono text-base tracking-[0.25em] text-[#f0f0f4] placeholder:text-[#5a5c68] focus:outline-none focus:border-white/[0.28]"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="flex-1 rounded-full bg-[#f0f0f4] text-[#0d0e12] py-2.5 text-sm font-semibold hover:bg-white transition-colors disabled:opacity-50"
                >
                  {busy ? "Sprawdzanie…" : "Zaloguj"}
                </button>
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  className="px-4 py-2.5 rounded-full border border-white/[0.1] text-xs text-[#9496a0] hover:text-[#f0f0f4]"
                >
                  Wyloguj
                </button>
              </div>
            </form>
          )}

          {stage === "denied" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-red-300">
                <Lock className="w-4 h-4" />
                Brak dostępu
              </div>
              <p className="text-xs text-[#9496a0] leading-relaxed">
                To konto nie ma uprawnień właściciela lub sesja nie spełnia wymagań AAL2 (hasło + TOTP).
              </p>
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="w-full rounded-full border border-white/[0.12] bg-white/[0.04] py-2.5 text-sm font-medium text-[#f0f0f4] hover:bg-white/[0.08]"
              >
                Wyloguj
              </button>
            </div>
          )}
        </div>
      )}

      {stage === "dashboard" && (
        <div className="space-y-6">
          {/* Top header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <img
                src={withBasePath("/app-icon.png")}
                alt="MCP Code"
                width={38}
                height={38}
                className="w-9 h-9 rounded-xl object-cover"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-semibold text-[#f0f0f4] tracking-[-0.02em]">
                    Statystyki pobrań
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/25 text-[11px] font-medium text-emerald-300">
                    <ShieldCheck className="w-3 h-3" />
                    AAL2 · TOTP
                  </span>
                </div>
                <p className="text-xs text-[#7d808c]">
                  Źródło: GitHub Releases (Axz-o/MCPCode)
                  {summary.latestDate ? ` · Ostatni pomiar: ${summary.latestDate}` : ""}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                disabled={statsLoading}
                onClick={() => void fetchStats()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-white/[0.1] bg-[#111318] hover:bg-[#161920] text-xs font-medium text-[#f0f0f4] transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${statsLoading ? "animate-spin" : ""}`} />
                Odśwież
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleSignOut()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-white/[0.1] bg-[#111318] hover:bg-[#161920] text-xs font-medium text-[#9496a0] hover:text-[#f0f0f4] transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Wyloguj
              </button>
            </div>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-white/[0.09] bg-[#111318] p-5">
              <div className="flex items-center justify-between text-xs text-[#9496a0] mb-2">
                <span>Łączna liczba pobrań</span>
                <Download className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-semibold text-[#f0f0f4]">
                {summary.totalDownloads.toLocaleString("pl-PL")}
              </div>
              <div className="text-xs text-[#7d808c] mt-1">pobrania łącznie</div>
            </div>

            <div className="rounded-2xl border border-white/[0.09] bg-[#111318] p-5">
              <div className="flex items-center justify-between text-xs text-[#9496a0] mb-2">
                <span>Instalatory .exe</span>
                <Package className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-3xl font-semibold text-[#f0f0f4]">
                {summary.exeDownloads.toLocaleString("pl-PL")}
              </div>
              <div className="text-xs text-[#7d808c] mt-1">pobrania plików .exe</div>
            </div>

            <div className="rounded-2xl border border-white/[0.09] bg-[#111318] p-5">
              <div className="flex items-center justify-between text-xs text-[#9496a0] mb-2">
                <span>Pakiety .msi</span>
                <KeyRound className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-3xl font-semibold text-[#f0f0f4]">
                {summary.msiDownloads.toLocaleString("pl-PL")}
              </div>
              <div className="text-xs text-[#7d808c] mt-1">pobrania plików .msi</div>
            </div>
          </div>

          {/* Breakdown by version */}
          <section className="rounded-2xl border border-white/[0.09] bg-[#111318] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/[0.07] flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#f0f0f4]">
                Podział według wersji i plików
              </h2>
              <span className="text-xs text-[#7d808c]">
                {summary.byVersion.length} {summary.byVersion.length === 1 ? "wersja" : "wersje"}
              </span>
            </div>

            {summary.byVersion.length === 0 ? (
              <div className="p-6 text-sm text-[#9496a0]">
                Brak zapisanych pomiarów. Uruchom zadanie zbierania statystyk, aby zapisać pierwszy stan liczników.
              </div>
            ) : (
              <div className="divide-y divide-white/[0.06]">
                {summary.byVersion.map((ver) => (
                  <div key={ver.tag} className="p-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-[#f0f0f4]">
                        {ver.tag}
                      </span>
                      <div className="flex items-center gap-4 text-xs text-[#9496a0]">
                        <span>.exe: <strong className="text-[#f0f0f4]">{ver.exe}</strong></span>
                        <span>.msi: <strong className="text-[#f0f0f4]">{ver.msi}</strong></span>
                        <span>Razem: <strong className="text-emerald-300">{ver.total} pobrań</strong></span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {ver.assets.map((asset) => (
                        <div
                          key={asset.name}
                          className="flex items-center justify-between gap-3 rounded-xl bg-[#0d0e12] border border-white/[0.06] px-3.5 py-2 text-xs"
                        >
                          <span className="font-mono text-[#d1d5db] truncate">
                            {asset.name}
                          </span>
                          <span className="shrink-0 font-medium text-[#f0f0f4]">
                            {asset.downloads} pobrań
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Daily increments */}
          <section className="rounded-2xl border border-white/[0.09] bg-[#111318] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/[0.07] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-[#f0f0f4]">
                  Dzienne przyrosty od pierwszego pomiaru
                </h2>
              </div>
              <span className="text-xs text-[#7d808c]">1 zapis / dzień (UTC)</span>
            </div>

            {summary.dailySeries.length === 0 ? (
              <div className="p-6 text-sm text-[#9496a0]">
                Brak historii dziennej.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0f1116] text-[#7d808c] border-b border-white/[0.06]">
                    <tr>
                      <th className="px-5 py-3 font-medium">Data</th>
                      <th className="px-5 py-3 font-medium">.exe</th>
                      <th className="px-5 py-3 font-medium">.msi</th>
                      <th className="px-5 py-3 font-medium">Stan licznika (pobrania)</th>
                      <th className="px-5 py-3 font-medium text-right">Dzienny przyrost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {[...summary.dailySeries].reverse().map((day) => (
                      <tr key={day.date} className="hover:bg-white/[0.02]">
                        <td className="px-5 py-3 font-mono text-[#d1d5db]">
                          {day.date}
                        </td>
                        <td className="px-5 py-3 text-[#9496a0]">{day.exe}</td>
                        <td className="px-5 py-3 text-[#9496a0]">{day.msi}</td>
                        <td className="px-5 py-3 font-medium text-[#f0f0f4]">
                          {day.total} pobrań
                        </td>
                        <td className="px-5 py-3 text-right">
                          {day.delta === null ? (
                            <span className="text-[#7d808c]">Pomiar początkowy</span>
                          ) : (
                            <span
                              className={
                                day.delta > 0 ? "text-emerald-400 font-medium" : "text-[#9496a0]"
                              }
                            >
                              {day.delta >= 0 ? `+${day.delta}` : day.delta} pobrań
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
