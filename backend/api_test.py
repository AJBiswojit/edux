"""
Comprehensive API smoke test — covers all registered routes for all three roles.
Prints a clean pass/fail table and exits with code 1 if any failures.
"""
from __future__ import annotations

import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

BASE = "http://127.0.0.1:8000/v1"
TIMEOUT = 30

# ── Auth / setup ─────────────────────────────────────────────────────────────
AUTH_ROUTES = [
    ("POST", "/auth/login",                {"email": "aarav.sharma@medixoedux.edu", "password": "aurora123", "role": "student"}),
    ("POST", "/auth/refresh",              None),   # filled after login
    ("GET",  "/auth/me",                   None),
    ("POST", "/auth/forgot-password",      {"email": "smoke-reset@medixoedux.edu"}),
    ("POST", "/auth/reset-password",       {"email": "smoke-reset@medixoedux.edu", "token": "482193", "password": "Aurora123"}),
    ("POST", "/auth/resend-otp",           {"email": "smoke-reset@medixoedux.edu", "purpose": "reset"}),
    ("POST", "/auth/verify-otp",           {"email": "smoke-reset@medixoedux.edu", "otp": "482193", "purpose": "reset"}),
    ("POST", "/auth/resend-otp",           {"email": "smoke-reset@medixoedux.edu", "purpose": "email"}),
    ("POST", "/auth/verify-email",         {"email": "smoke-reset@medixoedux.edu", "otp": "482193", "purpose": "email"}),
    ("GET",  "/auth/registration/options", None),
    ("GET",  "/auth/registration/status?email=aarav.sharma@medixoedux.edu", None),
    ("POST", "/auth/logout",               {}),
]

PLATFORM_ROUTES = [
    ("GET",  "/platform/site",            None),
    ("GET",  "/platform/testimonials",    None),
    ("GET",  "/platform/pricing",         None),
    ("GET",  "/platform/faqs",            None),
    ("GET",  "/platform/blog",            None),
    ("GET",  "/platform/blog/1",          None),
    ("GET",  "/platform/careers",         None),
    ("GET",  "/platform/case-studies",    None),
    ("GET",  "/platform/stats",           None),
    ("GET",  "/platform/contact",         None),
    ("POST", "/platform/newsletter",      {"email": "smoke@test.com"}),
    ("POST", "/platform/contact",         {"name": "Test", "email": "smoke@test.com", "message": "Test"}),
]

STUDENT_ROUTES = [
    ("GET",  "/student/profile",                      None),
    ("GET",  "/intelligence/profile",                 None),
    ("GET",  "/intelligence/summary",                 None),
    ("GET",  "/intelligence/datasets",                None),
    ("GET",  "/intelligence/derived",                 None),
    ("GET",  "/intelligence/exam-dna-signals",        None),
    ("GET",  "/intelligence/exam-attempts",           None),
    ("GET",  "/student/exam-agent/exams",             None),
    ("GET",  "/student/exam-agent/attempts",          None),
    ("GET",  "/student/dashboard",                    None),
    ("GET",  "/student/attendance",                   None),
    ("GET",  "/student/assignments",                  None),
    ("GET",  "/student/courses",                      None),
    ("GET",  "/student/courses/CS501",                None),
    ("GET",  "/student/subjects",                     None),
    ("GET",  "/student/events",                       None),
    ("GET",  "/student/mock-tests",                   None),
    ("GET",  "/student/exams",                        None),
    ("GET",  "/student/settings",                     None),
    ("PATCH","/student/settings",                     {"theme": "dark"}),
    ("GET",  "/student/programs",                     None),
    ("GET",  "/student/forum",                        None),
    ("GET",  "/student/support",                      None),
    ("POST", "/student/support",                      {"title": "Smoke test ticket", "body": "automated"}),
    ("GET",  "/student/admit-card",                   None),
    ("GET",  "/student/exam-analysis",                None),
    ("GET",  "/student/exam-analysis/options",        None),
    ("GET",  "/student/mentor/workspace",             None),
    ("GET",  "/student/academic-profile",             None),
    ("GET",  "/student/academic-resources",           None),
    ("GET",  "/student/academic-progress",            None),
    ("GET",  "/student/performance-accuracy",         None),
    ("GET",  "/student/interventions",                None),
    ("GET",  "/ai/tutor/threads",                     None),
    ("GET",  "/ai/learning-path",                     None),
    ("GET",  "/ai/recommendations",                   None),
    ("GET",  "/ai/weaknesses",                        None),
    ("GET",  "/ai/prediction",                        None),
    ("GET",  "/ai/stats",                             None),
    ("GET",  "/ai/copilot/suggestions",               None),
    ("GET",  "/ai/graph-search?q=test",               None),
    ("GET",  "/ai/assistant/threads",                 None),
]

