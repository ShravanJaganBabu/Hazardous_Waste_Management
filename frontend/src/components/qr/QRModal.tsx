import React from 'react';
import { Modal } from '../common/Modal';
import { Download, Printer, ShieldCheck, Copy, Check } from 'lucide-react';
import { IShipment, IWaste } from '../../types';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCodeUrl: string;
  shipment?: IShipment | null;
  waste?: IWaste | null;
}

export const QRModal: React.FC<QRModalProps> = ({
  isOpen,
  onClose,
  qrCodeUrl,
  shipment,
  waste,
}) => {
  const [copied, setCopied] = React.useState(false);

  const identifier = shipment?.shipmentId || waste?.wasteId || 'HW-2026';
  const manifest = shipment?.manifestNumber || 'MNF-TN-CPCB';

  const handleCopy = () => {
    navigator.clipboard.writeText(identifier);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cryptographic Chain Identifier"
      subtitle="CPCB Secured QR Consignment Manifest"
      maxWidth="md"
    >
      <div className="flex flex-col items-center text-center">
        {/* QR Code Container */}
        <div className="p-4 bg-white rounded-2xl shadow-2xl border-4 border-em/40 my-2">
          {qrCodeUrl ? (
            <img src={qrCodeUrl} alt="Consignment QR" className="w-56 h-56 object-contain" />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center bg-gray-100 text-gray-400 font-mono text-xs">
              Generating Secure QR...
            </div>
          )}
        </div>

        {/* Identifier Badge */}
        <div className="mt-4 flex items-center gap-2">
          <span className="font-mono text-sm font-bold text-white px-3 py-1 rounded-lg bg-panel border border-line">
            {identifier}
          </span>
          <button
            onClick={handleCopy}
            title="Copy ID"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-mist hover:text-em transition-colors border border-line"
          >
            {copied ? <Check className="w-4 h-4 text-em" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {/* Consignment Specs */}
        <div className="w-full mt-5 p-4 rounded-xl bg-black/40 border border-line text-left space-y-2 text-xs font-mono">
          <div className="flex justify-between">
            <span className="text-mist">Manifest Number:</span>
            <span className="text-white font-medium">{manifest}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-mist">Hazard Class:</span>
            <span className="text-alert font-medium">{waste?.category || 'Class 8 (Toxic/Corrosive)'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-mist">Quantity:</span>
            <span className="text-em font-medium">
              {waste?.declaredQuantity || shipment?.declaredQuantity} {waste?.unit || shipment?.unit || 'kg'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-mist">Security Protocol:</span>
            <span className="text-cyan font-medium">SHA-256 Multi-Party Node</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full mt-6 grid grid-cols-2 gap-3">
          <a
            href={qrCodeUrl}
            download={`HAZTRACK-${identifier}.png`}
            className="py-2.5 px-4 rounded-xl bg-em/15 hover:bg-em/25 text-em border border-em/40 font-medium text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download QR
          </a>
          <button
            onClick={handlePrint}
            className="py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-line font-medium text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print Manifest
          </button>
        </div>
      </div>
    </Modal>
  );
};
