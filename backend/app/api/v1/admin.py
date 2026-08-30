from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.responses import Response

from app.core.config import get_settings
from app.core.deps import DbDep, require_roles
from app.models.identity import User
from app.services import admin_runtime
from app.services import reports_runtime

router = APIRouter(tags=["admin"])
AdminDep = Annotated[User, Depends(require_roles("admin"))]


def _intel(db, user):
    return admin_runtime.assemble_admin_intelligence(db, user)


@router.get("/admin-intelligence/summary")
def admin_summary(db: DbDep, user: AdminDep):
    return _intel(db, user)


@router.get("/admin-intelligence/profile")
def admin_profile(db: DbDep, user: AdminDep):
    admin_runtime.require_admin(user)
    return admin_runtime.build_admin_profile(db, user)


@router.get("/admin-intelligence/datasets")
def admin_datasets(db: DbDep, user: AdminDep):
    return _intel(db, user)["datasets"]


@router.get("/admin-intelligence/derived")
def admin_derived(db: DbDep, user: AdminDep):
    return _intel(db, user)["derived"]


@router.get("/admin/feature-flags")
def flags():
    return {"parentPortal": get_settings().parent_portal_enabled}


@router.get("/admin/students")
def admin_students(db: DbDep, user: AdminDep):
    return admin_runtime.students_payload(db, user.institution_id)


@router.post("/admin/students")
def create_admin_student(body: dict, db: DbDep, user: AdminDep):
    return admin_runtime.create_student(db, user, body or {})


@router.get("/admin/faculty")
def admin_faculty(db: DbDep, user: AdminDep):
    return admin_runtime.faculty_payload(db, user.institution_id)


@router.post("/admin/faculty")
def create_admin_faculty(body: dict, db: DbDep, user: AdminDep):
    return admin_runtime.create_faculty(db, user, body or {})


@router.get("/admin/dashboard")
def admin_dashboard(db: DbDep, user: AdminDep):
    return admin_runtime.dashboard_payload(db, user.institution_id)


@router.get("/admin/users")
def admin_users(db: DbDep, user: AdminDep):
    return {"users": admin_runtime.list_users(db, user.institution_id)}


@router.post("/admin/users/invite")
def invite_admin_users(body: dict, db: DbDep, user: AdminDep):
    return admin_runtime.invite_users(db, user, body or {})


@router.patch("/admin/users/{user_id}/status")
def patch_user_status(user_id: str, body: dict, db: DbDep, user: AdminDep):
    return admin_runtime.set_user_status(db, user, user_id, body or {})


@router.get("/admin/departments")
def admin_departments(db: DbDep, user: AdminDep):
    return {"departments": admin_runtime.list_departments(db, user.institution_id)}


@router.post("/admin/departments")
def create_admin_department(body: dict, db: DbDep, user: AdminDep):
    return admin_runtime.create_department(db, user, body or {})


@router.get("/admin/courses")
def admin_courses(db: DbDep, user: AdminDep):
    return {"courses": admin_runtime.list_courses(db, user.institution_id)}


@router.post("/admin/courses")
def create_admin_course(body: dict, db: DbDep, user: AdminDep):
    return admin_runtime.create_course(db, user, body or {})


@router.get("/admin/analytics")
def admin_analytics(db: DbDep, user: AdminDep):
    return _intel(db, user)["datasets"]["analytics"]["adminAnalytics"]


@router.get("/admin/performance")
def admin_performance(db: DbDep, user: AdminDep):
    return _intel(db, user)["datasets"]["analytics"]["adminPerformance"]


@router.get("/admin/placements")
def admin_placements():
    return admin_runtime.empty_p3("placements")


@router.get("/admin/research")
def admin_research(db: DbDep, user: AdminDep):
    return admin_runtime.research_payload(db, user.institution_id)


@router.get("/admin/roles")
def admin_roles(db: DbDep, user: AdminDep):
    return admin_runtime.roles_payload(db, user.institution_id)


@router.get("/admin/permissions")
def admin_permissions():
    return admin_runtime.empty_p3("permissions")


@router.get("/admin/audit-logs")
def admin_audit_logs(db: DbDep, user: AdminDep):
    return admin_runtime.audit_logs_payload(db, user.institution_id)


@router.get("/admin/ai-config")
def admin_ai_config():
    return admin_runtime.empty_p3("ai-config")


@router.get("/admin/settings")
def admin_settings(db: DbDep, user: AdminDep):
    return admin_runtime.settings_payload(db, user)


@router.patch("/admin/settings")
def patch_admin_settings(body: dict, db: DbDep, user: AdminDep):
    return admin_runtime.save_settings(db, user, body or {})


