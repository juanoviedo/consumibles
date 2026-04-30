import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const session = request.cookies.get('admin_session')?.value;

  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Permitir acceso a login y recuperar contraseña
    if (request.nextUrl.pathname === '/admin/login' || request.nextUrl.pathname === '/admin/recuperar') {
      return NextResponse.next();
    }
    // Si no hay sesión, redirigir al login
    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};
