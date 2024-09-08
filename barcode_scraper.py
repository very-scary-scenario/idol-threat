#!/usr/bin/env python

"""
Not actually part of the canonical idol threat build process, since it often
requires a CAPTCHA, but here's a scraper to get all the Jack Ryan: Shadow
Recruit barcodes, which you can manually add to barcodes.txt if you like.

I tried implementing this with requests, and then with PhantomJS, but Incapsula
are pretty good at thwarting that (which seems fair, given that this is a
website with a paid-for API), so we have to use a real browser.
"""

from typing import Optional, Set, TypeVar

from selenium.webdriver import Firefox as Browser
from selenium.webdriver.common.by import By


T = TypeVar('T')


def not_none(val: Optional[T]) -> T:
    assert val is not None
    return val


def parse_barcode_url(url: str) -> str:
    return [f for f in url.split('/') if f][-1]


def await_captcha(browser: Browser) -> None:
    browser.implicitly_wait(60)  # so we can do the captcha if necessary
    browser.find_element(By.CSS_SELECTOR, '.short-banner')
    browser.implicitly_wait(3)  # captcha won't happen again


def get_barcodes(query: str) -> Set[str]:
    browser = Browser()
    browser.get(
        'https://www.barcodelookup.com/{}'.format(query),
    )
    barcodes = set()

    while True:
        await_captcha(browser)
        for link in browser.find_elements(
            By.CSS_SELECTOR, '#product-search-results > a[href]'
        ):
            barcodes.add(parse_barcode_url(not_none(link.get_attribute('href'))))
        nbs = browser.find_elements(By.CSS_SELECTOR, '.pagination li.active + li a')
        if not nbs:
            break
        nb, = nbs
        browser.get(not_none(nb.get_attribute('href')))

    browser.quit()

    return barcodes


if __name__ == '__main__':
    print('\n'.join(sorted(get_barcodes('jack-ryan-shadow-recruit'))))
