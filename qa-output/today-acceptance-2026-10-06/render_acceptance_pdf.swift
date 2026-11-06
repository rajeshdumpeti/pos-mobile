import AppKit
import PDFKit

let input = "/Users/rajeshdumpeti/Downloads/POS_Today_Acceptance_Test_Document_v1.0.pdf"
let output = "/private/tmp/pos-today-acceptance-pages"
let manager = FileManager.default
try? manager.createDirectory(atPath: output, withIntermediateDirectories: true)

guard let document = PDFDocument(url: URL(fileURLWithPath: input)) else {
  fatalError("Unable to open acceptance PDF")
}

for index in 0..<document.pageCount {
  guard let page = document.page(at: index) else { continue }
  let bounds = page.bounds(for: .mediaBox)
  let scale: CGFloat = 1.25
  let width = Int(bounds.width * scale)
  let height = Int(bounds.height * scale)
  guard let bitmap = NSBitmapImageRep(
    bitmapDataPlanes: nil,
    pixelsWide: width,
    pixelsHigh: height,
    bitsPerSample: 8,
    samplesPerPixel: 4,
    hasAlpha: true,
    isPlanar: false,
    colorSpaceName: .deviceRGB,
    bytesPerRow: 0,
    bitsPerPixel: 0
  ) else { continue }
  NSGraphicsContext.saveGraphicsState()
  NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: bitmap)
  NSColor.white.setFill()
  NSRect(x: 0, y: 0, width: width, height: height).fill()
  let context = NSGraphicsContext.current!.cgContext
  context.scaleBy(x: scale, y: scale)
  page.draw(with: .mediaBox, to: context)
  NSGraphicsContext.restoreGraphicsState()
  let data = bitmap.representation(using: .png, properties: [:])!
  try data.write(to: URL(fileURLWithPath: String(format: "%@/page-%02d.png", output, index + 1)))
}

print("Rendered \(document.pageCount) pages to \(output)")
