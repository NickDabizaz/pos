import { useEffect, useState } from "react";

import { buatInvitation, fetchInvitationAktif } from "@/lib/client/invitation";

type InvitationModalProps = {
  onClose: () => void;
};

export default function InvitationModal({ onClose }: InvitationModalProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadInvitation() {
      try {
        const invitation = await fetchInvitationAktif();
        if (isMounted) {
          setUrl(invitation?.url ?? null);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Gagal memuat link invitation");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadInvitation();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleGenerate() {
    setIsGenerating(true);
    setError(null);
    setCopied(false);

    try {
      const invitation = await buatInvitation();
      setUrl(invitation.url);
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : "Gagal membuat link invitation");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleCopy() {
    if (!url) return;

    await navigator.clipboard.writeText(url);
    setCopied(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xs ring-1 ring-slate-950/5">
        <div className="mb-5">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Invite Anggota</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Bagikan link ini ke calon anggota. Siapa pun yang membuka link akan mendaftar akun dan langsung
            bergabung sebagai anggota Perusahaan ini.
          </p>
        </div>

        {error && (
          <p className="mb-4 rounded-lg border border-status-danger-border bg-status-danger-bg px-3 py-2 text-sm text-status-danger-fg">
            {error}
          </p>
        )}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Memuat...</p>
        ) : (
          <>
            <div className="flex gap-2">
              <input
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                readOnly
                type="text"
                value={url ?? "Belum ada link invitation"}
              />
              <button
                className="shrink-0 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!url}
                onClick={handleCopy}
                type="button"
              >
                {copied ? "Tersalin" : "Salin"}
              </button>
            </div>

            <button
              className="mt-3 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isGenerating}
              onClick={handleGenerate}
              type="button"
            >
              {isGenerating ? "Membuat..." : url ? "Buat Ulang Link" : "Buat Link Invitation"}
            </button>
          </>
        )}

        <div className="mt-5 flex justify-end">
          <button
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            onClick={onClose}
            type="button"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
