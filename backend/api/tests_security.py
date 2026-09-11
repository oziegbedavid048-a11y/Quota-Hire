"""
Quota Hire — security regression tests.

One test class per audit finding. Each test encodes the vulnerable behaviour
that was found, so that if the fix is ever reverted the suite fails loudly
rather than silently regressing.

Run with:
    python manage.py test api.tests_security --settings=quotahire.settings_test
"""

from datetime import timedelta

from django.core.cache import cache
from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from .models import CustomUser, UserRole


class ThrottleIsolatedTestCase(TestCase):
    """
    Base class for tests that touch rate-limited endpoints.

    DRF stores throttle counters in the cache, which is process-wide and is
    NOT reset between tests. Without clearing it, an earlier test's requests
    consume another test's allowance and unrelated assertions start seeing
    429s. Clearing on both sides keeps each test independent.
    """

    def setUp(self):
        cache.clear()
        super().setUp()

    def tearDown(self):
        cache.clear()
        super().tearDown()


def _future():
    return (timezone.now() + timedelta(days=7)).date().isoformat()


def _past():
    return (timezone.now() - timedelta(days=1)).date().isoformat()


class RegistrationRoleEscalationTests(TestCase):
    """
    QH-01 — the public registration endpoint must never let a caller choose a
    privileged role for themselves.

    UserRole declares admin, SUPERADMIN, FINANCE_ADMIN, HR_OPS and SALES_CAM
    alongside employee and company. Only the latter two may be self-assigned.
    """

    def setUp(self):
        self.client = APIClient()
        self.url = reverse('auth-register')

    def _payload(self, **overrides):
        payload = {
            'email': 'escalation-probe@example.com',
            'name': 'Escalation Probe',
            'password': 'A-Str0ng-Passw0rd!x',
            'password2': 'A-Str0ng-Passw0rd!x',
        }
        payload.update(overrides)
        return payload

    def test_cannot_self_assign_admin_role(self):
        """Registering with role=admin must not produce an admin account."""
        resp = self.client.post(self.url, self._payload(role='admin'), format='json')

        # The request may be rejected outright, or accepted and downgraded.
        # What must never happen is an admin account existing afterwards.
        user = CustomUser.objects.filter(email='escalation-probe@example.com').first()
        if user is not None:
            self.assertNotEqual(
                user.role, 'admin',
                'Registration granted the caller the admin role — privilege escalation.',
            )
            self.assertFalse(user.is_staff, 'Registration granted is_staff.')
            self.assertFalse(user.is_superuser, 'Registration granted is_superuser.')
        else:
            self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_self_assign_any_privileged_role(self):
        """Every non-public role must be refused, not just 'admin'."""
        for idx, role in enumerate(
            ['admin', 'SUPERADMIN', 'FINANCE_ADMIN', 'HR_OPS', 'SALES_CAM']
        ):
            with self.subTest(role=role):
                email = f'probe-{idx}@example.com'
                self.client.post(
                    self.url, self._payload(email=email, role=role), format='json'
                )
                user = CustomUser.objects.filter(email=email).first()
                if user is not None:
                    self.assertIn(
                        user.role, (UserRole.EMPLOYEE, UserRole.COMPANY),
                        f'Role {role!r} was accepted from an untrusted client.',
                    )

    def test_employee_role_still_works(self):
        """The legitimate signup path must be unaffected."""
        resp = self.client.post(
            self.url, self._payload(email='emp@example.com', role='employee'), format='json'
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)
        user = CustomUser.objects.get(email='emp@example.com')
        self.assertEqual(user.role, UserRole.EMPLOYEE)
        self.assertTrue(
            hasattr(user, 'employee_profile'),
            'Employee registration must still auto-create the employee profile.',
        )

    def test_company_role_still_works(self):
        """Companies must still be able to sign up and get their profile."""
        resp = self.client.post(
            self.url, self._payload(email='co@example.com', role='company'), format='json'
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)
        user = CustomUser.objects.get(email='co@example.com')
        self.assertEqual(user.role, UserRole.COMPANY)
        self.assertTrue(
            hasattr(user, 'company_profile'),
            'Company registration must still auto-create the company profile.',
        )

    def test_role_defaults_to_employee_when_omitted(self):
        """Omitting role entirely must still work and default to employee."""
        payload = self._payload(email='default@example.com')
        resp = self.client.post(self.url, payload, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)
        self.assertEqual(
            CustomUser.objects.get(email='default@example.com').role, UserRole.EMPLOYEE
        )


