import { readFile } from "node:fs/promises";
import { google } from "googleapis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DEFAULT_PROJECT_ID = "volare-roadmap-engine-499102";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

type AnyObject = Record<string, unknown>;

type WebhookConfig = {
  projectId: string;
  sharedDriveId: string;
  fathomApiKey: string;
  geminiApiKey: string;
  googleServiceAccountJson: string;
  googleServiceAccountJsonBase64: string;
  googleServiceAccountFile: string;
  googleClientEmail: string;
  googlePrivateKey: string;
};

type GoogleServiceAccount = {
  type?: string;
  project_id?: string;
  client_email?: string;
  private_key?: string;
  private_key_id?: string;
  client_id?: string;
  client_x509_cert_url?: string;
  [key: string]: unknown;
};

class WebhookBadRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WebhookBadRequestError";
  }
}

class WebhookConfigError extends Error {
  constructor(
    message: string,
    readonly missing: string[] = [],
  ) {
    super(message);
    this.name = "WebhookConfigError";
  }
}

function readEnv(name: string) {
  const rawValue = process.env[name];

  if (!rawValue) {
    return "";
  }

  const trimmed = rawValue.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function getConfig(): WebhookConfig {
  return {
    projectId: readEnv("PROJECT_ID") || DEFAULT_PROJECT_ID,
    sharedDriveId: readEnv("SHARED_DRIVE_ID"),
    fathomApiKey: readEnv("FATHOM_API_KEY"),
    geminiApiKey: readEnv("GEMINI_API_KEY"),
    googleServiceAccountJson: readEnv("GOOGLE_SERVICE_ACCOUNT_JSON"),
    googleServiceAccountJsonBase64:
      readEnv("GOOGLE_SERVICE_ACCOUNT_JSON_BASE64") ||
      readEnv("GOOGLE_SERVICE_ACCOUNT_JSON_B64"),
    googleServiceAccountFile:
      readEnv("GOOGLE_SERVICE_ACCOUNT_FILE") ||
      readEnv("GOOGLE_APPLICATION_CREDENTIALS"),
    googleClientEmail:
      readEnv("GOOGLE_CLIENT_EMAIL") ||
      readEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
    googlePrivateKey:
      readEnv("GOOGLE_PRIVATE_KEY") ||
      readEnv("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY"),
  };
}

function sendJson(data: AnyObject, status = 200) {
  return Response.json(data, {
    status,
    headers: corsHeaders,
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cleanString(text?: string | null) {
  if (!text) return "";

  const removals = [
    "volare x",
    "roadmap session",
    "prospect:",
    "session",
    "roadmap",
  ];

  let lowered = text.toLowerCase();

  for (const word of removals) {
    lowered = lowered.replaceAll(word, "");
  }

  return lowered.trim();
}

function lcsSimilarity(a: string, b: string) {
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  if (a === b) return 1;

  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0),
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return (2 * dp[m][n]) / (m + n);
}

function normalizePrivateKey(privateKey?: string) {
  return privateKey ? privateKey.replace(/\\n/g, "\n") : "";
}

function parseGoogleServiceAccount(rawJson: string) {
  const credentials = JSON.parse(rawJson) as GoogleServiceAccount;

  if (credentials.private_key) {
    credentials.private_key = normalizePrivateKey(credentials.private_key);
  }

  return credentials;
}

function decodeBase64ToJson(base64Value: string) {
  const normalized = base64Value.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf8");
}

async function loadGoogleServiceAccount(config: WebhookConfig) {
  if (config.googleServiceAccountJson) {
    return parseGoogleServiceAccount(config.googleServiceAccountJson);
  }

  if (config.googleServiceAccountJsonBase64) {
    return parseGoogleServiceAccount(
      decodeBase64ToJson(config.googleServiceAccountJsonBase64),
    );
  }

  if (config.googleServiceAccountFile) {
    const serviceAccountJson = await readFile(
      config.googleServiceAccountFile,
      "utf8",
    );
    return parseGoogleServiceAccount(serviceAccountJson);
  }

  if (config.googleClientEmail && config.googlePrivateKey) {
    return {
      type: "service_account",
      project_id: config.projectId,
      client_email: config.googleClientEmail,
      private_key: normalizePrivateKey(config.googlePrivateKey),
    } satisfies GoogleServiceAccount;
  }

  return null;
}

function getGoogleCredentialHint() {
  return (
    "Set one of GOOGLE_SERVICE_ACCOUNT_JSON, " +
    "GOOGLE_SERVICE_ACCOUNT_JSON_BASE64, " +
    "GOOGLE_SERVICE_ACCOUNT_FILE/GOOGLE_APPLICATION_CREDENTIALS, or " +
    "GOOGLE_CLIENT_EMAIL + GOOGLE_PRIVATE_KEY."
  );
}

async function getGoogleServices() {
  const scopes = [
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/documents",
  ];
  const config = getConfig();
  const credentials = await loadGoogleServiceAccount(config);
  const authOptions: ConstructorParameters<typeof google.auth.GoogleAuth>[0] = {
    scopes,
    projectId: config.projectId,
  };

  if (credentials) {
    authOptions.credentials = credentials;
  }

  try {
    const auth = new google.auth.GoogleAuth(authOptions);
    const authClient = await auth.getClient();
    const apiAuth = authClient as never;

    const drive = google.drive({
      version: "v3",
      auth: apiAuth,
    });

    const docs = google.docs({
      version: "v1",
      auth: apiAuth,
    });

    return { drive, docs };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes("Could not load the default credentials")) {
      throw new WebhookConfigError(
        "Google authentication is not configured for this Next.js API. " +
          getGoogleCredentialHint(),
        [
          "GOOGLE_SERVICE_ACCOUNT_JSON",
          "GOOGLE_SERVICE_ACCOUNT_JSON_BASE64",
          "GOOGLE_SERVICE_ACCOUNT_FILE",
          "GOOGLE_APPLICATION_CREDENTIALS",
          "GOOGLE_CLIENT_EMAIL",
          "GOOGLE_PRIVATE_KEY",
        ],
      );
    }

    throw error;
  }
}

async function findProspectFolderFuzzy(
  drive: Awaited<ReturnType<typeof getGoogleServices>>["drive"],
  meetingTitle: string,
  sharedDriveId: string,
): Promise<[string | null, string | null]> {
  const cleanedMeeting = cleanString(meetingTitle);

  const query =
    `mimeType = 'application/vnd.google-apps.folder' ` +
    `and '${sharedDriveId}' in parents ` +
    `and trashed = false`;

  const results = await drive.files.list({
    q: query,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    corpora: "allDrives",
    fields: "files(id, name)",
  });

  const folders = results.data.files || [];

  let bestMatchId: string | null = null;
  let bestMatchName: string | null = null;
  let highestScore = 0;

  for (const folder of folders) {
    const cleanedFolder = cleanString(folder.name || "");
    const score = lcsSimilarity(cleanedMeeting, cleanedFolder);

    if (score > highestScore) {
      highestScore = score;
      bestMatchId = folder.id || null;
      bestMatchName = folder.name || null;
    }
  }

  if (highestScore >= 0.6) {
    return [bestMatchId, bestMatchName];
  }

  return [null, null];
}

async function getFathomTranscript(recordingId: string, fathomApiKey: string) {
  try {
    const url = `https://api.fathom.ai/v1/recordings/${recordingId}/transcript`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${fathomApiKey}`,
      },
    });

    if (!res.ok) {
      return "Transcript unavailable.";
    }

    return await res.text();
  } catch {
    return "Transcript unavailable.";
  }
}

async function generateRoadmapWithGemini(
  manualNotes: string,
  hvaContext: string,
  transcriptText: string,
  geminiApiKey: string,
) {
  const systemInstruction =
    "You are the master Volare AI Growth Advisor. Analyze the 'COPIED REPORT TEXT FROM ADVISOR NOTES', " +
    "metadata metrics, and meeting transcript to construct a precise 90-Day Growth Roadmap.\n\n" +
    "Data Processing Directive:\n" +
    "- Extract the exact numerical percentage scores found inside the 'COPIED REPORT TEXT FROM ADVISOR NOTES' section " +
    "(e.g., Overall Health Score, Financials, Sales, Marketing, Leadership, Recruiting, Productivity).\n" +
    "- Explicitly list these percentages next to their respective category section headers inside the completed roadmap document.";

  const userPrompt =
    `Please generate the 90-Day Growth Roadmap using these data arrays:\n\n` +
    `=== 1. COPIED REPORT TEXT FROM ADVISOR NOTES ===\n${manualNotes}\n\n` +
    `=== 2. PROPEL METADATA VALUES ===\n${hvaContext}\n\n` +
    `=== 3. CALL TRANSCRIPT TEXT ===\n${transcriptText}\n`;

  const geminiUrl =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    `gemini-2.5-flash:generateContent?key=${geminiApiKey}`;

  const apiPayload = {
    contents: [
      {
        parts: [{ text: userPrompt }],
      },
    ],
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
  };

  let aiOutput: string | null = null;
  let lastFailure = "Gemini Engine Validation Error";

  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25_000);

      const geminiRes = await fetch(geminiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiPayload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (geminiRes.ok) {
        const data = await geminiRes.json();
        aiOutput =
          data?.candidates?.[0]?.content?.parts?.[0]?.text || null;

        if (aiOutput) {
          break;
        }

        lastFailure = "Gemini returned no roadmap content.";
      } else {
        const errorBody = (await geminiRes.text()).slice(0, 500);
        lastFailure = `Gemini ${geminiRes.status}: ${errorBody || "empty response body"}`;
        await sleep(2 ** attempt * 1000);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      lastFailure = `Gemini request failed: ${message}`;
      await sleep(2 ** attempt * 1000);
    }
  }

  if (!aiOutput) {
    throw new Error(lastFailure);
  }

  return aiOutput;
}

function ensureConfig(config: WebhookConfig, requiredKeys: string[]) {
  const missing = requiredKeys.filter((key) => {
    switch (key) {
      case "SHARED_DRIVE_ID":
        return !config.sharedDriveId;
      case "FATHOM_API_KEY":
        return !config.fathomApiKey;
      case "GEMINI_API_KEY":
        return !config.geminiApiKey;
      default:
        return false;
    }
  });

  if (missing.length > 0) {
    throw new WebhookConfigError(
      `Missing required environment variables: ${missing.join(", ")}`,
      missing,
    );
  }
}

function toTitleCaseCompanyName(companyName: string | null) {
  return cleanString(companyName).replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeObject(value: unknown): AnyObject {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as AnyObject;
  }

  throw new WebhookBadRequestError("Webhook payload must be a JSON object.");
}

async function parsePayload(request: Request): Promise<AnyObject> {
  const rawBody = await request.text();
  const contentType = request.headers.get("content-type")?.toLowerCase() || "";

  if (!rawBody.trim()) {
    return {};
  }

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const formData = new URLSearchParams(rawBody);
    const payloadText = formData.get("payload") || formData.get("data");

    if (payloadText) {
      return normalizeObject(JSON.parse(payloadText));
    }

    return Object.fromEntries(formData.entries());
  }

  try {
    return normalizeObject(JSON.parse(rawBody));
  } catch {
    throw new WebhookBadRequestError(
      "Webhook payload must be valid JSON or form-urlencoded data.",
    );
  }
}

function errorResponse(error: unknown) {
  console.error("[volare-webhook]", error);

  if (error instanceof WebhookBadRequestError) {
    return sendJson(
      {
        status: "error",
        error: "Invalid webhook payload",
        details: error.message,
      },
      400,
    );
  }

  if (error instanceof WebhookConfigError) {
    return sendJson(
      {
        status: "error",
        error: "Webhook configuration error",
        details: error.message,
        missing: error.missing,
      },
      500,
    );
  }

  const message = error instanceof Error ? error.message : String(error);

  return sendJson(
    {
      status: "error",
      error: "Webhook request failed",
      details: message,
    },
    500,
  );
}

async function handleWebhook(payload: AnyObject) {
  const config = getConfig();
  const companyName =
    payload.Company_Name ||
    payload.company_name ||
    payload.company ||
    payload.business;

  const normalizedCompanyName =
    typeof companyName === "string" ? companyName.trim() : "";
  const recordingIdValue = payload.recording_id;
  const recordingId =
    typeof recordingIdValue === "string" || typeof recordingIdValue === "number"
      ? String(recordingIdValue).trim()
      : "";

  if (normalizedCompanyName && !recordingId) {
    ensureConfig(config, ["SHARED_DRIVE_ID"]);

    const { drive } = await getGoogleServices();

    const folder = await drive.files.create({
      requestBody: {
        name: `Prospect: ${normalizedCompanyName}`,
        mimeType: "application/vnd.google-apps.folder",
        parents: [config.sharedDriveId],
      },
      supportsAllDrives: true,
      fields: "id",
    });

    const folderId = folder.data.id;

    if (!folderId) {
      throw new Error("Folder was not created.");
    }

    await drive.files.create({
      requestBody: {
        name: `HVA_Data // ${normalizedCompanyName}.json`,
        parents: [folderId],
      },
      media: {
        mimeType: "application/json",
        body: JSON.stringify(payload, null, 2),
      },
      supportsAllDrives: true,
      fields: "id",
    });

    await drive.files.create({
      requestBody: {
        name: `Notes // ${normalizedCompanyName}`,
        mimeType: "application/vnd.google-apps.document",
        parents: [folderId],
      },
      supportsAllDrives: true,
      fields: "id",
    });

    return sendJson({
      status: "success",
      folder_created: folderId,
    });
  }

  if (recordingId) {
    ensureConfig(config, ["SHARED_DRIVE_ID", "FATHOM_API_KEY", "GEMINI_API_KEY"]);

    const meetingTitleValue = payload.meeting_title;
    const meetingTitle =
      typeof meetingTitleValue === "string" ? meetingTitleValue.trim() : "";

    const { drive, docs } = await getGoogleServices();

    const [folderId, targetCompanyName] = await findProspectFolderFuzzy(
      drive,
      meetingTitle,
      config.sharedDriveId,
    );

    if (!folderId) {
      return sendJson(
        {
          status: "error",
          error: `No fuzzy match found for title: ${meetingTitle}`,
        },
        404,
      );
    }

    const transcriptText = await getFathomTranscript(
      recordingId,
      config.fathomApiKey,
    );

    let manualNotes = "";
    let hvaContext = "";

    const query = `'${folderId}' in parents and trashed = false`;

    const itemsResponse = await drive.files.list({
      q: query,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      corpora: "allDrives",
      fields: "files(id, name, mimeType)",
    });

    const items = itemsResponse.data.files || [];

    for (const item of items) {
      const itemName = item.name || "";
      const itemId = item.id;

      if (!itemId) continue;

      if (itemName.includes("Notes //")) {
        try {
          const doc = await docs.documents.get({
            documentId: itemId,
          });

          const content = doc.data.body?.content || [];

          for (const section of content) {
            const elements = section.paragraph?.elements || [];

            for (const element of elements) {
              const text = element.textRun?.content;

              if (text) {
                manualNotes += text;
              }
            }
          }
        } catch (error) {
          console.warn("[volare-webhook] Failed to read notes document", error);
        }
      } else if (itemName.includes("HVA_Data //")) {
        try {
          const file = await drive.files.get(
            {
              fileId: itemId,
              alt: "media",
              supportsAllDrives: true,
            },
            {
              responseType: "text",
            },
          );

          hvaContext = String(file.data || "");
        } catch (error) {
          console.warn("[volare-webhook] Failed to read HVA data file", error);
        }
      }
    }

    const aiOutput = await generateRoadmapWithGemini(
      manualNotes,
      hvaContext,
      transcriptText,
      config.geminiApiKey,
    );

    const roadmapFile = await drive.files.create({
      requestBody: {
        name: `Draft Roadmap // ${toTitleCaseCompanyName(targetCompanyName)}`,
        mimeType: "application/vnd.google-apps.document",
        parents: [folderId],
      },
      supportsAllDrives: true,
      fields: "id",
    });

    const roadmapId = roadmapFile.data.id;

    if (!roadmapId) {
      throw new Error("Roadmap document ID missing.");
    }

    await docs.documents.batchUpdate({
      documentId: roadmapId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: {
                index: 1,
              },
              text: aiOutput,
            },
          },
        ],
      },
    });

    return sendJson({
      status: "success",
      roadmap_created: roadmapId,
    });
  }

  return sendJson({
    status: "success",
    message: "Volare Master Engine online!",
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET() {
  return sendJson({
    status: "success",
    message: "Volare Master Engine online!",
  });
}

export async function POST(request: Request) {
  try {
    const payload = await parsePayload(request);
    return await handleWebhook(payload);
  } catch (error) {
    return errorResponse(error);
  }
}
