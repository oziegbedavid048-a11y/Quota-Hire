import urllib.request, json
r = urllib.request.urlopen('http://localhost:8000/api/jobs/')
data = json.loads(r.read())
jobs = data if isinstance(data, list) else data.get('results', [])
for j in jobs:
    print(f"Job {j['id']} ({j['title']}): salary_range={repr(j['salary_range'])} | commission_range={repr(j['commission_range'])}")
