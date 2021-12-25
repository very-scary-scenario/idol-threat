#!/usr/bin/env python3

from bs4 import BeautifulSoup

from datetime import datetime
import hashlib
import json
import os
import re
import shutil
import subprocess
from tempfile import mkstemp
from time import sleep
from typing import Dict, List, Optional, Set, Tuple, TypedDict
from urllib.parse import urlparse


INDENT = 2

HERE = os.path.realpath(os.path.dirname(__file__))
SRC = os.path.join(HERE, 'src')
BUILD = os.path.join(HERE, 'build')
ICON_SIZE = 256
TEXT = os.path.join(SRC, 'text')
IDOL_DIRNAME = 'idols'
IMG = os.path.join(SRC, 'img')
IDOLS_DIR = os.path.join(IMG, IDOL_DIRNAME)
BOSSES_DIRNAME = 'bosses'
BOSSES_DIR = os.path.join(IMG, BOSSES_DIRNAME)
THUMBS_DIRNAME = 'idol-thumbs'
THUMBS_DIR = os.path.join(BUILD, 'idol-thumbs')
ICON_PATH = os.path.join(BUILD, 'icon.png')
POSES: Set[str] = set()
SKIN_COLOURS: Set[str] = set()
HAIR_COLOURS: Set[str] = set()
LAYERS: List[str] = []

if not os.path.isdir(THUMBS_DIR):
    os.mkdir(THUMBS_DIR)


class Part(TypedDict):
    path: str
    thumbPath: str
    medPath: str
    bodyType: str
    layer: str
    number: str
    pose: str
    skinColour: Optional[str]
    hairColour: Optional[str]


def part(
    path: str, thumb_path: str, med_path: str, bodytype: str, layer: str, colour: str, number: str, pose=None,
) -> Part:
    LAYERS.append(layer)
    skin_colour: Optional[str] = None
    hair_colour: Optional[str] = None

    if pose is not None:
        POSES.add(pose)
    if layer in ('hd', 'bd'):
        skin_colour = colour
        SKIN_COLOURS.add(colour)
    elif layer in ('hbe', 'hb', 'hf', 'hfe', 'ah'):
        hair_colour = colour
        HAIR_COLOURS.add(colour)

    return Part(
        path=path,
        thumbPath=thumb_path,
        medPath=med_path,
        bodyType=bodytype,
        layer=layer,
        number=number,
        pose=pose,
        skinColour=skin_colour,
        hairColour=hair_colour,
    )


def build_idols() -> Tuple[Dict[str, List[Part]], List[str], List[str], List[str]]:
    parts: Dict[str, List[Part]] = {}

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
                '/'.join(['img', IDOL_DIRNAME, d.name, entry.name]),
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


def build_bosses() -> List[str]:
    bosses = []

    for fn in sorted(
        os.listdir(BOSSES_DIR)
    ):
        if fn.startswith('.') or not fn.endswith('.png'):
            continue
        boss, ext = os.path.splitext(fn)
        bosses.append(boss)

    return bosses


def build_bios() -> List[str]:
    bios = []

    with open(os.path.join(TEXT, 'idol bios.txt')) as f:
        for bio in f.readlines():
            bio = bio.strip()
            if bio:
                bios.append(bio)

    return bios


class Ability(TypedDict):
    bonus: int
    healing: bool
    words: List[str]


def build_abilities() -> List[List[Ability]]:
    parts = []

    with open(os.path.join(TEXT, 'idol attack names word list.txt')) as f:
        for line in f.readlines():
            line = line.strip()

            if line.startswith('//') or not line:
                continue

            elif line.startswith('#'):
                subparts: List[Ability] = []
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


def build_quotes() -> List[str]:
    quotes = []

    with open(os.path.join(TEXT, 'idol quotes.txt')) as f:
        for line in f.readlines():
            line = line.strip()
            if line:
                quotes.append(line)

    return quotes


def build_animations() -> List[str]:
    return sorted([
        f'img/anim/{f}' for f in os.listdir(os.path.join(IMG, 'anim'))
        if f.endswith('.png')
    ])


class ChapterEvent(TypedDict):
    kind: str


class Redirect(ChapterEvent):
    loop_range: Optional[List[int]]
    target: str


class Chapter(TypedDict):
    name: str
    contents: List[ChapterEvent]  # XXX this should be more specific
    redirect: Optional[Redirect]


class Setting(ChapterEvent):
    value: str


class StageDirection(ChapterEvent):
    adjectives: Optional[Dict[str, str]]
    actor: Optional[str]
    verb: Optional[str]


class Battle(ChapterEvent):
    strength: int
    bosses: List[str]


class Setpiece(ChapterEvent):
    text: str


class Text(ChapterEvent):
    text: str
    speakers: List[str]
    em: bool


