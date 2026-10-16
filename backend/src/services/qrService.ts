import QRCode from 'qrcode';

export const generateQRCode = async (data: string | object): Promise<string> => {
  const content = typeof data === 'string' ? data : JSON.stringify(data);
  try {
    const qrDataUrl = await QRCode.toDataURL(content, {
      errorCorrectionLevel: 'H',
      margin: 2,
      scale: 8,
      color: {
        dark: '#05080a',
        light: '#ffffff',
      },
    });
    return qrDataUrl;
  } catch (error) {
    console.error('[QR GENERATION ERROR]', error);
    return '';
  }
};
