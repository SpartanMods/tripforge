// Tiny, dependency-free capability check for the Web Share API with files.
// Kept separate from tripPdf.ts so checking support never pulls in jsPDF.
export function canShareFiles(): boolean {
  try {
    const probe = new File([new Blob()], 'probe.pdf', { type: 'application/pdf' })
    return typeof navigator !== 'undefined' && !!navigator.canShare && navigator.canShare({ files: [probe] })
  } catch {
    return false
  }
}
