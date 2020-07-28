import requests
import json
import re
from rake_nltk import Rake


KEYWORDS = open('keywords.txt').read()


def find_phrase_in_news_keywords(search_string):
    # Create a raw string with word boundaries from search_string
    raw_search_string = r"\b" + search_string + r"\b"

    match_output = re.search(
        raw_search_string, KEYWORDS,
        flags=re.IGNORECASE
    )
    return match_output is not None


def get_keywords(page=None):

    URL = 'http://content.guardianapis.com/tags?api-key=test&page-size=1000&page={page}&type=keyword'
    page = int(page or 1)
    print(f'getting page:{page}')
    data = requests.get(URL.format(page=page)).json()
    with open('keywords.txt', 'a') as keyword_file:
        keyword_file.writelines([f"{r['webTitle']}\n" for r in data['response']['results']])
        print(f"wrote {len(data['response']['results'])}")

    if int(data['response']['pages']) > page:
        get_guardian_keywords(page + 1)


def get_searchable_phrases(sentence):

    # get key phrases from NLTK
    r = Rake()
    r.extract_keywords_from_text(sentence)
    phrases = [p[1] for p in r.get_ranked_phrases_with_scores() if p[0] > 1]
    for phrase in phrases:
        # if we we find the word or phrase in the list of 23000 news keywords
        if find_phrase_in_news_keywords(phrase):
            yield phrase


def get_news(query, limit=None):
    limit = limit or 1
    URL = 'http://content.guardianapis.com/search?q={query}&api-key=test&page-size={limit}'
    try:
        result = requests.get(URL.format(query=query, limit=limit)).json()['response']['results'][0]
        return {'title': result['webTitle'], 'url': result['webUrl']}
    except:
        return None


def populate_data():
    output = []
    data = json.loads(open('videodata.json').read())

    cache = {}

    for video in data:
        print (video['videoId'], video['title'])
        for sentence in video['sentenceWise'][0]['sentences']:
            for p in get_searchable_phrases(sentence['text']):
                news = cache.get(p) or get_news(p)
                if news:
                    cache[p] = news
                    print(f'\t found news for keyword: {p}')
                    if not sentence.get('news'):
                        sentence['news'] = {}
                    sentence['news'][p] = news
                    sentence['text'] = sentence['text'].replace(p, f'<strong>{p}</strong>')
        output.append(video)

    with open('videodata_out.json', 'w') as outfile:
        outfile.write(json.dumps(output))



