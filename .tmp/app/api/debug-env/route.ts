import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

function getJwtRole(token: string | undefined): string {
    if (!token) return 'missing'
    try {
        const parts = token.split('.')
        if (parts.length !== 3) return 'invalid_format'
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
        return payload.role || 'no_role_claim'
    } catch {
        return 'decode_error'
    }
}

export async function GET() {
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    const serviceKey = process.env.SUPABASE_SECRET_KEY
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL

    let connectionStatus = 'unknown'
    let connectionError = null

    try {
        const admin = getSupabaseAdmin()
        if (admin) {
            // Try a simple query
            const { error } = await admin.from('campaigns').select('count').limit(1)
            if (!error) {
                connectionStatus = 'connected'
            } else {
                connectionStatus = 'failed'
                connectionError = error.message
            }
        } else {
            connectionStatus = 'client_null'
        }
    } catch (e) {
        connectionStatus = 'error'
        connectionError = (e as Error).message
    }

    return NextResponse.json({
        env: {
            NEXT_PUBLIC_SUPABASE_URL: url ? 'Set' : 'Missing',
            ANON_KEY_ROLE: getJwtRole(anonKey),
            SERVICE_KEY_ROLE: getJwtRole(serviceKey),
            KEYS_ARE_IDENTICAL: anonKey === serviceKey,
        },
        supabase: {
            connectionStatus,
            connectionError
        },
        timestamp: new Date().toISOString()
    })
}
