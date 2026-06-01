/**
 * Web Application
 *
 * User-facing web interface for the chatbot platform.
 *
 * @module @chatbot/web
 * @stage 06-frontend (full implementation)
 */
export const WEB_VERSION = '0.0.1' as const
export { createWorkflowApiClient, WorkflowApiError } from './api/client.js'
export { createWebServer } from './server.js'
export { deriveUiState, renderAppPage } from './ui/render.js'
