#! /usr/bin/env python

import os, sys, re, mimetypes
from unicodedata import normalize

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMAGE_BASE = os.path.join(BASE_DIR, 'static', 'img')

def exit_with_error(error, exit_code = os.EX_TEMPFAIL):
    sys.stderr.write(error)
    sys.stderr.flush()
    sys.exit(exit_code)

# http://flask.pocoo.org/snippets/5/
_punct_re = re.compile(r'[\t !"#$%&\'()*\-/<=>?@\[\\\]^_`{|},.]+')

def slugify(text, delim=u'-'):
    """Generates an slightly worse ASCII-only slug."""
    text = u'%s' % text
    result = []
    for word in _punct_re.split(text.lower()):
        word = normalize('NFKD', word).encode('ascii', 'ignore')
        if word:
            result.append(word)
    return unicode(delim.join(result))

try:
    import requests
except ImportError:
    exit_with_error('Please install python requests. `pip install requests`', os.EX_SOFTWARE)

try:
    from lxml import html
except ImportError:
    exit_with_error('Please install lxml. `pip install lxml', os.EX_SOFTWARE)

EXTENSIONS  =   {
    'image/gif':    '.gif',
    'image/jpg':    '.jpg',
    'image/jpeg':   '.jpg',
    'image/png':    '.png',
}

def get_ext(url):
    mimetype = mimetypes.guess_type(url)[0]
    if mimetype in EXTENSIONS:
        return EXTENSIONS.get(mimetype)
    return os.path.splitext(url)[1]

def download_image(url, filename):
    directory = os.path.dirname(filename)
    if not os.path.exists(directory):
        os.makedirs(directory)
    response = requests.get(url, stream = True)
    with open(filename, 'wb') as f:
        for chunk in response.iter_content(chunk_size = 1024):
            if chunk:
                f.write(chunk)
                f.flush()
        f.close()
    return filename.replace(IMAGE_BASE, '').lstrip('/')

def url_to_html(url, post_params = {}):
    if post_params:
        page = requests.post(url, data = post_params)
    else:
        page = requests.get(url)
    assert page.status_code >= 200 and page.status_code < 300, '%s got status code %d' % (url, page.status_code)
    page = html.fromstring(page.text)
    page.make_links_absolute(url)
    return page

def city_council():
    page = url_to_html('http://www.chattanooga.gov/city-council/council-members')
    for link in page.xpath('//div[@id="above-content"]//ul[contains(@class, "nav")]//a'):
        council_person = link.text_content().strip().split(', ')[0].split(' ')
        council_person = ' '.join([council_person[0], council_person[-1]])
        cp_page = url_to_html(link.get('href'))
        person_image = None
        for image in cp_page.xpath('//div[@id="content"]//img'):
            if image.get('src', '').lower().find(council_person.split(' ')[-1].lower()) > -1:
                person_image = image.get('src')
                break
        if person_image:
            print '%s downloaded' % download_image(person_image, os.path.join(IMAGE_BASE, 'chattanooga', 'council', ''.join([slugify(council_person), get_ext(person_image)])))

def city_mayor():
    page = url_to_html('http://www.chattanooga.gov/mayors-office')
    mayor_image = None
    for image in page.xpath('//div[@id="content"]//img'):
        if image.get('src', '').lower().find('mayor') > -1:
            mayor_image = image.get('src')
            break
    if mayor_image:
        print '%s downloaded' % download_image(mayor_image, os.path.join(IMAGE_BASE, 'chattanooga', 'mayor', ''.join(['andy-berke', get_ext(mayor_image)])))

def county_commission():
    page = url_to_html('http://www.hamiltontn.gov/commission/')
    for link in page.xpath('//div[@id="text"]//a[text()[contains(., "District")]]'):
        cm_page = url_to_html(link.get('href'))
        commission_person = None
        for strong in cm_page.xpath('//div[@id="text"]//table//tr[1]//td//strong[1]'):
            commission_person = strong.text_content().strip().split('\n')[0].strip()
            break
        if commission_person:
            commission_person = commission_person.split(' ')
            commission_person = ' '.join([commission_person[0], commission_person[-1]])

            cm_image = None
            for image in cm_page.xpath('//div[@id="left_menu"]//img'):
                if image.get('src', '').lower().find(commission_person.split(' ')[-1].lower()) > -1:
                    cm_image = image.get('src')
                    break
            if cm_image:
                print '%s downloaded' % download_image(cm_image, os.path.join(IMAGE_BASE, 'hamilton-county', 'commission', ''.join([slugify(commission_person), get_ext(cm_image)])))

