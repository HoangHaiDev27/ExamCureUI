/** Hàng đăng nhập mạng xã hội + dải phân cách "hoặc". */
export function SocialAuth({ verb = "Đăng nhập" }: { verb?: string }) {
  return (
    <div>
      <div className="grid grid-cols-3 gap-2.5">
        <SocialButton label="Google" title={`${verb} với Google`}>
          <GoogleIcon />
        </SocialButton>
        <SocialButton label="Facebook" title={`${verb} với Facebook`}>
          <FacebookIcon />
        </SocialButton>
        <SocialButton label="Zalo" title={`${verb} với Zalo`}>
          <ZaloIcon />
        </SocialButton>
      </div>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="text-[13px] text-ink-3">hoặc</span>
        <span className="h-px flex-1 bg-line" />
      </div>
    </div>
  );
}

function SocialButton({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      className="inline-flex h-12 items-center justify-center gap-2 rounded-[8px] border border-line bg-paper text-[13.5px] font-medium text-ink transition-colors hover:border-line-strong hover:bg-paper-2"
    >
      {children}
      <span className="truncate">{label}</span>
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden className="shrink-0">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden className="shrink-0">
      <circle cx="12" cy="12" r="11" fill="#1877F2" />
      <path fill="#fff" d="M15.4 8.5h-1.9V7.2c0-.5.35-.65.6-.65h1.25V3.85L13.2 3.84c-2.35 0-2.9 1.76-2.9 2.9V8.5H8.6V11.2h1.7V20h3.2v-8.8h1.93l.27-2.7z" />
    </svg>
  );
}

function ZaloIcon() {
  return (
    <span
      className="grid h-[18px] shrink-0 place-items-center rounded-[4px] bg-[#e7f0ff] px-1 text-[10px] font-bold leading-none text-[#0068FF]"
      aria-hidden
    >
      Zalo
    </span>
  );
}
