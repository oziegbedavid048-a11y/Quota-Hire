class APICacheControlMiddleware:
    """
    Middleware to inject Cache-Control headers on successful GET requests for infrequently changed resources.
    - GET /api/jobs/ -> Cache for 5 minutes
    - GET /api/company/<slug>/ -> Cache for 10 minutes
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Only inject cache control on GET requests that returned 200 OK
        if request.method == 'GET' and response.status_code == 200:
            path = request.path
            
            # /api/jobs/ - cache for 5 minutes (300 seconds)
            if path.startswith('/api/jobs/') and len(path) <= 12: # matches '/api/jobs/' or with query params
                response['Cache-Control'] = 'public, max-age=300, stale-while-revalidate=60'
            
            # /api/company/<slug>/ - cache for 10 minutes (600 seconds)
            # Avoid caching company dashboard jobs/applicants endpoints
            elif path.startswith('/api/company/') and not path.endswith('/jobs/') and not '/applicants/' in path:
                response['Cache-Control'] = 'public, max-age=600, stale-while-revalidate=120'
                
        return response
