export function textSrcEntry2lineColumn(srcEntry, lineBreakPositions) {
    const ary = srcEntry.split(':');
    const sourceLocation = {
        length: parseInt(ary[1], 10),
        start: parseInt(ary[0], 10),
    };
    const loc = this.sourceMappingDecoder
        .convertOffsetToLineColumn(sourceLocation, lineBreakPositions);
        // FIXME: note we are lossy in that we don't return the end location
    if (loc.start) {
        // Adjust because routines starts lines at 0 rather than 1.
        loc.start.line++;
    }
    if (loc.end) {
        loc.end.line++;
    }
    return [loc.start, loc.end];
}

//   /**
//      * Maps linebreak positions of a source to its solidity file from the array of sources
//      *
//      * @param {object} decoder -  SourceMappingDecoder object
//      * @param {object[]} sources - Collection of MythX API output sources property.
//      * @returns {object} - linebreak positions grouped by soliduty file paths
//      */
//     export function mapLineBreakPositions(decoder, sources) {
//         const result = {};

//         Object.entries(sources).forEach(([ sourcePath, { source } ]) => {
//             if (source) {
//                 result[sourcePath] = decoder.getLinebreakPositions(source);
//             }
//         });

//         return result;
//     }