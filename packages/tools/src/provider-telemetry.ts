import type { ProviderErrorCode } from '@chatbot/contracts'

export interface ProviderTelemetryRecord {
  readonly requestId: string
  readonly workflowId: string
  readonly provider: string
  readonly model: string
  readonly inputTokens: number
  readonly outputTokens: number
  readonly estimatedCostUsd: number
  readonly errorCode?: ProviderErrorCode
  readonly errorMessage?: string
  readonly recordedAt: string
}

export interface ProviderTelemetryStore {
  save(record: ProviderTelemetryRecord): Promise<void>
  list(): Promise<readonly ProviderTelemetryRecord[]>
}

export class InMemoryProviderTelemetryStore implements ProviderTelemetryStore {
  private readonly records: ProviderTelemetryRecord[] = []

  save(record: ProviderTelemetryRecord): Promise<void> {
    this.records.push(record)
    return Promise.resolve()
  }

  list(): Promise<readonly ProviderTelemetryRecord[]> {
    return Promise.resolve([...this.records])
  }

  clear(): void {
    this.records.length = 0
  }
}
