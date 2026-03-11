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
  RESPONSIBLE: '15',
  DIRECTIONS: '4',
  ROLES: '5',
  PROJECTS: '6',
  FILE_URL: '3',
  STATUS: '12',
  SOURCE: '13',
  DATE: '16',
  TAGS: '17',
  VERSION: '18',
    CHECKLIST: '19',
      SUMMARY_CACHE: '20',
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

    // ------------------------------------------------------------------------
    // action: summarize
    // 1. Получает fileUrl из Bpium
    // 2. Скачивает PDF
    // 3. Отправляет в Perplexity (так как он лучше всех работает с поиском и саммари)
    // ------------------------------------------------------------------------
    if (action === 'summarize') {
      const body = await req.json();
      const docId = body?.docId;
      let fileUrl = body?.fileUrl || '';
          const force = body?.force === true;

      // If fileUrl not provided by client, fetch from Bpium as fallback
      if (!fileUrl && docId) {
        const docRes = await fetch(`${BASE_URL}/api/v1/catalogs/${CATALOG.DOCUMENTS}/records/${docId}`, {
          headers: authHeaders
        });
        if (docRes.ok) {
          const docData = await docRes.json();
          const fileField = docData.values?.[BPIUM_FIELDS.FILE_URL];
          if (Array.isArray(fileField) && fileField[0]?.url) fileUrl = fileField[0].url;
          else if (typeof fileField === 'string' && fileField) fileUrl = fileField;
                  // Read cached summary
        const cachedSummary = docData.values?.[BPIUM_FIELDS.SUMMARY_CACHE];
        if (!force && cachedSummary && typeof cachedSummary === 'string' && cachedSummary.trim()) {
          return new Response(JSON.stringify({ summary: cachedSummary, cached: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        }
      }

      if (!fileUrl) {
        return new Response(JSON.stringify({ summary: 'К этому документу не прикреплён файл для анализа.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // --- Download file and extract text ---
      const fileName = fileUrl.split('/').pop()?.split('?')[0]?.toLowerCase() || '';
      const ext = fileName.split('.').pop() || '';

      let extractedText = '';

      try {
        const fileRes = await fetch(fileUrl);
        if (!fileRes.ok) throw new Error(`Failed to download file: ${fileRes.status}`);
        const fileBuffer = await fileRes.arrayBuffer();
        const isPartial = false;
        if (ext === 'pdf') {
          const pdfParse = (await import('npm:pdf-parse@1.1.1')).default;
          const result = await pdfParse(new Uint8Array(fileBuffer));
          extractedText = result.text || '';
        } else if (ext === 'docx') {
          const JSZip = (await import('npm:jszip@3.10.1')).default;
          const zip = await JSZip.loadAsync(fileBuffer);
          const docXml = await zip.file('word/document.xml')?.async('string');
          if (docXml) {
            extractedText = docXml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
          }
        } else if (ext === 'xlsx' || ext === 'xls') {
          const XLSX = await import('npm:xlsx@0.18.5');
          const workbook = XLSX.read(new Uint8Array(fileBuffer), { type: 'array' });
          const parts: string[] = [];
          for (const sheetName of workbook.SheetNames) {
            const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]);
            if (csv.trim()) parts.push(`--- ${sheetName} ---\n${csv}`);
          }
          extractedText = parts.join('\n\n');
        } else {
          return new Response(JSON.stringify({ summary: `Формат .${ext} не поддерживается для анализа. Поддерживаются: PDF, DOCX, XLSX.` }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      } catch (dlErr) {
        console.error('File download/parse error:', dlErr);
        return new Response(JSON.stringify({ summary: 'Не удалось скачать или прочитать файл для анализа.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (!extractedText.trim()) {
        return new Response(JSON.stringify({ summary: 'Не удалось извлечь текст из файла. Возможно, документ содержит только изображения.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Truncate to ~15000 chars
      const MAX_TEXT = 15000;
      if (extractedText.length > MAX_TEXT) {
        extractedText = extractedText.slice(0, MAX_TEXT) + '\n\n[Текст обрезан — показаны первые ~15000 символов]';
      }

      // --- AI call with extracted text ---
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

      const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
            content: 'Ты ассистент в транспортной компании. Прочитай документ и дай структурированное резюме СТРОГО в формате:\n\n**Этот документ —** [одно предложение: что это такое]\n\n**Что требуется:**\n[1-2 предложения: что должны делать сотрудники]\n\n**Что меняется:**\n[1-2 предложения: новые требования или изменения, если есть]\n\n**На что обратить внимание:**\n[1-2 предложения: сроки, исключения, важные детали]\n\nПиши коротко, простым языком, без юридических терминов.'
            },
            {
              role: 'user',
                          content: `Вот текст документа для анализа${isPartial ? ' (показаны первые ~5MB файла, документ может быть больше)' : ''}:\n\n${extractedText}`
            }
          ]
        })
      });

      if (!aiRes.ok) {
        const errText = await aiRes.text();
        console.error('Lovable AI error:', aiRes.status, errText);
        if (aiRes.status === 429) throw new Error('Rate limit exceeded, try again later');
        if (aiRes.status === 402) throw new Error('AI credits exhausted');
        throw new Error('AI Gateway failed');
      }

      const aiData = await aiRes.json();
      const summary = aiData.choices[0].message.content;
          // Save summary to Bpium cache (fire and forget)
    if (docId) {
      fetch(`${BASE_URL}/api/v1/catalogs/${CATALOG.DOCUMENTS}/records/${docId}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ values: { [BPIUM_FIELDS.SUMMARY_CACHE]: summary } })
      }).catch((e: unknown) => console.error('Cache write failed:', e));
    }

      return new Response(JSON.stringify({ summary }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'get-documents') {
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

    // ... (остальные действия get-roles, get-projects и т.д.)
    if (action === 'get-roles' || action === 'get-projects' || action === 'get-directions' || action === 'get-sources') {
      const catalogId = action === 'get-roles' ? CATALOG.ROLES : 
                        action === 'get-projects' ? CATALOG.PROJECTS : 
                        action === 'get-directions' ? CATALOG.DIRECTIONS : CATALOG.SOURCES;
      const records = await fetchAllPages(`${BASE_URL}/api/v1/catalogs/${catalogId}/records`, authHeaders);
      const items = records.map((r: any) => ({ id: r.id, name: extractName(r.values?.['2']) }));
      return new Response(JSON.stringify(items), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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
