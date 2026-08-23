/**
 * Platform API — public/marketing surfaces (blog, careers, case studies,
 * contact, newsletter). Endpoint contracts unchanged.
 */
import { defineRoute } from '../core/router'
import {
  BLOG_POSTS, CAREERS, CASE_STUDIES, CONTACT_INFO,
} from '@/datasets/platform/content.js'

/* ---------------- Platform (landing) ---------------- */
/* Phase 3 — retired unused platform reads (testimonials/pricing/faqs/stats):
   landing sections import the same canonical datasets directly. */
defineRoute('get', '/platform/blog', () => ({ posts: BLOG_POSTS }))
defineRoute('get', '/platform/blog/:id', ({ params }) => ({ post: BLOG_POSTS.find((p) => String(p.id) === params.id) ?? BLOG_POSTS[0] }))
defineRoute('get', '/platform/careers', () => ({ roles: CAREERS }))
defineRoute('get', '/platform/case-studies', () => ({ studies: CASE_STUDIES }))
defineRoute('get', '/platform/contact', () => CONTACT_INFO)
defineRoute('post', '/platform/newsletter', () => ({ ok: true, message: 'Subscribed! Watch your inbox for the next issue.' }))
defineRoute('post', '/platform/contact', () => ({ ok: true, message: 'Message received — our team will reply within one business day.' }))
