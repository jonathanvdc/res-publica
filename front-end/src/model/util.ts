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