def build_campaign() -> Tuple[Dict[str, List[ChapterEvent]], List[Chapter], List[Chapter]]:
    chapters = []
    last_loop_referenced = 0

    with open(os.path.join(TEXT, 'idol campaign.txt')) as f:
        for line in (line.strip() for line in f.readlines() if line.strip()):
            if line.startswith('# '):
                current_chapter = Chapter(
                    name=line.lstrip('# '),
                    contents=[],
                    redirect=None,
                )
                chapters.append(current_chapter)

            elif line.startswith('## '):
                current_chapter['contents'].append(Setting(
                    kind='setting',
                    value=line.lstrip('# '),
                ))

            elif line.startswith('### '):
                content = line[4:]
                adjectives: Optional[Dict[str, str]]
                actor: Optional[str]

                if ' ' in content:
                    actor, instructions_raw = (
                        content.split(' ', 1))
                    verb, adjectives_raw = (
                        instructions_raw.split(', ', 1))
                    adjectives = {
                        k: v for k, v in (
                            a.split(' ') for a in adjectives_raw.split(', ')
                        )
                    }
                else:
                    verb = content
                    adjectives = None
                    actor = None

                current_chapter['contents'].append(StageDirection(
                    kind='direction',
                    verb=verb,
                    adjectives=adjectives,
                    actor=actor,
                ))

            elif line.startswith('#### '):
                condition, target = line.lstrip('# ').split(': ')
                loop_range = None

                if condition != 'always':
                    loop_range = [int(i) for i in condition.split('-')]
                    if max(loop_range) > last_loop_referenced:
                        last_loop_referenced = max(loop_range)

                if current_chapter['redirect'] is not None:
                    raise RuntimeError('{name!r} has more than one redirect'
                                       .format(**current_chapter))

                current_chapter['redirect'] = Redirect(
                    kind='redirect',
                    loop_range=loop_range,
                    target=target,
                )

            elif line.startswith('> battle '):
                meta, bosses_string = line.split(':', 1)
                _, _, strength_string = meta.split(' ', 2)

                current_chapter['contents'].append(Battle(
                    kind='battle',
                    strength=int(strength_string),
                    bosses=[
                        b.strip() for b in bosses_string.split(',')
                    ],
                ))

            elif line.startswith('! '):
                current_chapter['contents'].append(Setpiece(
                    kind='setpiece',
                    text=line.lstrip('! '),
                ))

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

                current_chapter['contents'].append(Text(
                    kind='text',
                    text=words,
                    speakers=speakers,
                    em=em,
                ))

    chapter_contents_by_name = {
        chapter['name']: chapter['contents'] for chapter in chapters
    }
    ordered_names = [chapter['name'] for chapter in chapters]

    initial_chapter_order: List[Chapter] = []
    final_loop_order: List[Chapter] = []

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


def build_icon() -> None:
    from selenium.webdriver import PhantomJS

    driver = PhantomJS(service_log_path=mkstemp()[1])
    driver.set_window_size(ICON_SIZE, ICON_SIZE)
    url = 'file://{}#icon'.format(os.path.join(BUILD, 'index.html'))
    driver.get(url)
    sleep(3)

    driver.save_screenshot(ICON_PATH)
    subprocess.check_call(['optipng', ICON_PATH])


def build_unit_names() -> List[List[List[str]]]:
    parts: List[List[List[str]]] = []

    with open(os.path.join(TEXT, 'idol unit name generator.txt')) as f:
        for line in f.readlines():
            words = line.strip().split('|')

            if words in (['A'], ['B']):
                parts.append([])
            elif parts and any(words):
                parts[-1].append(words)

    return parts


class Kana(TypedDict):
    kana: str
    weight: float


def build_kana() -> List[Kana]:
    kana = []
    total_frequency = 0

    with open(os.path.join(TEXT, 'kana.txt')) as f:
        for line in f.readlines():
            if line.startswith('//'):
                continue

            letters, freq_string = line.split()
            freq = int(freq_string)
            total_frequency += freq
            kana.append((letters, freq))

    return [
        Kana(kana=k, weight=c / total_frequency) for k, c in kana
    ]


def build_html() -> str:
    with open(os.path.join(SRC, 'index-src.html')) as f:
        soup = BeautifulSoup(f, 'html5lib')

        f.seek(0)
        index_checksum = hashlib.sha256()
        index_checksum.update(f.read().encode())

    with open(os.path.join(BUILD, 'idol-threat.manifest'), 'wt') as mf:
        print('CACHE MANIFEST', file=mf)
        print('# {}'.format(index_checksum.hexdigest()[:8]), file=mf)
        print('fonts/rumraisin.woff', file=mf)
        print('vss-logo.svg', file=mf)

        for element, attr in [
            (e, a)
            for a in ('src', 'href')
            for e in soup.select('[{}]'.format(a))
        ]:
            url_str = element[attr]
            assert isinstance(url_str, str), url_str
            parsed = urlparse(url_str)
            if (
                parsed.netloc or
                parsed.path.startswith('/') or
                element[attr] == '#'
            ):
                continue

            checksum = hashlib.sha256()

            with open(os.path.join(BUILD, parsed.path), 'rb') as cf:
                checksum.update(cf.read())

            element[attr] = url_str + '?v={}'.format(checksum.hexdigest()[:8])

            print(element[attr], file=mf)

        print('NETWORK:\n/', file=mf)

    soup.select('body')[0]['data-built-at'] = re.sub(
        r'\.\d+$', '', datetime.now().isoformat(),
    )

    return str(soup)