@router.get("/admin/revenue")
def admin_revenue():
    return admin_runtime.empty_p3("revenue")


@router.get("/admin/programs")
def admin_programs(db: DbDep, user: AdminDep):
    return {"programs": admin_runtime.list_programs(db, user.institution_id)}


@router.post("/admin/programs")
def create_admin_program(body: dict, db: DbDep, user: AdminDep):
    return admin_runtime.create_program(db, user, body or {})


@router.get("/admin/subjects")
def admin_subjects(db: DbDep, user: AdminDep):
    return {"subjects": admin_runtime.list_subjects(db, user.institution_id)}


@router.post("/admin/subjects")
def create_admin_subject(body: dict, db: DbDep, user: AdminDep):
    return admin_runtime.create_subject(db, user, body or {})


@router.get("/admin/batches")
def admin_batches(db: DbDep, user: AdminDep):
    return {"batches": admin_runtime.list_batches(db, user.institution_id)}


@router.post("/admin/batches")
def create_admin_batch(body: dict, db: DbDep, user: AdminDep):
    return admin_runtime.create_batch(db, user, body or {})


@router.get("/admin/calendar")
def admin_calendar(db: DbDep, user: AdminDep):
    return {"events": admin_runtime.list_calendar(db, user.institution_id)}


@router.post("/admin/calendar")
def create_admin_calendar(body: dict, db: DbDep, user: AdminDep):
    return admin_runtime.create_calendar_event(db, user, body or {})


@router.get("/admin/attendance-analytics")
def attendance_analytics(db: DbDep, user: AdminDep):
    return _intel(db, user)["datasets"]["analytics"]["adminAttendanceAnalytics"]


@router.get("/admin/assignment-analytics")
def assignment_analytics(db: DbDep, user: AdminDep):
    return _intel(db, user)["datasets"]["analytics"]["adminAssignmentAnalytics"]


@router.get("/admin/exam-analytics")
def exam_analytics(db: DbDep, user: AdminDep):
    return _intel(db, user)["datasets"]["analytics"]["adminExamAnalytics"]


@router.get("/admin/question-bank")
def admin_question_bank(db: DbDep, user: AdminDep):
    return admin_runtime.question_bank_payload(db, user.institution_id)


@router.get("/admin/scholarships")
def scholarships():
    return admin_runtime.empty_p3("scholarships")


@router.get("/admin/cms")
def cms():
    return admin_runtime.empty_p3("cms")


@router.get("/admin/api-config")
def api_config():
    return admin_runtime.empty_p3("api-config")


@router.get("/admin/data-tools")
def data_tools():
    return admin_runtime.empty_p3("data-tools")


@router.get("/admin/support")
def admin_support(db: DbDep, user: AdminDep):
    return admin_runtime.support_tickets(db, user)


@router.post("/admin/support")
def create_admin_support(body: dict, db: DbDep, user: AdminDep):
    return admin_runtime.create_support_ticket(db, user, body or {})


@router.get("/admin/reports")
def list_admin_reports(db: DbDep, user: AdminDep):
    return {"items": reports_runtime.list_reports(db, user)}


@router.post("/admin/reports")
def create_admin_report(body: dict, db: DbDep, user: AdminDep):
    return reports_runtime.create_report(db, user, body or {})


@router.delete("/admin/reports/{report_id}")
def delete_admin_report(report_id: str, db: DbDep, user: AdminDep):
    return reports_runtime.delete_report(db, user, report_id)


@router.patch("/admin/reports/{report_id}/archive")
def archive_admin_report(report_id: str, body: dict, db: DbDep, user: AdminDep):
    return reports_runtime.archive_report(db, user, report_id, body.get("archived") if isinstance(body, dict) else None)


@router.get("/admin/reports/{report_id}/download")
def download_admin_report(report_id: str, db: DbDep, user: AdminDep):
    row, data = reports_runtime.download_report(db, user, report_id)
    payload = reports_runtime.serialize_report(row)
    filename = f"{payload.get('title') or 'report'}.pdf".replace(" ", "_")
    return Response(content=data, media_type="application/pdf", headers={"Content-Disposition": f'attachment; filename="{filename}"'})


@router.get("/directory/faculty")
def directory_faculty(db: DbDep, user: AdminDep):
    return {"items": admin_runtime.faculty_payload(db, user.institution_id).get("faculty") or []}


@router.get("/directory/students")
def directory_students(db: DbDep, user: AdminDep):
    return {"items": admin_runtime.students_payload(db, user.institution_id).get("students") or []}


@router.get("/directory/users")
def directory_users(db: DbDep, user: AdminDep):
    return {"items": admin_runtime.list_users(db, user.institution_id)}
