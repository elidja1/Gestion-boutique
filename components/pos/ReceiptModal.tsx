'use client';

import React from 'react';
import { Sale, Company } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Printer, Download, Share2, CheckCircle2, X, ShoppingBag } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  company: Company;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  sale,
  company,
}) => {
  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const el = document.getElementById('printable-receipt');
    if (!el) return;
    try {
      const canvas = await html2canvas(el, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 190],
      });
      pdf.addImage(imgData, 'PNG', 0, 0, 80, 190);
      pdf.save(`Ticket_${sale.invoice_number}.pdf`);
    } catch (err) {
      console.error('PDF error', err);
    }
  };

  const handleShareWhatsApp = () => {
    const text = `*Reçu de paiement - ${company.name}*\nFacture: ${sale.invoice_number}\nBoutique: ${sale.store_name}\nMontant total: ${formatCurrency(sale.total_amount)}\nMerci pour votre achat !`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-bold">Vente Encaissée avec Succès</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Ticket Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-100 flex justify-center">
          <div
            id="printable-receipt"
            className="w-full max-w-[340px] bg-white p-5 rounded-2xl shadow-sm border border-slate-200 text-slate-800 font-mono text-xs leading-relaxed"
          >
            {/* Header */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <h2 className="text-sm font-black uppercase tracking-tight text-slate-950 font-sans">
                {company.name}
              </h2>
              <p className="text-[11px] font-medium text-slate-600 font-sans">
                {sale.store_name}
              </p>
              <p className="text-[10px] text-slate-500">IFU: {company.ifu}</p>
              <p className="text-[10px] text-slate-500">RCCM: {company.rccm}</p>
              <p className="text-[10px] text-slate-500">Tél: {company.phone}</p>
            </div>

            {/* Invoice Meta */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">FACTURE:</span>
                <span className="font-bold">{sale.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">DATE:</span>
                <span>{formatDate(sale.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">VENDEUR:</span>
                <span>{sale.seller_name || 'Caisse 01'}</span>
              </div>
              {sale.customer_name && (
                <div className="flex justify-between">
                  <span className="text-slate-500">CLIENT:</span>
                  <span className="font-semibold">{sale.customer_name}</span>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="py-2.5 border-b border-dashed border-slate-300">
              <div className="grid grid-cols-12 font-bold text-[10px] text-slate-500 pb-1 uppercase">
                <span className="col-span-6">Article</span>
                <span className="col-span-2 text-center">Qté</span>
                <span className="col-span-4 text-right">Total</span>
              </div>
              <div className="space-y-1.5 pt-1">
                {sale.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 text-[11px]">
                    <div className="col-span-6 truncate pr-1">
                      <p className="font-semibold text-slate-900 truncate">{item.product.name}</p>
                      <p className="text-[9px] text-slate-400">
                        {formatCurrency(item.unit_price)}/{item.product.unit || 'u'}
                      </p>
                    </div>
                    <span className="col-span-2 text-center font-bold">
                      {item.quantity} {item.product.unit || ''}
                    </span>
                    <span className="col-span-4 text-right font-bold">
                      {formatCurrency(item.total_price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Sous-total:</span>
                <span>{formatCurrency(sale.subtotal_amount)}</span>
              </div>
              {sale.discount_amount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Remise:</span>
                  <span>-{formatCurrency(sale.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-200">
                <span>NET À PAYER:</span>
                <span className="text-blue-700">{formatCurrency(sale.total_amount)}</span>
              </div>
            </div>

            {/* Payments & Change */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Mode Paiement:</span>
                <span className="font-bold">{sale.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Montant Reçu:</span>
                <span>{formatCurrency(sale.paid_amount)}</span>
              </div>
              {sale.change_returned > 0 && (
                <div className="flex justify-between font-bold text-emerald-700">
                  <span>Monnaie Rendue:</span>
                  <span>{formatCurrency(sale.change_returned)}</span>
                </div>
              )}
            </div>

            {/* Loyalty info */}
            {sale.customer_id && (
              <div className="py-2 text-center bg-amber-50 rounded-lg my-2 border border-amber-200/60 text-[10px] text-amber-800">
                ⭐ Points gagnés sur cet achat : +{Math.floor(sale.total_amount / 100)} pts
              </div>
            )}

            {/* Footer QR & Message */}
            <div className="pt-3 text-center space-y-2">
              <div className="inline-block p-1.5 bg-slate-50 border border-slate-200 rounded-lg">
                {/* Simulated QR barcode block */}
                <div className="w-16 h-16 bg-slate-900 mx-auto rounded flex items-center justify-center text-[8px] text-white p-1 text-center font-sans">
                  QR VERIF
                  <br />
                  {sale.invoice_number.slice(-6)}
                </div>
              </div>
              <p className="text-[10px] text-slate-500 font-sans italic px-2">
                {company.invoice_footer_message}
              </p>
              <p className="text-[9px] text-slate-400 font-sans">
                Vertu De Gloire POS v2.4 • Merci pour votre visite 🙏
              </p>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="p-4 bg-white border-t border-slate-200 grid grid-cols-3 gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all"
          >
            <Download className="w-4 h-4" />
            <span>PDF</span>
          </button>
          <button
            onClick={handleShareWhatsApp}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
          >
            <Share2 className="w-4 h-4" />
            <span>WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
