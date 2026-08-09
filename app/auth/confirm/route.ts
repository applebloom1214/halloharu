import { type EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";


export async function GET(request : NextRequest){
    const code = request.nextUrl.searchParams.get("code");
    const tokenHash = request.nextUrl.searchParams.get("token_hash");
    const type = request.nextUrl.searchParams.get(
        "type",
    ) as EmailOtpType | null;

    if(tokenHash && type){
        const supabase = await createClient();

        const {error} = await supabase.auth.verifyOtp({
            token_hash : tokenHash,
            type,
        });

        if(!error){
            return NextResponse.redirect(new URL("/", request.url));
        }
    }

    if(code){
        const supabase = await createClient();

        const {error} = await supabase.auth.exchangeCodeForSession(code);

        if (!error){
            return NextResponse.redirect(new URL("/", request.url));
        }
    }    


    return NextResponse.redirect(
        new URL("/login?error=confirmation_failed", request.url),
    );
}