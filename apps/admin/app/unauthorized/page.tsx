
'use client';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function UnauthorizedPage() {
    const router = useRouter();
    const supabase = createClient();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh(); // Clear middleware state
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-4">
            <h1 className="text-4xl font-bold text-red-500 mb-4">403 Forbidden</h1>
            <p className="text-xl text-gray-400 mb-8 max-w-md text-center">
                Your account does not have Super Admin privileges. This incident will be reported.
            </p>
            <div className="flex gap-4">
                <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-white text-black rounded hover:bg-gray-200 font-medium"
                >
                    Logout & Switch Account
                </button>
            </div>
        </div>
    )
}
