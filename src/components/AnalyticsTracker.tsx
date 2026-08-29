"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

declare global {
  interface Window {
    trackAnalyticsEvent?: (eventType: string, metadata?: Record<string, any>) => void;
  }
}

function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  let vid = localStorage.getItem("cb_vid");
  if (!vid) {
    const match = document.cookie.match(/(?:^|; )_cb_vid=([^;]*)/);
    if (match) vid = decodeURIComponent(match[1]);
  }
  if (!vid) {
    vid = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem("cb_vid", vid);
    document.cookie = `_cb_vid=${encodeURIComponent(vid)}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`;
  }
  return vid;
}

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  const now = Date.now();
  let sid = sessionStorage.getItem("cb_sid");
  let lastTs = parseInt(sessionStorage.getItem("cb_sid_ts") || "0", 10);

  // Expiración por inactividad de 30 minutos (1800000 ms)
  if (!sid || !lastTs || now - lastTs > 30 * 60 * 1000) {
    sid = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  sessionStorage.setItem("cb_sid", sid);
  sessionStorage.setItem("cb_sid_ts", now.toString());
  return sid;
}

function getDeviceType(): string {
  if (typeof window === "undefined") return "desktop";
  const ua = navigator.userAgent.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return "tablet";
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) {
    return "mobile";
  }
  if (window.innerWidth <= 768) return "mobile";
  if (window.innerWidth <= 1024) return "tablet";
  return "desktop";
}

function getOS(): string {
  if (typeof window === "undefined") return "Unknown";
  const ua = navigator.userAgent;
  if (ua.indexOf("Win") !== -1) return "Windows";
  if (ua.indexOf("Mac") !== -1) return "macOS";
  if (ua.indexOf("Linux") !== -1) return "Linux";
  if (ua.indexOf("Android") !== -1) return "Android";
  if (ua.indexOf("like Mac") !== -1 || /iPhone|iPad|iPod/.test(ua)) return "iOS";
  return "Unknown";
}

function getBrowser(): string {
  if (typeof window === "undefined") return "Unknown";
  const ua = navigator.userAgent;
  if (ua.indexOf("Edg") !== -1) return "Edge";
  if (ua.indexOf("Chrome") !== -1) return "Chrome";
  if (ua.indexOf("Firefox") !== -1) return "Firefox";
  if (ua.indexOf("Safari") !== -1) return "Safari";
  if (ua.indexOf("Opera") !== -1 || ua.indexOf("OPR") !== -1) return "Opera";
  return "Unknown";
}

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const prevPathname = useRef<string | null>(null);

  const sendEvent = (eventType: string, metadata: Record<string, any> = {}) => {
    try {
      const visitorId = getVisitorId();
      const sessionId = getSessionId();

      const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();

      const payload = {
        visitorId,
        sessionId,
        eventType,
        url: typeof window !== "undefined" ? window.location.href : "",
        pathname: pathname || "/",
        title: typeof document !== "undefined" ? document.title : "",
        referrer: typeof document !== "undefined" ? document.referrer : "",
        deviceType: getDeviceType(),
        os: getOS(),
        browser: getBrowser(),
        screenWidth: typeof window !== "undefined" ? window.innerWidth : 0,
        screenHeight: typeof window !== "undefined" ? window.innerHeight : 0,
        language: typeof navigator !== "undefined" ? navigator.language : "es-CO",
        utmSource: params.get("utm_source") || undefined,
        utmMedium: params.get("utm_medium") || undefined,
        utmCampaign: params.get("utm_campaign") || undefined,
        utmTerm: params.get("utm_term") || undefined,
        utmContent: params.get("utm_content") || undefined,
        metadata,
      };

      const body = JSON.stringify(payload);

      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: "application/json" });
        navigator.sendBeacon("/api/analytics/track", blob);
      } else {
        fetch("/api/analytics/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        }).catch(() => {});
      }
    } catch (e) {
      // Ignorar cualquier fallo para resguardar la app
    }
  };

  useEffect(() => {
    // Registrar función global para emitir eventos personalizados
    window.trackAnalyticsEvent = (eventType: string, metadata?: Record<string, any>) => {
      sendEvent(eventType, metadata);
    };

    return () => {
      delete window.trackAnalyticsEvent;
    };
  }, [pathname]);

  useEffect(() => {
    // Registrar page_view solo cuando cambia la ruta
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      sendEvent("page_view");
    }
  }, [pathname, searchParams]);

  return null;
}
