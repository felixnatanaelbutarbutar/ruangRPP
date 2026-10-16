from typing import Literal
from urllib.parse import urlparse

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

CATEGORIES = {'CP': 'Capaian Pembelajaran', 'Modul_Ajar': 'Modul ajar', 'Panduan': 'Panduan pembelajaran & asesmen', 'Buku_Guru': 'Buku / panduan guru', 'Template': 'Template internal', 'Checklist': 'Checklist validasi', 'Lokal': 'Sumber muatan lokal'}
SUBJECTS = ['Pendidikan Agama dan Budi Pekerti', 'Pendidikan Pancasila', 'Bahasa Indonesia', 'Matematika', 'IPAS', 'PJOK', 'Seni', 'Bahasa Inggris', 'Muatan Lokal/Bahasa Daerah', 'Lainnya']
CATEGORIES['Panduan_Mapel'] = 'Panduan mata pelajaran'
SUBJECTS += ['Kepercayaan Terhadap Tuhan Yang Maha Esa dan Budi Pekerti', 'Koding dan Kecerdasan Artifisial', 'Program Kebutuhan Khusus']


class StrictModel(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)


class PageRange(StrictModel):
    start: int = Field(ge=1, le=2000)
    end: int = Field(ge=1, le=2000)

    @model_validator(mode='after')
    def ordered(self):
        if self.end < self.start:
            raise ValueError('Halaman akhir harus sama atau lebih besar dari halaman awal.')
        return self


class Scope(StrictModel):
    subject: str = Field(min_length=1, max_length=120)
    phase: Literal['A', 'B', 'C', 'Umum']
    grades: list[int] = Field(default_factory=list, max_length=6)
    variant: str = Field(default='', max_length=120)
    region: str = Field(default='', max_length=120)
    page_ranges: list[PageRange] = Field(default_factory=list, max_length=30)

    @field_validator('subject')
    @classmethod
    def subject_known(cls, value):
        if value not in SUBJECTS + ['Lintas mapel']:
            raise ValueError('Pilih mapel katalog; gunakan Lainnya beserta varian untuk mapel khusus.')
        return value

    @field_validator('grades')
    @classmethod
    def grade_range(cls, value):
        if any(g not in range(1, 7) for g in value) or len(set(value)) != len(value):
            raise ValueError('Kelas harus unik dan antara 1–6.')
        return sorted(value)


class Metadata(StrictModel):
    title: str = Field(min_length=3, max_length=250)
    category: str
    year: int | None = Field(default=None, ge=1900, le=2100)
    year_unknown: bool = False
    edition: str = Field(default='', max_length=120)
    publisher: str = Field(default='', max_length=200)
    source_url: str = Field(default='', max_length=2000)
    internal_source: bool = False
    curriculum: str = Field(default='', max_length=200)
    topic: str = Field(default='', max_length=250)
    scopes: list[Scope] = Field(default_factory=list, max_length=40)
    license_note: str = Field(default='', max_length=4000)
    notes: str = Field(default='', max_length=4000)
    original_phases: list[Literal['A', 'B', 'C', 'D', 'E', 'F', 'F Tingkat Lanjut', 'Umum']] = Field(default_factory=list, max_length=8)
    original_level: str = Field(default='', max_length=150)

    @field_validator('category')
    @classmethod
    def category_known(cls, value):
        if value not in CATEGORIES:
            raise ValueError('Kategori tidak dikenal.')
        return value

    @field_validator('source_url')
    @classmethod
    def url_valid(cls, value):
        if value:
            parsed = urlparse(value)
            if parsed.scheme not in ('http', 'https') or not parsed.hostname or parsed.username or parsed.password:
                raise ValueError('URL sumber harus HTTP/HTTPS tanpa kredensial.')
        return value

    @model_validator(mode='after')
    def consistent_year(self):
        if self.year is not None and self.year_unknown:
            raise ValueError('Pilih tahun terbit atau tahun tidak diketahui, bukan keduanya.')
        return self


class Login(StrictModel):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=1, max_length=200)


class MetadataUpdate(StrictModel):
    expected_revision: int = Field(ge=1)
    metadata: Metadata


class Review(StrictModel):
    expected_revision: int = Field(ge=1)
    content: Literal['unreviewed', 'approved', 'needs_revision', 'rejected']
    rights: Literal['unreviewed', 'approved', 'noncommercial', 'denied']
    extraction: Literal['unreviewed', 'approved', 'needs_revision']
    evidence: str = Field(default='', max_length=2000)
    note: str = Field(default='', max_length=4000)
    external_processing_allowed: bool = False

    @model_validator(mode='after')
    def evidence_required(self):
        if (self.content == 'approved' or self.rights == 'approved' or self.extraction == 'approved') and (not self.evidence or not self.note):
            raise ValueError('Persetujuan memerlukan bukti/rujukan pemeriksaan dan catatan peninjau.')
        if self.external_processing_allowed and self.rights != 'approved':
            raise ValueError('Pemrosesan eksternal memerlukan izin yang disetujui.')
        return self


class RequirementInput(StrictModel):
    label: str = Field(min_length=3, max_length=200)
    category: str
    scope: Scope
    curriculum: str = Field(default='', max_length=200)
    minimum: int = Field(default=1, ge=1, le=20)
    note: str = Field(default='', max_length=2000)
    applicability: Literal['unconfirmed', 'applicable', 'not_applicable'] = 'unconfirmed'
    required_phases: list[Literal['A', 'B', 'C']] = Field(default_factory=list, max_length=3)
    source_url: str = Field(default='', max_length=2000)
    original_phases: list[Literal['A', 'B', 'C', 'D', 'E', 'F', 'F Tingkat Lanjut', 'Umum']] = Field(default_factory=list, max_length=8)

    @field_validator('source_url')
    @classmethod
    def source_valid(cls, value):
        return Metadata.url_valid(value)


    @field_validator('required_phases')
    @classmethod
    def unique_phases(cls, value):
        return sorted(set(value))

    @field_validator('category')
    @classmethod
    def category_known(cls, value):
        if value not in CATEGORIES:
            raise ValueError('Kategori tidak dikenal.')
        return value

    @model_validator(mode='after')
    def applicability_evidence(self):
        if self.applicability != 'unconfirmed' and not self.note:
            raise ValueError('Catat dasar penerapan atau alasan tidak berlaku.')
        return self
