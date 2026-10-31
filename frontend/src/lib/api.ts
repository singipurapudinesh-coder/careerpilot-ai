
export interface InterviewQuestionItem {
  category: string;
  question: string;
  rationale: string;
  sample_answer_guide: string;
  difficulty: string;
}

export interface MatchAnalysisResponse {
  analysis_id?: string;
  overall_score: number;
  skill_coverage_score: number;
  semantic_score: number;
  experience_score: number;
  matched_skills: string[];
  missing_skills: string[];
  bonus_skills: string[];
  gap_recommendations: string[];
  interview_questions: InterviewQuestionItem[];
}

export interface ParsedResumeResponse {
  id?: string;
  filename?: string;
  sections: Record<string, string>;
  extracted_skills: string[];
  word_count: number;
  estimated_experience_years?: number;
}

/**
 * API configuration
 *
 * Local development:
 *   http://localhost:8000/api/v1
 *
 * Production:
 *   Set NEXT_PUBLIC_API_URL in Vercel to:
 *   https://careerpilot-ai-b6n6.onrender.com/api/v1
 */
const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"
).replace(/\/+$/, "");

/**
 * Sends a request to the backend and provides a helpful error
 * if the backend cannot be reached.
 */
async function safeFetch(
  url: string,
  options: RequestInit
): Promise<Response> {
  try {
    return await fetch(url, options);
  } catch (err: unknown) {
    if (err instanceof TypeError) {
      throw new Error(
        `Could not connect to the CareerPilot backend at ${API_BASE_URL}. ` +
          "Please check the backend URL, network connection, and CORS configuration."
      );
    }

    throw err;
  }
}

/**
 * Uploads a resume file and returns the parsed resume data.
 */
export async function uploadResumeFile(
  file: File
): Promise<ParsedResumeResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await safeFetch(`${API_BASE_URL}/resumes/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));

    throw new Error(
      errorData.detail || "Failed to upload and parse resume file."
    );
  }

  return res.json();
}

/**
 * Runs the complete resume and job-description matching pipeline.
 */
export async function analyzeFullPipeline(
  resumeText: string,
  jdText: string,
  roleTitle = "Senior Full Stack Engineer",
  company = "Tech Company"
): Promise<MatchAnalysisResponse> {
  const res = await safeFetch(`${API_BASE_URL}/match/full-pipeline`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      resume_text: resumeText,
      jd_text: jdText,
      role_title: roleTitle,
      company,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));

    throw new Error(
      errorData.detail || "Match analysis request failed."
    );
  }

  return res.json();
}

/**
 * Checks the backend health endpoint.
 *
 * Works locally and in production by deriving /health
 * from the configured API base URL.
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const healthUrl = `${API_BASE_URL.replace(/\/api\/v1\/?$/, "")}/health`;

    const res = await fetch(healthUrl, {
      method: "GET",
    });

    return res.ok;
  } catch {
    return false;
  }
}
