"""Initial migration

Revision ID: a1b2c3d4e5f6
Revises: 
Create Date: 2025-02-21 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    op.create_table('analytes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('canonical_name', sa.String(length=100), nullable=False),
        sa.Column('display_name_ru', sa.String(length=255), nullable=False),
        sa.Column('synonyms', sa.JSON(), nullable=True),
        sa.Column('default_unit', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('canonical_name')
    )
    op.create_index(op.f('ix_analytes_canonical_name'), 'analytes', ['canonical_name'], unique=True)

    op.create_table('profiles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_profiles_user_id'), 'profiles', ['user_id'], unique=False)

    op.create_table('reports',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('profile_id', sa.Integer(), nullable=False),
        sa.Column('taken_at', sa.Date(), nullable=False),
        sa.Column('lab_name', sa.String(length=255), nullable=True),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['profile_id'], ['profiles.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_reports_profile_id'), 'reports', ['profile_id'], unique=False)

    op.create_table('results',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('report_id', sa.Integer(), nullable=False),
        sa.Column('analyte_id', sa.Integer(), nullable=False),
        sa.Column('value', sa.Numeric(precision=12, scale=4), nullable=False),
        sa.Column('unit', sa.String(length=50), nullable=True),
        sa.Column('ref_low', sa.Numeric(precision=12, scale=4), nullable=True),
        sa.Column('ref_high', sa.Numeric(precision=12, scale=4), nullable=True),
        sa.Column('flag', sa.String(length=10), nullable=True),
        sa.Column('raw_name', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['analyte_id'], ['analytes.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['report_id'], ['reports.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_results_report_id'), 'results', ['report_id'], unique=False)
    op.create_index(op.f('ix_results_analyte_id'), 'results', ['analyte_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_results_analyte_id'), table_name='results')
    op.drop_index(op.f('ix_results_report_id'), table_name='results')
    op.drop_table('results')
    op.drop_index(op.f('ix_reports_profile_id'), table_name='reports')
    op.drop_table('reports')
    op.drop_index(op.f('ix_profiles_user_id'), table_name='profiles')
    op.drop_table('profiles')
    op.drop_index(op.f('ix_analytes_canonical_name'), table_name='analytes')
    op.drop_table('analytes')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
