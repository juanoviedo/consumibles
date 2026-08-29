"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function getAnalyticsStatsAction(range: string = "last7days") {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  if (!session) {
    throw new Error("No autorizado");
  }

  const now = new Date();
  let startDate = new Date();
  let endDate = new Date();

  if (range === "today") {
    startDate.setHours(0, 0, 0, 0);
  } else if (range === "yesterday") {
    startDate.setDate(now.getDate() - 1);
    startDate.setHours(0, 0, 0, 0);
    endDate.setDate(now.getDate() - 1);
    endDate.setHours(23, 59, 59, 999);
  } else if (range === "last7days") {
    startDate.setDate(now.getDate() - 7);
  } else if (range === "last30days") {
    startDate.setDate(now.getDate() - 30);
  } else if (range === "thisMonth") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (range === "lastMonth") {
    startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  } else {
    // Todos los tiempos
    startDate = new Date(2020, 0, 1);
  }

  const dateFilter = {
    gte: startDate,
    lte: range === "yesterday" || range === "lastMonth" ? endDate : undefined,
  };

  const sessionWhere = { isExcluded: false, startedAt: dateFilter };
  const pageViewWhere = { isExcluded: false, createdAt: dateFilter };
  const eventWhere = { isExcluded: false, createdAt: dateFilter };
  const visitorWhere = { isExcluded: false, lastSeenAt: dateFilter };

  // 1. Resumen
  const totalVisitors = await prisma.analyticsVisitor.count({ where: visitorWhere });
  const totalSessions = await prisma.analyticsSession.count({ where: sessionWhere });
  const totalPageViews = await prisma.analyticsPageView.count({ where: pageViewWhere });

  const avgDurationResult = await prisma.analyticsSession.aggregate({
    where: sessionWhere,
    _avg: { durationSeconds: true },
  });
  const avgDuration = Math.round(avgDurationResult._avg.durationSeconds || 0);

  // Métrica de diagnóstico (Sesiones de admin excluidas)
  const excludedSessionsCount = await prisma.analyticsSession.count({
    where: { isExcluded: true, startedAt: dateFilter },
  });

  // 2. Geografía
  const sessionsByCountry = await prisma.analyticsSession.groupBy({
    by: ["country"],
    where: sessionWhere,
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });

  const sessionsByCity = await prisma.analyticsSession.groupBy({
    by: ["city", "country"],
    where: sessionWhere,
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });

  // 3. Tecnología
  const sessionsByDevice = await prisma.analyticsSession.groupBy({
    by: ["visitorId"],
    where: sessionWhere,
  });

  const devicesList = await prisma.analyticsVisitor.groupBy({
    by: ["deviceType"],
    where: visitorWhere,
    _count: { id: true },
  });

  const osList = await prisma.analyticsVisitor.groupBy({
    by: ["os"],
    where: visitorWhere,
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 5,
  });

  const browsersList = await prisma.analyticsVisitor.groupBy({
    by: ["browser"],
    where: visitorWhere,
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 5,
  });

  // 4. Tráfico y UTM
  const referrersList = await prisma.analyticsSession.groupBy({
    by: ["referrerHost"],
    where: { ...sessionWhere, referrerHost: { not: null } },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });

  const utmSourcesList = await prisma.analyticsSession.groupBy({
    by: ["utmSource"],
    where: { ...sessionWhere, utmSource: { not: null } },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });

  // 5. Páginas más visitadas
  const topPagesList = await prisma.analyticsPageView.groupBy({
    by: ["pathname"],
    where: pageViewWhere,
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });

  // 6. Ecommerce Events
  const whatsappClicksCount = await prisma.analyticsEvent.count({
    where: { ...eventWhere, eventName: "whatsapp_click" },
  });

  const addToCartCount = await prisma.analyticsEvent.count({
    where: { ...eventWhere, eventName: "add_to_cart" },
  });

  const productViewsCount = await prisma.analyticsEvent.count({
    where: { ...eventWhere, eventName: "product_view" },
  });

  const searchEvents = await prisma.analyticsEvent.findMany({
    where: { ...eventWhere, eventName: "search" },
    select: { metadata: true },
    take: 50,
  });

  return {
    summary: {
      totalVisitors,
      totalSessions,
      totalPageViews,
      pagesPerSession: totalSessions > 0 ? (totalPageViews / totalSessions).toFixed(1) : "0",
      avgDuration,
      excludedSessionsCount,
    },
    geography: {
      countries: sessionsByCountry.map((c) => ({ name: c.country || "Desconocido", count: c._count.id })),
      cities: sessionsByCity.map((c) => ({ name: `${c.city || "Desconocida"}${c.country ? `, ${c.country}` : ""}`, count: c._count.id })),
    },
    technology: {
      devices: devicesList.map((d) => ({ name: d.deviceType || "desktop", count: d._count.id })),
      os: osList.map((o) => ({ name: o.os || "Desconocido", count: o._count.id })),
      browsers: browsersList.map((b) => ({ name: b.browser || "Desconocido", count: b._count.id })),
    },
    traffic: {
      referrers: referrersList.map((r) => ({ name: r.referrerHost || "Directo / Ninguno", count: r._count.id })),
      utmSources: utmSourcesList.map((u) => ({ name: u.utmSource || "Ninguno", count: u._count.id })),
    },
    pages: {
      topPages: topPagesList.map((p) => ({ name: p.pathname, count: p._count.id })),
    },
    ecommerce: {
      whatsappClicksCount,
      addToCartCount,
      productViewsCount,
    },
  };
}
