"use client";

import React from "react";
import { format } from "date-fns";
import Image from "next/image";

interface ReceiptPrintViewProps {
    order: any;
    settings: any;
    mode: "bill" | "kot";
    shopDetails: any;
}

export const ReceiptPrintView = React.forwardRef<HTMLDivElement, ReceiptPrintViewProps>(
    ({ order, settings, mode, shopDetails }, ref) => {
        const currency = settings?.currency || "$";
        const paperWidth = settings?.printer_paper_width || "80mm"; // 58mm or 80mm
        const showLogo = settings?.printer_show_logo ?? true;
        const headerText = settings?.printer_header_text || "";
        const footerText = settings?.printer_footer_text || "Thank you for visiting!";

        // Styles for 58mm vs 80mm
        const containerStyle: React.CSSProperties = {
            width: paperWidth,
            padding: "5mm 2mm", // Add vertical buffer and side margins
            margin: "0",
            background: "white",
            color: "black",
            fontSize: paperWidth === "58mm" ? "12px" : "14px",
            fontFamily: "'Courier New', Courier, monospace", // Monospace looks best on thermal
            lineHeight: "1.2",
            boxSizing: "border-box", // Ensure padding doesn't affect width
        };

        if (!order) return null;

        return (
            <div ref={ref} className="print-container" style={containerStyle}>
                <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-container, .print-container * {
              visibility: visible;
            }
            .print-container {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              margin: 0;
              padding: 0;
            }
            @page {
              size: auto;
              margin: 0mm;
            }
          }
        `}</style>

                {/* === BILL TEMPLATE === */}
                {mode === "bill" && (
                    <div className="flex flex-col items-center text-center p-2 pb-8">
                        {/* Header */}
                        {showLogo && (
                            <div className="relative w-16 h-16 mb-2 grayscale">
                                {shopDetails?.logo_url ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                        src={shopDetails.logo_url}
                                        alt="Logo"
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <div className="border-2 border-black w-full h-full flex items-center justify-center font-bold text-xl rounded-full">
                                        {shopDetails?.name?.[0] || "FC"}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="font-bold text-lg mb-1">{shopDetails?.name}</div>
                        <div className="text-xs mb-2 whitespace-pre-wrap">{headerText}</div>

                        {/* Order Meta */}
                        <div className="w-full border-b border-black border-dashed my-2"></div>
                        <div className="w-full text-left text-xs mb-2">
                            <div className="flex justify-between font-bold">
                                <span>Order #: {order.order_number || order.id.slice(0, 8)}</span>
                                <span className="uppercase border border-black px-1 rounded-sm text-[10px]">
                                    {order.service_type?.replace('_', ' ') || 'DINE IN'}
                                </span>
                            </div>
                            {order.service_type === 'dine_in' ? (
                                <div>Table: {order.tables?.label || order.table_id || "N/A"}</div>
                            ) : (
                                <>
                                    <div>Name: {order.customer_name || "Guest"}</div>
                                    <div>Phone: {order.customer_phone || "N/A"}</div>
                                </>
                            )}
                            <div>Date: {format(new Date(order.created_at), "dd/MM/yyyy HH:mm:ss")}</div>
                        </div>

                        {/* Items Header */}
                        <div className="flex w-full text-xs font-bold border-b border-black border-dashed mb-2 pb-1">
                            <span className="text-left flex-1">Item</span>
                            <span className="w-8 text-center">Qty</span>
                            <span className="w-16 text-right">Total</span>
                        </div>

                        {/* Items List */}
                        <div className="w-full text-left text-xs space-y-2 mb-2">
                            {order.order_items?.map((item: any, idx: number) => (
                                <div key={idx} className="flex flex-col">
                                    <div className="flex">
                                        <span className="flex-1">{item.name}</span>
                                        <span className="w-8 text-center">{item.quantity}</span>
                                        <span className="w-16 text-right">
                                            {currency}{(item.price * item.quantity).toFixed(2)}
                                        </span>
                                    </div>
                                    {item.notes && <div className="text-[10px] italic pl-1">({item.notes})</div>}
                                </div>
                            ))}
                        </div>

                        {/* Calculations */}
                        <div className="w-full border-b border-black border-dashed my-2"></div>
                        <div className="w-full text-xs space-y-1">
                            {/* Calculate Values based on Settings */}
                            {(() => {
                                // 1. Calculate Item Total from items
                                const itemTotal = order.order_items?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) || 0;

                                const taxRate = settings?.tax_rate || 0;
                                let scRate = settings?.service_charge || 0;
                                const isTaxIncluded = settings?.tax_included_in_price;

                                // Check waiver overlap
                                if (order.metadata?.waived_service_charge) {
                                    scRate = 0;
                                } else if (order.service_type === 'takeaway' || order.service_type === 'delivery') {
                                    scRate = 0;
                                }

                                let subtotalExclusive = 0;
                                let taxAmount = 0;

                                if (isTaxIncluded) {
                                    subtotalExclusive = itemTotal / (1 + (taxRate / 100));
                                    taxAmount = itemTotal - subtotalExclusive;
                                } else {
                                    subtotalExclusive = itemTotal;
                                    taxAmount = subtotalExclusive * (taxRate / 100);
                                }

                                // Service Charge (always on Tax-Exclusive Subtotal)
                                const scAmount = (subtotalExclusive * scRate) / 100;

                                // Additional Fees
                                const pkgCharge = Number(order.packaging_charge) || 0;
                                const delFee = Number(order.delivery_fee) || 0;

                                // Grand Total
                                const grandTotal = subtotalExclusive + taxAmount + scAmount + pkgCharge + delFee;

                                return (
                                    <>
                                        {isTaxIncluded ? (
                                            <div className="flex justify-between">
                                                <span>Subtotal (incl. taxes)</span>
                                                <span>{currency}{(subtotalExclusive + taxAmount).toFixed(2)}</span>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex justify-between">
                                                    <span>Subtotal</span>
                                                    <span>{currency}{subtotalExclusive.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Tax ({taxRate}%)</span>
                                                    <span>{currency}{taxAmount.toFixed(2)}</span>
                                                </div>
                                            </>
                                        )}

                                        {scRate > 0 && (
                                            <div className="flex justify-between">
                                                <span>Service Charge ({scRate}%)</span>
                                                <span>{currency}{scAmount.toFixed(2)}</span>
                                            </div>
                                        )}

                                        {pkgCharge > 0 && (
                                            <div className="flex justify-between">
                                                <span>Packaging</span>
                                                <span>{currency}{pkgCharge.toFixed(2)}</span>
                                            </div>
                                        )}

                                        {delFee > 0 && (
                                            <div className="flex justify-between">
                                                <span>Delivery Fee</span>
                                                <span>{currency}{delFee.toFixed(2)}</span>
                                            </div>
                                        )}

                                        <div className="w-full border-b-2 border-black my-2"></div>

                                        <div className="flex justify-between w-full font-bold text-base">
                                            <span>Grand Total</span>
                                            <span>{currency}{grandTotal.toFixed(2)}</span>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>

                        {/* Footer */}
                        <div className="w-full border-b border-black border-dashed my-4"></div>
                        <div className="text-center text-xs whitespace-pre-wrap">
                            {footerText}
                        </div>
                        <div className="mt-4 text-[10px]">
                            Powered by Food Cafe
                        </div>
                    </div>
                )}

                {/* === KOT TEMPLATE === */}
                {mode === "kot" && (
                    <div className="flex flex-col items-start p-2 pb-8">
                        <div className="w-full text-center font-bold text-xl border-b-2 border-black pb-2 mb-2">
                            {order.service_type === 'takeaway' ? 'TAKEAWAY KOT' : order.service_type === 'delivery' ? 'DELIVERY KOT' : 'KITCHEN TICKET'}
                        </div>

                        <div className="flex justify-between w-full mb-1 text-sm font-bold">
                            {order.service_type === 'dine_in' ? (
                                <span>Table: {order.tables?.label || order.table_id || "N/A"}</span>
                            ) : (
                                <span>Type: {order.service_type?.replace('_', ' ').toUpperCase()}</span>
                            )}
                            <span>Order: #{order.order_number || order.id.slice(0, 4)}</span>
                        </div>

                        {(order.service_type === 'takeaway' || order.service_type === 'delivery') && (
                            <div className="w-full mb-2 text-xs border border-black p-1">
                                <span className="font-bold">Customer: </span>{order.customer_name} | {order.customer_phone}
                            </div>
                        )}

                        <div className="text-xs mb-4">
                            {format(new Date(), "dd/MM/yyyy HH:mm:ss")}
                        </div>

                        <div className="w-full border-b-2 border-black mb-2"></div>

                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-sm border-b border-black">
                                    <th className="w-[15%] py-1">Qty</th>
                                    <th className="w-[85%] py-1">Item</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.order_items?.map((item: any, idx: number) => (
                                    <tr key={idx} className="align-top text-lg font-bold">
                                        <td className="py-2 pr-2">{item.quantity}</td>
                                        <td className="py-2">
                                            <div>{item.name}</div>
                                            {item.notes && <div className="text-sm font-normal italic mt-1">** {item.notes} **</div>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {order.service_type !== 'dine_in' && (
                            <div className="w-full text-center mt-2 border border-black p-1 font-bold text-lg">
                                {order.service_type === 'takeaway' ? 'TO GO / PICKUP' : 'DELIVERY'}
                            </div>
                        )}
                        <div className="w-full border-t-2 border-black mt-2 pt-2 text-center font-bold">
                            END OF TICKET
                        </div>
                    </div>
                )}
            </div>
        );
    }
);

ReceiptPrintView.displayName = "ReceiptPrintView";
