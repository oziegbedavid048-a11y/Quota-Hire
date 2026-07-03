"""
backup_xata.py — Manual Xata database backup script
Run from the project root: python backend/backup_xata.py

Requires: pg_dump installed (comes with PostgreSQL client tools)
Creates:  backup_YYYY-MM-DD.sql in current directory
"""
import subprocess
import os
import sys
from datetime import date

# Load DATABASE_URL from backend/.env
env_path = os.path.join(os.path.dirname(__file__), '.env')
db_url = None
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            if line.startswith('DATABASE_URL='):
                db_url = line.strip().split('=', 1)[1]
                break

if not db_url:
    db_url = os.environ.get('DATABASE_URL')

if not db_url:
    print("ERROR: DATABASE_URL not found in backend/.env or environment.")
    print("Set DATABASE_URL and re-run.")
    sys.exit(1)

output_file = f"backup_{date.today().isoformat()}.sql"
print(f"Starting backup of Xata database...")
print(f"Output file: {output_file}")

try:
    result = subprocess.run(
        ['pg_dump', '--no-owner', '--no-acl', '--clean', '--if-exists', db_url],
        stdout=open(output_file, 'w'),
        stderr=subprocess.PIPE,
        text=True,
        check=True
    )
    size_kb = os.path.getsize(output_file) / 1024
    print(f"Backup complete: {output_file} ({size_kb:.1f} KB)")
    print(f"To restore: psql <target_db_url> -f {output_file}")
except FileNotFoundError:
    print("ERROR: pg_dump not found. Install PostgreSQL client tools:")
    print("  Windows: https://www.postgresql.org/download/windows/")
    print("  Mac:     brew install postgresql")
    print("  Linux:   sudo apt install postgresql-client")
    sys.exit(1)
except subprocess.CalledProcessError as e:
    print(f"ERROR: pg_dump failed: {e.stderr}")
    sys.exit(1)
