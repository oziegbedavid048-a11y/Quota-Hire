import os
import re

SKIP_DIRS = {'__pycache__', '.git', 'node_modules', 'staticfiles', 'media',
             'migrations', '.expo', 'dist', 'build', '.venv', 'venv'}

SKIP_FILES = {'package-lock.json', 'yarn.lock', '_sec_scan.py'}

SECRET_PATTERNS = [
    (r'(?i)(secret_key|api_key|apikey|private_key|auth_token)\s*=\s*["\'][^$\{\'\"]{8,}', 'Hardcoded secret'),
    (r'(?i)password\s*=\s*["\'][^$\{\'\"]{4,}', 'Hardcoded password'),
    (r'sk_live_[a-zA-Z0-9]{20,}', 'Paystack live secret key'),
    (r'pk_live_[a-zA-Z0-9]{20,}', 'Paystack live public key'),
    (r'AIza[0-9A-Za-z\-_]{35}', 'Google API key'),
    (r'(?i)bearer\s+[a-zA-Z0-9\-_\.]{20,}', 'Hardcoded bearer token'),
]

SAFE_PATTERNS = [
    'config(', 'os.environ', 'os.getenv', 'import.meta.env', 'process.env',
    'decouple', '#', '//', 'example', 'placeholder', 'your_', '<', '>',
    'insecure-dev', 'test', 'dummy', 'fake',
]

HARDCODED_URL_PATTERN = re.compile(
    r'["\']https?://[^"\']+onrender\.com[^"\']*["\']'
)
HARDCODED_URL_SKIP = ['api.ts', 'auth-screens.tsx']

CONSOLE_LOG_PATTERN = re.compile(r'\bconsole\.(log|warn|error|debug|info)\b')
CONSOLE_LOG_ALLOWED = ['notifications.ts', '_layout.tsx', 'api.ts']

TARGET_EXTENSIONS = {'.py', '.ts', '.tsx', '.js', '.jsx', '.json', '.env', '.yaml', '.yml'}

findings = {
    'critical': [],
    'high': [],
    'medium': [],
    'low': [],
    'info': [],
}


def is_safe_line(line):
    for pat in SAFE_PATTERNS:
        if pat in line:
            return True
    return False


