const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version',
};

const BASE_URL = 'https://neiroresheniya.bpium.ru';

// ------------------------------------------------------------------------
// Bpium field IDs for catalog 56 (Documents)
// ------------------------------------------------------------------------
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

// ------------------------------------------------------------------------
// fetchAllPages: загружает все записи через пагинацию (по 100 за раз)
// ------------------------------------------------------------------------
const fetchAllPages = async (url: string, authHeaders: Record<string, string>): Promise<any[]> => {
  const PAGE_SIZE = 100;
  let page = 1;
  const allRecords: any[] = [];

  while (true) {
    const pageUrl = `${url}?limit=${PAGE_SIZE}&offset=${(page - 1) * PAGE_SIZE}`;
    const res = await fetch(pageUrl, { headers: authHeaders });
    if (!res.ok) throw new Error(`Bpium responded ${res.status}`);
    const records = await res.json();
    if (!Array.isArray(records) || records.length === 0) break;
    allRecords.push(...records);
    if (records.length < PAGE_SIZE) break; // последняя страница
    page++;
  }

  return allRecords;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // ------------------------------------------------------------------------
    // action: check-password
    // Проверяет пароль директора на сервере. Пароль хранится в Supabase Secret VITE_DIRECTOR_PASSWORD.
    // ------------------------------------------------------------------------
    if (action === 'check-password') {
      const body = await req.json();
      const submitted = body?.password ?? '';
      const expected = Deno.env.get('VITE_DIRECTOR_PASSWORD') ?? '';

      if (!expected) {
        return new Response(JSON.stringify({ ok: false, error: 'not_configured' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const ok = submitted === expected;
      return new Response(JSON.stringify({ ok }), {
        status: ok ? 200 : 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const credentials = btoa(
      Deno.env.get('BPIUM_LOGIN') + ':' + Deno.env.get('BPIUM_PASSWORD')
    );
    const authHeaders = {
      'Authorization': 'Basic ' + credentials,
      'Content-Type': 'application/json',
    };

    if (action === 'get-documents') {
      // Загружаем ВСЕ документы через пагинацию
      const records = await fetchAllPages(
        `${BASE_URL}/api/v1/catalogs/${CATALOG.DOCUMENTS}/records`,
        authHeaders
      );

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
      const records = await fetchAllPages(
        `${BASE_URL}/api/v1/catalogs/${CATALOG.ROLES}/records`,
        authHeaders
      );
      const roles = records.map((r: any) => ({
        id: r.id,
        name: extractName(r.values?.['2']),
      }));
      return new Response(JSON.stringify(roles), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get-projects') {
      const records = await fetchAllPages(
        `${BASE_URL}/api/v1/catalogs/${CATALOG.PROJECTS}/records`,
        authHeaders
      );
      const projects = records.map((r: any) => ({
        id: r.id,
        name: extractName(r.values?.['2']),
      }));
      return new Response(JSON.stringify(projects), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get-directions') {
      const records = await fetchAllPages(
        `${BASE_URL}/api/v1/catalogs/${CATALOG.DIRECTIONS}/records`,
        authHeaders
      );
      const directions = records.map((r: any) => ({
        id: r.id,
        name: extractName(r.values?.['2']),
      }));
      return new Response(JSON.stringify(directions), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get-sources') {
      const records = await fetchAllPages(
        `${BASE_URL}/api/v1/catalogs/${CATALOG.SOURCES}/records`,
        authHeaders
      );
      const sources = records.map((r: any) => ({
        id: r.id,
        name: extractName(r.values?.['2']),
      }));
      return new Response(JSON.stringify(sources), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
