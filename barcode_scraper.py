#!/usr/bin/env python

"""
Not actually part of the canonical idol threat build process, since it often
requires a CAPTCHA, but here's a scraper to get all the Jack Ryan: Shadow
Recruit barcodes, which you can manually add to barcodes.txt if you like.

I tried implementing this with requests, and then with PhantomJS, but Incapsula
are pretty good at thwarting that (which seems fair, given that this is a
website with a paid-for API), so we have to use a real browser.
"""

from typing import Set

from selenium.webdriver import Chrome


def parse_barcode_url(url: str) -> str:
    return [f for f in url.split('/') if f][-1]


def get_barcodes(query: str) -> Set[str]:
    browser = Chrome()
    browser.implicitly_wait(60)  # so we can do the captcha if necessary
    browser.get(
        'https://www.barcodelookup.com/{}'.format(query),
    )
    barcodes = set()

    while True:
        browser.find_element_by_css_selector('.jumbotron')
        browser.implicitly_wait(3)  # captcha won't happen again
        for link in browser.find_elements_by_css_selector(
            '.term-result-item a'
        ):
            barcodes.add(parse_barcode_url(link.get_attribute('href')))
        nbs = browser.find_elements_by_css_selector('.pagination [rel="next"]')
        if not nbs:
            break
        nb, = nbs
        nb.click()

    return barcodes


if __name__ == '__main__':
    print('\n'.join(sorted(get_barcodes('jack-ryan-shadow-recruit'))))