FACULTY_ROUTES = [
    ("GET",  "/faculty-intelligence/summary",         None),
    ("GET",  "/faculty/students",                     None),
    ("GET",  "/faculty/attendance",                   None),
    ("GET",  "/faculty/assignments",                  None),
    ("GET",  "/faculty/question-bank",                None),
    ("GET",  "/faculty/research",                     None),
    ("GET",  "/faculty/lecture-planner",              None),
    ("GET",  "/faculty/exam-builder",                 None),
    ("GET",  "/faculty/settings",                     None),
    ("GET",  "/faculty/roster",                       None),
    ("GET",  "/faculty/courses",                      None),
    ("GET",  "/faculty/timetable",                    None),
    ("GET",  "/faculty/announcements",                None),
    ("GET",  "/faculty/quiz-builder",                 None),
    ("GET",  "/faculty/ai-studio",                    None),
    ("GET",  "/faculty/reports",                      None),
    ("GET",  "/faculty/paper-generator",              None),
    ("GET",  "/faculty/paper-generator/shares",       None),
    ("GET",  "/faculty/pyq-analysis",                 None),
    ("GET",  "/faculty/pyq-analysis/filters",         None),
    ("GET",  "/faculty/pyq-analysis/patterns",        None),
    ("GET",  "/faculty/pyq-analysis/analytics",       None),
    ("GET",  "/faculty/question-studio",              None),
    ("GET",  "/faculty/question-studio/sources",      None),
    ("GET",  "/faculty/question-studio/sessions",     None),
    ("GET",  "/faculty/question-studio/approved",     None),
    ("GET",  "/faculty/similar-issues",               None),
    ("GET",  "/faculty/interventions",                None),
    ("GET",  "/faculty/interventions/related-resources", None),
    ("GET",  "/faculty/students/fs_uni_b_13/360",       None),
    ("GET",  "/faculty/students/fs_uni_b_13/interventions", None),
    ("POST", "/faculty/ai-studio/save",               {"kind": "lesson", "item": {"title": "test"}}),
    ("POST", "/faculty/reports",                      {"title": "Smoke Report", "category": "Academic"}),
    ("POST", "/faculty/question-studio/sources/upload", {"name": "test.pdf", "type": "PDF"}),
    ("POST", "/faculty/question-studio/generate",     {"sourceId": "src_physics_kinematics", "settings": {"count": 2}}),
]

ADMIN_ROUTES = [
    ("GET",  "/admin-intelligence/summary",           None),
    ("GET",  "/admin-intelligence/profile",           None),
    ("GET",  "/admin-intelligence/datasets",          None),
    ("GET",  "/admin-intelligence/derived",           None),
    ("GET",  "/admin/feature-flags",                  None),
    ("GET",  "/admin/dashboard",                      None),
    ("GET",  "/admin/users",                          None),
    ("GET",  "/admin/departments",                    None),
    ("GET",  "/admin/courses",                        None),
    ("GET",  "/admin/analytics",                      None),
    ("GET",  "/admin/performance",                    None),
    ("GET",  "/admin/placements",                     None),
    ("GET",  "/admin/research",                       None),
    ("GET",  "/admin/roles",                          None),
    ("GET",  "/admin/permissions",                    None),
    ("GET",  "/admin/audit-logs",                     None),
    ("GET",  "/admin/ai-config",                      None),
    ("GET",  "/admin/settings",                       None),
    ("GET",  "/admin/revenue",                        None),
    ("GET",  "/admin/programs",                       None),
    ("GET",  "/admin/subjects",                       None),
    ("GET",  "/admin/batches",                        None),
    ("GET",  "/admin/calendar",                       None),
    ("GET",  "/admin/faculty",                        None),
    ("GET",  "/admin/students",                       None),
    ("GET",  "/admin/attendance-analytics",           None),
    ("GET",  "/admin/assignment-analytics",           None),
    ("GET",  "/admin/exam-analytics",                 None),
    ("GET",  "/admin/question-bank",                  None),
    ("GET",  "/admin/scholarships",                   None),
    ("GET",  "/admin/cms",                            None),
    ("GET",  "/admin/api-config",                     None),
    ("GET",  "/admin/data-tools",                     None),
    ("GET",  "/directory/faculty",                    None),
    ("GET",  "/directory/students",                   None),
    ("GET",  "/directory/users",                      None),
    ("POST", "/ai/executive/ask",                     {"message": "What is the student count?"}),
]

AI_SHARED_ROUTES = [
    ("POST", "/ai/mentor/chat",            {"message": "Hello mentor"}),
    ("POST", "/ai/tutor/respond",          {"text": "Explain recursion", "threadId": None}),
    ("POST", "/ai/generate-quiz",          {"topic": "Python", "count": 3}),
    ("POST", "/ai/generate-exam",          {"topic": "Data Structures"}),
    ("POST", "/ai/teaching-studio/lesson", {"topic": "Sorting algorithms", "duration": 45}),
]


# ── Helpers ───────────────────────────────────────────────────────────────────
def _request(method: str, path: str, token: str | None, body: dict | None) -> dict:
    url = f"{BASE}{path}"
    data = json.dumps(body).encode() if body is not None else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            raw = resp.read()
            return {"status": resp.status, "ok": True, "bytes": len(raw)}
    except urllib.error.HTTPError as exc:
        detail = exc.read()[:200].decode("utf-8", "replace")
        return {"status": exc.code, "ok": False, "detail": detail}
    except Exception as exc:
        return {"status": 0, "ok": False, "detail": str(exc)[:120]}


