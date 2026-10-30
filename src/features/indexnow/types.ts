export type IndexNowStatus = { key: string | null; keyFileUrl: string | null };

export type IndexNowSubmission = {
  requested: number;
  submitted: number;
  results: {
    ok: boolean;
    count: number;
    attempts: { endpoint: string; status: number; meaning: string }[];
  }[];
};
