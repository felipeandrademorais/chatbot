/**
 * Security Contracts
 *
 * Shared authentication and authorization contracts across modules.
 *
 * @module @chatbot/contracts/security
 * @version 1.0.0
 */

const AUTH_ROLES = ['admin', 'operator', 'viewer', 'agent'] as const
export type AuthRole = (typeof AUTH_ROLES)[number]

const AUTHORIZATION_ACTIONS = [
  'gateway:orchestrator:ping',
  'gateway:health:read',
  'workflow:execute',
  'tool:execute',
] as const
export type AuthorizationAction = (typeof AUTHORIZATION_ACTIONS)[number]

export interface JwtClaims {
  readonly sub: string
  readonly role: AuthRole
  readonly iat: number
  readonly exp: number
  readonly iss?: string
  readonly aud?: string
}

export type AuthorizationMatrix = Readonly<Record<AuthRole, readonly AuthorizationAction[]>>

const DEFAULT_AUTHORIZATION_MATRIX_SOURCE = {
  admin: ['gateway:orchestrator:ping', 'gateway:health:read', 'workflow:execute', 'tool:execute'],
  operator: ['gateway:orchestrator:ping', 'gateway:health:read', 'workflow:execute'],
  viewer: ['gateway:health:read'],
  agent: ['tool:execute'],
} as const satisfies AuthorizationMatrix

export const DEFAULT_AUTHORIZATION_MATRIX: AuthorizationMatrix = Object.freeze(
  DEFAULT_AUTHORIZATION_MATRIX_SOURCE,
)

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function isAuthRole(value: unknown): value is AuthRole {
  return typeof value === 'string' && AUTH_ROLES.includes(value as AuthRole)
}

export function isAuthorizationAction(value: unknown): value is AuthorizationAction {
  return (
    typeof value === 'string' && AUTHORIZATION_ACTIONS.includes(value as AuthorizationAction)
  )
}

export function isJwtClaims(value: unknown): value is JwtClaims {
  if (!isRecord(value)) {
    return false
  }

  const sub = value.sub
  const role = value.role
  const iat = value.iat
  const exp = value.exp
  const iss = value.iss
  const aud = value.aud

  return (
    isNonEmptyString(sub) &&
    isAuthRole(role) &&
    isFiniteNumber(iat) &&
    isFiniteNumber(exp) &&
    isOptionalString(iss) &&
    isOptionalString(aud)
  )
}

export function createAuthorizationMatrix(
  overrides: Partial<Record<AuthRole, readonly AuthorizationAction[]>>,
): AuthorizationMatrix {
  return Object.freeze({
    admin: Object.freeze([...(overrides.admin ?? [])]),
    operator: Object.freeze([...(overrides.operator ?? [])]),
    viewer: Object.freeze([...(overrides.viewer ?? [])]),
    agent: Object.freeze([...(overrides.agent ?? [])]),
  })
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === 'string'
}
