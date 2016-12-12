## v2.0.1 (2016/12/12)

- Reduce calls to `canvas.getContext('2d').getImageData` to gain performance;
- Use `window.parseInt` instead of `parseInt` to prevent tools likt webpack from overriding this method.

## v2.0.0 (2016/06/15)

Use co to wrap sync function getColor in color-extractor-canvas. Now it returns a Promise. Native Promise support required by browser.

## v1.0.1 (2016/05/21)

Update tmp file path when writing image color data