'use client';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

interface SubscriptionManagementProps {
    subscription: any;
    invoices: any[];
}

export function SubscriptionManagement({ subscription, invoices }: SubscriptionManagementProps) {
    const handleCancel = () => {
        // TODO: Implement Cancel Action
        alert('Cancellation flow needs to be implemented connected to RazorpayAdapter');
    };

    return (
        <div className="space-y-8 mt-8">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Billing History</h2>
                {subscription?.status === 'active' && (
                    <Button variant="destructive" onClick={handleCancel}>Cancel Subscription</Button>
                )}
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Invoice</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invoices && invoices.length > 0 ? (
                            invoices.map((invoice) => (
                                <TableRow key={invoice.id}>
                                    <TableCell>{format(new Date(invoice.created_at), 'MMM d, yyyy')}</TableCell>
                                    <TableCell>₹{invoice.amount}</TableCell>
                                    <TableCell className="capitalize">{invoice.status}</TableCell>
                                    <TableCell className="text-right">
                                        {invoice.invoice_pdf_url ? (
                                            <a href={invoice.invoice_pdf_url} target="_blank" className="text-blue-500 hover:underline">Download</a>
                                        ) : (
                                            "-"
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center">No invoices found</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
