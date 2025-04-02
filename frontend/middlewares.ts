import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Include ALL your protected routes
const protectedRoutes = [
  '/dashboard',
  '/product-list',
  '/pos',
  '/suppliers',
  '/purchase-orders',
  '/stock-transfer',
  '/user-list'
  // Add any other protected routes
]

const publicRoutes = ['/']

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname

  // Get session token from next-auth
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET
  })

  // Login page path
  const loginPath = '/'

  // Check if the path is the login page
  const isLoginPage = path === loginPath

  // If user is on login page and has token, redirect to dashboard
  if (isLoginPage && token) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl))
  }

  // If user is NOT on login page and has NO token, redirect to login
  if (!isLoginPage && !token) {
    // Store the original URL to redirect back after login
    const url = new URL(loginPath, req.nextUrl)
    url.searchParams.set('callbackUrl', encodeURI(req.url))
    return NextResponse.redirect(url)
  }

  // Otherwise, continue
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}