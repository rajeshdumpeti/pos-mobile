import Foundation
import PDFKit

let input = "/Users/rajeshdumpeti/Downloads/POS_Today_Acceptance_Test_Document_v1.0.pdf"
guard let document = PDFDocument(url: URL(fileURLWithPath: input)) else {
  fatalError("Unable to open acceptance PDF")
}

for index in 0..<document.pageCount {
  print("\n===== PAGE \(index + 1) =====\n")
  print(document.page(at: index)?.string ?? "")
}
