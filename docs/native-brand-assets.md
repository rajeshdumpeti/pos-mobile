# POS native brand assets

The native icon system is original POS-owned project artwork. Visual references informed the broad
premium-violet and glass direction only; reference screenshots and presentation boards are not
shipped. The native icon is also separate from the complete Authentication welcome illustration.

## Visual and source model

`assets/brand/source/pos-app-icon-master.png` is the high-resolution luminous/glass raster source.
The central face is intentionally free of generated text. `pos-mark.svg` defines exact geometric
`POS` lettering, while `pos-monochrome-mark.svg` defines the simplified single-color treatment.
Raster depth and deterministic vector geometry remain separate because a realistic glass surface is
poorly represented as an inaccurate “3D SVG,” while generated lettering is not authoritative.

`npm run brand:generate` combines the source model deterministically into Expo-consumed PNGs. The
generator and SVGs share the same measured rounded-stroke geometry. Derived assets are committed so
Expo does not need an asset-generation step during development or build.

## Platform treatment

- iOS/general receives an opaque, full-bleed 1024×1024 square. It has no baked rounded corners;
  iOS applies its own mask.
- Android receives a transparent, padded foreground, stable `#302344` background, and a true
  single-color transparent monochrome asset. Critical artwork stays inside the documented
  190…833-pixel conservative content boundary for launcher masks.
- Splash receives a separately scaled transparent orb/mark on the existing warm `#F4F3EF`
  background rather than blindly reusing the home-screen icon.
- Review exports at 256, 128, 64, 48, and 32 pixels make small-size behavior explicit. `POS` must
  remain readable at 48 pixels and recognizable at 32 pixels.

The deep indigo edge and high-luminance orb/letter contrast are intended to separate cleanly from
both light and dark home-screen backgrounds. Founder visual review on real launcher backgrounds is
still required.

## Replacement workflow

1. Replace the raster master with original, rights-cleared POS artwork while retaining a clean
   central face and strong small-size silhouette.
2. Change the SVG and matching measured generator geometry together if the exact mark changes.
3. Run `npm run brand:generate`, then `npm run brand:validate` and the focused brand tests.
4. Inspect every individual file under `assets/brand/review/`, plus the full-size adaptive,
   monochrome, and splash PNGs.

Changing an icon, adaptive-icon layer, monochrome icon, or splash image changes native resources and
requires a new native development/release build. Expo Go cannot validate the installed POS icon.
Android and physical-iPhone builds remain founder-controlled later work; this milestone creates no
EAS build and generates no native project directories.
