"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/supabaseClient";
import { useRouter } from "next/navigation";

export default function CallbackPage() {
    const router = useRouter();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        async function handleCallback() {
            if (typeof window === "undefined") return;

            // 1) Check for error parameters in the URL hash placed there by Supabase
            if (window.location.hash) {
                const hash = window.location.hash.startsWith("#")
                    ? window.location.hash.slice(1)
                    : window.location.hash;
                const params = new URLSearchParams(hash);
                const error =
                    params.get("error_description") ||
                    params.get("error");

                if (error) {
                    setErrorMessage(error);
                    return;
                }
            }

            // 2) For email magic links, Supabase JS automatically recovers the session
            //    from the URL fragment on first load. We just need to read it.
            const { data, error } = await supabase.auth.getSession();

            if (error) {
                console.error("Error getting session from callback:", error);
                setErrorMessage(error.message);
                return;
            }

            if (data.session) {
                // Set a cookie that middleware can check
                // Supabase stores session in localStorage, but middleware needs cookies
                const expiresIn = data.session.expires_in || 3600;
                document.cookie = `authSession=${data.session.access_token}; path=/; max-age=${expiresIn}; SameSite=Lax`;
                console.log("Session created, redirecting to /");
                // Use window.location for full page reload to ensure cookie is sent
                window.location.href = "/";
            } else {
                console.log("No session, redirecting to /login");
                // No session and no explicit error: send user back to login
                router.replace("/login");
            }
        }

        handleCallback();
    }, [router]);

    if (errorMessage) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="max-w-md w-full space-y-4 text-center">
                    <h1 className="text-xl font-semibold text-red-700">
                        There was an error logging you in.
                    </h1>
                    <p className="text-sm text-gray-800">
                        {errorMessage}
                    </p>
                    <p className="text-xs text-gray-500">
                        Please request a new magic link from the login page.
                    </p>
                </div>
            </div>
        );
    }

    return <div>Logging you in…</div>;
}
