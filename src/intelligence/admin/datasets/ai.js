/**
 * Admin Intelligence — AI data foundation (structures for Phase 5).
 *
 * Executive insight pools, intervention recommendation templates and
 * report templates. Nothing here is rendered yet — this is the data
 * contract the Executive AI Workspace (Phase 5) and Executive Reporting
 * (Phase 4) will consume. Values are seeded from existing admin datasets
 * so the pools stay consistent with the rest of the module.
 */

/* ---------- executive insight pool (tone-aware, seeded) ---------- */
export const execInsightPool = [
  { id: 'ei1', tone: 'positive', title: 'Retention is at a 4-year high', body: 'Overall retention reached 92.1% (2025 intake) — first-year retention 94.8%. Continue the first-year mentorship programme.' },
  { id: 'ei2', tone: 'warning', title: 'CSE Sec B attendance below threshold', body: '3-week average 86.4% — 14 students flagged. The CSE department leads attendance (92.1%) but this section trails.' },
  { id: 'ei3', tone: 'neutral', title: 'AI adoption growing steadily', body: '71,000 tutor + copilot sessions in August — the strongest month this term. Faculty AI grading covers 64% of assignments.' },
  { id: 'ei4', tone: 'warning', title: 'Outstanding fees concentrated in MBA & ECE', body: '342 invoices pending >45 days — 44% MBA, 31% ECE. Targeted nudges could recover ₹1.6 Cr.' },
  { id: 'ei5', tone: 'positive', title: 'Placement season is on track', body: '92.4% placement rate with average CTC ₹11.8 LPA (+9.2%). Microsoft & Flipkart drives scheduled this month.' },
  { id: 'ei6', tone: 'warning', title: 'At-risk rate improving institution-wide', body: '8.4% (Mar) → 5.9% (Aug) — a 29.8% reduction. The intervention pipeline is working; sustain weekly reviews.' },
]

/* ---------- intervention recommendation templates ---------- */
export const interventionPool = [
  { id: 'ai1', type: 'Attendance', priority: 'High', reason: '5 students below the 75% attendance floor (all CSE)', action: 'Trigger attendance reminder + HOD review of the flagged section', expected: '2–3 pt recovery within 2 weeks' },
  { id: 'ai2', type: 'Academic Risk', priority: 'Critical', reason: 'At-risk rate 5.9% · 214 students flagged this term', action: 'Continue weekly intervention reviews; escalate top 10% to counsellors', expected: 'Further 1 pt reduction before midsem' },
  { id: 'ai3', type: 'Finance', priority: 'Medium', reason: '342 invoices overdue >45 days (₹4.7 Cr outstanding)', action: 'Batch reminder to MBA & ECE cohorts with instalment options', expected: '₹1.6 Cr recovery within 30 days' },
  { id: 'ai4', type: 'Assessment', priority: 'High', reason: '3 exam drafts still in drafting — midsem begins Aug 19', action: 'Finalize OS, DBMS & Networks papers this week', expected: '100% readiness by Aug 18' },
  { id: 'ai5', type: 'AI Operations', priority: 'Medium', reason: 'Voice-to-Text model degraded · Fee & Invoice API latency 240ms', action: 'Restart model workers · monitor API after next deploy', expected: 'Latency back under 200ms' },
]

/* ---------- report templates (Phase 4/5 contract) ---------- */
export const adminReportTemplates = [
  { id: 'art_inst', name: 'Institution Health Report', category: 'Executive', includes: ['Institution health score', 'Academic / attendance / assessment health', 'Student success & at-risk', 'AI adoption', 'Recommendations'] },
  { id: 'art_dept', name: 'Department Scorecard', category: 'Academic', includes: ['Pass rate', 'Attendance', 'Placement rate', 'Faculty load', 'Department health score'] },
  { id: 'art_risk', name: 'Institution Risk Register', category: 'Students', includes: ['At-risk rate & trend', 'Below-threshold cohort', 'Top risk departments', 'Intervention status'] },
  { id: 'art_fac', name: 'Faculty Summary', category: 'Academic', includes: ['Faculty count & load', 'Teaching satisfaction', 'Research output', 'Department distribution'] },
  { id: 'art_assess', name: 'Assessment Health Report', category: 'Academic', includes: ['Exam average & pass rate', 'Readiness status', 'Question bank coverage', 'Assignment completion'] },
  { id: 'art_fin', name: 'Finance & Aid Summary', category: 'Finance', includes: ['Revenue vs target', 'Outstanding', 'Scholarship disbursement', 'Sources & departments'] },
]

/* ---------- executive prompt seeds (Phase 5) ---------- */
export const execPromptSeeds = [
  { id: 'ep1', label: 'Summarise institution health', prompt: 'Summarise the current institution health with its strongest and weakest factors.' },
  { id: 'ep2', label: 'Department comparison', prompt: 'Compare all departments on pass rate, attendance and placement — who needs attention?' },
  { id: 'ep3', label: 'Risk briefing', prompt: 'Brief me on the institution at-risk register and the top 3 interventions.' },
  { id: 'ep4', label: 'Board report', prompt: 'Draft a one-page board report on this term: academics, finance, placements and AI.' },
]

export default { execInsightPool, interventionPool, adminReportTemplates, execPromptSeeds }