def county_mayor():
    page = url_to_html('http://www.hamiltontn.gov/mayor/')
    mayor = page.xpath('//span[@id="PageNameplaceholder_lblTitle"]')[0].text_content().split(' - ')[-1].split(' ')
    mayor = ' '.join([mayor[0], mayor[-1]])
    mayor_image = None
    for image in page.xpath('//div[@id="left_menu"]//img'):
        if image.get('src', '').lower().find(mayor.split(' ')[-1].lower()) > -1:
            mayor_image = image.get('src')
            break
    if mayor_image:
        print '%s downloaded' % download_image(mayor_image, os.path.join(IMAGE_BASE, 'hamilton-county', 'mayor', ''.join([slugify(mayor), get_ext(mayor_image)])))

def county_services():
    page =  url_to_html('http://www.hamiltontn.gov/GovDirectory.aspx', post_params = {
                '__EVENTTARGET': 'ctl00$MainContent$GovDirectory1$lnkViewAll',
                '__EVENTARGUMENT': '',
                '__VIEWSTATE': '/wEPDwUIODUzODY0ODUPZBYCZg9kFgICBA9kFgYCBw9kFgICAQ8PFgIeBFRleHQFJEhhbWlsdG9uIENvdW50eSBHb3Zlcm5tZW50IERpcmVjdG9yeWRkAhUPFCsAAmQQFgAWABYAZAIXD2QWAgIBD2QWAgI5DzwrABECAA8WBB4LXyFEYXRhQm91bmRnHgtfIUl0ZW1Db3VudAIDZAEQFgAWABYAFgJmD2QWCAIBD2QWAmYPZBYCZg8VDCRodHRwOi8vd3d3LkhhbWlsdG9uVE4uZ292L0FjY291bnRpbmcKQWNjb3VudGluZyA0NTUgTm9ydGggSGlnaGxhbmQgUGFyayBBdmVudWUsIBFNY0RhbmllbCBCdWlsZGluZwtDaGF0dGFub29nYQJUTgUzNzQwNFI8YSBjbGFzcz0nTGluazEnIGhyZWY9Jy9jb21tdW5pdHkvbWFwcy9NY0RhbmllbEJsZGcuYXNweCc+RGlyZWN0aW9ucy9NYXA8L2E+PGJyIC8+DDQyMy0yMDktNjMzMAw0MjMtMjA5LTYzMzFxQ29udGFjdCBVczogIDxhIGhyZWY9J2h0dHA6Ly93d3cuaGFtaWx0b250bi5nb3YvRW1haWxGb3JtLmFzcHgnPmh0dHA6Ly93d3cuaGFtaWx0b250bi5nb3YvRW1haWxGb3JtLmFzcHg8L2E+PGJyLz5iV2ViIFBhZ2U6ICA8YSBocmVmPSdodHRwOi8vd3d3LkhhbWlsdG9uVE4uZ292L0FjY291bnRpbmcnPmh0dHA6Ly93d3cuSGFtaWx0b25UTi5nb3YvQWNjb3VudGluZzwvYT5kAgIPZBYCZg9kFgJmDxUMHmh0dHA6Ly9oYW1pbHRvbi50ZW5uZXNzZWUuZWR1Lx1BZ3JpY3VsdHVyZSBFeHRlbnNpb24gU2VydmljZRU2MTgzIEFkYW1zb24gQ2lyY2xlLCAKQm9ubnkgT2FrcwtDaGF0dGFub29nYQJUTgUzNzQxNk88YSBjbGFzcz0nTGluazEnIGhyZWY9Jy9jb21tdW5pdHkvbWFwcy9Cb25ueU9ha3MuYXNweCc+RGlyZWN0aW9ucy9NYXA8L2E+PGJyIC8+DDQyMy04NTUtNjExMww0MjMtODU1LTYxMTVxQ29udGFjdCBVczogIDxhIGhyZWY9J2h0dHA6Ly93d3cuaGFtaWx0b250bi5nb3YvRW1haWxGb3JtLmFzcHgnPmh0dHA6Ly93d3cuaGFtaWx0b250bi5nb3YvRW1haWxGb3JtLmFzcHg8L2E+PGJyLz5WV2ViIFBhZ2U6ICA8YSBocmVmPSdodHRwOi8vaGFtaWx0b24udGVubmVzc2VlLmVkdS8nPmh0dHA6Ly9oYW1pbHRvbi50ZW5uZXNzZWUuZWR1LzwvYT5kAgMPZBYCZg9kFgJmDxUMImh0dHA6Ly93d3cuSGFtaWx0b25UTi5nb3YvQXNzZXNzb3IUQXNzZXNzb3Igb2YgUHJvcGVydHkaNjEzNSBIZXJpdGFnZSBQYXJrIERyaXZlLCAKQm9ubnkgT2FrcwtDaGF0dGFub29nYQJUTgUzNzQxNk88YSBjbGFzcz0nTGluazEnIGhyZWY9Jy9jb21tdW5pdHkvbWFwcy9Cb25ueU9ha3MuYXNweCc+RGlyZWN0aW9ucy9NYXA8L2E+PGJyIC8+DDQyMy0yMDktNzMwMAw0MjMtMjA5LTczMDFxQ29udGFjdCBVczogIDxhIGhyZWY9J2h0dHA6Ly93d3cuaGFtaWx0b250bi5nb3YvRW1haWxGb3JtLmFzcHgnPmh0dHA6Ly93d3cuaGFtaWx0b250bi5nb3YvRW1haWxGb3JtLmFzcHg8L2E+PGJyLz5eV2ViIFBhZ2U6ICA8YSBocmVmPSdodHRwOi8vd3d3LkhhbWlsdG9uVE4uZ292L0Fzc2Vzc29yJz5odHRwOi8vd3d3LkhhbWlsdG9uVE4uZ292L0Fzc2Vzc29yPC9hPmQCBA8PFgIeB1Zpc2libGVoZGQYAQUtY3RsMDAkTWFpbkNvbnRlbnQkR292RGlyZWN0b3J5MSRndkRlcGFydG1lbnRzDzwrAAwBCAIBZIssu+JpBjsOfPnTgAZD8MLanCCouI42XrKQYKg9TZPI',
                '__EVENTVALIDATION': '/wEWHAK+v7jCBQKyoLblAwKyoPL2DQKyoN6bBQKyoJqtDwKyoIbSBgKyoMJjArKgrogIArKg6pkCArKg1r4JArKgktADArKg/vQKArKguoYFArKgpqsMArKg4rwGArKgzuENArKgio4BArKg9rIIArKgssQCArKgnukJArKg2voDArKgxp8LArKggrEFArKg7tUMArKgqucGArKglowOArKg0p0IAvnq1+UCNwVAXFcybaMxBsUe+lXZKBIC/g8+4ua3e8a1/RwLLaA='
            })
    for link in page.xpath('//div[@id="text"]//a[@class="Link1"]'):
        if link.get('href', '').lower().find('http://www.hamiltontn.gov') == 0 and link.get('href', '').lower().find('/community/maps/') == -1:
            svc_page = url_to_html(link.get('href'))
            name = None
            dept = None
            for span in svc_page.xpath('//div[@id="left_menu"]//span[@id="PageNameplaceholder_lblTitle"]'):
                if len(span.text_content().split(' - ')) > 1:
                    (dept, name) = span.text_content().split(' - ')
                    dept = dept.replace('Hamilton County', '').strip()
                    name = name.strip()
                    break
            if name and dept:
                svc_image = None
                for image in svc_page.xpath('//div[@id="left_menu"]//img'):
                    if image.get('src', '').lower().find(name.split(' ')[-1].lower()) > -1:
                        svc_image = image.get('src')
                        break
                if svc_image:
                    print '%s downloaded' % download_image(svc_image, os.path.join(IMAGE_BASE, 'hamilton-county', slugify(dept), ''.join([slugify(name), get_ext(svc_image)])))


if __name__ == '__main__':
    city_council()
    city_mayor()
    county_commission()
    county_mayor()
    county_services()

    sys.exit(os.EX_OK)
