"""Deterministic similar-issue groups + intervention records matching the SPA contract."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

CHAPTERS = [
    ("University", None, "Data Structures & Algorithms", "Graph Algorithms", "Low Accuracy"),
    ("University", None, "Operating Systems", "Deadlocks", "Performance Gap"),
    ("Competitive", "JEE", "Physics", "Kinematics", "Persistent Weakness"),
    ("Competitive", "NEET", "Biology", "Genetics", "Declining Performance"),
]


def _iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def build_similar_issues(students: list[dict]) -> dict:
    groups: list[dict] = []
    individuals: list[dict] = []
    for idx, (domain, family, subject, chapter, issue_type) in enumerate(CHAPTERS, start=1):
        pool = [
            s
            for s in students
            if (s.get("domain") or "University") == domain
            and (family is None or (s.get("examFamily") or "").upper() == family)
        ]
        members = pool[:8] if len(pool) >= 2 else pool
        if len(members) < 2:
            if members:
                s = members[0]
                individuals.append(_fingerprint(s, domain, family, subject, chapter, issue_type))
            continue
        avg_acc = round(sum((s.get("latestAccuracy") or s.get("accuracy") or 58) for s in members) / len(members), 1)
        student_rows = [
            {
                "studentId": s["id"],
                "roll": s.get("roll"),
                "name": s.get("name"),
                "batchId": s.get("batchId"),
                "accuracy": s.get("latestAccuracy") or s.get("accuracy") or 58,
            }
            for s in members
        ]
        gid = f"sig-{idx:02d}-{chapter.lower().replace(' ', '-')}"
        groups.append(
            {
                "id": gid,
                "groupId": gid,
                "domain": domain,
                "examFamily": family,
                "examMode": domain,
                "subject": subject,
                "chapter": chapter,
                "issueType": issue_type,
                "severity": "High" if issue_type in {"Persistent Weakness", "Low Accuracy"} else "Medium",
                "similarityScore": 0.91,
                "studentCount": len(members),
                "students": student_rows,
                "studentIds": [s["id"] for s in members],
                "batchIds": sorted({s.get("batchId") for s in members if s.get("batchId")}),
                "batches": sorted({s.get("batchName") or s.get("batchId") for s in members}),
                "avgAccuracy": avg_acc,
                "avgTime": 118,
                "totalIncorrect": 14,
                "totalSkipped": 6,
                "totalQuestions": 40,
                "affectedExams": 3,
                "maxPersistence": 3,
                "trend": "Persistent" if "Persistent" in issue_type else "Stable",
                "priority": "High" if len(members) >= 5 else "Medium",
                "evidence": {
                    "students": len(members),
                    "subject": subject,
                    "chapter": chapter,
                    "issueType": issue_type,
                    "avgAccuracy": avg_acc,
                    "avgTime": 118,
                    "questions": 40,
                    "incorrect": 14,
                    "skipped": 6,
                    "affectedExams": 3,
                    "persistence": 3,
                    "trend": "persistent" if "Persistent" in issue_type else "stable",
                },
                "whyDetected": (
                    f"{len(members)} students showed {avg_acc}% average accuracy in {chapter} ({subject}), "
                    "across at least 2 assessments."
                ),
                "recommendation": {
                    "title": "Concept revision + targeted practice",
                    "detail": f"{issue_type} in {chapter} — {avg_acc}% average accuracy.",
                    "actions": [
                        {"label": "Concept revision", "detail": f"Revisit {chapter} fundamentals with worked examples ({subject})."},
                        {"label": "Targeted practice", "detail": f"15–20 {chapter} questions from the question bank."},
                    ],
                },
                "note": "AI Similarity Score — prototype grouping, not a validated measure.",
            }
        )
    return {
        "groups": groups,
        "individuals": individuals,
        "count": len(groups),
        "individualCount": len(individuals),
        "demoExcluded": True,
        "note": "AI Similarity Score — prototype grouping, not a validated measure.",
    }


def _fingerprint(s: dict, domain: str, family: str | None, subject: str, chapter: str, issue_type: str) -> dict:
    return {
        "studentId": s["id"],
        "roll": s.get("roll"),
        "name": s.get("name"),
        "batchId": s.get("batchId"),
        "domain": domain,
        "examFamily": family,
        "subject": subject,
        "chapter": chapter,
        "issueType": issue_type,
        "severity": "Medium",
        "accuracy": s.get("latestAccuracy") or 60,
        "avgTime": 110,
        "trend": "stable",
        "evidence": {"attempts": 1, "questions": 8, "accuracy": s.get("latestAccuracy") or 60, "avgTime": 110, "incorrect": 3, "skipped": 1},
        "lastExam": s.get("lastExam"),
    }


def intervention_from_group(group: dict, override: dict | None = None) -> dict:
    override = override or {}
    status = override.get("status") or "Detected"
    students = override.get("studentIds") or group.get("studentIds") or [s.get("studentId") for s in group.get("students") or []]
    return {
        "id": group["id"],
        "groupId": group["id"],
        "title": f"{group['subject']} — {group['chapter']}",
        "issue": f"{(group.get('examFamily') + ' ') if group.get('examFamily') else ''}{group['subject']} — {group['chapter']}",
        "issueType": group["issueType"],
        "domain": group["domain"],
        "examFamily": group.get("examFamily"),
        "subject": group["subject"],
        "chapter": group["chapter"],
        "priority": override.get("priority") or group.get("priority") or "Medium",
        "status": status,
        "students": len(students),
        "studentCount": len(students),
        "studentIds": students,
        "studentList": group.get("students") or [],
        "objectives": override.get("objectives")
        or [
            f"Achieve ≥70% accuracy on {group['chapter']} questions",
            "Reduce average solving time below 100 seconds per question",
        ],
        "practiceConfig": override.get("practiceConfig")
        or {
            "type": "Targeted Practice",
            "count": 8,
            "difficulty": "Medium",
            "duration": 20,
            "includePyq": True,
        },
        "evidence": group.get("evidence"),
        "whyDetected": group.get("whyDetected"),
        "recommendation": group.get("recommendation"),
        "notes": override.get("notes"),
        "action": override.get("action"),
        "baseline": {"accuracy": group.get("avgAccuracy"), "avgTime": group.get("avgTime"), "incorrect": group.get("totalIncorrect")},
        "effectiveness": override.get("effectiveness"),
        "assignedAt": override.get("assignedAt"),
        "completedAt": override.get("completedAt"),
        "updatedAt": override.get("updatedAt") or _iso(),
        "createdAt": override.get("createdAt") or _iso(),
    }


TRANSITIONS = {
    "Detected": ["Recommended", "Dismissed"],
    "Recommended": ["Approved", "Dismissed"],
    "Approved": ["Planned", "Dismissed"],
    "Planned": ["Assigned", "Dismissed"],
    "Assigned": ["In Progress", "Dismissed"],
    "In Progress": ["Completed"],
    "Completed": ["Re-test Pending"],
    "Re-test Pending": ["Evaluating"],
    "Evaluating": ["Resolved", "Improving", "Persistent"],
    "Resolved": [],
    "Improving": [],
    "Persistent": [],
    "Dismissed": [],
}


def can_transition(from_status: str, to_status: str) -> bool:
    return to_status in TRANSITIONS.get(from_status, [])