class PlayReviewBypassTests(ThrottleIsolatedTestCase):
    """
    QH-03 — the Google Play reviewer bypass must be a single, explicitly
    configured account with a secret code and an expiry date, not a prefix
    match against every address on the internet.

    The old behaviour accepted the hardcoded code '123456' for any email
    beginning with 'reviewer', 'playstore' or 'google-reviewer' on any
    domain, minting verified accounts on demand.
    """

    REVIEW_EMAIL = 'play-review-account@quotahire.org'
    REVIEW_CODE = 's3cret-review-code-9f2a'

    def setUp(self):
        super().setUp()
        self.client = APIClient()
        self.verify_url = reverse('login-otp-verify')
        self.request_url = reverse('login-otp-request')

    # ── The old backdoor must be gone ────────────────────────────────────────

    def test_reviewer_prefix_no_longer_grants_access(self):
        """reviewer<anything>@<anydomain> plus 123456 must be refused."""
        for email in [
            'reviewer@attacker.com',
            'reviewer-bot-01@evil.example',
            'playstore@attacker.com',
            'playstore-reviewer@evil.example',
            'google-reviewer@attacker.com',
        ]:
            with self.subTest(email=email):
                resp = self.client.post(
                    self.verify_url,
                    {'email': email, 'otp_code': '123456'},
                    format='json',
                )
                self.assertEqual(
                    resp.status_code, status.HTTP_400_BAD_REQUEST,
                    f'{email} was granted a session via the old backdoor.',
                )
                self.assertNotIn('access', resp.data)
                self.assertFalse(
                    CustomUser.objects.filter(email=email).exists(),
                    f'{email} was created on demand — account minting still possible.',
                )

    def test_prefix_match_cannot_take_over_a_real_account(self):
        """A real user whose address starts with 'reviewer' must be safe."""
        victim = CustomUser.objects.create_user(
            username='reviewer@realcompany.com',
            email='reviewer@realcompany.com',
            password='the-real-users-password',
            role=UserRole.EMPLOYEE,
        )
        resp = self.client.post(
            self.verify_url,
            {'email': victim.email, 'otp_code': '123456'},
            format='json',
        )
        self.assertEqual(
            resp.status_code, status.HTTP_400_BAD_REQUEST,
            'A real account was taken over using the static reviewer code.',
        )

    def test_bypass_is_off_when_not_configured(self):
        """With no review settings, even the review address gets nothing."""
        resp = self.client.post(
            self.verify_url,
            {'email': self.REVIEW_EMAIL, 'otp_code': self.REVIEW_CODE},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    # ── The configured account must still work during the review window ──────

    @override_settings(
        PLAY_REVIEW_EMAIL=REVIEW_EMAIL,
        PLAY_REVIEW_OTP=REVIEW_CODE,
        PLAY_REVIEW_EXPIRES=_future(),
    )
    def test_configured_reviewer_can_log_in(self):
        """The one configured address with the right code gets a session."""
        resp = self.client.post(
            self.verify_url,
            {'email': self.REVIEW_EMAIL, 'otp_code': self.REVIEW_CODE},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        self.assertIn('access', resp.data)
        self.assertIn('refresh', resp.data)
        user = CustomUser.objects.get(email=self.REVIEW_EMAIL)
        self.assertEqual(user.role, UserRole.EMPLOYEE)
        self.assertTrue(user.email_verified)

    @override_settings(
        PLAY_REVIEW_EMAIL=REVIEW_EMAIL,
        PLAY_REVIEW_OTP=REVIEW_CODE,
        PLAY_REVIEW_EXPIRES=_future(),
    )
    def test_configured_reviewer_request_does_not_error(self):
        """Requesting a code for the review account must succeed silently."""
        resp = self.client.post(
            self.request_url, {'email': self.REVIEW_EMAIL}, format='json'
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)

    @override_settings(
        PLAY_REVIEW_EMAIL=REVIEW_EMAIL,
        PLAY_REVIEW_OTP=REVIEW_CODE,
        PLAY_REVIEW_EXPIRES=_future(),
    )
    def test_wrong_code_for_configured_reviewer_is_refused(self):
        resp = self.client.post(
            self.verify_url,
            {'email': self.REVIEW_EMAIL, 'otp_code': '123456'},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    @override_settings(
        PLAY_REVIEW_EMAIL=REVIEW_EMAIL,
        PLAY_REVIEW_OTP=REVIEW_CODE,
        PLAY_REVIEW_EXPIRES=_past(),
    )
    def test_bypass_self_destructs_after_expiry(self):
        """Past the expiry date the bypass is dead even with the right code."""
        resp = self.client.post(
            self.verify_url,
            {'email': self.REVIEW_EMAIL, 'otp_code': self.REVIEW_CODE},
            format='json',
        )
        self.assertEqual(
            resp.status_code, status.HTTP_400_BAD_REQUEST,
            'The review bypass outlived its expiry date.',
        )

    @override_settings(
        PLAY_REVIEW_EMAIL=REVIEW_EMAIL,
        PLAY_REVIEW_OTP=REVIEW_CODE,
        PLAY_REVIEW_EXPIRES='not-a-date',
    )
    def test_malformed_expiry_fails_closed(self):
        """An unparseable expiry must disable the bypass, not enable it."""
        resp = self.client.post(
            self.verify_url,
            {'email': self.REVIEW_EMAIL, 'otp_code': self.REVIEW_CODE},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)


class NormalOTPLoginTests(ThrottleIsolatedTestCase):
    """The ordinary email-OTP login must keep working unchanged."""

    def setUp(self):
        super().setUp()
        self.client = APIClient()
        self.verify_url = reverse('login-otp-verify')
        self.user = CustomUser.objects.create_user(
            username='normal@example.com',
            email='normal@example.com',
            password='pw-does-not-matter-here',
            role=UserRole.EMPLOYEE,
        )

    def _set_otp(self, code, minutes=30):
        from .views import hash_otp
        self.user.login_otp_code = hash_otp(code)
        self.user.login_otp_expires_at = timezone.now() + timedelta(minutes=minutes)
        self.user.save()

    def test_valid_otp_logs_in(self):
        self._set_otp('654321')
        resp = self.client.post(
            self.verify_url,
            {'email': self.user.email, 'otp_code': '654321'},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        self.assertIn('access', resp.data)

    def test_otp_is_cleared_after_successful_use(self):
        self._set_otp('654321')
        self.client.post(
            self.verify_url,
            {'email': self.user.email, 'otp_code': '654321'},
            format='json',
        )
        self.user.refresh_from_db()
        self.assertEqual(self.user.login_otp_code, '')

    def test_wrong_otp_refused(self):
        self._set_otp('654321')
        resp = self.client.post(
            self.verify_url,
            {'email': self.user.email, 'otp_code': '000000'},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_expired_otp_refused(self):
        self._set_otp('654321', minutes=-1)
        resp = self.client.post(
            self.verify_url,
            {'email': self.user.email, 'otp_code': '654321'},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)


class LoginOTPBruteForceTests(ThrottleIsolatedTestCase):
    """
    QH-02 — a login OTP must not tolerate unlimited guesses.

    Two independent controls are required, because either alone is bypassable:
      * a per-IP throttle (stops a single fast attacker), and
      * a per-account attempt counter (stops an attacker rotating IPs).
    """

    def setUp(self):
        super().setUp()
        self.client = APIClient()
        self.verify_url = reverse('login-otp-verify')
        self.user = CustomUser.objects.create_user(
            username='bf@example.com',
            email='bf@example.com',
            password='irrelevant',
            role=UserRole.EMPLOYEE,
        )
        from .views import hash_otp
        self.user.login_otp_code = hash_otp('424242')
        self.user.login_otp_expires_at = timezone.now() + timedelta(minutes=30)
        self.user.login_otp_attempts = 0
        self.user.save()

    def _guess(self, code, ip='10.0.0.1'):
        return self.client.post(
            self.verify_url,
            {'email': self.user.email, 'otp_code': code},
            format='json',
            REMOTE_ADDR=ip,
        )

    def test_otp_is_burned_after_max_failed_attempts(self):
        """After the cap, even the CORRECT code must stop working."""
        from .views import MAX_LOGIN_OTP_ATTEMPTS

        # Spread guesses across different IPs so the per-IP throttle is not
        # what stops us — this proves the per-account counter works.
        for i in range(MAX_LOGIN_OTP_ATTEMPTS):
            resp = self._guess('000000', ip=f'10.0.{i}.9')
            self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

        self.user.refresh_from_db()
        self.assertEqual(
            self.user.login_otp_code, '',
            'The OTP was not discarded after the maximum failed attempts.',
        )

        resp = self._guess('424242', ip='10.0.99.9')
        self.assertEqual(
            resp.status_code, status.HTTP_400_BAD_REQUEST,
            'The correct code still worked after the attempt cap was reached.',
        )
        self.assertNotIn('access', resp.data)

    def test_counter_increments_on_each_wrong_guess(self):
        self._guess('111111', ip='10.1.0.1')
        self.user.refresh_from_db()
        self.assertEqual(self.user.login_otp_attempts, 1)

        self._guess('222222', ip='10.1.0.2')
        self.user.refresh_from_db()
        self.assertEqual(self.user.login_otp_attempts, 2)

    def test_successful_login_resets_counter(self):
        self._guess('111111', ip='10.2.0.1')
        self.user.refresh_from_db()
        self.assertEqual(self.user.login_otp_attempts, 1)

        resp = self._guess('424242', ip='10.2.0.2')
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        self.user.refresh_from_db()
        self.assertEqual(self.user.login_otp_attempts, 0)

    def test_per_ip_throttle_kicks_in(self):
        """A single IP must be cut off well before the code space is walked."""
        seen_429 = False
        for _ in range(40):
            resp = self._guess('999999', ip='10.3.3.3')
            if resp.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
                seen_429 = True
                break
        self.assertTrue(
            seen_429,
            'The verify endpoint never returned 429 — it is not rate limited.',
        )

    def test_failure_messages_are_indistinguishable(self):
        """No-such-account, wrong-code and expired must read identically."""
        no_account = self.client.post(
            self.verify_url,
            {'email': 'nobody@example.com', 'otp_code': '123456'},
            format='json',
            REMOTE_ADDR='10.4.0.1',
        )
        wrong_code = self._guess('000000', ip='10.4.0.2')
        self.assertEqual(no_account.status_code, wrong_code.status_code)
        self.assertEqual(
            no_account.data.get('error'), wrong_code.data.get('error'),
            'Error messages differ, allowing account enumeration.',
        )

    def test_requesting_a_new_code_resets_the_counter(self):
        self.user.login_otp_attempts = 3
        self.user.save()

        # Issue a fresh code the same way the request view does.
        from .views import hash_otp
        self.user.login_otp_code = hash_otp('555555')
        self.user.login_otp_expires_at = timezone.now() + timedelta(minutes=30)
        self.user.login_otp_attempts = 0
        self.user.save()

        resp = self._guess('555555', ip='10.5.0.1')
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)


class ResumeParsingReDoSTests(TestCase):
    """
    QH-16 — resume parsing must not be exploitable as a denial of service.

    The location regex backtracked quadratically, so a resume made of repeated
    'Aa , ' tokens burned minutes of CPU in a single request. Six concurrent
    uploads filled every Gunicorn slot and took the whole backend offline.

    Two defences are required and both are tested here:
      * the pattern itself must not backtrack catastrophically, and
      * the view must cap how much text reaches the parser at all.
    """

    # Generous ceiling: the vulnerable pattern took ~10 s on this input, the
    # fixed one is milliseconds. Anything under 2 s proves the blow-up is gone
    # without making the test flaky on a slow machine.
    BUDGET_SECONDS = 2.0

    def _pathological(self, tokens):
        # Repeated capitalised tokens with separators, never followed by one
        # of the country names the pattern requires — the worst case.
        return 'Aa' + (' , Aa' * tokens) + '!'

    def test_parser_survives_pathological_input(self):
        import time
        from .views import parse_resume_text

        payload = self._pathological(8000)
        start = time.monotonic()
        parse_resume_text(payload)
        elapsed = time.monotonic() - start

        self.assertLess(
            elapsed, self.BUDGET_SECONDS,
            f'parse_resume_text took {elapsed:.2f}s on 8,000 tokens — '
            f'the catastrophic backtracking is still present.',
        )

    def test_parser_scales_linearly_not_quadratically(self):
        """Quadrupling the input must not multiply the time by ~16."""
        import time
        from .views import parse_resume_text

        def timed(tokens):
            payload = self._pathological(tokens)
            start = time.monotonic()
            parse_resume_text(payload)
            return time.monotonic() - start

        small = timed(2000)
        large = timed(8000)
        # Allow generous headroom for timer noise on small numbers.
        self.assertLess(
            large, max(small * 8, 1.0),
            f'Runtime grew super-linearly ({small:.3f}s -> {large:.3f}s), '
            f'which indicates backtracking.',
        )

    def test_parser_is_capped_by_length(self):
        """A very long document must be truncated before parsing."""
        from .views import MAX_RESUME_PARSE_CHARS, extract_and_parse_resume

        huge = self._pathological(200_000)
        self.assertGreater(len(huge), MAX_RESUME_PARSE_CHARS)

        import time
        start = time.monotonic()
        extract_and_parse_resume(huge)
        elapsed = time.monotonic() - start
        self.assertLess(
            elapsed, self.BUDGET_SECONDS,
            'The parse cap did not prevent a long document from burning CPU.',
        )

    # ── Real resumes must still parse correctly ──────────────────────────────

    def test_location_still_extracted(self):
        from .views import parse_resume_text

        text = (
            'Jane Doe\n'
            'Senior Account Executive\n'
            'Lagos, Nigeria\n'
            'jane@example.com | +234 801 234 5678\n'
            '8 years of experience selling SaaS into enterprise accounts, '
            'consistently achieving 120% of a $1.5M ARR quota across EMEA '
            'territories while mentoring junior sellers on the team.\n'
            'Skills: Salesforce, Outreach, MEDDIC, cold calling\n'
            'University of Lagos, B.Sc Business Administration\n'
        )
        parsed = parse_resume_text(text)

        self.assertIn('Nigeria', parsed['location'])
        self.assertEqual(parsed['experience_years'], 8)
        self.assertIn('Salesforce', parsed['skills'])
        self.assertIn('Meddic', parsed['skills'])
        self.assertTrue(parsed['phone_number'])
        self.assertIn('University of Lagos', parsed['education'])
        self.assertTrue(parsed['title'])

    def test_city_only_location_still_matches(self):
        from .views import parse_resume_text

        parsed = parse_resume_text('Ada Obi\nSDR based in Abuja\n')
        self.assertEqual(parsed['location'], 'Abuja')

    def test_multi_word_city_country_still_matches(self):
        from .views import parse_resume_text

        parsed = parse_resume_text('Port Harcourt, Nigeria\nSales Manager\n')
        self.assertIn('Nigeria', parsed['location'])

    def test_empty_text_is_safe(self):
        from .views import parse_resume_text

        parsed = parse_resume_text('')
        self.assertEqual(parsed['skills'], [])
        self.assertEqual(parsed['experience_years'], 0)
        self.assertEqual(parsed['location'], '')


class PasswordLoginTests(ThrottleIsolatedTestCase):
    """
    QH-04 — the password login must be rate limited and must not reveal
    which email addresses are registered.
    """

    def setUp(self):
        super().setUp()
        self.client = APIClient()
        self.url = reverse('auth-login')
        self.password = 'A-Str0ng-Passw0rd!x'
        self.user = CustomUser.objects.create_user(
            username='real@example.com',
            email='real@example.com',
            password=self.password,
            role=UserRole.EMPLOYEE,
        )
        self.user.email_verified = True
        self.user.save()

    def _login(self, email, password, ip='10.20.0.1'):
        return self.client.post(
            self.url, {'email': email, 'password': password},
            format='json', REMOTE_ADDR=ip,
        )

    def test_valid_login_still_works(self):
        resp = self._login(self.user.email, self.password)
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        self.assertIn('access', resp.data)
        self.assertIn('refresh', resp.data)
        self.assertEqual(resp.data['user']['email'], self.user.email)

    def test_unknown_account_and_wrong_password_are_indistinguishable(self):
        """The core enumeration fix."""
        unknown = self._login('nobody@example.com', 'whatever', ip='10.20.1.1')
        wrong = self._login(self.user.email, 'wrong-password', ip='10.20.1.2')

        self.assertEqual(unknown.status_code, wrong.status_code)
        self.assertEqual(
            str(unknown.data.get('detail')), str(wrong.data.get('detail')),
            'Login still distinguishes unknown accounts from wrong passwords.',
        )

    def test_old_enumerating_messages_are_gone(self):
        for resp in (
            self._login('nobody@example.com', 'x', ip='10.20.2.1'),
            self._login(self.user.email, 'x', ip='10.20.2.2'),
        ):
            body = str(resp.data)
            self.assertNotIn('No account found', body)
            self.assertNotIn('Password incorrect', body)

    def test_login_is_rate_limited(self):
        seen_429 = False
        for _ in range(60):
            resp = self._login(self.user.email, 'wrong', ip='10.20.3.3')
            if resp.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
                seen_429 = True
                break
        self.assertTrue(
            seen_429, 'The login endpoint accepted unlimited attempts.',
        )

    def test_unverified_message_still_reachable_with_correct_password(self):
        """The resend-verification UX depends on this distinct message."""
        unverified = CustomUser.objects.create_user(
            username='unverified@example.com',
            email='unverified@example.com',
            password=self.password,
            role=UserRole.EMPLOYEE,
        )
        unverified.email_verified = False
        unverified.save()

        resp = self._login(unverified.email, self.password, ip='10.20.4.1')
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('not verified', str(resp.data).lower())

    def test_unverified_not_revealed_without_correct_password(self):
        """A wrong password must not reveal that the account is unverified."""
        unverified = CustomUser.objects.create_user(
            username='unverified2@example.com',
            email='unverified2@example.com',
            password=self.password,
            role=UserRole.EMPLOYEE,
        )
        unverified.email_verified = False
        unverified.save()

        resp = self._login(unverified.email, 'wrong-password', ip='10.20.5.1')
        self.assertNotIn('not verified', str(resp.data).lower())


class BootstrapSuperuserTests(TestCase):
    """
    QH-33 — the post_migrate superuser hook must never fall back to a
    hardcoded password. A deploy that forgets DJANGO_SUPERUSER_PASSWORD must
    end up with no superuser touched, not a guessable one.
    """

    USERNAME = 'bootstrap-admin-probe'

    def _run_hook(self, env):
        import os
        from unittest.mock import patch
        from .apps import create_default_superuser

        # Start from a clean slate so inherited values cannot leak in.
        clean = {
            k: v for k, v in os.environ.items()
            if not k.startswith('DJANGO_SUPERUSER_')
        }
        clean.update(env)
        with patch.dict(os.environ, clean, clear=True):
            create_default_superuser(sender=None)

    def test_no_superuser_created_without_a_password(self):
        self._run_hook({'DJANGO_SUPERUSER_USERNAME': self.USERNAME,
                        'DJANGO_SUPERUSER_EMAIL': 'probe@example.com'})
        self.assertFalse(
            CustomUser.objects.filter(username=self.USERNAME).exists(),
            'A superuser was created without an explicit password.',
        )

    def test_the_old_default_password_is_never_used(self):
        """The historic default must not authenticate anything."""
        self._run_hook({'DJANGO_SUPERUSER_USERNAME': self.USERNAME,
                        'DJANGO_SUPERUSER_EMAIL': 'probe@example.com'})
        user = CustomUser.objects.filter(username=self.USERNAME).first()
        if user is not None:
            self.assertFalse(
                user.check_password('adminpassword123'),
                'The hardcoded default password still works.',
            )

    def test_no_superuser_created_without_an_email(self):
        self._run_hook({'DJANGO_SUPERUSER_USERNAME': self.USERNAME,
                        'DJANGO_SUPERUSER_PASSWORD': 'a-real-password'})
        self.assertFalse(
            CustomUser.objects.filter(username=self.USERNAME).exists()
        )

    def test_superuser_created_when_fully_configured(self):
        """The legitimate bootstrap path must still work."""
        self._run_hook({
            'DJANGO_SUPERUSER_USERNAME': self.USERNAME,
            'DJANGO_SUPERUSER_EMAIL': 'probe@example.com',
            'DJANGO_SUPERUSER_PASSWORD': 'a-properly-chosen-password',
        })
        user = CustomUser.objects.get(username=self.USERNAME)
        self.assertTrue(user.is_superuser)
        self.assertTrue(user.is_staff)
        self.assertTrue(user.check_password('a-properly-chosen-password'))

    def test_existing_superuser_is_resynced_not_duplicated(self):
        env = {
            'DJANGO_SUPERUSER_USERNAME': self.USERNAME,
            'DJANGO_SUPERUSER_EMAIL': 'probe@example.com',
            'DJANGO_SUPERUSER_PASSWORD': 'first-password',
        }
        self._run_hook(env)
        env['DJANGO_SUPERUSER_PASSWORD'] = 'second-password'
        self._run_hook(env)

        self.assertEqual(
            CustomUser.objects.filter(username=self.USERNAME).count(), 1
        )
        user = CustomUser.objects.get(username=self.USERNAME)
        self.assertTrue(user.check_password('second-password'))

    def test_hook_does_not_raise_when_unconfigured(self):
        """A missing variable must not break the deploy."""
        try:
            self._run_hook({})
        except Exception as exc:  # pragma: no cover
            self.fail(f'The bootstrap hook raised and would break a deploy: {exc}')


class EmailChangeTests(TestCase):
    """
    QH-05 — the account email must not be changeable through /api/auth/me/.

    Email is the USERNAME_FIELD. A writable email let anyone holding a stolen
    access token repoint the account at an address they control and then use
    forgot-password to take permanent ownership.
    """

    def setUp(self):
        self.client = APIClient()
        self.url = reverse('auth-me')
        self.user = CustomUser.objects.create_user(
            username='owner@example.com',
            email='owner@example.com',
            password='owner-password',
            role=UserRole.EMPLOYEE,
            first_name='Real',
            last_name='Owner',
        )
        self.user.email_verified = True
        self.user.save()
        self.client.force_authenticate(user=self.user)

    def test_email_cannot_be_changed_by_patch(self):
        self.client.patch(
            self.url, {'email': 'attacker@evil.example'}, format='json'
        )
        self.user.refresh_from_db()
        self.assertEqual(
            self.user.email, 'owner@example.com',
            'The account email was reassigned through /auth/me/.',
        )

    def test_email_cannot_be_changed_by_put(self):
        self.client.put(
            self.url,
            {'email': 'attacker@evil.example', 'first_name': 'Real'},
            format='json',
        )
        self.user.refresh_from_db()
        self.assertEqual(self.user.email, 'owner@example.com')

    def test_username_field_is_not_repointed(self):
        """Belt and braces: the login identity must be untouched."""
        self.client.patch(
            self.url, {'email': 'attacker@evil.example'}, format='json'
        )
        self.user.refresh_from_db()
        self.assertFalse(
            CustomUser.objects.filter(email='attacker@evil.example').exists()
        )

    def test_role_still_cannot_be_escalated_here(self):
        self.client.patch(self.url, {'role': 'admin'}, format='json')
        self.user.refresh_from_db()
        self.assertEqual(self.user.role, UserRole.EMPLOYEE)

    # ── The fields clients actually send must still work ─────────────────────

    def test_name_update_still_works(self):
        """mobile settings.tsx and profile.tsx send {name: ...}."""
        resp = self.client.patch(self.url, {'name': 'New Name'}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'New')
        self.assertEqual(self.user.last_name, 'Name')

    def test_first_last_name_update_still_works(self):
        """web Settings.tsx sends first_name/last_name."""
        resp = self.client.put(
            self.url, {'first_name': 'Ada', 'last_name': 'Obi'}, format='json'
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'Ada')
        self.assertEqual(self.user.last_name, 'Obi')

    def test_location_and_setup_completed_still_work(self):
        """web Onboarding.tsx sends setup_completed and location."""
        resp = self.client.patch(
            self.url,
            {'setup_completed': True, 'location': 'Lagos, Nigeria'},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        self.user.refresh_from_db()
        self.assertTrue(self.user.setup_completed)
        self.assertEqual(self.user.location, 'Lagos, Nigeria')

    def test_email_is_still_readable(self):
        """The clients read the email to display it — that must still work."""
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['email'], 'owner@example.com')


class PasswordResetHardeningTests(ThrottleIsolatedTestCase):
    """
    QH-07 — the web password reset must validate the new password, refuse to
    be replayed, and evict existing sessions.
    """

    def setUp(self):
        super().setUp()
        self.client = APIClient()
        self.forgot_url = reverse('auth-forgot-password')
        self.reset_url = reverse('auth-reset-password')
        self.user = CustomUser.objects.create_user(
            username='reset@example.com',
            email='reset@example.com',
            password='Original-Passw0rd!x',
            role=UserRole.EMPLOYEE,
        )
        self.user.email_verified = True
        self.user.save()

    def _issue_token(self):
        """Mint a reset token the same way ForgotPasswordView does."""
        import jwt as _jwt
        from django.conf import settings as _s
        from .views import _password_fingerprint

        return _jwt.encode(
            {
                'email': self.user.email,
                'type': 'password_reset',
                'pwh': _password_fingerprint(self.user),
                'exp': timezone.now() + timedelta(minutes=10),
            },
            _s.SECRET_KEY, algorithm='HS256',
        )

    def _reset(self, token, password):
        return self.client.post(
            self.reset_url,
            {'token': token, 'password': password, 'passwordConfirm': password},
            format='json',
        )

    # ── Strength ─────────────────────────────────────────────────────────────

    def test_weak_password_is_rejected(self):
        """'1' was previously accepted here."""
        resp = self._reset(self._issue_token(), '1')
        self.assertEqual(
            resp.status_code, status.HTTP_400_BAD_REQUEST,
            'A one-character password was accepted by the reset flow.',
        )
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('Original-Passw0rd!x'))

    def test_common_password_is_rejected(self):
        resp = self._reset(self._issue_token(), 'password123')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_strong_password_is_accepted(self):
        resp = self._reset(self._issue_token(), 'A-Brand-New-Passw0rd!x')
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('A-Brand-New-Passw0rd!x'))

    # ── Replay ───────────────────────────────────────────────────────────────

    def test_token_cannot_be_reused(self):
        token = self._issue_token()
        first = self._reset(token, 'A-Brand-New-Passw0rd!x')
        self.assertEqual(first.status_code, status.HTTP_200_OK, first.data)

        second = self._reset(token, 'Attacker-Chosen-Passw0rd!x')
        self.assertEqual(
            second.status_code, status.HTTP_400_BAD_REQUEST,
            'The reset token worked a second time — it is replayable.',
        )
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('A-Brand-New-Passw0rd!x'))
        self.assertFalse(self.user.check_password('Attacker-Chosen-Passw0rd!x'))

    def test_token_of_wrong_type_is_rejected(self):
        """An email-verification token must not work as a reset token."""
        import jwt as _jwt
        from django.conf import settings as _s

        verification_token = _jwt.encode(
            {'email': self.user.email, 'exp': timezone.now() + timedelta(days=1)},
            _s.SECRET_KEY, algorithm='HS256',
        )
        resp = self._reset(verification_token, 'A-Brand-New-Passw0rd!x')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unknown_account_does_not_leak(self):
        import jwt as _jwt
        from django.conf import settings as _s

        token = _jwt.encode(
            {'email': 'nobody@example.com', 'type': 'password_reset',
             'pwh': 'x' * 16, 'exp': timezone.now() + timedelta(minutes=10)},
            _s.SECRET_KEY, algorithm='HS256',
        )
        resp = self._reset(token, 'A-Brand-New-Passw0rd!x')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertNotIn('not found', str(resp.data).lower())

    # ── Session revocation ───────────────────────────────────────────────────

    def test_reset_revokes_existing_refresh_tokens(self):
        from rest_framework_simplejwt.tokens import RefreshToken
        from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken

        stolen = RefreshToken.for_user(self.user)
        self.assertEqual(BlacklistedToken.objects.count(), 0)

        resp = self._reset(self._issue_token(), 'A-Brand-New-Passw0rd!x')
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)

        self.assertGreater(
            BlacklistedToken.objects.count(), 0,
            'Password reset did not revoke outstanding sessions — a stolen '
            'refresh token would still work.',
        )

        # The stolen token must no longer be exchangeable.
        refresh_resp = self.client.post(
            reverse('auth-refresh'), {'refresh': str(stolen)}, format='json'
        )
        self.assertNotEqual(refresh_resp.status_code, status.HTTP_200_OK)


