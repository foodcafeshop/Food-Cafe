export interface ReceiptItem {
    name: string;
    quantity: number;
    price: number;
    notes?: string;
}

export interface ReceiptData {
    restaurantName: string;
    shopLogo?: string | null;
    printerHeader?: string;
    printerFooter?: string;
    tableLabel: string;
    date: string;
    billNumber?: string;
    billLabel?: string;
    currency: string;
    items: ReceiptItem[];
    subtotal: number;
    tax: number;
    taxRate: number;
    taxIncluded: boolean;
    serviceCharge: number;
    serviceChargeRate: number;
    includeServiceCharge: boolean;
    grandTotal: number;
    printerWidth?: string; // e.g. '80mm' or '58mm'
}

export function generateReceiptHtml(data: ReceiptData): string {
    const {
        restaurantName,
        shopLogo,
        printerHeader,
        printerFooter,
        tableLabel,
        date,
        billNumber,
        billLabel,
        currency,
        items,
        subtotal,
        tax,
        taxRate,
        taxIncluded,
        serviceCharge,
        serviceChargeRate,
        includeServiceCharge,
        grandTotal,
        printerWidth = '80mm'
    } = data;

    const isNarrow = printerWidth === '58mm';
    const fontSize = isNarrow ? '12px' : '14px';

    // Use passed values for totals to support historical reprints
    const subtotalExclusive = subtotal;
    const taxAmount = tax;
    const scAmount = serviceCharge;
    const finalGrandTotal = grandTotal;

    const footerText = printerFooter || "";

    return `
        <html>
            <head>
                <title>Bill - ${tableLabel}</title>
                <style>
                    @page {
                        size: ${printerWidth} auto;
                        margin: 0mm;
                    }
                    body { 
                        font-family: 'Courier New', Courier, monospace; 
                        padding: 0; 
                        margin: 0; 
                        width: ${printerWidth};
                        font-size: ${fontSize};
                        line-height: 1.2;
                        color: #000;
                        background: white;
                        box-sizing: border-box;
                    }
                    .print-container {
                        width: 100%;
                        padding: 5mm 2mm; 
                        box-sizing: border-box;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        text-align: center;
                    }
                    
                    /* Utility classes matching Tailwind-ish feel */
                    .w-full { width: 100%; }
                    .flex { display: flex; }
                    .flex-col { flex-direction: column; }
                    .items-center { align-items: center; }
                    .text-center { text-align: center; }
                    .text-right { text-align: right; }
                    .text-left { text-align: left; }
                    .font-bold { font-weight: bold; }
                    .text-xs { font-size: ${isNarrow ? '10px' : '12px'}; }
                    .text-sm { font-size: ${isNarrow ? '11px' : '13px'}; }
                    .text-base { font-size: ${fontSize}; }
                    .text-lg { font-size: ${isNarrow ? '14px' : '16px'}; }
                    
                    .mb-1 { margin-bottom: 4px; }
                    .mb-2 { margin-bottom: 8px; }
                    .mb-4 { margin-bottom: 16px; }
                    .pb-1 { padding-bottom: 4px; }
                    
                    .border-b { border-bottom: 1px solid #000; }
                    .border-dashed { border-bottom-style: dashed; }
                    .border-2 { border-bottom-width: 2px; }
                    
                    .logo {
                        width: 64px;
                        height: 64px;
                        object-fit: contain;
                        filter: grayscale(100%);
                        margin-bottom: 8px;
                    }
                    .logo-placeholder {
                        border: 2px solid #000;
                        width: 64px;
                        height: 64px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: bold;
                        font-size: 20px;
                        border-radius: 50%;
                        margin-bottom: 8px;
                    }

                    .whitespace-pre-wrap { white-space: pre-wrap; }
                    
                    .item-row { display: flex; width: 100%; }
                    .col-item { flex: 1; text-align: left; }
                    .col-qty { width: 32px; text-align: center; }
                    .col-total { width: 64px; text-align: right; }
                    
                    .justify-between { justify-content: space-between; }
                </style>
            </head>
            <body>
                <div class="print-container">
                    
                    ${shopLogo ? `
                        <img src="${shopLogo}" class="logo" alt="Logo" />
                    ` : ''}

                    <div class="font-bold text-lg mb-1">${restaurantName}</div>
                    <div class="text-xs mb-2 whitespace-pre-wrap">${printerHeader || ''}</div>

                    <!-- Order Meta -->
                    <div class="w-full border-b border-dashed mb-2"></div>
                    <div class="w-full text-left text-xs mb-2">
                        <div>${billLabel || 'Bill #'}: ${billNumber || 'Draft'}</div>
                        <div>Table: ${tableLabel}</div>
                        <div>Date: ${date}</div>
                    </div>

                    <!-- Items Header -->
                    <div class="item-row text-xs font-bold border-b border-dashed mb-2 pb-1">
                        <span class="col-item">Item</span>
                        <span class="col-qty">Qty</span>
                        <span class="col-total">Total</span>
                    </div>

                    <!-- Items List -->
                    <div class="w-full text-left text-xs mb-2">
                        ${items.map((item) => `
                            <div class="flex-col mb-1">
                                <div class="item-row">
                                    <span class="col-item">${item.name}</span>
                                    <span class="col-qty">${item.quantity}</span>
                                    <span class="col-total">${currency}${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                                ${item.notes ? `<div style="font-size: 10px; font-style: italic; padding-left: 4px;">(${item.notes})</div>` : ''}
                            </div>
                        `).join('')}
                    </div>

                    <!-- Calculations -->
                    <div class="w-full border-b border-dashed mb-2"></div>
                    <div class="w-full text-xs">
                        ${taxIncluded ? `
                            <div class="flex justify-between mb-1">
                                <span>Subtotal (incl. taxes)</span>
                                <span>${currency}${(subtotalExclusive + taxAmount).toFixed(2)}</span>
                            </div>
                        ` : `
                            <div class="flex justify-between mb-1">
                                <span>Subtotal</span>
                                <span>${currency}${subtotalExclusive.toFixed(2)}</span>
                            </div>
                            ${taxAmount > 0.01 ? `
                                <div class="flex justify-between mb-1">
                                    <span>Tax${taxRate > 0 ? ` (${taxRate}%)` : ''}</span>
                                    <span>${currency}${taxAmount.toFixed(2)}</span>
                                </div>
                            ` : ''}
                        `}
                        
                        ${scAmount > 0.01 ? `
                            <div class="flex justify-between mb-1">
                                <span>Service Charge${serviceChargeRate > 0 ? ` (${serviceChargeRate}%)` : ''}</span>
                                <span>${currency}${scAmount.toFixed(2)}</span>
                            </div>
                        ` : ''}

                        <div class="w-full border-b border-2 mb-2" style="margin-top: 8px;"></div>

                        <div class="flex justify-between w-full font-bold text-base">
                            <span>Grand Total</span>
                            <span>${currency}${finalGrandTotal.toFixed(2)}</span>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div class="w-full border-b border-dashed mb-4" style="margin-top: 8px;"></div>
                    <div class="text-center text-xs whitespace-pre-wrap">${footerText}</div>
                    <div style="font-size: 10px; margin-top: 16px;">Powered by Food Cafe</div>

                </div>
                <script>
                    window.onload = () => { window.print(); }
                </script>
            </body>
        </html>
    `;
}
