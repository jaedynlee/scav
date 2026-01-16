"use client";
import { supabase } from "@/app/supabaseClient"

import { useState } from "react";
import Button from "@/components/shared/Button";
import Card from "@/components/shared/Card";
import Input from "@/components/shared/Input";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL
            if (!baseUrl) {
                throw new Error("NEXT_PUBLIC_APP_URL is not set");
            }
            await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: `${baseUrl}/auth/callback`,
                },
            });
            setSuccess(true);
        } catch (err) {
            setError("Failed to send magic link; please try again.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-20 left-10 w-40 h-40 bg-violet-300 rounded-full opacity-30 blur-3xl animate-float" />
            <div className="absolute bottom-20 right-10 w-52 h-52 bg-fuchsia-300 rounded-full opacity-30 blur-3xl animate-float" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-rose-300 rounded-full opacity-25 blur-2xl animate-float" style={{ animationDelay: '2s' }} />
            <div className="absolute top-1/3 right-1/4 w-28 h-28 bg-yellow-300 rounded-full opacity-20 blur-2xl animate-float" style={{ animationDelay: '1.5s' }} />

            <div className="w-full max-w-md space-y-10 relative z-10">
                <div className="text-center space-y-5">
                    <div className="inline-block animate-wiggle">
                        <h1 className="text-7xl font-black bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-500 bg-clip-text text-transparent mb-2 drop-shadow-lg">
                            🧩
                        </h1>
                    </div>
                    <h1 className="text-6xl md:text-7xl font-black bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-500 bg-clip-text text-transparent leading-tight">
                        Epic Hunt
                    </h1>
                    <p className="text-xl text-gray-700 font-semibold">
                        Year 2 ✨
                    </p>
                </div>
                <Card>
                    {success ? <p>Magic link sent to {email}. Please check your email for a link to sign in. It may be in your spam folder!</p> : (<form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-xl font-medium">
                                {error}
                            </div>
                        )}

                        <Input
                            label=""
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                            disabled={loading}
                            className="text-2xl tracking-wider"
                        />

                        <Button type="submit" fullWidth disabled={loading}>
                            {loading ? "Doing magic..." : "🪄 Send me a magic link"}
                        </Button>
                    </form>)}
                </Card>
            </div>
        </div>
    );
}