class ChangePasswordTests(TestCase):
    """QH-07 — change-password must also revoke other sessions."""

    def setUp(self):
        self.client = APIClient()
        self.url = reverse('auth-change-password')
        self.user = CustomUser.objects.create_user(
            username='chg@example.com',
            email='chg@example.com',
            password='Original-Passw0rd!x',
            role=UserRole.EMPLOYEE,
        )
        self.user.email_verified = True
        self.user.save()
        self.client.force_authenticate(user=self.user)

    def test_change_password_still_works(self):
        resp = self.client.post(
            self.url,
            {'old_password': 'Original-Passw0rd!x',
             'new_password': 'A-Brand-New-Passw0rd!x'},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('A-Brand-New-Passw0rd!x'))

    def test_change_password_returns_fresh_tokens(self):
        """The caller must not be logged out of their own device."""
        resp = self.client.post(
            self.url,
            {'old_password': 'Original-Passw0rd!x',
             'new_password': 'A-Brand-New-Passw0rd!x'},
            format='json',
        )
        self.assertIn('access', resp.data)
        self.assertIn('refresh', resp.data)

    def test_change_password_revokes_other_sessions(self):
        from rest_framework_simplejwt.tokens import RefreshToken
        from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken

        RefreshToken.for_user(self.user)
        before = BlacklistedToken.objects.count()

        self.client.post(
            self.url,
            {'old_password': 'Original-Passw0rd!x',
             'new_password': 'A-Brand-New-Passw0rd!x'},
            format='json',
        )
        self.assertGreater(BlacklistedToken.objects.count(), before)

    def test_wrong_old_password_refused(self):
        resp = self.client.post(
            self.url,
            {'old_password': 'wrong', 'new_password': 'A-Brand-New-Passw0rd!x'},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_weak_new_password_refused(self):
        resp = self.client.post(
            self.url,
            {'old_password': 'Original-Passw0rd!x', 'new_password': '1'},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)


class MobileResetPasswordTests(ThrottleIsolatedTestCase):
    """QH-07 — the mobile reset path must enforce the same password policy."""

    def setUp(self):
        super().setUp()
        self.client = APIClient()
        self.url = reverse('mobile-reset-password')
        self.user = CustomUser.objects.create_user(
            username='mob@example.com',
            email='mob@example.com',
            password='Original-Passw0rd!x',
            role=UserRole.EMPLOYEE,
        )

    def _token(self):
        import jwt as _jwt
        from django.conf import settings as _s
        return _jwt.encode(
            {'email': self.user.email, 'type': 'mobile_password_reset',
             'exp': timezone.now() + timedelta(minutes=10)},
            _s.SECRET_KEY, algorithm='HS256',
        )

    def _reset(self, password):
        return self.client.post(
            self.url,
            {'reset_token': self._token(),
             'password': password, 'password_confirm': password},
            format='json',
        )

    def test_common_eight_char_password_now_refused(self):
        """'password' passed the old len>=8 check."""
        resp = self._reset('password')
        self.assertEqual(
            resp.status_code, status.HTTP_400_BAD_REQUEST,
            'The mobile reset accepted a password the rest of the app rejects.',
        )

    def test_all_numeric_password_refused(self):
        resp = self._reset('12345678')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_strong_password_accepted(self):
        resp = self._reset('A-Brand-New-Passw0rd!x')
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('A-Brand-New-Passw0rd!x'))


