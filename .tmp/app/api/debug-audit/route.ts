import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
    const serviceKey = process.env.SUPABASE_SECRET_KEY
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

    // Mask keys for security in response
    const mask = (s?: string) => s ? `${s.substring(0, 5)}...${s.substring(s.length - 5)}` : 'MISSING'

    const checks = {
        hasServiceKey: !!serviceKey,
        hasAnonKey: !!anonKey,
        keysAreIdentical: serviceKey === anonKey,
        serviceKeyPrefix: mask(serviceKey),
        anonKeyPrefix: mask(anonKey),
        adminClientStatus: 'Unknown'
    }

    let dbCheck = 'Not Run'
    try {
        const admin = getSupabaseAdmin()
        if (admin) {
            const { data, error } = await admin.from('template_projects').select('count', { count: 'exact', head: true })
            if (error) {
                dbCheck = `FAILED: ${error.message} (Code: ${error.code})`
            } else {
                dbCheck = 'SUCCESS: Admin client has access'
            }
        } else {
            dbCheck = 'FAILED: Could not initialize Admin Client'
        }
    } catch (e: any) {
        dbCheck = `EXCEPTION: ${e.message}`
    }

    return NextResponse.json({
        checks,
        dbCheck,
        environment: process.env.NODE_ENV
    })
}
