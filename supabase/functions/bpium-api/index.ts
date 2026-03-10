const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BASE_URL = 'https://neiroresheniya.bpium.ru';

// ---------------------------------------------------------------------------
// Bpium field IDs for catalog 56 (Documents)
// ---------------------------------------------------------------------------
const BPIUM_FIELDS = {
  TITLE: '2',
  RESPONSIBLE: '3',
  DIRECTIONS: '4',
  ROLES: '5',
  PROJECTS: '6',
  FILE_URL: '11',
  STATUS: '12',
  SOURCE: '13',
  DATE: '16',
  TAGS: '17',
  VERSION: '18',
} as const;

// Catalog IDs in Bpium
const CATALOG = {
  DOCUMENTS: '56',
  ROLES: '57',
  PROJECTS: '54',
  DIRECTIONS: '55',
  SOURCES: '59',
} as const;

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
      const res = await fetch(`${BASE_URL}/api/v1/catalogs/${CATALOG.DOCUMENTS}/records`, {
        headers: authHeaders,
      });
      if (!res.ok) throw new Error(`Bpium responded ${res.status}`);
      const records = await res.json();
      const documents = records.map((r: any) => ({
        id: r.id,
        title: r.values?.[BPIUM_FIELDS.TITLE],
        responsible: r.values?.[BPIUM_FIELDS.RESPONSIBLE],
        directions: r.values?.[BPIUM_FIELDS.DIRECTIONS],
        roles: r.values?.[BPIUM_FIELDS.ROLES],
        projects: r.values?.[BPIUM_FIELDS.PROJECTS],
        fileUrl: r.values?.[BPIUM_FIELDS.FILE_URL],
        status: r.values?.[BPIUM_FIELDS.STATUS],
        source: r.values?.[BPIUM_FIELDS.SOURCE],
        date: r.values?.[BPIUM_FIELDS.DATE],
        tags: r.values?.[BPIUM_FIELDS.TAGS],
        version: r.values?.[BPIUM_FIELDS.VERSION],
        createdAt: r.createdAt,
      }));
      return new Response(JSON.stringify(documents), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get-roles') {
      const res = await fetch(`${BASE_URL}/api/v1/catalogs/${CATALOG.ROLES}/records`, {
        headers: authHeaders,
      });
      if (!res.ok) throw new Error(`Bpium responded ${res.status}`);
      const records = await res.json();
      const roles = records.map((r: any) => ({
        id: r.id,
        name: extractName(r.values?.['2']),
      }));
      return new Response(JSON.stringify(roles), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get-projects') {
      const res = await fetch(`${BASE_URL}/api/v1/catalogs/${CATALOG.PROJECTS}/records`, {
        headers: authHeaders,
      });
      if (!res.ok) throw new Error(`Bpium responded ${res.status}`);
      const records = await res.json();
      const projects = records.map((r: any) => ({
        id: r.id,
        name: extractName(r.values?.['2']),
      }));
      return new Response(JSON.stringify(projects), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get-directions') {
      const res = await fetch(`${BASE_URL}/api/v1/catalogs/${CATALOG.DIRECTIONS}/records`, {
        headers: authHeaders,
      });
      if (!res.ok) throw new Error(`Bpium responded ${res.status}`);
      const records = await res.json();
      const directions = records.map((r: any) => ({
        id: r.id,
        name: extractName(r.values?.['2']),
      }));
      return new Response(JSON.stringify(directions), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get-sources') {
      const res = await fetch(`${BASE_URL}/api/v1/catalogs/${CATALOG.SOURCES}/records`, {
        headers: authHeaders,
      });
      if (!res.ok) throw new Error(`Bpium responded ${res.status}`);
      const records = await res.json();
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
