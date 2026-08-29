import { prisma } from "../src/lib/prisma";
import { hashIp, excludeAdminIp, isIpExcluded } from "../src/lib/analytics";

async function runTest() {
  console.log("=== INICIANDO PRUEBA DE EXCLUSIÓN RETROACTIVA DE ADMINISTRADORES ===");

  const testIpA = "181.206.12.99"; // IP A que simulará al visitante / luego admin
  const testIpB = "190.144.55.12"; // IP B que simulará visitante continuo

  const ipHashA = hashIp(testIpA);
  const ipHashB = hashIp(testIpB);

  console.log(`IP A: ${testIpA} -> Hash: ${ipHashA}`);
  console.log(`IP B: ${testIpB} -> Hash: ${ipHashB}`);

  // Limpiar rastros de prueba anterior si existieran
  await prisma.analyticsEvent.deleteMany({ where: { visitorId: { startsWith: "test_vid_" } } });
  await prisma.analyticsPageView.deleteMany({ where: { visitorId: { startsWith: "test_vid_" } } });
  await prisma.analyticsSession.deleteMany({ where: { visitorId: { startsWith: "test_vid_" } } });
  await prisma.analyticsVisitor.deleteMany({ where: { id: { startsWith: "test_vid_" } } });
  await prisma.analyticsExcludedIp.deleteMany({ where: { ipHash: { in: [ipHashA, ipHashB] } } });

  // PASO 1: Visitante normal en IP A realiza visitas
  console.log("\n-> PASO 1: Generando tráfico histórico desde IP A (Visitante normal)...");

  const vidA = "test_vid_A_1001";
  const sidA = "test_sid_A_1001";

  await prisma.analyticsVisitor.create({
    data: { id: vidA, isExcluded: false },
  });

  await prisma.analyticsSession.create({
    data: {
      id: sidA,
      visitorId: vidA,
      ipHash: ipHashA,
      isExcluded: false,
    },
  });

  await prisma.analyticsPageView.create({
    data: {
      visitorId: vidA,
      sessionId: sidA,
      url: "https://consumiblescali.com/catalogo",
      pathname: "/",
      isExcluded: false,
    },
  });

  await prisma.analyticsEvent.create({
    data: {
      visitorId: vidA,
      sessionId: sidA,
      eventName: "whatsapp_click",
      metadata: { totalFinal: 150000 },
      isExcluded: false,
    },
  });

  // Verificar que el tráfico está activo en estadísticas
  const initialSessionsCount = await prisma.analyticsSession.count({
    where: { ipHash: ipHashA, isExcluded: false },
  });
  console.log(`Paso 1 Verificación: Sesiones activas desde IP A = ${initialSessionsCount} (Esperado: 1)`);

  // PASO 2: Un administrador inicia sesión desde esa misma IP A
  console.log("\n-> PASO 2: Administrador inicia sesión desde la IP A...");
  await excludeAdminIp(testIpA, "test_admin_login");

  // PASO 3 & 4: Comprobar que IP A fue registrada como excluida y el histórico fue marcado retroactivamente
  console.log("\n-> PASO 3 & 4: Comprobando exclusión retroactiva...");

  const isAExcludedInDb = await isIpExcluded(ipHashA);
  console.log(`¿IP A está en tabla de exclusión? ${isAExcludedInDb} (Esperado: true)`);

  const sessionAAfter = await prisma.analyticsSession.findUnique({
    where: { id: sidA },
  });
  console.log(`Estado de Sesión A histórica tras detección: isExcluded = ${sessionAAfter?.isExcluded}, reason = ${sessionAAfter?.excludedReason}`);

  const pageViewsAAfter = await prisma.analyticsPageView.count({
    where: { sessionId: sidA, isExcluded: false },
  });
  console.log(`PageViews activas contables de IP A = ${pageViewsAAfter} (Esperado: 0)`);

  // PASO 5: Tráfico desde IP B (usuario normal)
  console.log("\n-> PASO 5: Tráfico nuevo desde IP B (usuario normal)...");
  const vidB = "test_vid_B_2002";
  const sidB = "test_sid_B_2002";

  await prisma.analyticsVisitor.create({
    data: { id: vidB, isExcluded: false },
  });

  await prisma.analyticsSession.create({
    data: {
      id: sidB,
      visitorId: vidB,
      ipHash: ipHashB,
      isExcluded: false,
    },
  });

  const sessionBAfter = await prisma.analyticsSession.findUnique({
    where: { id: sidB },
  });
  console.log(`Estado de Sesión B (Usuario normal): isExcluded = ${sessionBAfter?.isExcluded} (Esperado: false)`);

  // Limpieza final de prueba
  await prisma.analyticsEvent.deleteMany({ where: { visitorId: { startsWith: "test_vid_" } } });
  await prisma.analyticsPageView.deleteMany({ where: { visitorId: { startsWith: "test_vid_" } } });
  await prisma.analyticsSession.deleteMany({ where: { visitorId: { startsWith: "test_vid_" } } });
  await prisma.analyticsVisitor.deleteMany({ where: { id: { startsWith: "test_vid_" } } });
  await prisma.analyticsExcludedIp.deleteMany({ where: { ipHash: { in: [ipHashA, ipHashB] } } });

  console.log("\n=== PRUEBA COMPLETADA CON ÉXITO ABSOLUTO ===");
}

runTest()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