class GraduationBonus(TypedDict):
    bonus: int
    template: str


def build_graduation_bonuses() -> List[GraduationBonus]:
    graduation_bonuses = []

    with open(os.path.join(TEXT, 'idol graduation bonuses.txt')) as f:
        for line in f.readlines():
            bonus_str, template = line.strip().split(maxsplit=1)
            graduation_bonuses.append(GraduationBonus(
                bonus=int(bonus_str),
                template=template,
            ))

    return graduation_bonuses


def build_barcodes() -> Dict[str, List[str]]:
    barcodes: Dict[str, List[str]] = {}

    with open(os.path.join(TEXT, 'barcodes.txt')) as f:
        for line in f.readlines():
            line = line.strip()
            if not line:
                continue

            if line.startswith('# '):
                section = line[2:]
            else:
                codes = barcodes.setdefault(section, [])
                codes.append(line)

    return barcodes


def write_parts() -> None:
    parts, poses, skin_colours, hair_colours = build_idols()

    with open('build/parts.json', 'w') as j:
        j.write(json.dumps({
            'parts': parts,
            'poses': poses,
            'skinColours': skin_colours,
            'hairColours': hair_colours,
        }, indent=2))

    with open('src/parts.ts', 'w') as p:
        p.write(
            "import {{ ChapterPage }} from './util'\n"
            'export const PARTS = {}\nexport const POSES = {}\nexport const SKIN_COLOURS = {}\n'
            'export const HAIR_COLOURS = {}\n'
            .format(
                json.dumps(parts, indent=INDENT),
                json.dumps(poses, indent=INDENT),
                json.dumps(skin_colours, indent=INDENT),
                json.dumps(hair_colours, indent=INDENT),
            )
        )

        p.write(
            'export const CHAPTERS: {} = {}\nexport const INITIAL_CHAPTER_ORDER = {}\nexport const FINAL_LOOP_ORDER = {};'
            .format(
                'Record<string, ChapterPage[]>',
                *(json.dumps(c, indent=INDENT) for c in build_campaign())
            )
        )

        p.write('export const BOSS_NAMES = {}\n'.format(json.dumps(build_bosses(), indent=INDENT)))
        p.write('export const BIOS = {}\n'.format(json.dumps(build_bios(), indent=INDENT)))
        p.write('export const ABILITIES = {}\n'.format(json.dumps(build_abilities(), indent=INDENT)))
        p.write('export const QUOTES = {}\n'.format(json.dumps(build_quotes(), indent=INDENT)))
        p.write('export const ANIMATIONS = {}\n'.format(json.dumps(build_animations(), indent=INDENT)))
        p.write('export const UNIT_NAMES = {}\n'.format(json.dumps(build_unit_names(), indent=INDENT)))
        p.write('export const KANA = {}\n'.format(json.dumps(build_kana(), indent=INDENT)))
        p.write('export const BARCODES = {}\n'.format(json.dumps(build_barcodes(), indent=INDENT)))
        p.write('export const GRADUATION_BONUSES = {}\n'.format(
            json.dumps(build_graduation_bonuses(), indent=INDENT)
        ))


if __name__ == '__main__':
    import sys

    if '--icon-only' not in sys.argv:
        if '--no-parts' not in sys.argv:
            write_parts()

        with open(os.path.join(BUILD, 'style.css'), 'wb') as c:
            c.write(subprocess.check_output(['npx', 'lessc', os.path.join(SRC, 'style.less')]))

        try:
            subprocess.check_call(['npm', 'run', 'build'])
        except subprocess.CalledProcessError:
            pass

        imgdir = os.path.join(BUILD, 'img')
        if os.path.exists(imgdir):
            shutil.rmtree(imgdir)
        os.mkdir(imgdir)
        for subdir in ['anim', 'backgrounds', 'bosses', 'logo']:
            shutil.copytree(os.path.join(IMG, subdir), os.path.join(imgdir, subdir))
        for fn in ['placeholder.png', 'placeholder-flat.png', 'splash.jpg', 'vss-logo.svg']:
            shutil.copy(os.path.join(IMG, fn), os.path.join(imgdir, fn))

        os.mkdir(os.path.join(imgdir, 'vendor'))
        for fpath in [('sparkle', 'sparkle.png')]:
            shutil.copy(os.path.join(SRC, 'vendor', *fpath), os.path.join(imgdir, 'vendor', fpath[-1]))

        os.symlink(os.path.join('..', '..', 'src', 'img', 'idols'), os.path.join(imgdir, 'idols'))

        for subdir in ['fonts']:
            if os.path.exists(os.path.join(BUILD, subdir)):
                shutil.rmtree(os.path.join(BUILD, subdir))
            shutil.copytree(os.path.join(SRC, subdir), os.path.join(BUILD, subdir))

        with open(os.path.join(BUILD, 'index.html'), 'w') as h:
            h.write(build_html())

    if '--no-icon' not in sys.argv:
        build_icon()
