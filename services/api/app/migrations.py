"""Additive migration for existing pilot databases; never infer historical actor IDs."""
from sqlalchemy import inspect, text
from .db import Base


def initialize(engine):
    Base.metadata.create_all(engine)
    with engine.begin() as connection:
        columns = {c['name'] for c in inspect(connection).get_columns('source_audit')}
        if 'actor_id' not in columns:
            connection.execute(text('ALTER TABLE source_audit ADD COLUMN actor_id VARCHAR(36)'))
