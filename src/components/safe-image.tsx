"use client";

import { useState } from "react";

export function SafeImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-navy-800 to-navy-950">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(circle at 20% 20%, white 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="LIPAN RI"
          className="w-16 h-16 opacity-60 object-contain"
        />
        <span className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 to-gold-400" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => {
        if (e.currentTarget.src) setFailed(true);
      }}
    />
  );
}
