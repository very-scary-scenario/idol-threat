#!/usr/bin/env python3

from bs4 import BeautifulSoup

from datetime import datetime
import hashlib
import json
import os
import re
import subprocess
from tempfile import mkstemp
from time import sleep
from urllib.parse import urlparse


HERE = os.path.realpath(os.path.dirname(__file__))
ICON_SIZE = 256
IDOL_DIRNAME = 'idols'
IDOLS_DIR = os.path.join(HERE, IDOL_DIRNAME)
BOSSES_DIRNAME = 'bosses'
BOSSES_DIR = os.path.join(HERE, BOSSES_DIRNAME)
THUMBS_DIRNAME = 'idol-thumbs'
THUMBS_DIR = os.path.join(HERE, 'idol-thumbs')
ICON_PATH = os.path.join(HERE, 'icon.png')
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
            if entry.name.startswith('.'):
                continue

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


def build_bosses():
    bosses = []

    for fn in sorted(
        os.listdir(BOSSES_DIR)
    ):
        if fn.startswith('.') or not fn.endswith('.png'):
            continue
        boss, ext = os.path.splitext(fn)
        bosses.append(boss)

    return bosses


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
    chapters = []
    last_loop_referenced = 0

    with open(os.path.join(HERE, 'idol campaign.txt')) as f:
        for line in (l.strip() for l in f.readlines() if l.strip()):
            if line.startswith('# '):
                current_chapter = {
                    'name': line.lstrip('# '),
                    'contents': [],
                }
                chapters.append(current_chapter)

            elif line.startswith('## '):
                current_chapter['contents'].append({
                    'kind': 'setting',
                    'value': line.lstrip('# '),
                })

            elif line.startswith('### '):
                direction = {'kind': 'direction'}
                content = line[4:]

                if ' ' in content:
                    direction['actor'], instructions_raw = (
                        content.split(' ', 1))
                    direction['verb'], adjectives_raw = (
                        instructions_raw.split(', ', 1))
                    direction['adjectives'] = {
                        k: v for k, v in (
                            a.split(' ') for a in adjectives_raw.split(', ')
                        )
                    }
                else:
                    direction['verb'] = content

                current_chapter['contents'].append(direction)

            elif line.startswith('#### '):
                condition, target = line.lstrip('# ').split(': ')
                loop_range = None

                if condition != 'always':
                    loop_range = [int(i) for i in condition.split('-')]
                    if max(loop_range) > last_loop_referenced:
                        last_loop_referenced = max(loop_range)

                if 'redirect' in current_chapter:
                    raise RuntimeError('{name!r} has more than one redirect'
                                       .format(**current_chapter))

                current_chapter['redirect'] = {
                    'kind': 'redirect',
                    'loop_range': loop_range,
                    'target': target,
                }

            elif line.startswith('> battle '):
                meta, bosses_string = line.split(':', 1)
                _, _, strength_string = meta.split(' ', 2)

                current_chapter['contents'].append({
                    'kind': 'battle',
                    'strength': int(strength_string),
                    'bosses': [
                        b.strip() for b in bosses_string.split(',')
                    ]
                })

            elif line.startswith('! '):
                current_chapter['contents'].append({
                    'kind': 'setpiece',
                    'text': line.lstrip('! '),
                })

            else:
                speaker_match = re.match(r'^([\w, ]+):: (.+)$', line)
                if speaker_match:
                    speaker_string, words = speaker_match.groups()
                    speakers = [sp.strip() for sp in speaker_string.split(',')]
                else:
                    speakers, words = ([], line)

                em_match = re.match(r'^/(.+)/$', words)
                if em_match:
                    words, = em_match.groups()
                    em = True
                else:
                    em = False

                current_chapter['contents'].append({
                    'kind': 'text',
                    'text': words,
                    'speakers': speakers,
                    'em': em,
                })

    chapter_contents_by_name = {
        chapter['name']: chapter['contents'] for chapter in chapters
    }
    ordered_names = [chapter['name'] for chapter in chapters]

    initial_chapter_order = []
    final_loop_order = []

    def add_loop_for_index(loop_index, chapter_order):
        chapter_index = 0

        while True:
            try:
                chapter = chapters[chapter_index]
            except IndexError:
                break

            chapter_order.append(chapter['name'])

            redirect = chapter.get('redirect')

            if (
                redirect is not None and (
                    (redirect['loop_range'] is None) or (
                        redirect['loop_range'][0] <=
                        loop_index <=
                        redirect['loop_range'][1]
                    )
                )
            ):
                if redirect['target'] == 'restart':
                    break

                target_name = redirect['target'].replace('goto ', '')
                chapter_index = ordered_names.index(target_name)

            else:
                chapter_index += 1

    for loop_index in range(last_loop_referenced + 1):
        add_loop_for_index(loop_index, initial_chapter_order)

    add_loop_for_index(last_loop_referenced + 1, final_loop_order)

    # print('\n'.join(initial_chapter_order))
    # print('\n -- and then, indefinitely:\n')
    # print('\n'.join(final_loop_order))

    return chapter_contents_by_name, initial_chapter_order, final_loop_order


