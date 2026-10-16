def automatic_checks(metadata: dict, extraction: dict):
    issues = []
    if not metadata.get('scopes'):
        issues.append('Cakupan mata pelajaran dan fase belum diperiksa.')
    if metadata['category'] == 'Panduan_Mapel' and (not metadata.get('original_phases') or not metadata.get('original_level')):
        issues.append('Cakupan fase dan jenjang file asli belum dicatat.')
    for key, label in [('publisher', 'Penerbit/instansi'), ('curriculum', 'Acuan kurikulum')]:
        if not metadata.get(key):
            issues.append(f'{label} belum diisi.')
    if metadata.get('year') is None and not metadata.get('year_unknown'):
        issues.append('Isi tahun terbit atau tandai tidak diketahui.')
    if not metadata.get('source_url') and not metadata.get('internal_source'):
        issues.append('URL asal belum diisi atau sumber internal belum ditandai.')
    for scope in metadata['scopes']:
        if metadata.get('original_phases') and 'Umum' not in metadata['original_phases'] and scope['phase'] not in metadata['original_phases']:
            issues.append(f'Fase {scope["phase"]} tidak tercantum dalam cakupan file asli.')
        if scope['subject'] in ['Pendidikan Agama dan Budi Pekerti', 'Seni', 'Muatan Lokal/Bahasa Daerah', 'Lainnya', 'Program Kebutuhan Khusus'] and not scope['variant']:
            issues.append(f'Varian {scope["subject"]} belum dijelaskan.')
        if scope['subject'] == 'Muatan Lokal/Bahasa Daerah' and not scope['region']:
            issues.append('Wilayah muatan lokal belum diisi.')
        if metadata['category'] == 'CP' and scope['phase'] == 'Umum':
            issues.append('Cakupan fase CP perlu diperiksa.')
    if extraction.get('status') != 'readable':
        issues.append(extraction.get('message') or 'Teks perlu diperiksa.')
    return ('passed' if not issues else 'needs_review'), issues


def pipeline(document):
    r = document.review or {}
    if document.auto_status != 'passed':
        return 'blocked'
    m = document.metadata_json
    phases = m.get('original_phases', [])
    if phases and not set(phases).intersection(['A', 'B', 'C', 'Umum']):
        return 'outside_sd_scope'
    if set(phases).intersection(['D', 'E', 'F', 'F Tingkat Lanjut']) and any(not s.get('page_ranges') for s in m['scopes']):
        return 'awaiting_page_selection'
    if any(r.get(k) != 'approved' for k in ('content', 'rights', 'extraction')):
        return 'awaiting_review'
    if not r.get('external_processing_allowed'):
        return 'awaiting_external_permission'
    return 'eligible_for_indexing'


def matches(document, criteria):
    m = document.metadata_json
    if m['category'] != criteria['category']:
        return False
    if criteria.get('curriculum') and criteria['curriculum'] != m.get('curriculum'):
        return False
    if criteria.get('required_phases'):
        return all(matches(document, dict(criteria, required_phases=[], scope=dict(criteria['scope'], phase=p))) for p in criteria['required_phases'])
    target = criteria['scope']
    if m.get('original_phases') and 'Umum' not in m['original_phases'] and target['phase'] not in m['original_phases']:
        return False
    for actual in m['scopes']:
        # Never infer coverage by crossing independent document-wide tags.
        if actual['subject'] != target['subject'] or actual['phase'] != target['phase']:
            continue
        if target['variant'] != actual['variant'] or target['region'] != actual['region']:
            continue
        if target['grades'] and not set(target['grades']).issubset(actual['grades']):
            continue
        return True
    return False
