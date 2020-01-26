interface Options {
    /**
     * Byte size of the raw hash.
     * @default 256
    */
    size?: number

    /**
     * The hash seed.
     * @default ""
    */
    key?: string

    /**
     * Hashing levels.
     * @default 64
    */
    levels?: number
}

/**
 * Create an MD6 hash of a string.
 * @param input The string to hash.
 * @param options Options.
 * @example
 * ```
 * const md6 = require("md6-hash");
 *
 * md6("a");
 * //=> '2b0a697a081c21269514640aab4d74ffafeb3c0212df68ce92922087c69b0a77'
 * ```
*/
declare function md6Hex(input: string, options?: Options): string

export = md6Hash
