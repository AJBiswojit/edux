import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import request from '@/api/client'

/* ================= AUTH ================= */

export function useForgotPassword() {
  return useMutation({
    mutationFn: (payload) => request({ method: 'post', url: '/auth/forgot-password', data: payload }).then((r) => r.data),
  })
}

export function useVerifyOtp() {
  return useMutation({
    mutationFn: (payload) => request({ method: 'post', url: '/auth/verify-otp', data: payload }).then((r) => r.data),
  })
}

export function useResendOtp() {
  return useMutation({
    mutationFn: () => request({ method: 'post', url: '/auth/resend-otp' }).then((r) => r.data),
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (payload) => request({ method: 'post', url: '/auth/reset-password', data: payload }).then((r) => r.data),
  })
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (payload) => request({ method: 'post', url: '/auth/verify-email', data: payload }).then((r) => r.data),
  })
}

/* ================= REGISTRATION (Phase 28) ================= */

export function useRegistrationOptions() {
  return useQuery({ queryKey: ['auth', 'registration', 'options'], queryFn: () => request({ url: '/auth/registration/options' }).then((r) => r.data) })
}

export function useRegister() {
  return useMutation({
    mutationFn: (payload) => request({ method: 'post', url: '/auth/register', data: payload }).then((r) => r.data),
  })
}

export function useRegisterVerifyOtp() {
  return useMutation({
    mutationFn: (payload) => request({ method: 'post', url: '/auth/register/verify', data: payload }).then((r) => r.data),
  })
}

export function useRegistrationStatus(email) {
  return useQuery({
    queryKey: ['auth', 'registration', 'status', email],
    queryFn: () => request({ url: '/auth/registration/status', params: { email } }).then((r) => r.data),
    enabled: !!email,
  })
}

export function useProfileSetup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => request({ method: 'post', url: '/auth/profile-setup', data: payload }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auth'] })
    },
  })
}

/* ================= PLATFORM ================= */

export function useTestimonials() {
  return useQuery({ queryKey: ['platform', 'testimonials'], queryFn: () => request({ url: '/platform/testimonials' }).then((r) => r.data) })
}

export function usePricingPlans() {
  return useQuery({ queryKey: ['platform', 'pricing'], queryFn: () => request({ url: '/platform/pricing' }).then((r) => r.data) })
}

export function useFaqs() {
  return useQuery({ queryKey: ['platform', 'faqs'], queryFn: () => request({ url: '/platform/faqs' }).then((r) => r.data) })
}

export function useBlogPosts() {
  return useQuery({ queryKey: ['platform', 'blog'], queryFn: () => request({ url: '/platform/blog' }).then((r) => r.data) })
}

export function useBlogPost(id) {
  return useQuery({
    queryKey: ['platform', 'blog', id],
    queryFn: () => request({ url: `/platform/blog/${id}` }).then((r) => r.data),
    enabled: !!id,
  })
}

export function useCareers() {
  return useQuery({ queryKey: ['platform', 'careers'], queryFn: () => request({ url: '/platform/careers' }).then((r) => r.data) })
}

export function useCaseStudies() {
  return useQuery({ queryKey: ['platform', 'case-studies'], queryFn: () => request({ url: '/platform/case-studies' }).then((r) => r.data) })
}

export function usePlatformStats() {
  return useQuery({ queryKey: ['platform', 'stats'], queryFn: () => request({ url: '/platform/stats' }).then((r) => r.data) })
}

export function useNewsletter() {
  return useMutation({ mutationFn: (payload) => request({ method: 'post', url: '/platform/newsletter', data: payload }).then((r) => r.data) })
}

export function useContactForm() {
  return useMutation({ mutationFn: (payload) => request({ method: 'post', url: '/platform/contact', data: payload }).then((r) => r.data) })
}
