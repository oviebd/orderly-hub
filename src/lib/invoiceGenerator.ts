import { Order, Customer } from '@/types';
import { format } from 'date-fns';

interface BusinessInfo {
    businessName: string;
    businessAddress?: string;
    phone?: string;
}

export const generateInvoice = (order: Order, customer: Customer, business: BusinessInfo | null) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Please allow popups to generate invoices');
        return;
    }

    const subtotal = order.products.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const orderDate = order.orderDate ? format(new Date(order.orderDate), 'PPP') : 'N/A';

    // Fallbacks for business info
    const businessName = business?.businessName || 'Business Name';
    const businessAddress = business?.businessAddress || '';
    const businessPhone = business?.phone || '';

    // Customer info
    const customerName = customer.name || 'Guest Customer';
    const customerPhone = customer.phone || '';
    const customerAddress = customer.address || '';

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Invoice #${order.id.slice(0, 8)}</title>
        <style>
            body {
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                color: #555;
                line-height: 1.5;
                padding: 40px;
                max-width: 800px;
                margin: 0 auto;
            }
            .invoice-box {
                border: 1px solid #eee;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.15);
                padding: 30px;
            }
            .header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 40px;
            }
            .header-left h1 {
                margin: 0;
                color: #333;
                font-size: 24px;
            }
            .header-right {
                text-align: right;
            }
            .invoice-details {
                margin-bottom: 30px;
            }
            .invoice-details h2 {
                margin: 0 0 10px 0;
                font-size: 18px;
                color: #333;
            }
            .addresses {
                display: flex;
                justify-content: space-between;
                margin-bottom: 40px;
            }
            .address-box {
                width: 45%;
            }
            .address-box h3 {
                font-size: 14px;
                text-transform: uppercase;
                color: #999;
                margin-bottom: 10px;
                border-bottom: 1px solid #eee;
                padding-bottom: 5px;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
            }
            th {
                text-align: left;
                background: #f9f9f9;
                padding: 10px;
                font-size: 12px;
                text-transform: uppercase;
                color: #999;
            }
            td {
                padding: 12px 10px;
                border-bottom: 1px solid #eee;
                vertical-align: top;
            }
            .text-right {
                text-align: right;
            }
            .totals {
                text-align: right;
            }
            .totals-row {
                display: flex;
                justify-content: flex-end;
                margin-bottom: 5px;
            }
            .totals-label {
                width: 150px;
                color: #999;
                font-size: 14px;
            }
            .totals-value {
                width: 100px;
                font-weight: 500;
                color: #333;
            }
            .grand-total {
                font-size: 18px;
                font-weight: bold;
                color: #333;
                margin-top: 10px;
                padding-top: 10px;
                border-top: 2px solid #333;
            }
            .footer {
                margin-top: 50px;
                text-align: center;
                color: #999;
                font-size: 12px;
                border-top: 1px solid #eee;
                padding-top: 20px;
            }
            @media print {
                body {
                    padding: 0;
                }
                .invoice-box {
                    box-shadow: none;
                    border: none;
                    padding: 0;
                }
            }
        </style>
    </head>
    <body>
        <div class="invoice-box">
            <div class="header">
                <div class="header-left">
                    <h1>${businessName}</h1>
                    ${businessAddress ? `<div>${businessAddress}</div>` : ''}
                    ${businessPhone ? `<div>${businessPhone}</div>` : ''}
                </div>
                <div class="header-right">
                    <h1 style="color: #ccc; letter-spacing: 2px;">INVOICE</h1>
                    <div>#${order.invoiceNumber || order.id.slice(0, 8).toUpperCase()}</div>
                    <div>${orderDate}</div>
                </div>
            </div>

            <div class="addresses">
                <div class="address-box">
                    <h3>Bill To</h3>
                    <div><strong>${customerName}</strong></div>
                    ${customerAddress ? `<div>${customerAddress}</div>` : ''}
                    ${customerPhone ? `<div>${customerPhone}</div>` : ''}
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="width: 50%;">Item Description</th>
                        <th class="text-right">Price</th>
                        <th class="text-right">Qty</th>
                        <th class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${order.products.map(item => `
                        <tr>
                            <td>
                                <strong>${item.name}</strong>
                                ${item.code ? `<div style="font-size: 12px; color: #999;">Code: ${item.code}</div>` : ''}
                                ${item.description ? `<div style="font-size: 12px; color: #999;">${item.description}</div>` : ''}
                            </td>
                            <td class="text-right">${item.price.toFixed(2)}</td>
                            <td class="text-right">${item.quantity}</td>
                            <td class="text-right">${(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="totals">
                <div class="totals-row">
                    <div class="totals-label">Subtotal</div>
                    <div class="totals-value">${subtotal.toFixed(2)}</div>
                </div>
                ${order.deliveryCharge > 0 ? `
                <div class="totals-row">
                    <div class="totals-label">Delivery Charge</div>
                    <div class="totals-value">${order.deliveryCharge.toFixed(2)}</div>
                </div>
                ` : ''}
                <div class="totals-row">
                    <div class="totals-label" style="color: #333; margin-top: 10px;">Total</div>
                    <div class="totals-value grand-total">${order.totalAmount.toFixed(2)}</div>
                </div>
            </div>

            ${order.notes ? `
            <div style="margin-top: 30px; padding: 15px; background: #f9f9f9; border-radius: 4px;">
                <h3 style="margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase; color: #999;">Notes</h3>
                <div style="font-size: 14px;">${order.notes}</div>
            </div>
            ` : ''}

            <div class="footer">
                <p>Powered by Orderly</p>
            </div>
        </div>
        <script>
            window.onload = function() { window.print(); }
        </script>
    </body>
    </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
};