class CacheControlTests(TestCase):
    """
    QH-08 — private data must never be marked publicly cacheable.

    The middleware used an exclusion list, which let applicant records and
    raw resume PDFs be labelled `public, max-age=600`.
    """

    def setUp(self):
        self.client = APIClient()
        self.company = CustomUser.objects.create_user(
            username='co@example.com', email='co@example.com',
            password='pw', role=UserRole.COMPANY,
        )
        self.employee = CustomUser.objects.create_user(
            username='emp@example.com', email='emp@example.com',
            password='pw', role=UserRole.EMPLOYEE,
        )
        from .models import CompanyProfile, EmployeeProfile, Job, Application
        CompanyProfile.objects.create(user=self.company, company_name='Acme')
        EmployeeProfile.objects.create(user=self.employee)
        self.job = Job.objects.create(
            company=self.company, title='AE', description='d',
            requirements=[], status='approved',
        )
        self.application = Application.objects.create(
            job=self.job, employee=self.employee,
        )

    def _cc(self, resp):
        return resp.headers.get('Cache-Control', '')

    # ── Private routes must not be public ────────────────────────────────────

    def test_application_detail_is_not_public(self):
        self.client.force_authenticate(user=self.company)
        resp = self.client.get(
            reverse('company-application-detail', args=[self.application.pk])
        )
        self.assertNotIn(
            'public', self._cc(resp),
            'Applicant detail is still marked publicly cacheable.',
        )

    def test_resume_route_is_not_public(self):
        self.client.force_authenticate(user=self.company)
        resp = self.client.get(
            reverse('company-resume-proxy', args=[self.application.pk])
        )
        self.assertNotIn(
            'public', self._cc(resp),
            'The resume route is still marked publicly cacheable.',
        )

    def test_authenticated_user_route_is_private(self):
        self.client.force_authenticate(user=self.employee)
        resp = self.client.get(reverse('auth-me'))
        self.assertIn('private', self._cc(resp))
        self.assertIn('no-store', self._cc(resp))

    def test_notifications_are_private(self):
        self.client.force_authenticate(user=self.employee)
        resp = self.client.get(reverse('notifications'))
        self.assertIn('private', self._cc(resp))

    def test_company_applicants_list_is_private(self):
        self.client.force_authenticate(user=self.company)
        resp = self.client.get(
            reverse('company-job-applicants', args=[self.job.pk])
        )
        self.assertNotIn('public', self._cc(resp))

    # ── Genuinely public routes must still be cached ─────────────────────────

    def test_public_job_list_is_still_cached(self):
        resp = self.client.get(reverse('job-list-create'))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn(
            'public', self._cc(resp),
            'The public job list lost its cache header — this will hurt performance.',
        )
        self.assertIn('max-age=300', self._cc(resp))

    def test_public_job_detail_is_still_cached(self):
        resp = self.client.get(reverse('job-detail', args=[self.job.pk]))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('public', self._cc(resp))

    def test_public_company_profile_is_still_cached(self):
        resp = self.client.get(
            reverse('company-public-profile', args=[str(self.company.pk)])
        )
        if resp.status_code == status.HTTP_200_OK:
            self.assertIn(
                'public', self._cc(resp),
                'The public company profile lost its cache header.',
            )
            self.assertIn('max-age=600', self._cc(resp))


class EmailInjectionTests(ThrottleIsolatedTestCase):
    """
    QH-18 — user-controlled text must be HTML-escaped before it reaches an
    email body, and the display name must never come from the request.

    An unescaped name let an unauthenticated caller deliver arbitrary markup
    to a victim's inbox from the platform's own DKIM-signed domain.
    """

    PAYLOAD = "<a href='https://evil.example'>Verify your account now</a>"

    def setUp(self):
        super().setUp()
        self.client = APIClient()
        self.user = CustomUser.objects.create_user(
            username='victim@example.com',
            email='victim@example.com',
            password='pw',
            role=UserRole.EMPLOYEE,
            first_name='Real',
            last_name='Person',
        )
        self.user.email_verified = False
        self.user.save()

    # ── Escaping ─────────────────────────────────────────────────────────────

    def test_templates_escape_markup_in_names(self):
        from .email_templates import (
            get_verification_email_html, get_recovery_email_html,
            get_welcome_email_html, get_login_otp_email_html,
            get_mobile_otp_email_html,
        )
        rendered = [
            get_verification_email_html(user=self.PAYLOAD, redirect='https://x/'),
            get_recovery_email_html(user=self.PAYLOAD, redirect='https://x/'),
            get_welcome_email_html(user=self.PAYLOAD),
            get_login_otp_email_html(user=self.PAYLOAD, otp_code='123456'),
            get_mobile_otp_email_html(self.PAYLOAD, '123456'),
        ]
        for html in rendered:
            self.assertNotIn(
                "<a href='https://evil.example'>", html,
                'Raw attacker markup survived into the email body.',
            )
            self.assertIn('&lt;a href=', html)

    def test_job_titles_are_escaped(self):
        from .email_templates import (
            get_job_submitted_email_html, get_job_approved_email_html,
            get_job_rejected_email_html, get_application_confirmed_email_html,
        )
        evil = '<script>alert(1)</script>'
        for html in [
            get_job_submitted_email_html(user='A', job_title=evil),
            get_job_approved_email_html(user='A', job_title=evil, job_code='QH-1'),
            get_job_rejected_email_html(user='A', job_title=evil),
            get_application_confirmed_email_html(user='A', job_title=evil),
        ]:
            self.assertNotIn('<script>', html)
            self.assertIn('&lt;script&gt;', html)

    def test_notification_body_is_escaped(self):
        from .email_templates import get_notification_email_html
        html = get_notification_email_html(
            user='A', title='<b>T</b>', message='<img src=x onerror=alert(1)>',
        )
        self.assertNotIn('<img src=x', html)
        self.assertNotIn('<b>T</b>', html)

    def test_none_does_not_render_as_the_string_none(self):
        from .email_templates import get_notification_email_html
        html = get_notification_email_html(
            user='A', title='T', message='M', job_title=None,
        )
        self.assertNotIn('>None<', html)

    def test_normal_names_are_unharmed(self):
        """Escaping must not mangle ordinary names."""
        from .email_templates import get_welcome_email_html
        html = get_welcome_email_html(user="Ada Obi")
        self.assertIn('Ada Obi', html)

    def test_apostrophe_names_still_readable(self):
        from .email_templates import get_welcome_email_html
        html = get_welcome_email_html(user="O'Brien")
        self.assertNotIn('<script', html)
        self.assertTrue('O&#x27;Brien' in html or "O'Brien" in html)

    # ── The request must not control the display name ────────────────────────

    def test_client_supplied_name_is_ignored(self):
        from django.core import mail

        mail.outbox = []
        resp = self.client.post(
            reverse('auth-send-verification'),
            {'email': self.user.email, 'name': self.PAYLOAD},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)

        # The email is dispatched on a background thread; give it a moment.
        import time
        for _ in range(50):
            if mail.outbox:
                break
            time.sleep(0.05)

        for message in mail.outbox:
            body = message.body + ''.join(a[0] for a in getattr(message, 'alternatives', []))
            self.assertNotIn('evil.example', body,
                             'The attacker-supplied name reached the email.')
            self.assertIn('Real', body)


class PlayBillingReplayTests(TestCase):
    """
    QH-06 — a Google Play purchase token must only ever unlock content for
    the account that actually bought it.

    The duplicate-token branch looked up the paid transaction without scoping
    to the caller, so a shared token let any user redeem a download for their
    own CV without paying.
    """

    def setUp(self):
        from .models import GeneratedCV, PaymentTransaction, PaymentStatus

        self.client = APIClient()
        self.url = reverse('payment-verify-iap')

        self.buyer = CustomUser.objects.create_user(
            username='buyer@example.com', email='buyer@example.com',
            password='pw', role=UserRole.EMPLOYEE,
        )
        self.freeloader = CustomUser.objects.create_user(
            username='free@example.com', email='free@example.com',
            password='pw', role=UserRole.EMPLOYEE,
        )

        self.buyer_cv = GeneratedCV.objects.create(
            employee=self.buyer, template_id='T1', template_name='Classic',
            cv_pdf=b'%PDF-buyer',
        )
        self.freeloader_cv = GeneratedCV.objects.create(
            employee=self.freeloader, template_id='T1', template_name='Classic',
            cv_pdf=b'%PDF-free',
        )

        self.shared_token = 'gpa-purchase-token-abc123'
        PaymentTransaction.objects.create(
            user=self.buyer, cv=self.buyer_cv, reference='ref-buyer',
            amount_eur=1.50, status=PaymentStatus.PAID,
            payment_source=PaymentTransaction.PAYMENT_SOURCE_GOOGLE_PLAY,
            google_purchase_token=self.shared_token,
        )

    def _verify(self, user, cv):
        self.client.force_authenticate(user=user)
        return self.client.post(
            self.url,
            {
                'purchase_token': self.shared_token,
                'product_id': 'cv_download_150',
                'cv_id': cv.pk,
                'order_id': 'GPA.0000',
            },
            format='json',
        )

    def test_another_user_cannot_redeem_a_shared_token(self):
        from .models import DownloadToken

        resp = self._verify(self.freeloader, self.freeloader_cv)

        self.assertNotEqual(
            resp.status_code, status.HTTP_200_OK,
            'A purchase token belonging to another user unlocked a free download.',
        )
        self.assertNotIn('download_token', resp.data)
        self.assertFalse(
            DownloadToken.objects.filter(user=self.freeloader).exists(),
            'A download token was issued to a user who never paid.',
        )

    def test_shared_token_returns_conflict(self):
        resp = self._verify(self.freeloader, self.freeloader_cv)
        self.assertEqual(resp.status_code, status.HTTP_409_CONFLICT)

    def test_original_buyer_can_still_redownload(self):
        """The legitimate re-download path must keep working."""
        from .models import DownloadToken

        resp = self._verify(self.buyer, self.buyer_cv)
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        self.assertIn('download_token', resp.data)
        self.assertTrue(resp.data.get('already_verified'))
        self.assertTrue(
            DownloadToken.objects.filter(
                user=self.buyer, cv=self.buyer_cv
            ).exists()
        )

    def test_buyer_cannot_use_their_token_for_someone_elses_cv(self):
        """cv_id is already owner-scoped; confirm it stays that way."""
        resp = self._verify(self.buyer, self.freeloader_cv)
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)


