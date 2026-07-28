import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient(){
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies : {
                getAll(){
                    return cookieStore.getAll();
                },

                setAll(cookiesToSet, _headers){
                    try{
                        cookiesToSet.forEach(({name, value, options}) =>{
                            cookieStore.set(name, value, options);
                        });
                    }catch{
                        /*
                         * Server Component에서는 쿠키를 직접 수정할 수 없다.
                         * Proxy가 세션을 갱신하고 있으므로 여기서는 무시해도 된다.
                         */ 
                    }
                },
            },
        },
    );
}