'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Mail, ShieldAlert } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();
    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            // Check Super Admin Status
            const { data: isSuperAdmin, error: rpcError } = await supabase.rpc('is_super_admin');

            if (rpcError || !isSuperAdmin) {
                await supabase.auth.signOut();
                toast.error('Access Denied: Super Admin privileges required.');
            } else {
                toast.success('Welcome back, Admin.');
                router.push('/');
                router.refresh();
            }

        } catch (error: any) {
            toast.error(error.message || "Authentication failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 w-full">
            <Card className="w-full max-w-md border-slate-800 bg-slate-900 text-white shadow-2xl">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-6">
                        <div className="relative h-16 w-16 rounded-2xl overflow-hidden bg-slate-800 border border-slate-700 shadow-inner flex items-center justify-center">
                            {/* Using Shield icon as placeholder if logo fails, but attempting logo first */}
                            <Image
                                src="/fc_logo_orange.webp"
                                alt="Admin Logo"
                                fill
                                className="object-cover"
                            />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">
                        Super Admin
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        Restricted access. Authorized personnel only.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                <Input
                                    type="email"
                                    placeholder="Email"
                                    className="pl-9 bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 focus-visible:ring-orange-500"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                <Input
                                    type="password"
                                    placeholder="Password"
                                    className="pl-9 bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 focus-visible:ring-orange-500"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? "Authenticating..." : "Enter Dashboard"}
                        </Button>
                        <p className="text-xs text-center text-slate-500">
                            By continuing, you agree to the Internal Security Policy. Actions are logged.
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
