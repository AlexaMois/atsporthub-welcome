const ALLOWED_ORIGINS = [
  'https://portal.atslogistik.ru',
  'https://atsporthub-welcome.lovable.app',
];

function isAllowedOrigin(origin: string): boolean {
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  // Allow all *.lovable.app subdomains (preview URLs)
  if (/^https:\/\/[a-z0-9\-]+\.(lovable\.app|lovableproject\.com)$/.test(origin)) return true;
  return false;
}

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') || '';
  const allowedOrigin = isAllowedOrigin(origin) ? origin : '';
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  };
}

const BASE_URL = 'https://neiroresheniya.bpium.ru';

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

const CATALOG = {
  DOCUMENTS: '56',
  ROLES: '57',
  PROJECTS: '54',
  DIRECTIONS: '55',
  SOURCES: '59',
} as const;

// --- Rate limiting for password checks ---
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_FAILED_ATTEMPTS = 5;
const failedAttempts = new Map<string, { count: number; firstAttempt: number }>();

function isRateLimited(ip: string): boolean {
  const entry = failedAttempts.get(ip);
  if (!entry) return false;
  if (Date.now() - entry.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    failedAttempts.delete(ip);
    return false;
  }
  return entry.count >= MAX_FAILED_ATTEMPTS;
}

function recordFailedAttempt(ip: string): void {
  const entry = failedAttempts.get(ip);
  const now = Date.now();
  if (!entry || now - entry.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    failedAttempts.set(ip, { count: 1, firstAttempt: now });
  } else {
    entry.count++;
  }
}

// --- Timing-safe password comparison (HMAC-based, works in Deno) ---
async function timingSafeCompare(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode('hmac-compare-key'),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const [sigA, sigB] = await Promise.all([
    crypto.subtle.sign('HMAC', key, encoder.encode(a)),
    crypto.subtle.sign('HMAC', key, encoder.encode(b)),
  ]);
  const aArr = new Uint8Array(sigA);
  const bArr = new Uint8Array(sigB);
  let diff = 0;
  for (let i = 0; i < aArr.length; i++) diff |= aArr[i] ^ bArr[i];
  return diff === 0;
}

// --- JWT helpers ---
async function getJwtKey(): Promise<CryptoKey> {
  const secret = Deno.env.get('JWT_SECRET') || '';
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

function base64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function createJwt(payload: Record<string, unknown>): Promise<string> {
  const header = base64url(new TextEncoder().encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const body = base64url(new TextEncoder().encode(JSON.stringify(payload)));
  const data = `${header}.${body}`;
  const key = await getJwtKey();
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return `${data}.${base64url(sig)}`;
}

async function verifyJwt(token: string): Promise<{ valid: boolean; payload?: Record<string, unknown> }> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return { valid: false };
    const key = await getJwtKey();
    const data = `${parts[0]}.${parts[1]}`;

    // Decode signature
    const sigB64 = parts[2].replace(/-/g, '+').replace(/_/g, '/');
    const sigBin = atob(sigB64);
    const sigBuf = new Uint8Array(sigBin.length);
    for (let i = 0; i < sigBin.length; i++) sigBuf[i] = sigBin.charCodeAt(i);

    const valid = await crypto.subtle.verify('HMAC', key, sigBuf, new TextEncoder().encode(data));
    if (!valid) return { valid: false };

    const payloadB64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(payloadB64));

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false };
  }
}

