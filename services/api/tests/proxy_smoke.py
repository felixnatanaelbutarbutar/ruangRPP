"""Manual smoke test against disposable Docker web/API containers only."""
import hashlib
import io
import json
import httpx
from pypdf import PdfWriter

url = 'http://ruangrpp-proxy-test-web:3000/api/v1'
with httpx.Client(timeout=120) as client:
    login = client.post(url + '/auth/login', json={'email':'admin@example.test','password':'OnlyForContainerTests123'})
    assert login.status_code == 200, login.text
    writer = PdfWriter()
    for _ in range(260):
        writer.add_blank_page(width=72,height=72)
    writer.add_attachment('synthetic.bin', b'x' * (33 * 1024 * 1024))
    buffer = io.BytesIO()
    writer.write(buffer)
    data = buffer.getvalue()
    metadata = dict(title='Disposable proxy test',category='Panduan_Mapel',year_unknown=True,
        publisher='Test',internal_source=True,curriculum='Synthetic', original_phases=['A','F'],original_level='Synthetic',
        scopes=[dict(subject='Matematika',phase='A',page_ranges=[dict(start=250,end=252)])])
    response = client.post(url + '/documents', data={'metadata':json.dumps(metadata)},files={'file':('proxy.pdf',data)})
    assert response.status_code == 201, response.text
    result = response.json()
    assert result['processing_status'] == 'queued'
    original = client.get(url + '/documents/' + result['id'] + '/file')
    assert original.status_code == 200
    assert hashlib.sha256(original.content).digest() == hashlib.sha256(data).digest()
    too_large = client.post(url + '/documents', data={'metadata':json.dumps(metadata)},files={'file':('oversize.pdf',b'%PDF-' + b'x' * (129*1024*1024))})
    assert too_large.status_code == 413, too_large.text
    cross_origin = client.post(url + '/auth/logout',headers={'origin':'https://other.example'})
    assert cross_origin.status_code == 403
    print(json.dumps({'upload_mib':round(len(data)/1024/1024,2),'queued':True,'original_sha256_matches':True,'over_limit':413,'cross_origin':403}))
