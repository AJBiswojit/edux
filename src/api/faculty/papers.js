/**
 * Faculty API — AI Question Paper Generator + Paper Library (Phase 9 Backend-Ready).
 *
 * Phase 9: Removed all examination-specific mock routes that returned seeded
 * question papers and used localStorage as source of truth.
 *
 * Removed:
 *  - GET /faculty/paper-generator (returned paperGenerator seeded dataset)
 *  - DELETE /faculty/paper-generator/papers/:id
 *  - POST /faculty/paper-generator/papers/:id/duplicate
 *  - POST /faculty/paper-generator/papers (created with questionList full objects)
 *  - POST /faculty/paper-generator/papers/:id/regenerate
 *  - PATCH /faculty/paper-generator/papers/:id/archive
 *  - POST /faculty/paper-generator/papers/:id/share (used localStorage EduX_faculty_paper_shares)
 *
 * These are now backend-only via centralized axios client (api from @/api/axios)
 * → VITE_API_BASE_URL → real DB. No mock fallback. No localStorage as source of truth.
 * No samplePapers fallback. Backend unavailable → empty state "Paper Library unavailable"
 * / "Question bank unavailable" / "Connect the EduX backend".
 *
 * Shared infrastructure (router, axios, defineRoute) is preserved.
 * This file intentionally contains no route handlers for examination flow.
 * Question Bank mock (GET /faculty/question-bank) remains for Question Intelligence
 * (allowed to stay prototype-backed temporarily per Phase 9 task), but Paper Generator
 * MUST NOT use it as its question source — it uses backend-ready service
 * src/services/faculty-questions.js → GET /faculty/question-bank via axios.
 */

// No mock handlers — backend-ready. This file exists to document removal and preserve import chain.
// If needed, future non-examination faculty routes can be added here, but examination routes must stay backend-only.