const extractName = (val: any): string => {
  if (!val) return '';
  if (Array.isArray(val)) return String(val[0] || '');
  return String(val);
};

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
    if (records.length < PAGE_SIZE) break;
    page++;
  }

  return allRecords;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.get('Origin') || '';
    if (isAllowedOrigin(origin)) {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Max-Age': '86400',
        },
      });
    }
    return new Response(null, { status: 403 });
  }

  const corsHeaders = getCorsHeaders(req);

  // Block requests from disallowed origins
  const origin = req.headers.get('Origin') || '';
  if (origin && !isAllowedOrigin(origin)) {
    return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // action: check-password
    if (action === 'check-password') {
      const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || req.headers.get('cf-connecting-ip')
        || 'unknown';

      if (isRateLimited(clientIp)) {
        return new Response(JSON.stringify({ ok: false, error: 'rate_limited' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const body = await req.json();
      const submitted = body?.password ?? '';
      const expected = Deno.env.get('VITE_DIRECTOR_PASSWORD') ?? '';

      if (!expected) {
        return new Response(JSON.stringify({ ok: false, error: 'not_configured' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const ok = await timingSafeCompare(submitted, expected);

      if (!ok) {
        recordFailedAttempt(clientIp);
        return new Response(JSON.stringify({ ok: false }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Generate JWT token on successful auth
      const now = Math.floor(Date.now() / 1000);
      const token = await createJwt({
        sub: 'director',
        iat: now,
        exp: now + 8 * 60 * 60, // 8 hours
      });

      return new Response(JSON.stringify({ ok: true, token }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // action: verify-token
    if (action === 'verify-token') {
      const body = await req.json();
      const token = body?.token ?? '';
      const result = await verifyJwt(token);
      return new Response(JSON.stringify({ valid: result.valid }), {
        status: 200,
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

    // action: verify-user — поиск по номеру телефона в каталоге Пользователи АТС
    if (action === 'verify-user') {
      const body = await req.json();
      const rawPhone: string = (body?.phone ?? '').replace(/[\s\-().]/g, '');
      if (!rawPhone) {
        return new Response(JSON.stringify({ ok: false, error: 'no_phone' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Получаем всех пользователей из каталога 64 (Пользователи АТС)
      const usersRes = await fetch(
        `${BASE_URL}/api/v1/catalogs/64/records?count=500`,
        { headers: authHeaders }
      );
      if (!usersRes.ok) {
        return new Response(JSON.stringify({ ok: false, error: 'bpium_error' }), {
          status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const users = await usersRes.json();

      // Ищем пользователя по номеру телефона (нормализуем оба)
      // Нормализация: убираем пробелы/тире/скобки/плюс, приводим к 11 цифрам с 7
      // Поддерживаем форматы: +79991234567, 89991234567, 79991234567, 9991234567
      const normalize = (p: string): string => {
        const digits = p.replace(/[\s\-().+]/g, ''); // только цифры
        if (digits.length === 10) return '7' + digits;  // 9XXXXXXXXX → 79XXXXXXXXX
        if (digits.startsWith('8') && digits.length === 11) return '7' + digits.slice(1); // 8XXX → 7XXX
        return digits; // уже в формате 7XXXXXXXXX или другом
      };
      const normalizedInput = normalize(rawPhone);

      const found = users.find((u: any) => {
        const phones: any[] = u.values?.phone ?? [];
        return phones.some((p: any) => normalize(p.contact ?? '') === normalizedInput);
      });

      if (!found) {
        return new Response(JSON.stringify({ ok: false, error: 'not_found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Проверяем статус: ['1'] = Активен, ['2'] = Уволен, ['3'] = Заблокирован
      const statusArr: string[] = found.values?.status ?? [];
      const statusCode = statusArr[0] ?? '';
      if (statusCode !== '1') {
        const reason = statusCode === '2' ? 'fired' : statusCode === '3' ? 'blocked' : 'inactive';
        return new Response(JSON.stringify({ ok: false, error: reason }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Собираем роли пользователя
      const roles: string[] = (found.values?.roles ?? []).map((r: any) => r.recordTitle).filter(Boolean);
      const fio: string = found.values?.fio ?? found.title ?? '';

      // Генерируем JWT с данными пользователя
      const now = Math.floor(Date.now() / 1000);
      const token = await createJwt({
        sub: found.id,
        fio,
        roles,
        iat: now,
        exp: now + 12 * 60 * 60, // 12 часов
      });

      // Обновляем last_login в Bpium
      fetch(
        `${BASE_URL}/api/v1/catalogs/64/records/${found.id}`,
        {
          method: 'PATCH',
          headers: authHeaders,
          body: JSON.stringify({ values: { last_login: new Date().toISOString() } }),
        }
      ).catch(() => {/* не блокируем ответ */});

      return new Response(JSON.stringify({ ok: true, token, fio, roles }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // action: summarize
    if (action === 'summarize') {
      const body = await req.json();
      const docId = body?.docId;
      let fileUrl = body?.fileUrl || '';
      const force = body?.force === true;

      // Fetch doc record from Bpium (need it for fileUrl fallback + cache)
      let docData: any = null;
      if (docId) {
        const docRes = await fetch(`${BASE_URL}/api/v1/catalogs/${CATALOG.DOCUMENTS}/records/${docId}`, {
          headers: authHeaders
        });
        if (docRes.ok) {
          docData = await docRes.json();
          if (!fileUrl) {
            const fileField = docData.values?.[BPIUM_FIELDS.FILE_URL];
            if (Array.isArray(fileField) && fileField[0]?.url) fileUrl = fileField[0].url;
            else if (typeof fileField === 'string' && fileField) fileUrl = fileField;
          }
        }
      }

      if (!fileUrl) {
        return new Response(JSON.stringify({ summary: 'К этому документу не прикреплён файл для анализа.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // --- Download file ---
      const fileName = fileUrl.split('/').pop()?.split('?')[0]?.toLowerCase() || '';
      const ext = fileName.split('.').pop() || '';

      let extractedText = '';
      let fileBuffer: ArrayBuffer;

      try {
        const MAX_FILE_SIZE = 10 * 1024 * 1024;
        const headRes = await fetch(fileUrl, { method: 'HEAD' });
        const contentLength = parseInt(headRes.headers.get('content-length') || '0', 10);

        if (contentLength > MAX_FILE_SIZE) {
          return new Response(JSON.stringify({ summary: `Файл слишком большой для анализа (${Math.round(contentLength / 1024 / 1024)}МБ). Максимум — 10МБ.` }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const fileRes = await fetch(fileUrl);
        if (!fileRes.ok) throw new Error(`Failed to download file: ${fileRes.status}`);
        fileBuffer = await fileRes.arrayBuffer();
      } catch (dlErr) {
        console.error('File download error:', dlErr);
        return new Response(JSON.stringify({ summary: 'Не удалось скачать файл для анализа.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // --- Calculate file hash for smart caching ---
      const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer);
      const fileHash = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0')).join('');

      // --- Check cache by hash ---
      if (!force && docData) {
        const cachedRaw = docData.values?.[BPIUM_FIELDS.SUMMARY_CACHE];
        if (cachedRaw && typeof cachedRaw === 'string' && cachedRaw.trim()) {
          try {
            const parsed = JSON.parse(cachedRaw);
            if (parsed.fileHash === fileHash && parsed.summary) {
              return new Response(JSON.stringify({
                summary: parsed.summary,
                cached: true,
                generatedAt: parsed.generatedAt
              }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              });
            }
          } catch {
            // Old format or invalid JSON — regenerate
          }
        }
      }

      // --- Extract text ---
      try {
        if (ext === 'pdf') {
          const pdfParse = (await import('pdf-parse')).default;
          const result = await pdfParse(new Uint8Array(fileBuffer));
          extractedText = result.text || '';
        } else if (ext === 'doc') {
          // .doc is OLE2 binary format — extract what text we can
          const bytes = new Uint8Array(fileBuffer);
          const parts: string[] = [];
          let i = 0;
          while (i < bytes.length) {
            // Look for runs of printable ASCII/Cyrillic text
            if (bytes[i] >= 0x20 && bytes[i] < 0x7f) {
              let run = '';
              while (i < bytes.length && bytes[i] >= 0x20 && bytes[i] < 0x7f) {
                run += String.fromCharCode(bytes[i]);
                i++;
              }
              if (run.length >= 8) parts.push(run);
            } else {
              i++;
            }
          }
          // Also try UTF-16LE decoding for Cyrillic content
          try {
            const utf16Text = new TextDecoder('utf-16le', { fatal: false }).decode(bytes);
            const cleaned = utf16Text.replace(/[\x00-\x1f\x7f-\x9f]/g, ' ').replace(/\s+/g, ' ').trim();
            if (cleaned.length > 100) {
              extractedText = cleaned;
            }
          } catch { /* ignore */ }
          if (!extractedText && parts.length > 0) {
            extractedText = parts.join(' ');
          }
          // If still empty, provide filename context for AI
          if (!extractedText.trim()) {
            const docTitle = docData?.values?.[BPIUM_FIELDS.TITLE] || fileName;
            extractedText = `[Документ в формате .doc: "${docTitle}". Текст не удалось извлечь автоматически. Проанализируй на основе названия документа.]`;
          }
        } else if (ext === 'docx') {
          const JSZip = (await import('jszip')).default;
          const zip = await JSZip.loadAsync(fileBuffer);
          const docXml = await zip.file('word/document.xml')?.async('string');
          if (docXml) {
            extractedText = docXml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
          }
        } else if (ext === 'xlsx' || ext === 'xls') {
          const XLSX = await import('xlsx');
          const workbook = XLSX.read(new Uint8Array(fileBuffer), { type: 'array' });
          const parts: string[] = [];
          for (const sheetName of workbook.SheetNames) {
            const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]);
            if (csv.trim()) parts.push(`--- ${sheetName} ---\n${csv}`);
          }
          extractedText = parts.join('\n\n');
        } else {
          return new Response(JSON.stringify({ summary: `Формат .${ext} не поддерживается для анализа. Поддерживаются: PDF, DOC, DOCX, XLSX.` }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      } catch (parseErr) {
        console.error('File parse error:', parseErr);
        return new Response(JSON.stringify({ summary: 'Не удалось прочитать файл для анализа.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (!extractedText.trim()) {
        return new Response(JSON.stringify({ summary: 'Не удалось извлечь текст из файла. Возможно, документ содержит только изображения.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const MAX_TEXT = 15000;
      if (extractedText.length > MAX_TEXT) {
        extractedText = extractedText.slice(0, MAX_TEXT) + '\n\n[Текст обрезан — показаны первые ~15000 символов]';
      }

      // --- AI call ---
      const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
      if (!PERPLEXITY_API_KEY) throw new Error('PERPLEXITY_API_KEY not configured');

      const aiRes = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [
            {
              role: 'system',
              content: 'Ты ассистент в транспортной компании. Прочитай документ и дай структурированное резюме СТРОГО в формате:\n\n**Этот документ —** [одно предложение: что это такое]\n\n**Что требуется:**\n[1-2 предложения: что должны делать сотрудники]\n\n**Что меняется:**\n[1-2 предложения: новые требования или изменения, если есть]\n\n**На что обратить внимание:**\n[1-2 предложения: сроки, исключения, важные детали]\n\nПиши коротко, простым языком, без юридических терминов.'
            },
            {
              role: 'user',
              content: `Вот текст документа для анализа:\n\n${extractedText}`
            }
          ],
          max_tokens: 1000
        })
      });

      if (!aiRes.ok) {
        const errText = await aiRes.text();
        console.error('Perplexity AI error:', aiRes.status, errText);
        if (aiRes.status === 429) throw new Error('Rate limit exceeded, try again later');
        if (aiRes.status === 402) throw new Error('AI credits exhausted');
        throw new Error('Perplexity API failed');
      }

      const aiData = await aiRes.json();
      const summary = aiData.choices[0].message.content;
      const generatedAt = new Date().toISOString();

      // Save summary + hash to Bpium cache (fire and forget)
      if (docId) {
        const cachePayload = JSON.stringify({
          summary,
          fileHash,
          generatedAt,
          model: 'sonar'
        });
        fetch(`${BASE_URL}/api/v1/catalogs/${CATALOG.DOCUMENTS}/records/${docId}`, {
          method: 'PATCH',
          headers: authHeaders,
          body: JSON.stringify({ values: { [BPIUM_FIELDS.SUMMARY_CACHE]: cachePayload } })
        }).catch((e: unknown) => console.error('Cache write failed:', e));
      }

      return new Response(JSON.stringify({ summary, generatedAt }), {
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
    const corsHeaders = getCorsHeaders(req);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
