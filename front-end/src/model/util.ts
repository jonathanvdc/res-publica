/**
 * Sorts a list of elements by key.
 * @param elements The elements to sort.
 * @param getKey A function that extracts keys from elements.
 * @param reverse Tells if the ordering should be reversed.
 */
export function sortBy<T, V>(elements: T[], getKey: (x: T) => V, reverse: boolean = false): T[] {
    return elements.sort((a, b) => {
        let aId = getKey(a);
        let bId = getKey(b);
        if (reverse) {
            let tmp = aId;
            aId = bId;
            bId = tmp;
        }
        if (aId > bId) { return 1; }
        else if (aId < bId) { return -1; }
        else { return 0; }
    });
}

/**
 * Changes the luminance of a hex color.
 * @param hex A hex color string.
 * @param lum The new luminance.
 */
export function changeLuminance(hex: string, lum: number = 0): string {
    // Parse the color string.
    let pointInColorSpace = [];
    if (hex.startsWith('rgb(')) {
        let parts = hex.substring('rgb('.length, hex.length - 1).split(',');
        pointInColorSpace = parts.map(x => parseInt(x.trim()));
    } else {
        let hexVal = String(hex).replace(/[^0-9a-f]/gi, '');
        if (hexVal.length < 6) {
            hexVal = hexVal[0] + hexVal[0] + hexVal[1] + hexVal[1] + hexVal[2] + hexVal[2];
        }

        for (let i = 0; i < hex.length / 2; i++) {
            pointInColorSpace.push(parseInt(hex.substr(i * 2, 2), 16));
        }
    }

    let offset = 0;
    if (pointInColorSpace.length > 3) {
        // Skip alpha channel if we have one.
        offset++;
    }

    // Change luminosity.
    for (let i = offset; i < pointInColorSpace.length; i++) {
        let p = pointInColorSpace[i];
        pointInColorSpace[i] = Math.round(Math.min(Math.max(0, p + (p * lum)), 255));
    }

    // Generate hex string.
    let rgb = "#";
    for (let i = 0; i < pointInColorSpace.length; i++) {
        let c = pointInColorSpace[i].toString(16);
        rgb += ("00" + c).substr(c.length);
    }

    return rgb;
}
