import { Button } from "@/components/ui/button";
import { ChefHat, Store } from "lucide-react";
import Link from "next/link";

export default function PlatformLanding() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-white p-4 text-center">
            <div className="bg-white p-12 rounded-3xl shadow-xl max-w-2xl w-full space-y-8 border border-orange-100">
                <div className="flex justify-center">
                    <div className="h-24 w-24 bg-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-200">
                        <ChefHat className="h-12 w-12 text-white" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                        Welcome to Food Cafe Platform
                    </h1>
                    <p className="text-xl text-gray-600 max-w-lg mx-auto">
                        The all-in-one solution for managing your restaurant's digital presence.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 max-w-md mx-auto">
                    <Link href="/admin/login">
                        <Button size="lg" className="w-full h-14 text-lg font-bold bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-200">
                            Merchant Login
                        </Button>
                    </Link>
                    <Link href="/food-cafe">
                        <Button size="lg" variant="outline" className="w-full h-14 text-lg font-bold border-2">
                            View Demo Shop
                        </Button>
                    </Link>
                </div>

                <div className="pt-8 border-t border-gray-100">
                    <p className="text-sm text-gray-500">
                        Powered by <span className="font-bold text-orange-500">Gemini Antigravity</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
