import type { WorkflowStatus } from '@chatbot/contracts'

import type { WorkflowDetails } from '../api/client.js'

export type UiState = 'empty' | 'loading' | 'error' | 'success'

export interface ScreenModel {
  workflow?: WorkflowDetails
  message?: string
  error?: string
  retryable?: boolean
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function formatStatus(status: WorkflowStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export function deriveUiState(model: ScreenModel): UiState {
  if (model.error) {
    return 'error'
  }
  if (!model.workflow) {
    return 'empty'
  }
  if (model.workflow.status === 'completed') {
    return 'success'
  }
  return 'loading'
}

function renderTimeline(workflow: WorkflowDetails): string {
  const items = workflow.timeline
    .map((entry) => {
      const note = entry.note ? `<p>${escapeHtml(entry.note)}</p>` : ''
      return `<li><strong>${escapeHtml(formatStatus(entry.status))}</strong> <time>${escapeHtml(
        entry.timestamp,
      )}</time>${note}</li>`
    })
    .join('')
  return `<ol>${items}</ol>`
}

function retryButton(workflowId: string): string {
  return `
    <form method="post" action="/workflows/${encodeURIComponent(workflowId)}/retry">
      <button type="submit">Retry workflow</button>
    </form>
  `
}

function renderWorkflowPanel(model: ScreenModel): string {
  if (!model.workflow) {
    return `<section aria-live="polite"><p>No workflow selected yet. Submit a task to begin.</p></section>`
  }

  const workflow = model.workflow
  const base = `
    <section aria-live="polite">
      <h2>Workflow ${escapeHtml(workflow.workflowId)}</h2>
      <p>Status: <strong>${escapeHtml(formatStatus(workflow.status))}</strong></p>
      <p>Last update: <time>${escapeHtml(workflow.updatedAt)}</time></p>
      <h3>Timeline</h3>
      ${renderTimeline(workflow)}
    </section>
  `

  if (workflow.status === 'completed') {
    const resultText = workflow.result ?? 'No result payload returned.'
    return `${base}<section><h3>Result</h3><pre>${escapeHtml(resultText)}</pre></section>`
  }

  if (workflow.status === 'failed' || workflow.status === 'cancelled') {
    const error = workflow.error ?? 'Workflow ended without an error message.'
    return `${base}<section><h3>Error</h3><p>${escapeHtml(error)}</p>${retryButton(
      workflow.workflowId,
    )}</section>`
  }

  return `${base}<p>Workflow is still processing. Refresh to update status.</p>`
}

function renderAlert(model: ScreenModel): string {
  if (model.error) {
    const retry = model.retryable ? '<p>You can retry this action.</p>' : ''
    return `<section role="alert"><h2>Request failed</h2><p>${escapeHtml(model.error)}</p>${retry}</section>`
  }
  if (model.message) {
    return `<section aria-live="polite"><p>${escapeHtml(model.message)}</p></section>`
  }
  return ''
}

export function renderAppPage(model: ScreenModel): string {
  const state = deriveUiState(model)
  const stateMessage =
    state === 'empty'
      ? 'Empty state'
      : state === 'loading'
        ? 'Loading state'
        : state === 'success'
          ? 'Success state'
          : 'Error state'

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Chatbot Workflow Console</title>
  </head>
  <body>
    <main>
      <header>
        <h1>Workflow Console</h1>
        <p>State: ${stateMessage}</p>
      </header>
      <section>
        <h2>Submit workflow</h2>
        <form method="post" action="/workflows">
          <label for="taskType">Task type</label>
          <input id="taskType" name="taskType" type="text" required />
          <label for="payload">Payload (JSON)</label>
          <textarea id="payload" name="payload" rows="6">{}</textarea>
          <button type="submit">Submit workflow</button>
        </form>
      </section>
      ${renderAlert(model)}
      ${renderWorkflowPanel(model)}
    </main>
  </body>
</html>`
}