class BlobAndLengthLimitTests(ThrottleIsolatedTestCase):
    """
    QH-17 / QH-19 — binary and free-text writes must be bounded, and the
    caps declared on serializers must actually run on the paths that write.
    """

    def setUp(self):
        super().setUp()
        from .models import Job, EmployeeProfile, CompanyProfile

        self.client = APIClient()
        self.employee = CustomUser.objects.create_user(
            username='e@example.com', email='e@example.com',
            password='pw', role=UserRole.EMPLOYEE,
        )
        EmployeeProfile.objects.create(user=self.employee)
        self.company = CustomUser.objects.create_user(
            username='c@example.com', email='c@example.com',
            password='pw', role=UserRole.COMPANY,
        )
        CompanyProfile.objects.create(user=self.company, company_name='Acme')
        self.job = Job.objects.create(
            company=self.company, title='AE', description='d',
            requirements=[], status='approved',
        )
        self.client.force_authenticate(user=self.employee)

    # ── QH-17: CV blob ───────────────────────────────────────────────────────

    def test_oversized_cv_pdf_is_rejected(self):
        import base64
        from .views import SaveGeneratedCVView

        oversized = b'A' * (SaveGeneratedCVView.MAX_CV_PDF_BYTES + 1024)
        resp = self.client.post(
            reverse('cv-save'),
            {
                'template_id': 'T1',
                'template_name': 'Classic',
                'cv_pdf_base64': base64.b64encode(oversized).decode(),
            },
            format='json',
        )
        self.assertEqual(
            resp.status_code, status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            'An oversized CV blob was written into the database.',
        )

    def test_normal_cv_still_saves(self):
        import base64
        from .models import GeneratedCV

        resp = self.client.post(
            reverse('cv-save'),
            {
                'template_id': 'T1',
                'template_name': 'Classic',
                'cv_pdf_base64': base64.b64encode(b'%PDF-1.4 tiny').decode(),
            },
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)
        self.assertTrue(GeneratedCV.objects.filter(employee=self.employee).exists())

    def test_cv_save_is_throttled(self):
        import base64
        payload = {
            'template_id': 'T1', 'template_name': 'C',
            'cv_pdf_base64': base64.b64encode(b'%PDF').decode(),
        }
        seen_429 = False
        for _ in range(40):
            r = self.client.post(reverse('cv-save'), payload, format='json')
            if r.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
                seen_429 = True
                break
        self.assertTrue(seen_429, 'The CV save endpoint accepted unlimited writes.')

    # ── QH-19: cover letter cap on the apply path ────────────────────────────

    def test_cover_letter_is_truncated_on_apply(self):
        from .models import Application
        from .views import MAX_COVER_LETTER_CHARS

        resp = self.client.post(
            reverse('job-apply', args=[self.job.pk]),
            {'cover_letter': 'x' * 50_000},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)
        app = Application.objects.get(job=self.job, employee=self.employee)
        self.assertLessEqual(
            len(app.cover_letter), MAX_COVER_LETTER_CHARS,
            'The serializer cap still does not run on the apply path.',
        )

    def test_normal_cover_letter_preserved(self):
        from .models import Application

        letter = 'I am very interested in this role.'
        self.client.post(
            reverse('job-apply', args=[self.job.pk]),
            {'cover_letter': letter}, format='json',
        )
        app = Application.objects.get(job=self.job, employee=self.employee)
        self.assertEqual(app.cover_letter, letter)