def build_icon():
    from selenium.webdriver import PhantomJS

    driver = PhantomJS(service_log_path=mkstemp()[1])
    driver.set_window_size(ICON_SIZE, ICON_SIZE)
    url = 'file://{}#icon'.format(os.path.join(HERE, 'index.html'))
    driver.get(url)
    sleep(3)

    driver.save_screenshot(ICON_PATH)
    subprocess.check_call(['optipng', ICON_PATH])


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

        f.seek(0)
        index_checksum = hashlib.sha256()
        index_checksum.update(f.read().encode())

    with open('idol-threat.manifest', 'wt') as mf:
        print('CACHE MANIFEST', file=mf)
        print('# {}'.format(index_checksum.hexdigest()[:8]), file=mf)
        print('fonts/rumraisin.woff', file=mf)
        print('vss-logo.svg', file=mf)

        for element, attr in [
            (e, a)
            for a in ('src', 'href')
            for e in soup.select('[{}]'.format(a))
        ]:
            parsed = urlparse(element[attr])
            if parsed.netloc or parsed.path.startswith('/'):
                continue

            checksum = hashlib.sha256()

            with open(parsed.path, 'rb') as cf:
                checksum.update(cf.read())

            element[attr] += '?v={}'.format(checksum.hexdigest()[:8])
            print(element[attr], file=mf)

        print('NETWORK:\n/', file=mf)

    soup.select('body')[0]['data-built-at'] = re.sub(
        r'\.\d+$', '', datetime.now().isoformat(),
    )

    return str(soup)


def build_graduation_bonuses():
    graduation_bonuses = []

    with open(os.path.join(HERE, 'idol graduation bonuses.txt')) as f:
        for line in f.readlines():
            bonus_str, template = line.strip().split(maxsplit=1)
            graduation_bonuses.append((int(bonus_str), template))

    return graduation_bonuses


def build_barcodes():
    barcodes = {}

    with open(os.path.join(HERE, 'barcodes.txt')) as f:
        for line in f.readlines():
            line = line.strip()
            if not line:
                continue

            if line.startswith('# '):
                section = line[2:]
            else:
                l = barcodes.setdefault(section, [])
                l.append(line)

    return barcodes


def write_parts():
    parts, poses, skin_colours, hair_colours = build_idols()

    with open('parts.json', 'w') as j:
        j.write(json.dumps({
            'parts': parts,
            'poses': poses,
            'skinColours': skin_colours,
            'hairColours': hair_colours,
        }, indent=2))

    with open('parts.js', 'w') as p:
        p.write(
            'PARTS = {}; POSES = {}; SKIN_COLOURS = {}; '
            'HAIR_COLOURS = {};'
            .format(
                json.dumps(parts),
                json.dumps(poses),
                json.dumps(skin_colours),
                json.dumps(hair_colours),
            )
        )

        p.write(
            'CHAPTERS = {}; INITIAL_CHAPTER_ORDER = {}; FINAL_LOOP_ORDER = {};'
            .format(*(json.dumps(c) for c in build_campaign()))
        )

        p.write('BOSS_NAMES = {};'.format(json.dumps(build_bosses())))
        p.write('BIOS = {};'.format(json.dumps(build_bios())))
        p.write('ABILITIES = {};'.format(json.dumps(build_abilities())))
        p.write('QUOTES = {};'.format(json.dumps(build_quotes())))
        p.write('ANIMATIONS = {};'.format(json.dumps(build_animations())))
        p.write('UNIT_NAMES = {};'.format(json.dumps(build_unit_names())))
        p.write('KANA = {};'.format(json.dumps(build_kana())))
        p.write('BARCODES = {};'.format(json.dumps(build_barcodes())))
        p.write('GRADUATION_BONUSES = {};'.format(
            json.dumps(build_graduation_bonuses())
        ))


if __name__ == '__main__':
    import sys

    if '--icon-only' not in sys.argv:
        if '--no-parts' not in sys.argv:
            write_parts()

        with open('style.css', 'wb') as c:
            c.write(subprocess.check_output(['lessc', 'style.less']))

        if not os.path.exists(ICON_PATH):
            build_icon()

        with open('index.html', 'w') as h:
            h.write(build_html())

    if '--no-icon' not in sys.argv:
        build_icon()
