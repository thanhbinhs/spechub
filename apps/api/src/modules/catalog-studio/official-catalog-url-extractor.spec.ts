import { BadRequestException } from "@nestjs/common";
import { extractOfficialCatalogUrl } from "./official-catalog-url-extractor";

describe("extractOfficialCatalogUrl", () => {
  it("extracts explicit Apple Tech Specs fields and field-level evidence", () => {
    const result = extractOfficialCatalogUrl(
      "device",
      "https://www.apple.com/iphone-17/specs/",
      `
        <html>
          <head>
            <meta name="description" content="The new iPhone 17." />
            <script type="application/ld+json">
              {"@context":"https://schema.org","@type":"Product","name":"iPhone 17","description":"The new iPhone 17."}
            </script>
          </head>
          <body>
            <h1>iPhone 17</h1>
            <table>
              <tr><th>Chip</th><td>A19 chip</td></tr>
              <tr><th>Display</th><td>6.3-inch display, 120Hz</td></tr>
              <tr><th>Battery</th><td>Up to 30 hours video playback</td></tr>
            </table>
          </body>
        </html>`,
    );

    expect(result.sourceLabel).toBe("Apple Tech Specs");
    expect(result.values).toMatchObject({
      name: "iPhone 17",
      summary: "The new iPhone 17.",
      chipset: "A19 chip",
      display: "6.3-inch display, 120Hz",
      __official_source: "apple",
      __evidence_display: "Display: 6.3-inch display, 120Hz",
    });
    expect(result.values.raw_text).toContain("chipset: A19 chip");
  });

  it("extracts Apple's row/column layout and scopes values to the URL model", () => {
    const result = extractOfficialCatalogUrl(
      "device",
      "https://www.apple.com/iphone-16/specs/",
      `
        <html>
          <head>
            <title>iPhone 16 and iPhone 16 Plus - Technical Specifications - Apple</title>
            <meta property="og:description" content="View all technical specifications for iPhone 16 and iPhone 16 Plus." />
          </head>
          <body>
            <h1>iPhone 16 Technical Specifications</h1>
            <div role="table" class="techspecs with-2-columns">
              <div role="rowgroup" class="techspecs-section section-capacity">
                <div role="row" class="techspecs-row">
                  <div role="rowheader" class="techspecs-rowheader">Capacity<sup class="footnote">1</sup></div>
                  <div role="cell" class="techspecs-column">
                    <strong class="techspecs-small-heading">iPhone 16</strong>
                    <ul><li>128GB</li><li>256GB</li></ul>
                  </div>
                  <div role="cell" class="techspecs-column">
                    <strong class="techspecs-small-heading">iPhone 16 Plus</strong>
                    <ul><li>128GB</li><li>256GB</li><li>512GB</li></ul>
                  </div>
                </div>
              </div>
              <div role="rowgroup" class="techspecs-section section-size-and-weight">
                <div role="row" class="techspecs-row">
                  <div role="rowheader" class="techspecs-rowheader">Size and Weight<sup class="footnote">2</sup></div>
                  <div role="cell" class="techspecs-column">
                    <strong class="techspecs-small-heading">iPhone 16</strong>
                    <p>Width: 2.82 inches (71.6 mm)</p><p>Height: 5.81 inches (147.6 mm)</p>
                    <p>Depth: 0.31 inch (7.80 mm)</p><p>Weight: 6.00 ounces (170 grams)</p>
                  </div>
                  <div role="cell" class="techspecs-column">
                    <strong class="techspecs-small-heading">iPhone 16 Plus</strong>
                    <p>Width: 3.06 inches (77.8 mm)</p><p>Height: 6.33 inches (160.9 mm)</p>
                    <p>Depth: 0.31 inch (7.80 mm)</p><p>Weight: 7.03 ounces (199 grams)</p>
                  </div>
                </div>
              </div>
              <div role="rowgroup" class="techspecs-section section-display">
                <div role="row" class="techspecs-row">
                  <div role="rowheader" class="techspecs-rowheader">Display</div>
                  <div role="cell" class="techspecs-column">
                    <strong class="techspecs-small-heading">iPhone 16</strong>
                    <ul><li>6.1-inch all-screen OLED display</li><li>2556-by-1179-pixel resolution at 460 ppi</li></ul>
                  </div>
                  <div role="cell" class="techspecs-column">
                    <strong class="techspecs-small-heading">iPhone 16 Plus</strong>
                    <ul><li>6.7-inch all-screen OLED display</li><li>2796-by-1290-pixel resolution at 460 ppi</li></ul>
                  </div>
                </div>
                <div role="row" class="techspecs-row">
                  <div role="cell" class="techspecs-column" aria-colspan="2">
                    <strong class="techspecs-small-heading">Both models</strong>
                    <ul><li>HDR display</li><li>1000 nits max brightness (typical); 2000 nits peak brightness (outdoor)</li></ul>
                  </div>
                </div>
              </div>
              <div role="rowgroup" class="techspecs-section section-chip">
                <div role="row" class="techspecs-row"><div role="rowheader">Chip</div><div role="cell"><ul><li>A18 chip</li><li>6-core CPU</li></ul></div></div>
              </div>
              <div role="rowgroup" class="techspecs-section section-camera">
                <div role="row" class="techspecs-row"><div role="rowheader">Camera</div><div role="cell"><ul><li>48MP Fusion Main: 26 mm, ƒ/1.6 aperture</li><li>12MP Ultra Wide: 13 mm, ƒ/2.2 aperture</li></ul></div></div>
              </div>
              <div role="rowgroup" class="techspecs-section section-truedepth-camera">
                <div role="row" class="techspecs-row"><div role="rowheader">TrueDepth Camera</div><div role="cell"><ul><li>12MP camera</li><li>ƒ/1.9 aperture</li></ul></div></div>
              </div>
              <div role="rowgroup" class="techspecs-section section-power-and-battery">
                <div role="row" class="techspecs-row">
                  <div role="rowheader">Power and Battery<sup class="footnote">5</sup></div>
                  <div role="cell"><strong class="techspecs-small-heading">iPhone 16</strong><p>Video playback: Up to 22 hours</p></div>
                  <div role="cell"><strong class="techspecs-small-heading">iPhone 16 Plus</strong><p>Video playback: Up to 27 hours</p></div>
                </div>
                <div role="row"><div role="cell"><strong class="techspecs-small-heading">Both models</strong><p>Fast-charge capable with 20W adapter or higher</p></div></div>
              </div>
              <div role="rowgroup"><div role="row"><div role="rowheader">Splash, Water, and Dust Resistant<sup class="footnote">3</sup></div><div role="cell">Rated IP68 under IEC standard 60529</div></div></div>
              <div role="rowgroup"><div role="row"><div role="rowheader">MagSafe and Wireless Charging</div><div role="cell">MagSafe wireless charging up to 25W; Qi2 wireless charging up to 25W</div></div></div>
              <div role="rowgroup"><div role="row"><div role="rowheader">SIM Card</div><div role="cell">Dual eSIM (two active eSIMs)</div></div></div>
              <div role="rowgroup"><div role="row"><div role="rowheader">Operating System</div><div role="cell">iOS 26</div></div></div>
            </div>
          </body>
        </html>`,
    );

    expect(result.values).toMatchObject({
      name: "iPhone 16",
      storage: "128GB 256GB",
      dimensions: expect.stringContaining("170 grams"),
      chipset: "A18 chip 6-core CPU",
      display: expect.stringContaining("6.1-inch"),
      camera: expect.stringContaining("48MP Fusion Main"),
      front_camera: "12MP camera ƒ/1.9 aperture",
      battery: expect.stringContaining("Up to 22 hours"),
      ingress_protection: "Rated IP68 under IEC standard 60529",
      wireless_charging:
        "MagSafe wireless charging up to 25W; Qi2 wireless charging up to 25W",
      sim: "Dual eSIM (two active eSIMs)",
      operating_system: "iOS 26",
    });
    expect(result.values.display).toContain("2000 nits");
    expect(result.values.display).not.toContain("6.7-inch");
    expect(result.values.battery).not.toContain("27 hours");
    expect(result.values.storage).not.toContain("512GB");
    expect(result.values.__evidence_display).toContain("Display:");
  });

  it("rejects an official page that only yields title and description", () => {
    expect(() =>
      extractOfficialCatalogUrl(
        "device",
        "https://www.apple.com/iphone-16/specs/",
        `<html><head><meta name="description" content="View all technical specifications." /></head><body><h1>iPhone 16 Technical Specifications</h1></body></html>`,
      ),
    ).toThrow("quá ít thông số hữu ích");
  });

  it("extracts the matching Google compare-table column without mixing the XL model", () => {
    const result = extractOfficialCatalogUrl(
      "device",
      "https://store.google.com/us/product/pixel_10_pro_specs?hl=en-US",
      `
        <html><head><meta name="description" content="Explore Pixel 10 Pro specs." /></head><body>
          <h1>Review Specs &amp; Features of Pixel 10 Pro &amp; Pixel 10 Pro XL</h1>
          <table>
            <tr><td>Pixel 10 Pro</td><td>Pixel 10 Pro XL</td></tr>
            <tr><td colspan="2"><h3>Display</h3></td></tr>
            <tr><td><div>6.3-inch LTPO OLED</div><div>1280 x 2856 at 495 PPI</div></td><td><div>6.8-inch LTPO OLED</div><div>1344 x 2992 at 486 PPI</div></td></tr>
            <tr><td colspan="2"><h3>Battery and charging</h3></td></tr>
            <tr><td>Typical 4870 mAh; wireless charging up to 15W</td><td>Typical 5200 mAh; wireless charging up to 25W</td></tr>
            <tr><td colspan="2"><h3>Memory and storage</h3></td></tr>
            <tr><td>16 GB RAM; 128 GB; 256 GB</td><td>16 GB RAM; 256 GB; 512 GB; 1 TB</td></tr>
            <tr><td colspan="2"><h3>Processor</h3></td></tr>
            <tr><td>Google Tensor G5</td><td>Google Tensor G5</td></tr>
            <tr><td colspan="2"><h3>Rear camera</h3></td></tr>
            <tr><td>50 MP wide; 48 MP ultrawide</td><td>50 MP wide; 48 MP ultrawide</td></tr>
            <tr><td colspan="2"><h3>Operating system</h3></td></tr>
            <tr><td>Launched with Android 16</td><td>Launched with Android 16</td></tr>
          </table>
        </body></html>`,
    );

    expect(result.values).toMatchObject({
      name: "Pixel 10 Pro",
      display: "6.3-inch LTPO OLED 1280 x 2856 at 495 PPI",
      battery: "Typical 4870 mAh; wireless charging up to 15W",
      memory: "16 GB RAM; 128 GB; 256 GB",
      storage: "16 GB RAM; 128 GB; 256 GB",
      chipset: "Google Tensor G5",
      camera: "50 MP wide; 48 MP ultrawide",
      operating_system: "Launched with Android 16",
    });
    expect(result.values.display).not.toContain("6.8-inch");
    expect(result.values.battery).not.toContain("5200 mAh");
    expect(result.values.storage).not.toContain("1 TB");
  });

  it("extracts structured Qualcomm product specifications", () => {
    const result = extractOfficialCatalogUrl(
      "hardware-module",
      "https://www.qualcomm.com/smartphones/products/8-series/snapdragon-8-elite-mobile-platform",
      `
        <html><body>
          <h1>Snapdragon 8 Elite Mobile Platform</h1>
          <table>
            <tr><th># of CPU Cores</th><td>8</td></tr>
            <tr><th>Max Clock</th><td>4.32 GHz</td></tr>
            <tr><th>GPU</th><td>Qualcomm Adreno</td></tr>
            <tr><th>Cellular Modem</th><td>Snapdragon X80 5G Modem-RF System</td></tr>
          </table>
        </body></html>`,
    );

    expect(result.values).toMatchObject({
      name: "Snapdragon 8 Elite Mobile Platform",
      cores: "8",
      clock: "4.32 GHz",
      gpu: "Qualcomm Adreno",
      modem: "Snapdragon X80 5G Modem-RF System",
      __evidence_cores: "# of CPU Cores: 8",
    });
  });

  it("rejects non-official and category URLs instead of making up a record", () => {
    expect(() =>
      extractOfficialCatalogUrl(
        "device",
        "https://example.com/review/example-phone",
        "<h1>Example Phone</h1>",
      ),
    ).toThrow(BadRequestException);
    expect(() =>
      extractOfficialCatalogUrl(
        "hardware-module",
        "https://www.qualcomm.com/smartphones/products/8-series",
        "<h1>Snapdragon 8 Series</h1>",
      ),
    ).toThrow(BadRequestException);
  });
});