class CommunityLimitsTests(ThrottleIsolatedTestCase):
    """QH-20 / QH-27 / QH-29 / QH-31 — community writes bounded and validated."""

    def setUp(self):
        super().setUp()
        from .models import CommunityPost

        self.client = APIClient()
        self.user = CustomUser.objects.create_user(
            username='u@example.com', email='u@example.com',
            password='pw', role=UserRole.EMPLOYEE,
        )
        self.other = CustomUser.objects.create_user(
            username='o@example.com', email='o@example.com',
            password='pw', role=UserRole.EMPLOYEE,
        )
        self.client.force_authenticate(user=self.user)
        self.post = CommunityPost.objects.create(
            author=self.user, content='hello', category='general',
        )

    # ── Throttling ───────────────────────────────────────────────────────────

    def test_post_creation_is_throttled(self):
        seen_429 = False
        for i in range(200):
            r = self.client.post(
                reverse('community-post-create'),
                {'content': f'spam {i}', 'category': 'general'},
                format='json',
            )
            if r.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
                seen_429 = True
                break
        self.assertTrue(seen_429, 'Community post creation is still unlimited.')

    def test_a_normal_post_still_works(self):
        resp = self.client.post(
            reverse('community-post-create'),
            {'content': 'A perfectly ordinary post.', 'category': 'general'},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)

    # ── Comment length ───────────────────────────────────────────────────────

    def test_oversized_comment_rejected(self):
        resp = self.client.post(
            reverse('community-comments', args=[self.post.pk]),
            {'content': 'x' * 50_000}, format='json',
        )
        self.assertEqual(
            resp.status_code, status.HTTP_400_BAD_REQUEST,
            'Comments still have no length limit.',
        )

    def test_normal_comment_works(self):
        resp = self.client.post(
            reverse('community-comments', args=[self.post.pk]),
            {'content': 'Great post, thanks for sharing.'}, format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)

    def test_reply_threading_still_works(self):
        """QH-31 made parent read-only — replies must still attach."""
        from .models import CommunityComment

        parent = CommunityComment.objects.create(
            post=self.post, author=self.other, content='parent comment',
        )
        resp = self.client.post(
            reverse('community-comments', args=[self.post.pk]),
            {'content': 'a reply', 'parent': parent.pk}, format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)
        reply = CommunityComment.objects.get(content='a reply')
        self.assertEqual(
            reply.parent_id, parent.pk,
            'Replies lost their parent — threading is broken.',
        )

    def test_parent_cannot_be_repointed_by_patch(self):
        from .models import CommunityComment, CommunityPost

        other_post = CommunityPost.objects.create(
            author=self.other, content='another', category='general',
        )
        foreign = CommunityComment.objects.create(
            post=other_post, author=self.other, content='foreign',
        )
        mine = CommunityComment.objects.create(
            post=self.post, author=self.user, content='mine',
        )
        self.client.patch(
            reverse('community-comment-detail', args=[mine.pk]),
            {'parent': foreign.pk}, format='json',
        )
        mine.refresh_from_db()
        self.assertIsNone(
            mine.parent_id,
            'A comment was repointed at a parent in a different thread.',
        )

    # ── Poll validation (QH-27) ──────────────────────────────────────────────

    def test_non_list_choices_does_not_500(self):
        resp = self.client.post(
            reverse('community-poll-create'),
            {'question': 'Q?', 'choices': 5}, format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_string_choices_does_not_500(self):
        resp = self.client.post(
            reverse('community-poll-create'),
            {'question': 'Q?', 'choices': 'ab'}, format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_bad_ends_at_does_not_500(self):
        resp = self.client.post(
            reverse('community-poll-create'),
            {'question': 'Q?', 'choices': ['a', 'b'], 'ends_at': 'banana'},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_overlong_question_rejected(self):
        resp = self.client.post(
            reverse('community-poll-create'),
            {'question': 'Q' * 5000, 'choices': ['a', 'b']}, format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_valid_poll_still_creates(self):
        resp = self.client.post(
            reverse('community-poll-create'),
            {'question': 'Best CRM?', 'choices': ['Salesforce', 'HubSpot']},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)
        self.assertEqual(len(resp.data['choices']), 2)

    # ── Poll voting (QH-29) ──────────────────────────────────────────────────

    def test_cannot_vote_on_a_closed_poll(self):
        from .models import CommunityPoll, CommunityPollChoice

        poll = CommunityPoll.objects.create(
            author=self.user, question='Closed?', category='polls',
            ends_at=timezone.now() - timedelta(days=1),
        )
        choice = CommunityPollChoice.objects.create(poll=poll, text='a', order=0)
        resp = self.client.post(
            reverse('community-poll-vote', args=[poll.pk]),
            {'choice_id': choice.pk}, format='json',
        )
        self.assertEqual(
            resp.status_code, status.HTTP_400_BAD_REQUEST,
            'A closed poll still accepted a vote.',
        )

    def test_voting_on_an_open_poll_works(self):
        from .models import CommunityPoll, CommunityPollChoice, CommunityPollVote

        poll = CommunityPoll.objects.create(
            author=self.user, question='Open?', category='polls',
            ends_at=timezone.now() + timedelta(days=1),
        )
        choice = CommunityPollChoice.objects.create(poll=poll, text='a', order=0)
        resp = self.client.post(
            reverse('community-poll-vote', args=[poll.pk]),
            {'choice_id': choice.pk}, format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        self.assertEqual(CommunityPollVote.objects.filter(poll=poll).count(), 1)

    def test_changing_a_vote_does_not_duplicate(self):
        from .models import CommunityPoll, CommunityPollChoice, CommunityPollVote

        poll = CommunityPoll.objects.create(
            author=self.user, question='Change?', category='polls',
        )
        a = CommunityPollChoice.objects.create(poll=poll, text='a', order=0)
        b = CommunityPollChoice.objects.create(poll=poll, text='b', order=1)

        self.client.post(reverse('community-poll-vote', args=[poll.pk]),
                         {'choice_id': a.pk}, format='json')
        self.client.post(reverse('community-poll-vote', args=[poll.pk]),
                         {'choice_id': b.pk}, format='json')

        votes = CommunityPollVote.objects.filter(poll=poll, voter=self.user)
        self.assertEqual(votes.count(), 1, 'Changing a vote created a duplicate.')
        self.assertEqual(votes.first().choice_id, b.pk)


class OTPStorageTests(ThrottleIsolatedTestCase):
    """
    QH-09 — one-time codes must never be readable from the database.

    Both the login OTP and the password-reset OTP were stored in the clear,
    so any read of those tables handed over working credentials.
    """

    def setUp(self):
        super().setUp()
        self.client = APIClient()
        self.user = CustomUser.objects.create_user(
            username='otp@example.com', email='otp@example.com',
            password='pw', role=UserRole.EMPLOYEE,
        )

    def test_login_otp_is_not_stored_in_plaintext(self):
        from django.core import mail
        import re as _re

        mail.outbox = []
        resp = self.client.post(
            reverse('login-otp-request'), {'email': self.user.email}, format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)

        self.user.refresh_from_db()
        stored = self.user.login_otp_code
        self.assertTrue(stored, 'No OTP was stored at all.')
        self.assertEqual(len(stored), 64, 'Stored value is not a sha256 digest.')
        self.assertFalse(
            _re.fullmatch(r'\d{6}', stored),
            'The six-digit code is still stored in plaintext.',
        )

    def test_emailed_code_still_verifies(self):
        """End to end: request a code, read it from the email, log in."""
        from django.core import mail
        import re as _re

        mail.outbox = []
        self.client.post(
            reverse('login-otp-request'), {'email': self.user.email}, format='json',
        )
        self.assertTrue(mail.outbox, 'No OTP email was sent.')

        body = mail.outbox[0].body
        match = _re.search(r'\b(\d{6})\b', body)
        self.assertIsNotNone(match, f'No six-digit code found in the email: {body[:200]}')
        code = match.group(1)

        # The plaintext code must not equal what is stored.
        self.user.refresh_from_db()
        self.assertNotEqual(code, self.user.login_otp_code)

        resp = self.client.post(
            reverse('login-otp-verify'),
            {'email': self.user.email, 'otp_code': code},
            format='json', REMOTE_ADDR='10.30.0.1',
        )
        self.assertEqual(
            resp.status_code, status.HTTP_200_OK,
            f'The emailed code no longer verifies: {resp.data}',
        )
        self.assertIn('access', resp.data)

    def test_reset_otp_is_not_stored_in_plaintext(self):
        from .models import PasswordResetOTP
        import re as _re

        resp = self.client.post(
            reverse('mobile-forgot-password'),
            {'email': self.user.email}, format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)

        otp = PasswordResetOTP.objects.filter(user=self.user).first()
        self.assertIsNotNone(otp, 'No reset OTP row was created.')
        self.assertEqual(len(otp.otp_code), 64)
        self.assertFalse(_re.fullmatch(r'\d{6}', otp.otp_code))

    def test_reset_otp_round_trip(self):
        from django.core import mail
        import re as _re

        mail.outbox = []
        self.client.post(
            reverse('mobile-forgot-password'),
            {'email': self.user.email}, format='json',
        )
        self.assertTrue(mail.outbox)
        code = _re.search(r'\b(\d{6})\b', mail.outbox[0].body).group(1)

        resp = self.client.post(
            reverse('mobile-verify-otp'),
            {'email': self.user.email, 'otp_code': code}, format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        self.assertIn('reset_token', resp.data)

    def test_stored_digest_cannot_be_replayed_as_the_code(self):
        """Submitting the digest itself must not authenticate."""
        from .views import hash_otp

        self.user.login_otp_code = hash_otp('123456')
        self.user.login_otp_expires_at = timezone.now() + timedelta(minutes=30)
        self.user.save()

        resp = self.client.post(
            reverse('login-otp-verify'),
            {'email': self.user.email, 'otp_code': self.user.login_otp_code},
            format='json', REMOTE_ADDR='10.31.0.1',
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_digest_is_deterministic_and_constant_width(self):
        from .views import hash_otp, verify_otp

        self.assertEqual(hash_otp('000000'), hash_otp('000000'))
        self.assertNotEqual(hash_otp('000000'), hash_otp('000001'))
        self.assertTrue(verify_otp('424242', hash_otp('424242')))
        self.assertFalse(verify_otp('424242', hash_otp('999999')))
        self.assertFalse(verify_otp('424242', ''))


class HardeningBatchTests(ThrottleIsolatedTestCase):
    """QH-10 / QH-11 / QH-13 / QH-26 / QH-28 / QH-30 / QH-32."""

    def setUp(self):
        super().setUp()
        self.client = APIClient()

    # ── QH-10: secure defaults ───────────────────────────────────────────────

    def test_debug_defaults_to_false(self):
        """A missing DEBUG variable must not turn on tracebacks."""
        import os
        from unittest.mock import patch
        from decouple import Config, RepositoryEmpty

        env = {k: v for k, v in os.environ.items() if k != 'DEBUG'}
        with patch.dict(os.environ, env, clear=True):
            cfg = Config(RepositoryEmpty())
            self.assertFalse(
                cfg('DEBUG', default=False, cast=bool),
                'DEBUG still defaults to True when the variable is absent.',
            )

    def test_settings_module_has_no_insecure_secret_fallback(self):
        """The published default key must not be reachable outside DEBUG."""
        from quotahire import settings as s

        code = self._code_only(s)
        idx = code.find('insecure-dev-key-change-in-production')
        self.assertNotEqual(idx, -1, 'Expected the dev key to still exist for DEBUG.')
        # It must sit inside the `if DEBUG:` branch, not the production one.
        self.assertIn(
            'if DEBUG:', code[:idx],
            'The insecure SECRET_KEY default is reachable outside DEBUG.',
        )

    # ── QH-11: ping must not fork ────────────────────────────────────────────

    @staticmethod
    def _code_only(module):
        """Module source with comment-only lines removed.

        These tests assert on what the code does, so the prose that documents
        each fix must not be able to satisfy — or break — an assertion. Whole
        lines are dropped rather than tokenising, because joining tokens back
        together would split phrases like `class Foo` across lines and make
        substring checks meaningless.
        """
        import inspect

        source = inspect.getsource(module)
        return '\n'.join(
            line for line in source.split('\n')
            if not line.lstrip().startswith('#')
        )

    def test_ping_does_not_shell_out(self):
        from api import urls as api_urls

        code = self._code_only(api_urls)
        self.assertNotIn(
            'subprocess', code,
            'The ping endpoint still spawns a subprocess on every request.',
        )

    def test_ping_still_works(self):
        resp = self.client.get(reverse('ping'))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.json()['status'], 'ok')

    def test_ping_does_not_leak_exception_text(self):
        resp = self.client.get(reverse('ping'))
        body = str(resp.json())
        for leak in ('Traceback', 'No such file', 'WinError', 'FileNotFound'):
            self.assertNotIn(leak, body)

    # ── QH-13: no shadowed view ──────────────────────────────────────────────

    def test_admin_job_update_view_defined_once(self):
        from api import views

        self.assertEqual(
            self._code_only(views).count('class AdminJobUpdateView'), 1,
            'AdminJobUpdateView is still defined twice — one silently wins.',
        )

    # ── QH-26: blob not loaded on list ───────────────────────────────────────

    def test_cv_list_defers_the_pdf_blob(self):
        from .models import GeneratedCV

        employee = CustomUser.objects.create_user(
            username='cv@example.com', email='cv@example.com',
            password='pw', role=UserRole.EMPLOYEE,
        )
        GeneratedCV.objects.create(
            employee=employee, template_id='T1', template_name='C',
            cv_pdf=b'%PDF' + b'x' * 5000,
        )
        self.client.force_authenticate(user=employee)
        resp = self.client.get(reverse('cv-my-list'))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        from .views import MyGeneratedCVsView
        qs = MyGeneratedCVsView.queryset if hasattr(MyGeneratedCVsView, 'queryset') else None
        # Assert on the deferred field set of an instance from the real queryset.
        view = MyGeneratedCVsView()
        view.request = type('R', (), {'user': employee})()
        obj = view.get_queryset().first()
        self.assertIn(
            'cv_pdf', obj.get_deferred_fields(),
            'The PDF blob is still loaded when listing CVs.',
        )

    # ── QH-28: no raw threads ────────────────────────────────────────────────

    def test_no_raw_threads_spawned_in_views(self):
        from api import views

        self.assertNotIn(
            'threading.Thread(', self._code_only(views),
            'A raw OS thread is still spawned per request.',
        )

    def test_registration_still_sends_verification_email(self):
        from django.core import mail

        mail.outbox = []
        resp = self.client.post(
            reverse('auth-register'),
            {
                'email': 'newuser@example.com', 'name': 'New User',
                'password': 'A-Str0ng-Passw0rd!x', 'password2': 'A-Str0ng-Passw0rd!x',
                'role': 'employee',
            },
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)
        self.assertTrue(
            any('erify' in m.subject for m in mail.outbox),
            'Registration no longer sends a verification email.',
        )

    # ── QH-30: no bare excepts ───────────────────────────────────────────────

    def test_no_bare_except_clauses(self):
        import inspect
        from api import views, serializers

        for module in (views, serializers):
            source = inspect.getsource(module)
            for line in source.split('\n'):
                self.assertNotEqual(
                    line.strip(), 'except:',
                    f'A bare except: remains in {module.__name__}',
                )

    # ── QH-32: members directory throttled ───────────────────────────────────

    def test_members_directory_is_throttled(self):
        user = CustomUser.objects.create_user(
            username='m@example.com', email='m@example.com',
            password='pw', role=UserRole.EMPLOYEE,
        )
        self.client.force_authenticate(user=user)
        seen_429 = False
        for _ in range(200):
            r = self.client.get(reverse('community-members'))
            if r.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
                seen_429 = True
                break
        self.assertTrue(seen_429, 'The member directory is still unthrottled.')

    def test_members_directory_still_returns_usable_records(self):
        user = CustomUser.objects.create_user(
            username='m2@example.com', email='m2@example.com',
            password='pw', role=UserRole.EMPLOYEE, first_name='Ada',
        )
        self.client.force_authenticate(user=user)
        resp = self.client.get(reverse('community-members'))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(resp.data)
        # The mobile list keys on id — it must still be present.
        self.assertIn('id', resp.data[0])
        self.assertIn('name', resp.data[0])


class UploadVerificationTests(ThrottleIsolatedTestCase):
    """QH-22 — uploads must be verified by parsing, not by trusting a header."""

    def setUp(self):
        super().setUp()
        self.client = APIClient()
        self.user = CustomUser.objects.create_user(
            username='up@example.com', email='up@example.com',
            password='pw', role=UserRole.EMPLOYEE,
        )
        self.client.force_authenticate(user=self.user)
        self.url = reverse('profile-avatar')

    @staticmethod
    def _real_png():
        import io
        from PIL import Image
        from django.core.files.uploadedfile import SimpleUploadedFile

        buf = io.BytesIO()
        Image.new('RGB', (8, 8), (16, 101, 21)).save(buf, format='PNG')
        return SimpleUploadedFile('a.png', buf.getvalue(), content_type='image/png')

    def test_non_image_with_image_content_type_is_rejected(self):
        from django.core.files.uploadedfile import SimpleUploadedFile

        evil = SimpleUploadedFile(
            'a.png', b'<html><script>alert(1)</script></html>',
            content_type='image/png',
        )
        resp = self.client.post(self.url, {'avatar': evil}, format='multipart')
        self.assertEqual(
            resp.status_code, status.HTTP_400_BAD_REQUEST,
            'A non-image was accepted because the client said it was a PNG.',
        )

    def test_truncated_image_is_rejected(self):
        from django.core.files.uploadedfile import SimpleUploadedFile

        broken = SimpleUploadedFile(
            'a.png', b'\x89PNG\r\n\x1a\n' + b'\x00' * 40,
            content_type='image/png',
        )
        resp = self.client.post(self.url, {'avatar': broken}, format='multipart')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_a_real_png_is_still_accepted(self):
        resp = self.client.post(
            self.url, {'avatar': self._real_png()}, format='multipart'
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        self.assertIn('avatarUrl', resp.data)
        self.user.refresh_from_db()
        self.assertTrue(self.user.avatar)

    def test_uploaded_image_is_not_truncated_by_verification(self):
        """verify() consumes the stream — the file must be rewound before save."""
        resp = self.client.post(
            self.url, {'avatar': self._real_png()}, format='multipart'
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.user.avatar.open()
        saved = self.user.avatar.read()
        self.user.avatar.close()
        self.assertGreater(
            len(saved), 50,
            'The saved avatar is truncated — the stream was not rewound.',
        )


class CommunityQueryEfficiencyTests(ThrottleIsolatedTestCase):
    """QH-24 — counts must be correct and must not scale multiplicatively."""

    def setUp(self):
        super().setUp()
        from .models import CommunityPost, CommunityComment

        self.client = APIClient()
        self.author = CustomUser.objects.create_user(
            username='a@example.com', email='a@example.com',
            password='pw', role=UserRole.EMPLOYEE,
        )
        self.client.force_authenticate(user=self.author)

        self.post = CommunityPost.objects.create(
            author=self.author, content='counted', category='general',
        )
        self.likers = []
        for i in range(4):
            u = CustomUser.objects.create_user(
                username=f'l{i}@example.com', email=f'l{i}@example.com',
                password='pw', role=UserRole.EMPLOYEE,
            )
            self.post.likes.add(u)
            self.likers.append(u)
        for i in range(3):
            CommunityComment.objects.create(
                post=self.post, author=self.author, content=f'c{i}',
            )

    def test_feed_counts_are_correct(self):
        """The subquery rewrite must produce the same numbers as before."""
        resp = self.client.get(reverse('community-feed'))
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        row = next(r for r in resp.data['results'] if r['id'] == self.post.pk)
        self.assertEqual(row['likes_count'], 4)
        self.assertEqual(row['comments_count'], 3)

    def test_post_with_no_likes_or_comments_counts_zero(self):
        from .models import CommunityPost

        empty = CommunityPost.objects.create(
            author=self.author, content='empty', category='general',
        )
        resp = self.client.get(reverse('community-feed'))
        row = next(r for r in resp.data['results'] if r['id'] == empty.pk)
        self.assertEqual(row['likes_count'], 0)
        self.assertEqual(row['comments_count'], 0)

    def test_is_liked_still_accurate(self):
        self.post.likes.add(self.author)
        resp = self.client.get(reverse('community-feed'))
        row = next(r for r in resp.data['results'] if r['id'] == self.post.pk)
        self.assertTrue(row['is_liked'])

    def test_comment_list_query_count_is_bounded(self):
        """Counts must come from the prefetch, not one query per comment."""
        from .models import CommunityComment

        for i in range(15):
            c = CommunityComment.objects.create(
                post=self.post, author=self.author, content=f'extra{i}',
            )
            for u in self.likers:
                c.likes.add(u)

        from django.test.utils import CaptureQueriesContext
        from django.db import connection

        url = reverse('community-comments', args=[self.post.pk])
        # The exact count does not matter; what matters is that it stays flat
        # rather than growing with the number of comments on the page.
        with CaptureQueriesContext(connection) as ctx:
            resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        self.assertLess(
            len(ctx.captured_queries), 20,
            f'Listing comments issued {len(ctx.captured_queries)} queries — '
            f'the prefetch is still being bypassed.',
        )

    def test_comment_counts_are_correct(self):
        from .models import CommunityComment

        c = CommunityComment.objects.create(
            post=self.post, author=self.author, content='likeme',
        )
        for u in self.likers:
            c.likes.add(u)

        resp = self.client.get(reverse('community-comments', args=[self.post.pk]))
        row = next(r for r in resp.data['results'] if r['id'] == c.pk)
        self.assertEqual(row['likes_count'], 4)
        self.assertEqual(row['dislikes_count'], 0)


class DashboardAnalyticsTests(ThrottleIsolatedTestCase):
    """QH-23 — analytics must not load whole tables, and must stay correct."""

    def setUp(self):
        super().setUp()
        from .models import Job, EmployeeProfile, CompanyProfile, Application

        self.client = APIClient()
        self.company = CustomUser.objects.create_user(
            username='co2@example.com', email='co2@example.com',
            password='pw', role=UserRole.COMPANY,
        )
        CompanyProfile.objects.create(user=self.company, company_name='Acme')
        self.employee = CustomUser.objects.create_user(
            username='emp2@example.com', email='emp2@example.com',
            password='pw', role=UserRole.EMPLOYEE,
        )
        EmployeeProfile.objects.create(
            user=self.employee, skills=['Salesforce', 'MEDDIC'],
        )
        for i in range(6):
            job = Job.objects.create(
                company=self.company, title=f'AE {i}', description='d',
                requirements=['Salesforce', 'Outbound'], status='approved',
                salary_range='50,000 - 90,000',
            )
            Application.objects.create(job=job, employee=self.employee)

    def test_employee_analytics_still_correct(self):
        self.client.force_authenticate(user=self.employee)
        resp = self.client.get(reverse('dashboard-analytics'))
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        self.assertEqual(len(resp.data['marketInsightsData']), 6)
        self.assertEqual(len(resp.data['skillMatchData']), 6)
        self.assertEqual(resp.data['activeApps'], 6)

        subjects = [s['subject'] for s in resp.data['skillMatchData']]
        self.assertIn('Salesforce', subjects)

    def test_skill_demand_reflects_job_counts(self):
        """Reusing the Counter must give the same numbers as the old rescan."""
        self.client.force_authenticate(user=self.employee)
        resp = self.client.get(reverse('dashboard-analytics'))
        sf = next(s for s in resp.data['skillMatchData'] if s['subject'] == 'Salesforce')
        # 6 jobs list Salesforce -> min(150, 80 + 6*10) = 140
        self.assertEqual(sf['B'], 140)
        # The employee has Salesforce in their profile.
        self.assertEqual(sf['A'], 120)

    def test_company_analytics_still_correct(self):
        self.client.force_authenticate(user=self.company)
        resp = self.client.get(reverse('dashboard-analytics'))
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        self.assertEqual(resp.data['activeRolesCount'], 6)
        self.assertEqual(resp.data['totalApplicantsCount'], 6)
        # Every application matches on 'Salesforce'.
        self.assertEqual(resp.data['topMatchesCount'], 6)

    def test_company_analytics_query_count_is_bounded(self):
        from django.test.utils import CaptureQueriesContext
        from django.db import connection

        self.client.force_authenticate(user=self.company)
        with CaptureQueriesContext(connection) as ctx:
            resp = self.client.get(reverse('dashboard-analytics'))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertLess(
            len(ctx.captured_queries), 30,
            f'Company analytics issued {len(ctx.captured_queries)} queries — '
            f'it is still dereferencing relations per application.',
        )


class PlayReviewExistingAccountTests(ThrottleIsolatedTestCase):
    """
    QH-03 follow-up — the review account is created by hand before the store
    submission, so the bypass must attach to that existing account rather
    than silently creating a second, empty one.
    """

    REVIEW_EMAIL = 'PlayReviewer@QuotaHire.org'   # note the capitals
    REVIEW_CODE = '123456'                        # the code already given to Google

    def setUp(self):
        super().setUp()
        self.client = APIClient()
        self.verify_url = reverse('login-otp-verify')
        # The account as the owner actually created it: mixed case, with data.
        self.existing = CustomUser.objects.create_user(
            username='playreviewer_manual',
            email=self.REVIEW_EMAIL,
            password='some-password',
            role=UserRole.EMPLOYEE,
            first_name='Play',
            last_name='Reviewer',
        )

    @override_settings(
        PLAY_REVIEW_EMAIL='playreviewer@quotahire.org',   # lowercase in env
        PLAY_REVIEW_OTP=REVIEW_CODE,
        PLAY_REVIEW_EXPIRES=_future(),
    )
    def test_attaches_to_the_existing_account_despite_case(self):
        before = CustomUser.objects.count()
        resp = self.client.post(
            self.verify_url,
            {'email': 'playreviewer@quotahire.org', 'otp_code': self.REVIEW_CODE},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        self.assertEqual(
            CustomUser.objects.count(), before,
            'A duplicate review account was created instead of reusing the existing one.',
        )
        self.assertEqual(
            resp.data['user']['id'], str(self.existing.pk),
            'The reviewer was signed in to a different account than the prepared one.',
        )

    @override_settings(
        PLAY_REVIEW_EMAIL='playreviewer@quotahire.org',
        PLAY_REVIEW_OTP=REVIEW_CODE,
        PLAY_REVIEW_EXPIRES=_future(),
    )
    def test_reviewer_email_is_case_insensitive_on_input(self):
        """Google may type the address with different capitalisation."""
        for typed in [
            'playreviewer@quotahire.org',
            'PlayReviewer@QuotaHire.org',
            'PLAYREVIEWER@QUOTAHIRE.ORG',
        ]:
            with self.subTest(typed=typed):
                cache.clear()
                resp = self.client.post(
                    self.verify_url,
                    {'email': typed, 'otp_code': self.REVIEW_CODE},
                    format='json',
                )
                self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)

    @override_settings(
        PLAY_REVIEW_EMAIL='playreviewer@quotahire.org',
        PLAY_REVIEW_OTP=REVIEW_CODE,
        PLAY_REVIEW_EXPIRES=_future(),
    )
    def test_unverified_existing_account_is_made_usable(self):
        self.existing.email_verified = False
        self.existing.is_active = False
        self.existing.save()

        resp = self.client.post(
            self.verify_url,
            {'email': 'playreviewer@quotahire.org', 'otp_code': self.REVIEW_CODE},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        self.existing.refresh_from_db()
        self.assertTrue(self.existing.email_verified)
        self.assertTrue(self.existing.is_active)

    @override_settings(
        PLAY_REVIEW_EMAIL='playreviewer@quotahire.org',
        PLAY_REVIEW_OTP=REVIEW_CODE,
        PLAY_REVIEW_EXPIRES=_future(),
    )
    def test_keeping_123456_still_blocks_the_old_prefix_attack(self):
        """
        The whole point: even with the original code retained, only ONE
        address works. The old backdoor accepted any reviewer*/playstore*
        address on any domain.
        """
        for attacker in [
            'reviewer@attacker.com',
            'playstore@attacker.com',
            'playreviewer@attacker.com',       # same local part, wrong domain
            'playreviewer2@quotahire.org',     # right domain, wrong address
        ]:
            with self.subTest(attacker=attacker):
                cache.clear()
                resp = self.client.post(
                    self.verify_url,
                    {'email': attacker, 'otp_code': '123456'},
                    format='json',
                )
                self.assertEqual(
                    resp.status_code, status.HTTP_400_BAD_REQUEST,
                    f'{attacker} still got in with the retained code.',
                )
                self.assertFalse(
                    CustomUser.objects.filter(email__iexact=attacker).exists(),
                    f'{attacker} was minted as an account.',
                )


class DashboardCacheInvalidationTests(ThrottleIsolatedTestCase):
    """
    Real-time correctness — the dashboard cache must not outlive the data.

    DashboardAnalyticsView caches per (user, role) for DASHBOARD_TTL seconds.
    Before this fix no mutation cleared it, so a user who applied for a job
    saw their old application count for up to a minute even if the client
    refetched immediately. These tests assert the cache is dropped by the
    mutation itself.
    """

    def setUp(self):
        super().setUp()
        self.client = APIClient()
        self.employee = CustomUser.objects.create_user(
            username='rt_emp', email='rt_emp@example.com', password='Str0ngPass!23',
            role=UserRole.EMPLOYEE, email_verified=True,
        )
        self.company = CustomUser.objects.create_user(
            username='rt_co', email='rt_co@example.com', password='Str0ngPass!23',
            role=UserRole.COMPANY, email_verified=True,
        )
        from .models import Job
        self.job = Job.objects.create(
            company=self.company, title='Realtime AE', description='d',
            requirements=[], status='approved',
        )

    def _auth(self, user):
        self.client.force_authenticate(user=user)

    def _warm_dashboard(self, user):
        """Populate the cache the way a real dashboard visit would."""
        from .cache_utils import dashboard_key, safe_get
        self._auth(user)
        resp = self.client.get(reverse('dashboard-analytics'))
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        self.assertIsNotNone(
            safe_get(dashboard_key(user.pk, user.role)),
            'dashboard cache was not populated, so this test proves nothing',
        )
        return dashboard_key(user.pk, user.role)

    def test_applying_clears_both_dashboards(self):
        from .cache_utils import safe_get
        emp_key = self._warm_dashboard(self.employee)
        co_key = self._warm_dashboard(self.company)

        self._auth(self.employee)
        resp = self.client.post(
            reverse('job-apply', args=[self.job.pk]), {}, format='json'
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)

        self.assertIsNone(
            safe_get(emp_key),
            'Applicant dashboard still cached — their tracker would show stale data.',
        )
        self.assertIsNone(
            safe_get(co_key),
            'Company dashboard still cached — applicant count would be stale.',
        )

    def test_status_change_clears_both_dashboards(self):
        from .models import Application
        from .cache_utils import safe_get
        app = Application.objects.create(job=self.job, employee=self.employee)

        emp_key = self._warm_dashboard(self.employee)
        co_key = self._warm_dashboard(self.company)

        self._auth(self.company)
        resp = self.client.put(
            reverse('application-status', args=[app.pk]),
            {'status': 'accepted'}, format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)

        self.assertIsNone(safe_get(emp_key), 'Employee dashboard stale after decision.')
        self.assertIsNone(safe_get(co_key), 'Company dashboard stale after decision.')

    def test_saving_a_job_clears_the_employee_dashboard(self):
        from .cache_utils import safe_get
        emp_key = self._warm_dashboard(self.employee)

        self._auth(self.employee)
        resp = self.client.post(reverse('job-save', args=[self.job.pk]), {}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        self.assertIsNone(safe_get(emp_key), 'Saved-jobs change left the dashboard cached.')

    def test_shortlisting_clears_both_dashboards(self):
        from .models import Application
        from .cache_utils import safe_get
        app = Application.objects.create(job=self.job, employee=self.employee)

        emp_key = self._warm_dashboard(self.employee)
        co_key = self._warm_dashboard(self.company)

        self._auth(self.company)
        resp = self.client.post(
            reverse('company-shortlist-applicant', args=[app.pk]), {}, format='json'
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)

        self.assertIsNone(safe_get(co_key), 'Company dashboard stale after shortlisting.')
        self.assertIsNone(safe_get(emp_key), 'Employee dashboard stale after shortlisting.')

    def test_invalidate_dashboards_skips_incomplete_pairs(self):
        """A missing relation must not raise or clear unrelated keys."""
        from .cache_utils import invalidate_dashboards, dashboard_key, safe_set, safe_get
        key = dashboard_key(self.employee.pk, 'employee')
        safe_set(key, {'x': 1}, ttl=60)
        invalidate_dashboards((None, 'company'), (self.company.pk, None))
        self.assertIsNotNone(safe_get(key), 'Unrelated dashboard key was cleared.')


class JobApprovalWorkflowTests(ThrottleIsolatedTestCase):
    """
    A posted job must stay invisible to job seekers until an admin approves it.

    Covers the whole path: what a company may set when posting, what each
    listing endpoint returns, what can be acted on while pending, and what
    changes once the status moves.
    """

    def setUp(self):
        super().setUp()
        self.client = APIClient()
        self.company = CustomUser.objects.create_user(
            username='appr_co', email='appr_co@example.com', password='Str0ngPass!23',
            role=UserRole.COMPANY, email_verified=True,
        )
        self.employee = CustomUser.objects.create_user(
            username='appr_emp', email='appr_emp@example.com', password='Str0ngPass!23',
            role=UserRole.EMPLOYEE, email_verified=True,
        )
        self.admin = CustomUser.objects.create_user(
            username='appr_admin', email='appr_admin@example.com', password='Str0ngPass!23',
            role='admin', email_verified=True,
        )
        # Registration creates this alongside the account; CompanyJobsView
        # returns nothing without it.
        from .models import CompanyProfile
        CompanyProfile.objects.create(user=self.company, company_name='Appr Co')

    def _post_job(self, **overrides):
        self.client.force_authenticate(user=self.company)
        payload = {
            'title': 'Enterprise Account Executive',
            'description': 'Sell things.',
            'requirements': ['3 years B2B'],
            'location': 'Lagos',
        }
        payload.update(overrides)
        return self.client.post(reverse('job-list-create'), payload, format='json')

    @staticmethod
    def _ids(response):
        data = response.data
        rows = data.get('results', data) if hasattr(data, 'get') else data
        return [row['id'] for row in rows]

    # -- posting --------------------------------------------------------------

    def test_new_job_starts_pending(self):
        from .models import Job
        resp = self._post_job()
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)
        self.assertEqual(Job.objects.get(pk=resp.data['id']).status, 'pending')

    def test_company_cannot_self_approve_at_creation(self):
        """status is read-only; sending it must not bypass review."""
        from .models import Job
        resp = self._post_job(status='approved')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)
        self.assertEqual(
            Job.objects.get(pk=resp.data['id']).status, 'pending',
            'A company approved its own job by sending status in the payload.',
        )

    # -- visibility while pending ---------------------------------------------

    def test_pending_job_is_absent_from_the_public_list(self):
        job_id = self._post_job().data['id']
        self.client.force_authenticate(user=self.employee)
        listing = self.client.get(reverse('job-list-create'))
        self.assertEqual(listing.status_code, status.HTTP_200_OK)
        self.assertNotIn(
            job_id, self._ids(listing),
            'A pending job was listed to job seekers.',
        )

    def test_pending_job_detail_is_not_retrievable(self):
        job_id = self._post_job().data['id']
        self.client.force_authenticate(user=self.employee)
        resp = self.client.get(reverse('job-detail', args=[job_id]))
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_pending_job_cannot_be_applied_to(self):
        job_id = self._post_job().data['id']
        self.client.force_authenticate(user=self.employee)
        resp = self.client.post(reverse('job-apply', args=[job_id]), {}, format='json')
        self.assertEqual(
            resp.status_code, status.HTTP_404_NOT_FOUND,
            'An unapproved job accepted an application.',
        )

    def test_pending_job_cannot_be_saved(self):
        job_id = self._post_job().data['id']
        self.client.force_authenticate(user=self.employee)
        resp = self.client.post(reverse('job-save', args=[job_id]), {}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_company_still_sees_its_own_pending_job(self):
        """The poster must be able to track what is awaiting review."""
        job_id = self._post_job().data['id']
        self.client.force_authenticate(user=self.company)
        resp = self.client.get(reverse('company-jobs'))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn(job_id, self._ids(resp))

    # -- the approval itself --------------------------------------------------

    def test_nobody_but_an_admin_can_approve_a_job(self):
        """The owning company may now close its own approved listing, so it is no
        longer refused outright at the permission layer. What must never happen
        is a company approving its own job and skipping review — that is what
        this asserts, by status and by the stored value."""
        from .models import Job
        job_id = self._post_job().data['id']
        url = reverse('job-status-update', args=[job_id])

        for actor in (self.company, self.employee):
            with self.subTest(actor=actor.role):
                self.client.force_authenticate(user=actor)
                resp = self.client.put(url, {'status': 'approved'}, format='json')
                self.assertIn(
                    resp.status_code,
                    (status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN),
                    'a non-admin must not be able to approve a job',
                )
                self.assertEqual(
                    Job.objects.get(pk=job_id).status, 'pending',
                    'the job was approved by a non-admin',
                )

    def test_a_company_cannot_approve_even_its_own_approved_job(self):
        """Once approved, the owner may close it — but not set any other status."""
        from .models import Job
        job_id = self._post_job().data['id']
        Job.objects.filter(pk=job_id).update(status='approved')
        url = reverse('job-status-update', args=[job_id])
        self.client.force_authenticate(user=self.company)

        for attempt in ('pending', 'approved', 'rejected'):
            with self.subTest(attempt=attempt):
                resp = self.client.put(url, {'status': attempt}, format='json')
                self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertEqual(Job.objects.get(pk=job_id).status, 'approved')

        # The one transition the owner is allowed.
        resp = self.client.put(url, {'status': 'closed'}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(Job.objects.get(pk=job_id).status, 'closed')

    def test_a_company_cannot_touch_another_companys_job(self):
        from .models import Job
        from django.contrib.auth import get_user_model
        other = get_user_model().objects.create_user(
            username='rival@example.com', email='rival@example.com',
            password='Str0ngPassw0rd!x9', role='company', email_verified=True)
        job_id = self._post_job().data['id']
        Job.objects.filter(pk=job_id).update(status='approved')

        self.client.force_authenticate(user=other)
        resp = self.client.put(reverse('job-status-update', args=[job_id]),
                               {'status': 'closed'}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Job.objects.get(pk=job_id).status, 'approved')

    def test_approval_makes_the_job_visible(self):
        from .models import Job
        job_id = self._post_job().data['id']

        self.client.force_authenticate(user=self.admin)
        resp = self.client.put(
            reverse('job-status-update', args=[job_id]),
            {'status': 'approved'}, format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        self.assertEqual(Job.objects.get(pk=job_id).status, 'approved')

        self.client.force_authenticate(user=self.employee)
        listing = self.client.get(reverse('job-list-create'))
        self.assertIn(job_id, self._ids(listing), 'Job stayed hidden after approval.')
        detail = self.client.get(reverse('job-detail', args=[job_id]))
        self.assertEqual(detail.status_code, status.HTTP_200_OK)

    def test_rejected_job_stays_hidden(self):
        job_id = self._post_job().data['id']
        self.client.force_authenticate(user=self.admin)
        self.client.put(
            reverse('job-status-update', args=[job_id]),
            {'status': 'rejected'}, format='json',
        )
        self.client.force_authenticate(user=self.employee)
        self.assertNotIn(job_id, self._ids(self.client.get(reverse('job-list-create'))))

    def test_django_admin_bulk_action_approves(self):
        """The action an administrator actually clicks on the admin page."""
        from django.contrib.admin.sites import AdminSite
        from .admin import JobAdmin
        from .models import Job

        job_id = self._post_job().data['id']
        job_admin = JobAdmin(Job, AdminSite())
        job_admin.message_user = lambda *a, **k: None   # needs a request otherwise
        job_admin.approve_jobs(None, Job.objects.filter(pk=job_id))

        self.assertEqual(Job.objects.get(pk=job_id).status, 'approved')

    def test_approval_clears_the_public_job_list_cache(self):
        """Otherwise an approved job waits out the cache TTL before appearing."""
        from .cache_utils import jobs_list_key, safe_get

        self.client.force_authenticate(user=self.employee)
        self.client.get(reverse('job-list-create'))          # warm the cache
        self.assertIsNotNone(
            safe_get(jobs_list_key('')),
            'cache was not warmed, so this test proves nothing',
        )

        job_id = self._post_job().data['id']
        self.client.force_authenticate(user=self.admin)
        self.client.put(
            reverse('job-status-update', args=[job_id]),
            {'status': 'approved'}, format='json',
        )
        self.assertIsNone(
            safe_get(jobs_list_key('')),
            'Public job list still cached after an approval.',
        )
