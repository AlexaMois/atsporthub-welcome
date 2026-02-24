const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BASE_URL = 'https://neiroresheniya.bpium.ru';

const extractName = (val: any): string => {
  if (!val) return '';
  if (Array.isArray(val)) return String(val[0] || '');
  return String(val);
};

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
      const res = await fetch(`${BASE_URL}/api/v1/catalogs/56/records`, {
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
        createdAt: r.createdAt,
      }));

      return new Response(JSON.stringify(documents), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get-roles') {
      const res = await fetch(`${BASE_URL}/api/v1/catalogs/57/records`, {
        headers: authHeaders,
      });
      if (!res.ok) throw new Error(`Bpium responded ${res.status}`);
      const records = await res.json();

      console.log('Sample roles record values:', JSON.stringify(records[0]?.values));
      const roles = records.map((r: any) => ({
        id: r.id,
        name: extractName(r.values?.['2']),
      }));

      return new Response(JSON.stringify(roles), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get-projects') {
      const res = await fetch(`${BASE_URL}/api/v1/catalogs/54/records`, {
        headers: authHeaders,
      });
      if (!res.ok) throw new Error(`Bpium responded ${res.status}`);
      const records = await res.json();

      console.log('FULL RECORD:', JSON.stringify(records[0]));
      console.log('Sample projects record values:', JSON.stringify(records[0]?.values));
      const projects = records.map((r: any) => ({
        id: r.id,
        name: extractName(r.values?.['2']),
      }));

      return new Response(JSON.stringify(projects), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get-directions') {
      const res = await fetch(`${BASE_URL}/api/v1/catalogs/55/records`, {
        headers: authHeaders,
      });
      if (!res.ok) throw new Error(`Bpium responded ${res.status}`);
      const records = await res.json();

      console.log('Sample directions record values:', JSON.stringify(records[0]?.values));
      const directions = records.map((r: any) => ({
        id: r.id,
        name: extractName(r.values?.['2']),
      }));

      return new Response(JSON.stringify(directions), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get-sources') {
      const res = await fetch(`${BASE_URL}/api/v1/catalogs/59/records`, {
        headers: authHeaders,
      });
      if (!res.ok) throw new Error(`Bpium responded ${res.status}`);
      const records = await res.json();

      console.log('Sample sources record values:', JSON.stringify(records[0]?.values));
      const sources = records.map((r: any) => ({
        id: r.id,
        name: extractName(r.values?.['2']),
      }));

      return new Response(JSON.stringify(sources), {
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
