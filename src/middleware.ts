import { NextResponse, type NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  })

  const { pathname } = request.nextUrl

  console.log('[MIDDLEWARE] pathname:', pathname, 'token:', token ? 'exists' : 'null')

  // Rotas públicas
  const publicRoutes = ['/login', '/registro', '/setup', '/api/setup', '/api/auth']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // Se não está logado e não é rota pública, redireciona para login
  if (!token && !isPublicRoute) {
    console.log('[MIDDLEWARE] No token, redirecting to login')
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Se está logado e tentando acessar login, redireciona para dashboard
  if (token && pathname === '/login') {
    console.log('[MIDDLEWARE] Has token on login page, redirecting to /')
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
