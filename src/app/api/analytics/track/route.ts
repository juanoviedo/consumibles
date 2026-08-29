import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getIpFromHeaders,
  hashIp,
  getGeoFromHeaders,
  excludeAdminIp,
  isIpExcluded,
} from "@/lib/analytics";

export async function POST(request: Request) {
  try {
    const ip = getIpFromHeaders(request.headers);
    const ipHash = hashIp(ip);
    const geo = getGeoFromHeaders(request.headers);

    // 1. Detectar si hay sesión de administrador en cookies
    const cookieHeader = request.headers.get("cookie") || "";
    const isAdminSession = cookieHeader.includes("admin_session=");

    let isExcluded = false;

    if (isAdminSession) {
      isExcluded = true;
      // Registrar IP del administrador y aplicar exclusión retroactiva
      await excludeAdminIp(ip, "admin_session_cookie");
    } else {
      isExcluded = await isIpExcluded(ipHash);
    }

    const body = await request.json();
    const {
      visitorId,
      sessionId,
      eventType = "page_view",
      url,
      pathname = "/",
      title,
      referrer,
      deviceType,
      os,
      browser,
      screenWidth,
      screenHeight,
      language,
      utmSource,
      utmMedium,
      utmCampaign,
      utmTerm,
      utmContent,
      metadata,
    } = body;

    if (!visitorId || !sessionId) {
      return NextResponse.json({ error: "visitorId and sessionId are required" }, { status: 400 });
    }

    // 2. Registrar/Actualizar Visitante
    const existingVisitor = await prisma.analyticsVisitor.findUnique({
      where: { id: visitorId },
    });

    if (!existingVisitor) {
      await prisma.analyticsVisitor.create({
        data: {
          id: visitorId,
          deviceType,
          os,
          browser,
          screenWidth,
          screenHeight,
          language,
          country: geo.country,
          countryCode: geo.countryCode,
          region: geo.region,
          city: geo.city,
          isExcluded,
        },
      });
    } else {
      await prisma.analyticsVisitor.update({
        where: { id: visitorId },
        data: {
          lastSeenAt: new Date(),
          deviceType: deviceType || existingVisitor.deviceType,
          os: os || existingVisitor.os,
          browser: browser || existingVisitor.browser,
          screenWidth: screenWidth || existingVisitor.screenWidth,
          screenHeight: screenHeight || existingVisitor.screenHeight,
          language: language || existingVisitor.language,
          country: geo.country || existingVisitor.country,
          countryCode: geo.countryCode || existingVisitor.countryCode,
          region: geo.region || existingVisitor.region,
          city: geo.city || existingVisitor.city,
          isExcluded: isExcluded ? true : existingVisitor.isExcluded,
        },
      });
    }

    // 3. Registrar/Actualizar Sesión
    let referrerHost: string | null = null;
    if (referrer) {
      try {
        referrerHost = new URL(referrer).hostname;
      } catch {}
    }

    const existingSession = await prisma.analyticsSession.findUnique({
      where: { id: sessionId },
    });

    if (!existingSession) {
      await prisma.analyticsSession.create({
        data: {
          id: sessionId,
          visitorId,
          ipHash,
          referrer,
          referrerHost,
          entryPage: pathname,
          exitPage: pathname,
          utmSource,
          utmMedium,
          utmCampaign,
          utmTerm,
          utmContent,
          country: geo.country,
          countryCode: geo.countryCode,
          region: geo.region,
          city: geo.city,
          isExcluded,
          excludedReason: isExcluded ? "admin_ip" : null,
          excludedAt: isExcluded ? new Date() : null,
        },
      });
    } else {
      const durationSeconds = Math.max(
        0,
        Math.floor((Date.now() - new Date(existingSession.startedAt).getTime()) / 1000)
      );
      await prisma.analyticsSession.update({
        where: { id: sessionId },
        data: {
          lastActiveAt: new Date(),
          exitPage: pathname,
          durationSeconds,
          isExcluded: isExcluded ? true : existingSession.isExcluded,
        },
      });
    }

    // 4. Registrar PageView si aplica
    if (eventType === "page_view") {
      await prisma.analyticsPageView.create({
        data: {
          visitorId,
          sessionId,
          url: url || pathname,
          pathname,
          title,
          referrer,
          isExcluded,
        },
      });
    }

    // 5. Registrar Evento
    await prisma.analyticsEvent.create({
      data: {
        visitorId,
        sessionId,
        eventName: eventType,
        pathname,
        metadata: metadata || null,
        isExcluded,
      },
    });

    return NextResponse.json({ success: true, isExcluded });
  } catch (error: any) {
    console.error("Analytics Tracking Error:", error);
    // Retornamos 200 silencioso para garantizar que no rompa el cliente
    return NextResponse.json({ success: false, error: error.message }, { status: 200 });
  }
}
