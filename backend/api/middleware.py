import re


class APICacheControlMiddleware:
    """
    Inject Cache-Control headers on successful GET requests.

    SECURITY (QH-08): the previous rule was an exclusion list — anything under
    /api/company/ that did not end in '/jobs/' or contain '/applicants/' was
    marked `public, max-age=600`. That swept in two private routes:

        /api/company/applications/<pk>/          applicant name, email, phone
        /api/company/applications/<pk>/resume/   the raw resume PDF

    `public` is an explicit invitation to any shared cache — a CDN, a
    corporate proxy, the platform edge — to store the response and hand it to
    a different requester, and there was no Vary: Authorization to soften it.

    The rule is now an allowlist: exactly one public shape is cacheable, and
    everything else is marked private and no-store. New endpoints therefore
    default to safe instead of exposed.
    """

    # Only the public company profile: /api/company/<lookup>/ — one segment,
    # and never the /applications/... or /jobs/ sub-routes.
    PUBLIC_COMPANY_PROFILE = re.compile(r'^/api/company/[^/]+/$')

    # The public job list and single approved jobs.
    PUBLIC_JOBS = re.compile(r'^/api/jobs/(\d+/)?$')

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        if request.method != 'GET' or response.status_code != 200:
            return response

        path = request.path

        if self.PUBLIC_JOBS.match(path):
            response['Cache-Control'] = 'public, max-age=300, stale-while-revalidate=60'
            response['Vary'] = 'Accept-Encoding'
        elif self.PUBLIC_COMPANY_PROFILE.match(path):
            response['Cache-Control'] = 'public, max-age=600, stale-while-revalidate=120'
            response['Vary'] = 'Accept-Encoding'
        elif path.startswith('/api/'):
            # Everything else is per-user data. Never let a shared cache keep it.
            response['Cache-Control'] = 'private, no-store'

        return response
