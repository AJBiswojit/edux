from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.config import get_settings
from app.core.deps import DbDep, require_roles
from app.models.identity import User
from app.services import live_catalog
from app.services.people_directory import admin_faculty_payload, admin_students_payload
from app.services.spa_payloads import payload

router = APIRouter(tags=["admin"])
AdminDep = Annotated[User, Depends(require_roles("admin"))]


@router.get("/admin-intelligence/summary")
def admin_summary(user: AdminDep):
    return payload("admin-intelligence-summary")


@router.get("/admin-intelligence/profile")
def admin_profile(user: AdminDep):
    return payload("admin-intelligence-profile")


@router.get("/admin-intelligence/datasets")
def admin_datasets(user: AdminDep):
    return payload("admin-intelligence-datasets")


@router.get("/admin-intelligence/derived")
def admin_derived(user: AdminDep):
    return payload("admin-intelligence-derived")


@router.get("/admin/feature-flags")
def flags():
    return {"parentPortal": get_settings().parent_portal_enabled}


@router.get("/admin/students")
def admin_students(db: DbDep, user: AdminDep):
    return admin_students_payload(db, user.institution_id)


@router.get("/admin/faculty")
def admin_faculty(db: DbDep, user: AdminDep):
    live = admin_faculty_payload(db, user.institution_id)
    if live.get("total"):
        return live
    catalog = payload("admin-catalog")
    return {"faculty": catalog.get("facultyList") or [], "total": len(catalog.get("facultyList") or [])}


@router.get("/admin/dashboard")
def admin_dashboard(db: DbDep, user: AdminDep):
    return live_catalog.admin_dashboard(db, user.institution_id)


@router.get("/admin/users")
def admin_users(db: DbDep, user: AdminDep):
    return {"users": live_catalog.admin_users(db, user.institution_id)}


@router.get("/admin/departments")
def admin_departments(db: DbDep, user: AdminDep):
    return {"departments": live_catalog.admin_departments(db, user.institution_id)}


@router.get("/admin/courses")
def admin_courses(db: DbDep, user: AdminDep):
    return {"courses": live_catalog.admin_courses(db, user.institution_id)}


@router.get("/admin/analytics")
def admin_analytics(user: AdminDep):
    return payload("admin-catalog")["analytics"]


@router.get("/admin/performance")
def admin_performance(user: AdminDep):
    return payload("admin-catalog")["performance"]


@router.get("/admin/placements")
def admin_placements(user: AdminDep):
    return payload("admin-catalog")["placements"]


@router.get("/admin/research")
def admin_research(user: AdminDep):
    return payload("admin-catalog")["research"]


@router.get("/admin/roles")
def admin_roles(user: AdminDep):
    return {"roles": payload("admin-catalog")["roles"]}


@router.get("/admin/permissions")
def admin_permissions(user: AdminDep):
    return {"modules": payload("admin-catalog")["permissions"]}


@router.get("/admin/audit-logs")
def admin_audit_logs(user: AdminDep):
    return {"logs": payload("admin-catalog")["auditLogs"]}


@router.get("/admin/ai-config")
def admin_ai_config(user: AdminDep):
    return payload("admin-catalog")["aiConfig"]


@router.get("/admin/settings")
def admin_settings(user: AdminDep):
    return payload("admin-catalog")["settings"]


@router.get("/admin/revenue")
def admin_revenue(user: AdminDep):
    return payload("admin-catalog")["revenue"]


@router.get("/admin/programs")
def admin_programs(db: DbDep, user: AdminDep):
    return {"programs": live_catalog.admin_programs(db, user.institution_id)}


@router.get("/admin/subjects")
def admin_subjects(db: DbDep, user: AdminDep):
    return {"subjects": live_catalog.admin_subjects(db, user.institution_id)}


@router.get("/admin/batches")
def admin_batches(db: DbDep, user: AdminDep):
    return {"batches": live_catalog.admin_batches(db, user.institution_id)}


@router.get("/admin/calendar")
def admin_calendar(db: DbDep, user: AdminDep):
    return {"events": live_catalog.admin_calendar(db, user.institution_id)}


@router.get("/admin/attendance-analytics")
def attendance_analytics(user: AdminDep):
    return payload("admin-catalog")["attendanceAnalytics"]


@router.get("/admin/assignment-analytics")
def assignment_analytics(user: AdminDep):
    return payload("admin-catalog")["assignmentAnalytics"]


@router.get("/admin/exam-analytics")
def exam_analytics(user: AdminDep):
    return payload("admin-catalog")["examAnalytics"]


@router.get("/admin/question-bank")
def admin_question_bank(user: AdminDep):
    return payload("admin-catalog")["questionBank"]


@router.get("/admin/scholarships")
def scholarships(user: AdminDep):
    return {"items": payload("admin-catalog")["scholarships"]}


@router.get("/admin/cms")
def cms(user: AdminDep):
    return payload("admin-catalog")["cms"]


@router.get("/admin/api-config")
def api_config(user: AdminDep):
    return payload("admin-catalog")["apiConfig"]


@router.get("/admin/data-tools")
def data_tools(user: AdminDep):
    return payload("admin-catalog")["dataTools"]


@router.get("/directory/faculty")
def directory_faculty(db: DbDep, user: AdminDep):
    return {"items": admin_faculty_payload(db, user.institution_id).get("faculty") or payload("admin-catalog").get("facultyList") or []}


@router.get("/directory/students")
def directory_students(db: DbDep, user: AdminDep):
    return {"items": admin_students_payload(db, user.institution_id).get("students") or []}


@router.get("/directory/users")
def directory_users(db: DbDep, user: AdminDep):
    return {"items": live_catalog.admin_users(db, user.institution_id)}
