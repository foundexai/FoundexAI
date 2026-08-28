import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import crypto from "crypto";

interface SignerData {
  email: string;
  name?: string;
  role: string;
  signed_at: Date;
  ip_address: string;
  signature_type: "drawn" | "typed";
  signature_data: string; // base64 data url for drawn, text string for typed
  signature_hash: string;
}

export async function overlaySignaturesAndCertificate(
  originalPdfUrl: string,
  signers: SignerData[],
  docName: string
): Promise<Buffer> {
  // 1. Download original PDF bytes
  const res = await fetch(originalPdfUrl);
  if (!res.ok) {
    throw new Error(`Failed to download PDF from URL: ${originalPdfUrl}`);
  }
  const originalPdfArrayBuffer = await res.arrayBuffer();
  const originalPdfBuffer = Buffer.from(originalPdfArrayBuffer);

  // 2. Generate SHA-256 Document Fingerprint of the original PDF
  const originalHash = crypto
    .createHash("sha256")
    .update(originalPdfBuffer)
    .digest("hex");

  // 3. Load PDF into pdf-lib
  const pdfDoc = await PDFDocument.load(originalPdfBuffer);
  
  // 4. Add the Audit Certificate Page at the end of the PDF
  const certificatePage = pdfDoc.addPage([600, 800]);
  const { width, height } = certificatePage.getSize();

  // Load fonts
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const courierOblique = await pdfDoc.embedFont(StandardFonts.CourierOblique);

  // Draw background border
  certificatePage.drawRectangle({
    x: 20,
    y: 20,
    width: width - 40,
    height: height - 40,
    borderColor: rgb(0.9, 0.75, 0.35), // gold border
    borderWidth: 2,
  });

  // Page Title
  certificatePage.drawText("FOUNDEX E-SIGNATURE AUDIT CERTIFICATE", {
    x: 40,
    y: height - 60,
    size: 16,
    font: helveticaBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  // Certificate description
  certificatePage.drawText(
    "This document is cryptographically signed and secured. Below is a verifiable record of the digital signatures and security logs.",
    {
      x: 40,
      y: height - 85,
      size: 9,
      font: helveticaFont,
      color: rgb(0.4, 0.4, 0.4),
    }
  );

  // Draw Divider
  certificatePage.drawLine({
    start: { x: 40, y: height - 100 },
    end: { x: width - 40, y: height - 100 },
    color: rgb(0.85, 0.85, 0.85),
    thickness: 1,
  });

  // Document Info Table
  certificatePage.drawText("DOCUMENT SECURITY METADATA", {
    x: 40,
    y: height - 120,
    size: 10,
    font: helveticaBold,
    color: rgb(0.15, 0.15, 0.15),
  });

  certificatePage.drawText(`Document Name: ${docName}`, {
    x: 40,
    y: height - 140,
    size: 9,
    font: helveticaFont,
  });

  certificatePage.drawText(`Original SHA-256 Fingerprint: ${originalHash}`, {
    x: 40,
    y: height - 155,
    size: 8,
    font: courierOblique,
    color: rgb(0.2, 0.2, 0.2),
  });

  certificatePage.drawText(`Signing Completion Date: ${new Date().toUTCString()}`, {
    x: 40,
    y: height - 170,
    size: 9,
    font: helveticaFont,
  });

  // Draw Divider
  certificatePage.drawLine({
    start: { x: 40, y: height - 185 },
    end: { x: width - 40, y: height - 185 },
    color: rgb(0.85, 0.85, 0.85),
    thickness: 1,
  });

  // Signatures Section Title
  certificatePage.drawText("DIGITAL SIGNATURE RECORDS", {
    x: 40,
    y: height - 205,
    size: 10,
    font: helveticaBold,
    color: rgb(0.15, 0.15, 0.15),
  });

  let currentY = height - 230;

  // 5. Draw each Signer's audit trail and signature image
  for (let i = 0; i < signers.length; i++) {
    const signer = signers[i];

    // Card border for each signer
    certificatePage.drawRectangle({
      x: 40,
      y: currentY - 145,
      width: width - 80,
      height: 135,
      borderColor: rgb(0.92, 0.92, 0.92),
      borderWidth: 1,
      color: rgb(0.99, 0.99, 0.99),
    });

    // Signer Header
    certificatePage.drawText(`Signer ${i + 1}: ${signer.name || "Unknown"} (${signer.email})`, {
      x: 55,
      y: currentY - 25,
      size: 10,
      font: helveticaBold,
    });

    certificatePage.drawText(`Role: ${signer.role.toUpperCase()}`, {
      x: 55,
      y: currentY - 40,
      size: 9,
      font: helveticaFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Audit logs
    certificatePage.drawText(`IP Address: ${signer.ip_address}`, {
      x: 55,
      y: currentY - 60,
      size: 9,
      font: helveticaFont,
    });

    certificatePage.drawText(`Signed At: ${new Date(signer.signed_at).toUTCString()}`, {
      x: 55,
      y: currentY - 75,
      size: 9,
      font: helveticaFont,
    });

    certificatePage.drawText(`Audit Hash Stamp: ${signer.signature_hash}`, {
      x: 55,
      y: currentY - 90,
      size: 7,
      font: courierOblique,
      color: rgb(0.3, 0.3, 0.3),
    });

    // Signature Title
    certificatePage.drawText("Signature:", {
      x: width - 210,
      y: currentY - 25,
      size: 9,
      font: helveticaBold,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Draw the actual signature
    if (signer.signature_type === "drawn" && signer.signature_data.includes("base64,")) {
      try {
        const base64Data = signer.signature_data.split("base64,")[1];
        const imageBuffer = Buffer.from(base64Data, "base64");
        
        // Embed the base64 image
        const pngImage = await pdfDoc.embedPng(imageBuffer);
        
        // Draw the image
        certificatePage.drawImage(pngImage, {
          x: width - 210,
          y: currentY - 110,
          width: 140,
          height: 75,
        });
      } catch (err) {
        console.error("Failed to render signature PNG onto PDF page:", err);
        certificatePage.drawText("[PNG Rendering Error]", {
          x: width - 210,
          y: currentY - 75,
          size: 10,
          font: courierOblique,
        });
      }
    } else {
      // Typed cursive signature name
      certificatePage.drawText(signer.signature_data, {
        x: width - 210,
        y: currentY - 70,
        size: 18,
        font: courierOblique,
        color: rgb(0.05, 0.15, 0.45), // Navy blue cursive ink look
      });
    }

    currentY -= 160;
  }

  // Footer seal info
  certificatePage.drawText("Secured by Foundex digital escrow systems. Verification: https://foundex.ai/verify", {
    x: 40,
    y: 35,
    size: 7,
    font: helveticaFont,
    color: rgb(0.6, 0.6, 0.6),
  });

  // 6. Save document bytes
  const signedPdfBytes = await pdfDoc.save();
  return Buffer.from(signedPdfBytes);
}
