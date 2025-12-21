"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChefHat, Lock, Mail, Users } from "lucide-react";
import Image from "next/image";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function AdminLoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <LoginForm />
        </Suspense>
    );
}

function LoginForm() {
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(searchParams.get("signup") === "true");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const router = useRouter();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isSignUp) {
                if (password !== confirmPassword) {
                    toast.error("Passwords do not match");
                    setLoading(false);
                    return;
                }
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/auth/callback`,
                        data: {
                            full_name: fullName,
                        }
                    }
                });
                if (error) throw error;

                if (data.session) {
                    toast.success("Account created!");
                    window.location.href = '/shops';
                } else {
                    toast.success("Account created! Please check your email to confirm.");
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                toast.success("Welcome back!");
                window.location.href = '/shops';
            }
        } catch (error: any) {
            console.error("Auth error:", error);
            toast.error(error.message || "Authentication failed");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback?next=/shops`,
                },
            });
            if (error) throw error;
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
            <Card className="w-full max-w-sm border-none shadow-lg">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="relative h-12 w-12 rounded-full overflow-hidden shadow-sm">
                            <Image
                                src="/fc_logo_orange.webp"
                                alt="Food Cafe Logo"
                                fill
                                className="object-contain rounded-xl"
                            />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">
                        {isSignUp ? "Create Account" : "Admin Access"}
                    </CardTitle>
                    <CardDescription>
                        {isSignUp
                            ? "Enter your details to create a new account"
                            : "Enter your credentials to access the dashboard"}
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleAuth}>
                    <CardContent className="space-y-4">
                        {isSignUp && (
                            <div className="space-y-2">
                                <div className="relative">
                                    <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        placeholder="Full Name"
                                        className="pl-9"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        )}
                        <div className="space-y-2">
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="email"
                                    placeholder="Email"
                                    className="pl-9"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="password"
                                    placeholder="Password"
                                    className="pl-9"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>
                        {isSignUp && (
                            <div className="space-y-2">
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="password"
                                        placeholder="Confirm Password"
                                        className="pl-9"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button className="w-full" type="submit" disabled={loading}>
                            {loading ? "Processing..." : (isSignUp ? "Sign Up" : "Sign In")}
                        </Button>

                        <div className="text-center text-sm">
                            <span className="text-muted-foreground">
                                {isSignUp ? "Already have an account? " : "Don't have an account? "}
                            </span>
                            <button
                                type="button"
                                onClick={() => setIsSignUp(!isSignUp)}
                                className="font-medium text-primary hover:underline"
                            >
                                {isSignUp ? "Sign In" : "Sign Up"}
                            </button>
                        </div>

                        <div className="relative w-full">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    Or continue with
                                </span>
                            </div>
                        </div>
                        <Button variant="outline" type="button" className="w-full" onClick={handleGoogleLogin}>
                            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                            </svg>
                            Google
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
