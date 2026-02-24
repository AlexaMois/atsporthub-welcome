const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BASE_URL = 'https://neiroresheniya.bpium.ru';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const credentials = btoa(
      Deno.env.get('BPIUM_LOGIN') + ':' + Deno.env.get('BPIUM_PASSWORD')
    );
    const authHeaders = {
      'Authorization': 'Basic ' + credentials,
      'Content-Type': 'application/json',
    };

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (action === 'get-documents') {
      const res = await fetch(`${BASE_URL}/api/catalogs/56/records`, {
        headers: authHeaders,
      });
      if (!res.ok) throw new Error(`Bpium responded ${res.status}`);
      const records = await res.json();

      const documents = records.map((r: any) => ({
        id: r.id,
        title: r.values?.['2'],
        responsible: r.values?.['3'],
        date: r.values?.['4'],
        source: r.values?.['5'],
        directions: r.values?.['6'],
        roles: r.values?.['7'],
        projects: r.values?.['8'],
        status: r.values?.['12'],
        version: r.values?.['13'],
      }));

      return new Response(JSON.stringify(documents), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get-roles') {
      const res = await fetch(`${BASE_URL}/api/catalogs/57/records`, {
        headers: authHeaders,
      });
      if (!res.ok) throw new Error(`Bpium responded ${res.status}`);
      const records = await res.json();

      const roles = records.map((r: any) => ({
        id: r.id,
        name: r.values?.['1'],
      }));

      return new Response(JSON.stringify(roles), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
