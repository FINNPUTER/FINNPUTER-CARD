/* Where the waitlist server lives, and the scroll film. */
window.FINNPUTER_CARD = {
  api: (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://localhost:8787'
    : 'https://card-api.finnputerdex.com',
  // 72 stills cut from the card clip. map: [scroll position, place in the clip]
  film: {
    count: 72,
    path: 'assets/seq/f-',
    ext: 'webp',
    // Virtual plays the first moments backwards and lands on frame one,
    // the printed Physical card fades in over it, then the clip runs through to gold.
    map: [[0, 0.14], [0.26, 0], [0.56, 0], [0.72, 0.56], [1, 1]],
    still: { in: [0.26, 0.34], out: [0.5, 0.56] },
    cut: [0.3, 0.64],
    quiet: [0.34, 0.69],
    stops: [0.1, 0.42, 0.94]
  }
};
