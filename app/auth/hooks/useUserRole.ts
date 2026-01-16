"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/supabaseClient";

export function useUserRole() {
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchRole() {
            try {
                setLoading(true);
                setError(null);

                const { data: sessionData } = await supabase.auth.getSession();
                const user = sessionData.session?.user;
                if (!user) {
                    setRole(null);
                    return;
                }

                // Query user_roles joined to roles so the user only reads their own role via RLS
                // Assumes a FK user_roles.role_id -> roles.id with a relationship named "roles"
                const { data, error } = await supabase
                    .from("user_roles")
                    .select("roles(name)")
                    .eq("user_id", user.id)
                    .maybeSingle();

                if (error) {
                    console.error("Error fetching role from user_roles:", error);
                    setRole(null);
                    setError("Failed to fetch role");
                } else {
                    const roleName = (data as any)?.roles?.name ?? null;
                    setRole(roleName);
                }
            } catch (err) {
                console.error(err);
                setRole(null);
                setError("Unexpected error");
            } finally {
                setLoading(false);
            }
        }

        fetchRole();
    }, []);

    return { role, loading, error, isAdmin: role === "admin" };
}