def login(email: str, password: str, role: str) -> tuple[str, str]:
    res = _request("POST", "/auth/login", None, {"email": email, "password": password, "role": role})
    if not res["ok"]:
        raise RuntimeError(f"Login failed for {role}: {res}")
    # re-read with full body
    body = json.dumps({"email": email, "password": password, "role": role}).encode()
    req = urllib.request.Request(f"{BASE}/auth/login", data=body, headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
        data = json.loads(resp.read())
    return data["accessToken"], data["refreshToken"]


def run_suite(label: str, routes: list, token: str | None, extra: dict | None = None) -> list[dict]:
    results = []
    for method, path, body in routes:
        # substitute dynamic values
        if extra:
            for k, v in extra.items():
                path = path.replace(f"{{{k}}}", v)
            if body and isinstance(body, dict):
                body = {k: (extra.get(v, v) if isinstance(v, str) and v.startswith("{") else v) for k, v in body.items()}
        r = _request(method, path, token, body)
        icon = "✓" if r["ok"] else "✗"
        flag = "" if r["ok"] else f"  ← {r.get('detail','')[:80]}"
        print(f"  {icon} {method:6} {path}{flag}")
        results.append({"suite": label, "method": method, "path": path, **r})
    return results


# ── Main ──────────────────────────────────────────────────────────────────────
def main() -> None:
    all_results: list[dict] = []
    PASS = "\033[32m"
    FAIL = "\033[31m"
    RESET = "\033[0m"
    BOLD = "\033[1m"

    # ── 1. Platform (no auth) ─────────────────────────────────────────────
    print(f"\n{BOLD}── Platform (no auth) ──{RESET}")
    all_results += run_suite("platform", PLATFORM_ROUTES, None)

    # ── 2. Auth endpoints ─────────────────────────────────────────────────
    print(f"\n{BOLD}── Auth ──{RESET}")
    # Login first to get tokens for the remaining auth tests
    try:
        s_access, s_refresh = login("aarav.sharma@medixoedux.edu", "aurora123", "student")
    except Exception as e:
        print(f"  {FAIL}FATAL: student login failed — {e}{RESET}")
        sys.exit(1)

    for method, path, body in AUTH_ROUTES:
        if path == "/auth/refresh":
            body = {"refreshToken": s_refresh}
        r = _request(method, path, s_access if method in ("GET", "PATCH") or "me" in path else None, body)
        icon = "✓" if r["ok"] else "✗"
        flag = "" if r["ok"] else f"  ← {r.get('detail','')[:80]}"
        print(f"  {icon} {method:6} {path}{flag}")
        all_results.append({"suite": "auth", "method": method, "path": path, **r})

    # ── 3. Student ────────────────────────────────────────────────────────
    print(f"\n{BOLD}── Student ──{RESET}")
    all_results += run_suite("student", STUDENT_ROUTES, s_access)

    # ── 4. Faculty ────────────────────────────────────────────────────────
    print(f"\n{BOLD}── Faculty ──{RESET}")
    try:
        f_access, _ = login("meera.krishnan@medixoedux.edu", "aurora123", "faculty")
    except Exception as e:
        print(f"  {FAIL}FATAL: faculty login failed — {e}{RESET}")
        f_access = None
    if f_access:
        all_results += run_suite("faculty", FACULTY_ROUTES, f_access)

    # ── 5. Admin ──────────────────────────────────────────────────────────
    print(f"\n{BOLD}── Admin ──{RESET}")
    try:
        a_access, _ = login("ananya.iyer@medixoedux.edu", "aurora123", "admin")
    except Exception as e:
        print(f"  {FAIL}FATAL: admin login failed — {e}{RESET}")
        a_access = None
    if a_access:
        all_results += run_suite("admin", ADMIN_ROUTES, a_access)
        # AI shared routes with admin token
        print(f"\n{BOLD}── AI (admin token) ──{RESET}")
        all_results += run_suite("ai", AI_SHARED_ROUTES, a_access)

    # ── Summary ───────────────────────────────────────────────────────────
    total  = len(all_results)
    passed = sum(1 for r in all_results if r["ok"])
    failed = [r for r in all_results if not r["ok"]]

    print(f"\n{'─'*60}")
    print(f"{BOLD}TOTAL: {total}  {PASS}PASS: {passed}{RESET}{BOLD}  {FAIL}FAIL: {len(failed)}{RESET}")
    print(f"{'─'*60}")

    if failed:
        print(f"\n{FAIL}{BOLD}FAILURES:{RESET}")
        for r in failed:
            print(f"  [{r['suite']}] {r['method']} {r['path']}  →  HTTP {r['status']}  {r.get('detail','')[:100]}")

    # Write JSON report
    out = Path(__file__).resolve().parent / "logs" / "api_test_report.json"
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps({"total": total, "passed": passed, "failed": len(failed), "results": all_results}, indent=2), encoding="utf-8")
    print(f"\nFull report → {out}")

    sys.exit(0 if not failed else 1)


if __name__ == "__main__":
    main()
