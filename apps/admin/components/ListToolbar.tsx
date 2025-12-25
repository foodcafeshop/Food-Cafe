
'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';

export function ListToolbar({
    placeholder = "Search...",
    statusOptions = []
}: {
    placeholder?: string,
    statusOptions?: { label: string, value: string }[]
}) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();

    const handleSearch = (term: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (term) {
            params.set('q', term);
        } else {
            params.delete('q');
        }
        router.replace(`${pathname}?${params.toString()}`);
    }

    const handleStatusChange = (status: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (status && status !== 'all') {
            params.set('status', status);
        } else {
            params.delete('status');
        }
        router.replace(`${pathname}?${params.toString()}`);
    }

    return (
        <div className="flex w-full max-w-sm gap-2">
            <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder={placeholder}
                    defaultValue={searchParams.get('q')?.toString()}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-9"
                />
            </div>
            {statusOptions.length > 0 && (
                <select
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={searchParams.get('status')?.toString() || 'all'}
                    onChange={(e) => handleStatusChange(e.target.value)}
                >
                    <option value="all">All Status</option>
                    {statusOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            )}
        </div>
    );
}
