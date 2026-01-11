const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

let supabase = null;

function getSupabaseClient() {
    if (!supabase && supabaseUrl && supabaseAnonKey) {
        supabase = createClient(supabaseUrl, supabaseAnonKey);
        console.log('✅ Supabase client initialized');
    }
    return supabase;
}

function isSupabaseConfigured() {
    return !!(supabaseUrl && supabaseAnonKey);
}

const supabaseAPIService = {
    setupRoutes(app) {
        if (!isSupabaseConfigured()) {
            console.warn('⚠️ Supabase not configured - SUPABASE_URL and SUPABASE_ANON_KEY required');
            
            app.post('/api/supabase/*', (req, res) => {
                res.status(503).json({
                    ok: false,
                    error: 'Supabase is not configured'
                });
            });
            return;
        }

        console.log('✅ Supabase API routes initializing...');

        app.post('/api/supabase/reservations', async (req, res) => {
            try {
                const {
                    store_id,
                    store_name,
                    guest_name,
                    guest_email,
                    guest_phone,
                    reservation_date,
                    reservation_time,
                    party_size,
                    notes,
                    honeypot
                } = req.body;

                if (honeypot) {
                    return res.status(400).json({ ok: false, error: 'Invalid submission' });
                }

                if (!store_id || !guest_name || !guest_email || !reservation_date) {
                    return res.status(400).json({
                        ok: false,
                        error: '必須項目が不足しています（store_id, guest_name, guest_email, reservation_date）'
                    });
                }

                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(guest_email)) {
                    return res.status(400).json({ ok: false, error: 'メールアドレスの形式が正しくありません' });
                }

                const client = getSupabaseClient();
                const { data, error } = await client
                    .from('reservations')
                    .insert([{
                        store_id,
                        store_name: store_name || null,
                        guest_name,
                        guest_email,
                        guest_phone: guest_phone || null,
                        reservation_date,
                        reservation_time: reservation_time || null,
                        party_size: party_size ? parseInt(party_size, 10) : null,
                        notes: notes || null,
                        created_at: new Date().toISOString()
                    }])
                    .select('id')
                    .single();

                if (error) {
                    console.error('❌ Supabase reservation insert error:', error);
                    return res.status(500).json({ ok: false, error: error.message });
                }

                console.log('✅ Reservation saved to Supabase:', data.id);
                res.json({ ok: true, id: data.id });

            } catch (error) {
                console.error('❌ Reservation API error:', error);
                res.status(500).json({ ok: false, error: 'サーバーエラーが発生しました' });
            }
        });

        app.post('/api/supabase/contacts', async (req, res) => {
            try {
                const {
                    name,
                    email,
                    phone,
                    message,
                    page_url,
                    honeypot
                } = req.body;

                if (honeypot) {
                    return res.status(400).json({ ok: false, error: 'Invalid submission' });
                }

                if (!name || !email || !message) {
                    return res.status(400).json({
                        ok: false,
                        error: '必須項目が不足しています（name, email, message）'
                    });
                }

                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    return res.status(400).json({ ok: false, error: 'メールアドレスの形式が正しくありません' });
                }

                const client = getSupabaseClient();
                const { data, error } = await client
                    .from('contacts')
                    .insert([{
                        name,
                        email,
                        phone: phone || null,
                        message,
                        page_url: page_url || null,
                        created_at: new Date().toISOString()
                    }])
                    .select('id')
                    .single();

                if (error) {
                    console.error('❌ Supabase contact insert error:', error);
                    return res.status(500).json({ ok: false, error: error.message });
                }

                console.log('✅ Contact saved to Supabase:', data.id);
                res.json({ ok: true, id: data.id });

            } catch (error) {
                console.error('❌ Contact API error:', error);
                res.status(500).json({ ok: false, error: 'サーバーエラーが発生しました' });
            }
        });

        app.post('/api/supabase/listings', async (req, res) => {
            try {
                const {
                    store_name,
                    category,
                    address,
                    contact_person,
                    email,
                    phone,
                    pr_text,
                    website_url,
                    sns_url,
                    plan,
                    honeypot
                } = req.body;

                if (honeypot) {
                    return res.status(400).json({ ok: false, error: 'Invalid submission' });
                }

                if (!store_name || !category || !contact_person || !email) {
                    return res.status(400).json({
                        ok: false,
                        error: '必須項目が不足しています（store_name, category, contact_person, email）'
                    });
                }

                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    return res.status(400).json({ ok: false, error: 'メールアドレスの形式が正しくありません' });
                }

                const client = getSupabaseClient();
                const { data, error } = await client
                    .from('listings')
                    .insert([{
                        store_name,
                        category,
                        address: address || null,
                        contact_person,
                        email,
                        phone: phone || null,
                        pr_text: pr_text || null,
                        website_url: website_url || null,
                        sns_url: sns_url || null,
                        plan: plan || null,
                        created_at: new Date().toISOString()
                    }])
                    .select('id')
                    .single();

                if (error) {
                    console.error('❌ Supabase listing insert error:', error);
                    return res.status(500).json({ ok: false, error: error.message });
                }

                console.log('✅ Listing application saved to Supabase:', data.id);
                res.json({ ok: true, id: data.id });

            } catch (error) {
                console.error('❌ Listing API error:', error);
                res.status(500).json({ ok: false, error: 'サーバーエラーが発生しました' });
            }
        });

        app.get('/api/supabase/health', (req, res) => {
            res.json({
                ok: true,
                configured: isSupabaseConfigured(),
                timestamp: new Date().toISOString()
            });
        });

        console.log('✅ Supabase API routes initialized');
    }
};

module.exports = { supabaseAPIService, isSupabaseConfigured };
