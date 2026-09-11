class APICacheControlMiddleware:
    """
    Inject Cache-Control headers on successful GET requests.

    SECURITY (QH-08): the original rule was an exclusion list — anything under
    /api/company/ that did not end in '/jobs/' or contain '/applicants/' was
    marked `public, max-age=600`. That swept in two private routes:

        /api/company/applications/<pk>/          applicant name, email, phone
        /api/company/applications/<pk>/resume/   the raw resume PDF

    `public` is an explicit invitation to any shared cache — a CDN, a corporate
    proxy, the platform edge — to store the response and hand it to a different
    requester, and there was no Vary: Authorization to soften it.

    SECURITY (QH-35): the allowlist that replaced it matched paths by regex:

        PUBLIC_COMPANY_PROFILE = re.compile(r'^/api/company/[^/]+/$')

    `[^/]+` matches any single segment, including the literal `jobs`. So
    /api/company/jobs/ — CompanyJobsView, the authenticated company's own
    postings in every status, drafts and rejections included — was served
    `public, max-age=600` to any shared cache, with only Vary: Accept-Encoding.
    The docstring claimed that route was excluded; the pattern did not exclude
    it. The QH-08 bug had reappeared inside the QH-08 fix.

    Paths are no longer matched at all. The rule now keys off the resolved view
    name, which Django has already determined by the time this middleware sees
    the response. A route is cacheable only if it is named here, so a new
    endpoint cannot become publicly cacheable by accident — whatever its URL
    happens to look like. Every public response also carries
    `Vary: Authorization`, so even if one were to vary by caller, a shared cache
    could not serve one user's copy to another.
    """

    # Resolved URL name -> (max-age seconds, stale-while-revalidate seconds).
    # Only genuinely public, identical-for-everyone responses belong here.
    PUBLIC_CACHEABLE_VIEWS = {
        'job-list-create':        (300, 60),    # GET /api/jobs/ — approved jobs only
        'job-detail':             (300, 60),    # GET /api/jobs/<pk>/ — one approved job
        'company-public-profile': (600, 120),   # GET /api/company/<lookup>/ — public profile
    }

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        if request.method != 'GET' or response.status_code != 200:
            return response

        if not request.path.startswith('/api/'):
            return response

        match = getattr(request, 'resolver_match', None)
        url_name = getattr(match, 'url_name', None)
        cache_rule = self.PUBLIC_CACHEABLE_VIEWS.get(url_name) if url_name else None

        # A safety net as well as a rule: job-list-create also serves POST, and
        # only its GET is public. The method check above already covers that,
        # but the name check keeps the intent obvious at the call site.
        if cache_rule is not None:
            max_age, swr = cache_rule
            response['Cache-Control'] = f'public, max-age={max_age}, stale-while-revalidate={swr}'
            # Authorization is included so a shared cache keys anonymous and
            # authenticated responses separately. Without it, `public` lets a
            # proxy hand one caller's copy to the next.
            response['Vary'] = 'Accept-Encoding, Authorization'
        else:
            # Everything else is per-user data. Never let a shared cache keep it.
            response['Cache-Control'] = 'private, no-store'

        return response
