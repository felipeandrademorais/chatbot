import { createHmac, timingSafeEqual } from 'node:crypto'

import type { AuthorizationAction, AuthorizationMatrix, JwtClaims } from '@chatbot/contracts'
import { isJwtClaims } from '@chatbot/contracts'

export interface AuthPolicy {
  readonly requiredAction: AuthorizationAction
  readonly authorizationMatrix: AuthorizationMatrix
  readonly jwtSecret: string
  readonly nowEpochSeconds?: () => number
}

export type AuthFailureReason = 'missing_token' | 'invalid_token' | 'expired_token' | 'forbidden'

export type AuthCheckResult =
  | {
      readonly ok: true
      readonly claims: JwtClaims
    }
  | {
      readonly ok: false
      readonly statusCode: 401 | 403
      readonly reason: AuthFailureReason
      readonly message: string
    }

interface JwtHeader {
  readonly alg: string
  readonly typ?: string
}

export function authorizeRequest(
  authorizationHeader: string | undefined,
  policy: AuthPolicy,
): AuthCheckResult {
  const token = extractBearerToken(authorizationHeader)
  if (!token) {
    return {
      ok: false,
      statusCode: 401,
      reason: 'missing_token',
      message: 'Missing bearer token',
    }
  }

  const jwt = parseAndVerifyJwt(token, policy.jwtSecret)
  if (!jwt.ok) {
    return jwt
  }

  const now = policy.nowEpochSeconds?.() ?? Math.floor(Date.now() / 1000)
  if (jwt.claims.exp <= now) {
    return {
      ok: false,
      statusCode: 401,
      reason: 'expired_token',
      message: 'Token is expired',
    }
  }

  const allowedActions = policy.authorizationMatrix[jwt.claims.role]
  if (!allowedActions.includes(policy.requiredAction)) {
    return {
      ok: false,
      statusCode: 403,
      reason: 'forbidden',
      message: 'Role is not authorized for this action',
    }
  }

  return {
    ok: true,
    claims: jwt.claims,
  }
}

export function extractBearerToken(authorizationHeader: string | undefined): string | null {
  if (!authorizationHeader) {
    return null
  }

  const parts = authorizationHeader.trim().split(/\s+/)
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null
  }

  return parts[1] ?? null
}

function parseAndVerifyJwt(
  token: string,
  jwtSecret: string,
):
  | {
      readonly ok: true
      readonly claims: JwtClaims
    }
  | {
      readonly ok: false
      readonly statusCode: 401
      readonly reason: 'invalid_token'
      readonly message: string
    } {
  const segments = token.split('.')
  if (segments.length !== 3) {
    return invalidToken('JWT must contain exactly three segments')
  }

  const [encodedHeader, encodedPayload, signatureSegment] = segments
  if (!encodedHeader || !encodedPayload || !signatureSegment) {
    return invalidToken('JWT segments must be non-empty')
  }

  const header = decodeJwtHeader(encodedHeader)
  if (!header) {
    return invalidToken('JWT header is invalid')
  }

  if (header.alg !== 'HS256') {
    return invalidToken('Only HS256 JWT tokens are accepted')
  }

  const signedContent = `${encodedHeader}.${encodedPayload}`
  const expectedSignature = createHmac('sha256', jwtSecret).update(signedContent).digest()
  const providedSignature = decodeBase64Url(signatureSegment)

  if (providedSignature.length !== expectedSignature.length) {
    return invalidToken('JWT signature is invalid')
  }

  if (!timingSafeEqual(providedSignature, expectedSignature)) {
    return invalidToken('JWT signature is invalid')
  }

  const payload = parseJsonObject(decodeBase64UrlToString(encodedPayload))
  if (!isJwtClaims(payload)) {
    return invalidToken('JWT claims do not match contract')
  }

  return {
    ok: true,
    claims: payload,
  }
}

function decodeJwtHeader(encodedHeader: string): JwtHeader | null {
  const rawHeader = decodeBase64UrlToString(encodedHeader)
  const header = parseJsonObject(rawHeader)
  if (!header) {
    return null
  }

  const alg = header.alg
  if (typeof alg !== 'string') {
    return null
  }

  const typ = header.typ
  if (typeof typ === 'string') {
    return { alg, typ }
  }
  if (typ === undefined) {
    return { alg }
  }
  return null
}

function parseJsonObject(value: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(value)
    if (typeof parsed !== 'object' || parsed === null) {
      return null
    }
    return parsed as Record<string, unknown>
  } catch {
    return null
  }
}

function decodeBase64Url(value: string): Buffer {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const paddingLength = (4 - (normalized.length % 4)) % 4
  const padded = `${normalized}${'='.repeat(paddingLength)}`
  return Buffer.from(padded, 'base64')
}

function decodeBase64UrlToString(value: string): string {
  return decodeBase64Url(value).toString('utf8')
}

function invalidToken(message: string): {
  readonly ok: false
  readonly statusCode: 401
  readonly reason: 'invalid_token'
  readonly message: string
} {
  return {
    ok: false,
    statusCode: 401,
    reason: 'invalid_token',
    message,
  }
}
