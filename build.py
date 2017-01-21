#!/usr/bin/env python3

import json
import os

DIRNAME = 'idols'
IDOLS_DIR = os.path.join(os.path.dirname(__file__), DIRNAME)
POSES = set()
SKIN_COLOURS = set()
HAIR_COLOURS = set()
LAYERS = set()


def part(path, bodytype, layer, colour, number, pose=None):
    # temporary hack for poses data being wrong
    if layer == 'bd':
        pose = number
        number = 1
    # end of temporary hack

    attrs = {
        'path': path,
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
            parts.append(part('/'.join([DIRNAME, d.name, entry.name]),
                              *fn.split('_')))

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
