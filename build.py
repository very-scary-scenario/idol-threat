#!/usr/bin/env python3

from bs4 import BeautifulSoup

import hashlib
import json
import os
import subprocess
from tempfile import mkstemp
from time import sleep
from urllib.parse import urlparse


HERE = os.path.realpath(os.path.dirname(__file__))
ICON_SIZE = 256
IDOL_DIRNAME = 'idols'
IDOLS_DIR = os.path.join(HERE, IDOL_DIRNAME)
THUMBS_DIRNAME = 'idol-thumbs'
THUMBS_DIR = os.path.join(HERE, 'idol-thumbs')
POSES = set()
SKIN_COLOURS = set()
HAIR_COLOURS = set()
LAYERS = []

if not os.path.isdir(THUMBS_DIR):
    os.mkdir(THUMBS_DIR)


def part(
    path, thumb_path, med_path, bodytype, layer, colour, number,
    pose=None,
):
    attrs = {
        'path': path,
        'thumbPath': thumb_path,
        'medPath': med_path,
        'bodytype': bodytype,
        'layer': layer,
        'number': number,
        'pose': pose,
    }

    LAYERS.append(layer)

    if pose is not None:
        POSES.add(pose)
    if layer in ('hd', 'bd'):
        attrs['skinColour'] = colour
        SKIN_COLOURS.add(colour)
    elif layer in ('hbe', 'hb', 'hf', 'hfe', 'ah'):
        attrs['hairColour'] = colour
        HAIR_COLOURS.add(colour)

    return attrs


def build_idols():
    parts = {}

    for d in sorted(
        os.scandir(IDOLS_DIR),
        key=lambda d: d.name,
    ):
        if not d.is_dir():
            continue

        for entry in sorted(
            os.scandir(os.path.join(IDOLS_DIR, d.name)),
            key=lambda de: de.name,
        ):
            fn = entry.name.replace('.png', '')

            basename, ext = os.path.splitext(entry.name)

            thumb_name = '{}-thumb{}'.format(basename, ext)
            med_name = '{}-med{}'.format(basename, ext)

            img_path = os.path.join(IDOLS_DIR, d.name, entry.name)
            thumb_path = os.path.join(THUMBS_DIR, thumb_name)
            med_path = os.path.join(THUMBS_DIR, med_name)

            this_part = part(
                '/'.join([IDOL_DIRNAME, d.name, entry.name]),
                '/'.join([THUMBS_DIRNAME, thumb_name]),
                '/'.join([THUMBS_DIRNAME, med_name]),
                *fn.split('_')
            )
            parts_list = parts.setdefault(this_part['layer'], [])
            parts_list.append(this_part)

            if not os.path.exists(thumb_path):
                subprocess.check_call(
                    ['convert', img_path, '-resize', '400x400^', thumb_path])
                subprocess.check_call(['optipng', thumb_path])

            if not os.path.exists(med_path):
                subprocess.check_call(
                    ['convert', img_path, '-resize', '1000x1000^', med_path])
                subprocess.check_call(['optipng', med_path])

    return parts, sorted(POSES), sorted(SKIN_COLOURS), sorted(HAIR_COLOURS)


def build_bios():
    bios = []

    with open(os.path.join(HERE, 'idol bios.txt')) as f:
        for bio in f.readlines():
            bio = bio.strip()
            if bio:
                bios.append(bio)

    return bios


def build_abilities():
    parts = []

    with open(os.path.join(HERE, 'idol attack names word list.txt')) as f:
        for line in f.readlines():
            line = line.strip()

            if line.startswith('//') or not line:
                continue

            elif line.startswith('#'):
                subparts = []
                parts.append(subparts)
                continue

            bonus = 0
            healing = False

            while line[0] in '+-@':
                char = line[0]

                if char == '+':
                    bonus += 1
                elif char == '-':
                    bonus -= 1
                elif char == '@':
                    healing = True

                line = line[1:]

            parts[-1].append({
                'bonus': bonus,
                'healing': healing,
                'words': line.split('|'),
            })

    return parts


def build_quotes():
    quotes = []

    with open(os.path.join(HERE, 'idol quotes.txt')) as f:
        for line in f.readlines():
            line = line.strip()
            if line:
                quotes.append(line)

    return quotes


