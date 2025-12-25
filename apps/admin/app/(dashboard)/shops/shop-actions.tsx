
'use client';

import { generateImpersonationLink, banShop } from '@/app/actions';
import { ExternalLink, Ban, CheckCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface ShopActionsProps {
    shopId: string;
    ownerId: string | null;
    isBanned: boolean;
}

export default function ShopActions({ shopId, ownerId, isBanned }: ShopActionsProps) {
    const [loadingImpersonate, setLoadingImpersonate] = useState(false);
    const [loadingBan, setLoadingBan] = useState(false);
    const router = useRouter();

    const handleImpersonate = async () => {
        if (!ownerId) {
            toast.error('No owner assigned to this shop');
            return;
        }
        setLoadingImpersonate(true);
        try {
            const url = await generateImpersonationLink(ownerId);
            // Open in new tab or redirect
            // Since it's a magic link, it logs them in.
            // Ideally we want to redirect to the merchant app with this session.
            // But for now, let's just open the verify link. 
            // The verify link usually redirects to the siteUrl configured in Supabase.
            // CAUTION: The magic link will log them into WHICHEVER app the link points to. 
            // In Supabase, Site URL is usually one of them.
            // Admin Actions are powerful.
            window.open(url, '_blank');
            toast.success('Magic Link opened in new tab');
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoadingImpersonate(false);
        }
    };

    const handleBan = async () => {
        if (!confirm(isBanned ? 'Unban this shop?' : 'Are you sure you want to BAN this shop?')) return;

        setLoadingBan(true);
        try {
            await banShop(shopId, isBanned);
            toast.success(isBanned ? 'Shop Unbanned' : 'Shop Banned');
            router.refresh();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoadingBan(false);
        }
    }

    return (
        <div className="flex justify-end gap-2">
            <button
                onClick={handleImpersonate}
                disabled={loadingImpersonate}
                className="p-2 text-slate-400 hover:text-orange-500 hover:bg-slate-800 rounded disabled:opacity-50"
                title="Impersonate Owner"
            >
                {loadingImpersonate ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
            </button>
            <button
                onClick={handleBan}
                disabled={loadingBan}
                className={`p-2 rounded disabled:opacity-50 ${isBanned ? 'text-green-500 hover:bg-green-900/20' : 'text-red-500 hover:bg-red-900/20'}`}
                title={isBanned ? "Unban Shop" : "Ban Shop"}
            >
                {loadingBan ? <Loader2 className="h-4 w-4 animate-spin" /> : (isBanned ? <CheckCircle className="h-4 w-4" /> : <Ban className="h-4 w-4" />)}
            </button>
        </div>
    )
}
