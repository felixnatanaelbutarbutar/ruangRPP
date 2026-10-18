"""Small collection pilot; targets are not verified curriculum facts."""
from uuid import NAMESPACE_URL, uuid5
from sqlalchemy.orm import Session
from .db import Requirement
from .schemas import RequirementInput

TARGETS = [
    ('cp', '01 · CP resmi untuk Matematika fase A', 'CP', 'Matematika', 'A', []),
    ('ppa', '02 · Panduan pembelajaran dan asesmen', 'Panduan', 'Lintas mapel', 'Umum', []),
    ('example', '03 · Satu contoh modul ajar Matematika kelas 1', 'Modul_Ajar', 'Matematika', 'A', [1]),
    ('template', '04 · Template internal modul ajar', 'Template', 'Lintas mapel', 'Umum', []),
    ('checklist', '05 · Checklist penilaian draf', 'Checklist', 'Lintas mapel', 'Umum', []),
]


def target_id(key):
    return str(uuid5(NAMESPACE_URL, 'ruangrpp:pilot-small:v1:' + key))


CORE_IDS = {target_id(t[0]) for t in TARGETS}


def initialize_collection(engine):
    with Session(engine) as db:
        for key, label, category, subject, phase, grades in TARGETS:
            identifier = target_id(key)
            if db.get(Requirement, identifier):
                continue
            value = RequirementInput(label=label, category=category,
                scope={'subject': subject, 'phase': phase, 'grades': grades},
                note='Prioritas pilot Matematika kelas 1. Calon cakupan, belum diverifikasi. '
                     'Satu file gabungan cukup diunggah sekali. Tahun, versi, dan izin diperiksa sebelum dipakai AI.')
            db.add(Requirement(id=identifier, label=value.label,
                criteria=value.model_dump(exclude={'label', 'note', 'applicability'}),
                note=value.note, applicability='unconfirmed', created_by='system'))
        db.commit()