def build_animations():
    return sorted([
        f for f in os.listdir(os.path.join(HERE, 'anim'))
        if f.endswith('.png')
    ])


def build_campaign():
    campaign = []
    with open(os.path.join(HERE, 'idol campaign.txt')) as f:
        for line in (l.strip() for l in f.readlines() if l.strip()):
            if line.startswith('# '):
                current_chapter = []
                campaign.append(current_chapter)

            elif line.startswith('## '):
                current_chapter.append({
                    'kind': 'setting',
                    'value': line.lstrip('# '),
                })
            elif line.startswith('> battle'):
                current_chapter.append({
                    'kind': 'battle',
                    'strength': int(line.split(' ')[-1]),
                })
            else:
                current_chapter.append({
                    'kind': 'text',
                    'text': line,
                })

    return campaign


def build_icon():
    from selenium.webdriver import PhantomJS

    driver = PhantomJS(service_log_path=mkstemp()[1])
    driver.set_window_size(ICON_SIZE, ICON_SIZE)
    url = 'file://{}#icon'.format(os.path.join(HERE, 'index.html'))
    driver.get(url)
    sleep(3)

    icon_path = os.path.join(HERE, 'icon.png')
    driver.save_screenshot(icon_path)
    subprocess.check_call(['optipng', icon_path])


def build_unit_names():
    parts = []

    with open(os.path.join(HERE, 'idol unit name generator.txt')) as f:
        for line in f.readlines():
            words = line.strip().split('|')

            if words in (['A'], ['B']):
                parts.append([])
            elif parts and any(words):
                parts[-1].append(words)

    return parts


def build_kana():
    kana = []
    total_frequency = 0

    with open(os.path.join(HERE, 'kana.txt')) as f:
        for line in f.readlines():
            if line.startswith('//'):
                continue

            letters, freq_string = line.split()
            freq = int(freq_string)
            total_frequency += freq
            kana.append((letters, freq))

    return [
        (l, c / total_frequency) for l, c in kana
    ]


def build_html():
    with open('index-src.html') as f:
        soup = BeautifulSoup(f, 'html5lib')

    for attr in ('src', 'href'):
        for element in soup.select('[{}]'.format(attr)):
            parsed = urlparse(element[attr])
            if parsed.netloc or parsed.path.startswith('/'):
                continue

            checksum = hashlib.sha256()

            with open(parsed.path, 'rb') as cf:
                checksum.update(cf.read())

            element[attr] += '?v={}'.format(checksum.hexdigest()[:8])

    return str(soup)


def build_graduation_bonuses():
    graduation_bonuses = []

    with open(os.path.join(HERE, 'idol graduation bonuses.txt')) as f:
        for line in f.readlines():
            bonus_str, template = line.strip().split(maxsplit=1)
            graduation_bonuses.append((int(bonus_str), template))

    return graduation_bonuses


if __name__ == '__main__':
    import sys

    if '--icon-only' not in sys.argv:
        with open('parts.js', 'w') as p:
            parts, poses, skin_colours, hair_colours = build_idols()
            p.write(
                'PARTS = {}; POSES = {}; SKIN_COLOURS = {}; HAIR_COLOURS = {};'
                .format(
                    json.dumps(parts),
                    json.dumps(poses),
                    json.dumps(skin_colours),
                    json.dumps(hair_colours),
                )
            ),
            p.write('BIOS = {};'.format(json.dumps(build_bios())))
            p.write('ABILITIES = {};'.format(json.dumps(build_abilities())))
            p.write('QUOTES = {};'.format(json.dumps(build_quotes())))
            p.write('ANIMATIONS = {};'.format(json.dumps(build_animations())))
            p.write('CAMPAIGN = {};'.format(json.dumps(build_campaign())))
            p.write('UNIT_NAMES = {};'.format(json.dumps(build_unit_names())))
            p.write('KANA = {};'.format(json.dumps(build_kana())))
            p.write('GRADUATION_BONUSES = {};'.format(
                json.dumps(build_graduation_bonuses())
            ))

        with open('style.css', 'wb') as c:
            c.write(subprocess.check_output(['lessc', 'style.less']))

        with open('index.html', 'w') as h:
            h.write(build_html())

    if '--no-icon' not in sys.argv:
        build_icon()
