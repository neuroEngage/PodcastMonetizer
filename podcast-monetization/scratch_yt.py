import urllib.request, re
html = urllib.request.urlopen('https://www.youtube.com/results?search_query=data+engineering+podcast').read().decode('utf-8')
match = re.search(r'"videoId":"(.*?)"', html)
if match:
    print('https://www.youtube.com/watch?v=' + match.group(1))
else:
    print('Not found')
