"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

interface BrandLogoProps {
  name: string;
  website?: string;
  logo_url?: string;
  initial?: string;
  className?: string;
}

export function BrandLogo({
  name,
  website,
  logo_url,
  initial,
  className,
}: BrandLogoProps) {
  // 1. Clean domain
  const domain = useMemo(() => {
    if (!website) return null;
    return website.replace(/(^\w+:|^)\/\//, "").replace(/\/$/, "").split('/')[0];
  }, [website]);

  // 2. State for falling back locally if query isn't enough or for immediate UI
  const [localFallback, setLocalFallback] = useState(0); // 0: primary, 1: google, 2: initial

  // We could use TanStack Query to 'persist' the best found URL if we had a backend check,
  // but for frontend img tags, local state + onError is often more robust against CORS.
  
  // However, we can use useQuery to 'cache' the knowledge that a domain doesn't have a Clearbit logo
  // (though checking that requires a fetch which might fail CORS).
  
  // Let's stick to the high-performance img pattern with a nice fade-in.

  const primarySrc = useMemo(() => {
    if (logo_url) return logo_url;
    if (domain) return `https://logo.clearbit.com/${domain}`;
    return null;
  }, [logo_url, domain]);

  const googleSrc = useMemo(() => {
    if (!domain) return null;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  }, [domain]);

  const handleImageError = () => {
    setLocalFallback((prev) => prev + 1);
  };

  const showInitial = localFallback >= 2 || (!logo_url && !domain);
  const currentSrc = localFallback === 0 ? primarySrc : googleSrc;

  if (showInitial) {
    return (
      <div
        className={cn(
          "w-full h-full flex items-center justify-center bg-yellow-400 text-black font-black text-xl",
          className
        )}
      >
        {initial || name.charAt(0)}
      </div>
    );
  }

  return (
    <div className={cn("relative w-full h-full bg-white flex items-center justify-center p-2", className)}>
      <img
        src={currentSrc || ""}
        alt={name}
        className="max-w-full max-h-full object-contain transition-opacity duration-300"
        onError={handleImageError}
        loading="lazy"
      />
    </div>
  );
}
