"""inscription utilisateur, déconnexion serveur, demandes rattachées au compte

Revision ID: 0003
Revises: 0002
Create Date: 2026-11-02 11:20:00
"""
from alembic import op
import sqlalchemy as sa


revision = '0003'
down_revision = '0002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'revoked_tokens',
        sa.Column('jti', sa.String(length=64), primary_key=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_revoked_tokens_expires_at', 'revoked_tokens', ['expires_at'])
    with op.batch_alter_table('referral_requests', schema=None) as batch_op:
        batch_op.add_column(sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True))
        batch_op.create_index('ix_referral_requests_user_id', ['user_id'])


def downgrade() -> None:
    with op.batch_alter_table('referral_requests', schema=None) as batch_op:
        batch_op.drop_index('ix_referral_requests_user_id')
        batch_op.drop_column('user_id')
    op.drop_index('ix_revoked_tokens_expires_at', 'revoked_tokens')
    op.drop_table('revoked_tokens')
