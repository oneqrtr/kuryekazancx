export function AdBanner({ className = '' }: { className?: string }) {
  return (
    <div className={`w-full bg-gray-100 border border-dashed border-gray-300 rounded-lg flex items-center justify-center p-4 min-h-[120px] text-gray-400 text-sm font-medium ${className}`}>
      {/* TODO: Google AdSense kodları burata eklenecek */}
      [Görsel Reklam Alanı]
    </div>
  );
}
