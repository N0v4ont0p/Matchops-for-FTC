export interface UpcomingMatch {
  id: string;
  number: number;
  red: string[];
  blue: string[];
  startTime?: string;
}

interface FtcScoutMatch {
  match_number?: number;
  score_red_final?: number;
  score_blue_final?: number;
  teams?: {
    red?: string[];
    blue?: string[];
  };
  start_time?: string;
}

export async function fetchUpcomingMatches(eventCode: string): Promise<UpcomingMatch[]> {
  const base = import.meta.env.VITE_FTCSCOUT_BASE_URL || "https://api.ftcscout.org/rest/v1";
  const url = `${base}/events/${encodeURIComponent(eventCode)}/matches`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`FTCScout request failed with ${response.status}`);
  }

  const body = (await response.json()) as FtcScoutMatch[];

  return body
    .filter((item) => item.score_red_final == null && item.score_blue_final == null)
    .slice(0, 8)
    .map((item, index) => ({
      id: `${item.match_number ?? index}`,
      number: item.match_number ?? index + 1,
      red: item.teams?.red ?? [],
      blue: item.teams?.blue ?? [],
      startTime: item.start_time
    }));
}
