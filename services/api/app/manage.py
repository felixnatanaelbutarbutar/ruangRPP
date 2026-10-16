import argparse
import getpass
from uuid import uuid4

from pwdlib import PasswordHash
from sqlalchemy import select

from .db import Base, Session, User, engine
from .migrations import initialize

parser = argparse.ArgumentParser(description='Administrasi lokal RuangRPP')
parser.add_argument('command', choices=['init-db', 'create-user'])
parser.add_argument('--email')
parser.add_argument('--name')
parser.add_argument('--role', choices=['admin', 'collector'], default='collector')
args = parser.parse_args()
if args.command == 'init-db':
    initialize(engine)
    print('Skema admin siap; migrasi penambahan kolom telah diperiksa.')
else:
    if not args.email or not args.name:
        parser.error('--email dan --name wajib diisi.')
    password = getpass.getpass('Kata sandi (minimal 12 karakter): ')
    confirm = getpass.getpass('Ulangi kata sandi: ')
    if password != confirm or len(password) < 12:
        raise SystemExit('Kata sandi tidak sesuai atau terlalu pendek.')
    with Session() as db:
        if db.scalar(select(User).where(User.email == args.email.lower())):
            raise SystemExit('Email sudah terdaftar.')
        db.add(User(id=str(uuid4()), email=args.email.lower(), name=args.name, role=args.role, password_hash=PasswordHash.recommended().hash(password)))
        db.commit()
    print('Akun dibuat. Kata sandi disimpan sebagai hash Argon2.')
