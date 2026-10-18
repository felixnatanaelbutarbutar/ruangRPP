export type Teacher = {
  id: string;
  name: string;
  email: string;
  role: string;
  generation_available?: boolean;
  billing_available?: boolean;
};

export type Scope = {
  id: string;
  subject: string;
  phase: string;
  grade: number;
  curriculum: string;
  variant: string;
  ready: boolean;
  missing: string[];
};

export type Subject = {
  name: string;
  grades: number[];
  variant_required: boolean;
};

export type Reference = {
  id: string;
  title: string;
  locator: string;
  text: string;
  category: string;
  source_url: string;
  score?: number;
  scope?: { subject: string; phase: string };
};

export type Objective = {
  text: string;
  source_ids: string[];
};

export type Section = Objective & {
  heading: string;
  kind: 'curriculum' | 'adaptation';
};

export type Result = {
  title: string;
  objectives: Objective[];
  sections: Section[];
};

export type Draft = {
  id?: string;
  mode: 'ai' | 'rag';
  result: Result;
  references: Reference[];
  revision?: number;
  model: { provider: string; model: string };
  credits_used?: number;
};

export type DraftListItem = {
  id: string;
  mode: 'ai' | 'rag';
  title: string;
  subject?: string;
  grade?: number;
  created_at: string;
};

export type Setup = {
  environment: string;
  available: boolean;
  enabled: boolean;
  server_key_configured: boolean;
  app_url_valid: boolean;
};

export type Plan = {
  id: string;
  name: string;
  amount: number;
  credits: number;
};

export type Order = {
  id: string;
  plan_name: string;
  amount: number;
  credits: number;
  status: string;
  environment: string;
  created_at: string;
  checked_at: string | null;
  checkout_url: string | null;
};

export type Billing = {
  setup: Setup;
  plans: Plan[];
  trial: { credits: number; claimed: boolean };
  quota: Record<string, number>;
  orders: Order[];
  total: number;
};

export type View = 'create' | 'drafts' | 'billing';

export function exportDraftToWord(draft: Draft) {
  const title = draft.result.title || 'Modul Ajar';
  const objectivesHtml = draft.result.objectives
    .map((o, i) => `<li>${o.text}</li>`)
    .join('');
  const sectionsHtml = draft.result.sections
    .map(
      s => `
      <div style="margin-top: 14pt;">
        <h3 style="color: #0D7C6F; font-size: 12pt; margin-bottom: 4pt; border-bottom: 1pt solid #D9E4E2; padding-bottom: 2pt;">${s.heading}</h3>
        <p style="white-space: pre-wrap; line-height: 1.6; margin: 0;">${s.text}</p>
      </div>`
    )
    .join('');

  const html = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${title}</title>
      <style>
        body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #172B55; margin: 20mm; }
        h1 { font-size: 18pt; color: #0D7C6F; margin-bottom: 6pt; }
        h2 { font-size: 13pt; color: #172B55; margin-top: 14pt; margin-bottom: 4pt; }
        .meta { color: #555; font-size: 9.5pt; margin-bottom: 16pt; border-bottom: 1.5pt solid #0D7C6F; padding-bottom: 6pt; }
        ol { padding-left: 20px; line-height: 1.6; }
        .footer { margin-top: 30pt; font-size: 9pt; color: #888; border-top: 1pt solid #D9E4E2; padding-top: 6pt; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p class="meta">Disusun dengan RuangRPP &middot; Format Draf Modul Ajar Kurikulum Nasional</p>
      
      <h2>Tujuan Pembelajaran</h2>
      <ol>${objectivesHtml}</ol>

      <h2>Rencana Langkah Pembelajaran & Asesmen</h2>
      ${sectionsHtml}

      <div class="footer">
        Draf ini disusun sebagai rancangan awal. Keputusan pembelajaran dan penyesuaian kelas tetap berada pada guru.
      </div>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff' + html], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_')}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