def scan_file(filepath):
    rel = os.path.relpath(filepath)
    fname = os.path.basename(filepath)
    ext = os.path.splitext(fname)[1]

    try:
        with open(filepath, encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
    except Exception:
        return

    for i, raw_line in enumerate(lines, 1):
        line = raw_line.rstrip()
        stripped = line.strip()

        # Skip comment-only lines
        if stripped.startswith('#') or stripped.startswith('//') or stripped.startswith('*'):
            continue

        # --- Secret patterns ---
        for pattern, label in SECRET_PATTERNS:
            if re.search(pattern, line):
                if not is_safe_line(line):
                    findings['critical'].append(
                        f'[CRITICAL] {label}\n  File : {rel}\n  Line : {i}\n  Code : {stripped[:120]}\n'
                    )

        # --- Hardcoded backend URLs (should use API_BASE constant) ---
        if HARDCODED_URL_PATTERN.search(line) and fname not in HARDCODED_URL_SKIP:
            if 'API_BASE' not in line:
                findings['high'].append(
                    f'[HIGH] Hardcoded backend URL (use API_BASE constant)\n  File : {rel}\n  Line : {i}\n  Code : {stripped[:120]}\n'
                )

        # --- console.log left in production code ---
        if CONSOLE_LOG_PATTERN.search(line) and ext in {'.ts', '.tsx', '.js', '.jsx'}:
            if fname not in CONSOLE_LOG_ALLOWED:
                findings['low'].append(
                    f'[LOW] console.log/warn/error in production code\n  File : {rel}\n  Line : {i}\n  Code : {stripped[:120]}\n'
                )

        # --- TODO / FIXME / HACK / XXX ---
        if re.search(r'\b(TODO|FIXME|HACK|XXX)\b', line, re.I):
            findings['info'].append(
                f'[INFO] Unresolved comment marker\n  File : {rel}\n  Line : {i}\n  Code : {stripped[:120]}\n'
            )

    # --- Check .env files are not committed ---
    if fname == '.env' and '.env.example' not in fname:
        findings['critical'].append(
            f'[CRITICAL] .env file committed to repo\n  File : {rel}\n'
        )


def walk_and_scan(root='.'):
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for fname in filenames:
            if fname in SKIP_FILES:
                continue
            _, ext = os.path.splitext(fname)
            if ext in TARGET_EXTENSIONS:
                scan_file(os.path.join(dirpath, fname))


def check_backend_settings():
    settings_path = os.path.join('backend', 'quotahire', 'settings.py')
    if not os.path.exists(settings_path):
        return
    with open(settings_path, encoding='utf-8', errors='ignore') as f:
        content = f.read()

    checks = [
        ('DEBUG = True', 'DEBUG is hardcoded to True in settings.py', 'critical'),
        ('ALLOWED_HOSTS = []', 'ALLOWED_HOSTS is empty list — allows any host', 'high'),
        ('CORS_ALLOW_ALL_ORIGINS = True', 'CORS allows ALL origins', 'high'),
        ('SSL_REDIRECT', 'SECURE_SSL_REDIRECT not configured', 'medium'),
    ]
    for pattern, msg, severity in checks:
        if pattern in content and severity == 'critical':
            findings['critical'].append(f'[CRITICAL] {msg}\n  File : {settings_path}\n')
        elif pattern in content and severity == 'high':
            findings['high'].append(f'[HIGH] {msg}\n  File : {settings_path}\n')


def check_mobile_app_json():
    path = os.path.join('mobile', 'app.json')
    if not os.path.exists(path):
        return
    with open(path, encoding='utf-8', errors='ignore') as f:
        content = f.read()
    if '"package"' not in content:
        findings['high'].append(
            '[HIGH] android.package not set in mobile/app.json\n'
        )
    if '"bundleIdentifier"' not in content:
        findings['medium'].append(
            '[MEDIUM] ios.bundleIdentifier not set in mobile/app.json\n'
        )
    if '"googleServicesFile"' not in content:
        findings['medium'].append(
            '[MEDIUM] android.googleServicesFile not set in mobile/app.json\n'
        )


def check_gitignore():
    for gpath in ['.gitignore', os.path.join('mobile', '.gitignore'), os.path.join('backend', '.gitignore')]:
        if not os.path.exists(gpath):
            continue
        with open(gpath, encoding='utf-8', errors='ignore') as f:
            content = f.read()
        if '.env' not in content:
            findings['high'].append(
                f'[HIGH] .env not in {gpath} — secrets could be committed\n'
            )


def check_requirements():
    req_path = os.path.join('backend', 'requirements.txt')
    if not os.path.exists(req_path):
        return
    with open(req_path, encoding='utf-8', errors='ignore') as f:
        lines = f.readlines()
    unpinned = []
    for line in lines:
        line = line.strip()
        if line and not line.startswith('#'):
            if '==' not in line and '>=' not in line and '~=' not in line:
                unpinned.append(line)
    if unpinned:
        findings['medium'].append(
            f'[MEDIUM] Unpinned dependencies in requirements.txt (version could change on redeploy):\n'
            + ''.join(f'  - {p}\n' for p in unpinned)
        )


def main():
    print('=' * 70)
    print('  QUOTA HIRE — Full Security Scan')
    print('=' * 70)

    walk_and_scan('.')
    check_backend_settings()
    check_mobile_app_json()
    check_gitignore()
    check_requirements()

    total = sum(len(v) for v in findings.values())

    for severity in ['critical', 'high', 'medium', 'low', 'info']:
        items = findings[severity]
        if items:
            print(f'\n{"=" * 70}')
            print(f'  {severity.upper()} ({len(items)} finding{"s" if len(items) != 1 else ""})')
            print(f'{"=" * 70}')
            for item in items:
                print(item)

    print('\n' + '=' * 70)
    print('  SUMMARY')
    print('=' * 70)
    print(f'  Critical : {len(findings["critical"])}')
    print(f'  High     : {len(findings["high"])}')
    print(f'  Medium   : {len(findings["medium"])}')
    print(f'  Low      : {len(findings["low"])}')
    print(f'  Info     : {len(findings["info"])}')
    print(f'  Total    : {total}')
    print('=' * 70)


if __name__ == '__main__':
    main()
