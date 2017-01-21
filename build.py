#!/usr/bin/env python3

import json
import os
import subprocess


DIRNAME = 'idols'
IDOLS_DIR = os.path.join(os.path.dirname(__file__), DIRNAME)
THUMBS_DIR = os.path.join(os.path.dirname(__file__), 'idol-thumbs')
POSES = set()
SKIN_COLOURS = set()
HAIR_COLOURS = set()
LAYERS = set()

if not os.path.isdir(THUMBS_DIR):
    os.mkdir(THUMBS_DIR)


def part(path, thumb_path, bodytype, layer, colour, number, pose=None):
    attrs = {
        'path': path,
        'thumbPath': thumb_path,
        'bodytype': bodytype,
        'layer': layer,
        'number': number,
        'pose': pose,
    }

    LAYERS.add(layer)

    if pose is not None:
        POSES.add(pose)
    if layer in ('hd', 'bd'):
        attrs['skinColour'] = colour
        SKIN_COLOURS.add(colour)
    elif layer in ('hbe', 'hb', 'hf', 'hfe', 'ah'):
        attrs['hairColour'] = colour
        HAIR_COLOURS.add(colour)

    return attrs


def build_idols_json():
    parts = []

    for d in os.scandir(IDOLS_DIR):
        if not d.is_dir():
            continue

        for entry in os.scandir(os.path.join(IDOLS_DIR, d.name)):
            fn = entry.name.replace('.png', '')

            basename, ext = os.path.splitext(entry.name)
            thumb_name = '{}-thumb{}'.format(basename, ext)
            img_path = os.path.join(IDOLS_DIR, d.name, entry.name)
            thumb_path = os.path.join(THUMBS_DIR, thumb_name)

            subprocess.check_call(
                ['convert', img_path, '-resize', '400x400^', thumb_path])
            subprocess.check_call(['optipng', thumb_path])

            parts.append(part(
                '/'.join([DIRNAME, d.name, entry.name]),
                '/'.join([THUMBS_DIR, thumb_name]),
                *fn.split('_')
            ))

    return {
        pose: {
            skin_colour: {
                hair_colour: {
                    layer: [
                        p for p in parts if
                        p['layer'] == layer and
                        p.get('hairColour') in (hair_colour, None) and
                        p.get('skinColour') in (skin_colour, None) and
                        p.get('pose') in (pose, None)
                    ] for layer in LAYERS
                } for hair_colour in HAIR_COLOURS
            } for skin_colour in SKIN_COLOURS
        } for pose in POSES
    }


if __name__ == '__main__':
    with open('parts.js', 'w') as p:
        p.write('PARTS = {};'.format(json.dumps(build_idols_json())))
