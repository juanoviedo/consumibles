import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const SALT = process.env.ANALYTICS_SALT || "consumibles_cali_analytics_salt_2026_safe";

export function hashIp(ip: string): string {
  if (!ip || ip === "127.0.0.1" || ip === "::1") return "localhost";
  return crypto.createHash("sha256").update(ip + SALT).digest("hex");
}

export function getIpFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}

export function getGeoFromHeaders(headers: Headers) {
  const countryCode = headers.get("x-vercel-ip-country") || null;
  const region = headers.get("x-vercel-ip-country-region") || null;
  const cityRaw = headers.get("x-vercel-ip-city");
  const city = cityRaw ? decodeURIComponent(cityRaw) : null;
  const country = countryCode === "CO" ? "Colombia" : countryCode;

  return {
    country,
    countryCode,
    region,
    city,
  };
}

/**
 * Registra una IP de administrador y excluye retroactivamente todo su histórico de analítica.
 */
export async function excludeAdminIp(ip: string, reason: string = "admin_detection") {
  if (!ip) return;
  const ipHash = hashIp(ip);
  if (!ipHash) return;

  try {
    // 1. Registrar IP en tabla de exclusiones
    await prisma.analyticsExcludedIp.upsert({
      where: { ipHash },
      update: { lastDetectedAt: new Date(), isActive: true },
      create: { ipHash, reason, isActive: true },
    });

    // 2. Exclusión retroactiva de sesiones
    await prisma.analyticsSession.updateMany({
      where: { ipHash, isExcluded: false },
      data: {
        isExcluded: true,
        excludedReason: "admin_ip",
        excludedAt: new Date(),
      },
    });

    // 3. Exclusión retroactiva de vistas de página asociadas
    await prisma.analyticsPageView.updateMany({
      where: { session: { ipHash }, isExcluded: false },
      data: { isExcluded: true },
    });

    // 4. Exclusión retroactiva de eventos asociados
    await prisma.analyticsEvent.updateMany({
      where: { session: { ipHash }, isExcluded: false },
      data: { isExcluded: true },
    });

    // 5. Exclusión retroactiva de visitantes asociados
    await prisma.analyticsVisitor.updateMany({
      where: { sessions: { some: { ipHash } } },
      data: { isExcluded: true },
    });
  } catch (err) {
    console.error("Error al procesar exclusión retroactiva de IP de admin:", err);
  }
}

/**
 * Comprueba si un hash de IP está registrado como administrativo
 */
export async function isIpExcluded(ipHash: string): Promise<boolean> {
  if (!ipHash) return false;
  try {
    const record = await prisma.analyticsExcludedIp.findUnique({
      where: { ipHash },
    });
    return !!record?.isActive;
  } catch {
    return false;
  }
}
