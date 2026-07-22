"""add dataset analysis_data

Revision ID: 20260722_0001
Revises:
Create Date: 2026-07-22
"""

from alembic import op
import sqlalchemy as sa


revision = "20260722_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("datasets", sa.Column("analysis_data", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("datasets", "analysis_data")
