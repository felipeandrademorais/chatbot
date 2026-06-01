import type { components, paths } from './generated/openapi-types.js'
import { parseErrorResponse, parseWorkflowDetails } from './validators.js'

type CreateWorkflowPayload =
  paths['/api/v1/workflows']['post']['requestBody']['content']['application/json']
type WorkflowDetails = components['schemas']['WorkflowDetails']

export class WorkflowApiError extends Error {
  readonly status: number
  readonly code: string
  readonly requestId: string
  readonly retryable: boolean

  constructor(
    status: number,
    code: string,
    message: string,
    requestId: string,
    retryable: boolean,
  ) {
    super(message)
    this.name = 'WorkflowApiError'
    this.status = status
    this.code = code
    this.requestId = requestId
    this.retryable = retryable
  }
}

export interface WorkflowApiClient {
  createWorkflow(payload: CreateWorkflowPayload): Promise<WorkflowDetails>
  getWorkflow(workflowId: string): Promise<WorkflowDetails>
  retryWorkflow(workflowId: string): Promise<WorkflowDetails>
}

async function parseJson(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    throw new Error(`Expected application/json, got "${contentType}"`)
  }
  return response.json()
}

async function handleErrorResponse(response: Response): Promise<never> {
  const body = await parseJson(response)
  const parsed = parseErrorResponse(body)
  const retryable =
    typeof parsed.retryable === 'boolean' ? parsed.retryable : response.status >= 500
  throw new WorkflowApiError(
    response.status,
    parsed.error,
    parsed.message,
    parsed.requestId,
    retryable,
  )
}

function buildUrl(baseUrl: string, path: string): string {
  return new URL(path, baseUrl).toString()
}

export function createWorkflowApiClient(baseUrl: string): WorkflowApiClient {
  async function createWorkflow(payload: CreateWorkflowPayload): Promise<WorkflowDetails> {
    const response = await fetch(buildUrl(baseUrl, '/api/v1/workflows'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8_000),
    })

    if (response.status !== 202) {
      return handleErrorResponse(response)
    }
    return parseWorkflowDetails(await parseJson(response))
  }

  async function getWorkflow(workflowId: string): Promise<WorkflowDetails> {
    const response = await fetch(
      buildUrl(baseUrl, `/api/v1/workflows/${encodeURIComponent(workflowId)}`),
      {
        method: 'GET',
        signal: AbortSignal.timeout(8_000),
      },
    )
    if (response.status !== 200) {
      return handleErrorResponse(response)
    }
    return parseWorkflowDetails(await parseJson(response))
  }

  async function retryWorkflow(workflowId: string): Promise<WorkflowDetails> {
    const response = await fetch(
      buildUrl(baseUrl, `/api/v1/workflows/${encodeURIComponent(workflowId)}/retry`),
      {
        method: 'POST',
        signal: AbortSignal.timeout(8_000),
      },
    )
    if (response.status !== 202) {
      return handleErrorResponse(response)
    }
    return parseWorkflowDetails(await parseJson(response))
  }

  return { createWorkflow, getWorkflow, retryWorkflow }
}

export type { CreateWorkflowPayload, WorkflowDetails }
