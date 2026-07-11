interface TopbarProps {
  titleAr: string;
  titleEn: string;
  subtitleAr?: string;
}

export function Topbar({ titleAr, titleEn, subtitleAr }: TopbarProps) {
  return (
    <header className="flex items-center justify-between border-b border-navy-100 bg-white px-8 py-5">
      <div>
        <h1 className="text-xl font-semibold text-navy-950">{titleAr}</h1>
        <p className="text-xs text-navy-400">
          {titleEn}
          {subtitleAr ? <span className="ms-2 text-navy-500">· {subtitleAr}</span> : null}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-navy-50 px-3 py-1.5 text-xs font-medium text-navy-600">
          بيانات تجريبية · Demo Data
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-900 text-sm font-semibold text-gold-400">
          نم
        </div>
      </div>
    </header>
  );
}
