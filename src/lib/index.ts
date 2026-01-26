// place files you want to import through the `$lib` alias in this folder.
export let rootUrl = "/";

export function slugify(text: string) {
    return text.toLowerCase().replace(/\s+/g, '-');
}

export function prepend(input: string, length: number, char: string) {
    while (input.length < length) {
        input = char + input;
    }
    return input;
}