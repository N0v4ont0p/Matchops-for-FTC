export interface UpcomingMatch {
  id: string;
  description: string;
  scheduledStartTime?: string;
  red: string[];
  blue: string[];
}

export interface EventContext {
  code: string;
  name: string;
  timezone: string;
  hasMatches: boolean;
  upcomingMatches: UpcomingMatch[];
}

export interface TeamLookupResult {
  number: number;
  name: string;
  schoolName?: string;
  city?: string;
  state?: string;
  country?: string;
  website?: string;
}

interface GraphQlMatchTeam {
  alliance: "Red" | "Blue";
  team: {
    number: number;
    name: string;
  };
}

interface GraphQlMatch {
  id: number;
  description: string;
  hasBeenPlayed: boolean;
  scheduledStartTime?: string;
  teams: GraphQlMatchTeam[];
}

interface GraphQlEvent {
  code: string;
  name: string;
  timezone: string;
  hasMatches: boolean;
  matches: GraphQlMatch[];
}

interface GraphQlResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

const GRAPHQL_ENDPOINT = "https://api.ftcscout.org/graphql";

async function requestGraphql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({ query, variables })
  });

  if (!response.ok) {
    throw new Error(`FTCScout GraphQL request failed with ${response.status}`);
  }

  const payload = (await response.json()) as GraphQlResponse<T>;
  if (payload.errors?.length) {
    throw new Error(payload.errors[0].message || "FTCScout GraphQL error");
  }
  if (!payload.data) {
    throw new Error("FTCScout GraphQL empty response");
  }
  return payload.data;
}

function mapUpcomingMatches(matches: GraphQlMatch[]): UpcomingMatch[] {
  const sorted = matches
    .slice()
    .sort((a, b) => {
      const ta = a.scheduledStartTime ? Date.parse(a.scheduledStartTime) : Number.MAX_SAFE_INTEGER;
      const tb = b.scheduledStartTime ? Date.parse(b.scheduledStartTime) : Number.MAX_SAFE_INTEGER;
      return ta - tb;
    });

  const upcoming = sorted.filter((m) => !m.hasBeenPlayed).slice(0, 10);
  const fallback = sorted.slice(-10);
  const source = upcoming.length > 0 ? upcoming : fallback;

  return source.map((match) => {
    const red = match.teams
      .filter((entry) => entry.alliance === "Red")
      .map((entry) => `${entry.team.number}`);
    const blue = match.teams
      .filter((entry) => entry.alliance === "Blue")
      .map((entry) => `${entry.team.number}`);

    return {
      id: `${match.id}`,
      description: match.description,
      scheduledStartTime: match.scheduledStartTime,
      red,
      blue
    };
  });
}

export async function fetchEventContextGraphql(season: number, eventCode: string): Promise<EventContext> {
  const query = `
    query EventContext($season: Int!, $code: String!) {
      eventByCode(season: $season, code: $code) {
        code
        name
        timezone
        hasMatches
        matches {
          id
          description
          hasBeenPlayed
          scheduledStartTime
          teams {
            alliance
            team {
              number
              name
            }
          }
        }
      }
    }
  `;

  const data = await requestGraphql<{ eventByCode: GraphQlEvent | null }>(query, {
    season,
    code: eventCode.toUpperCase()
  });

  if (!data.eventByCode) {
    throw new Error("Event not found");
  }

  return {
    code: data.eventByCode.code,
    name: data.eventByCode.name,
    timezone: data.eventByCode.timezone,
    hasMatches: data.eventByCode.hasMatches,
    upcomingMatches: mapUpcomingMatches(data.eventByCode.matches || [])
  };
}

export async function lookupTeamByNumberRest(teamNumber: number): Promise<TeamLookupResult | null> {
  const url = `https://api.ftcscout.org/rest/v1/teams/${teamNumber}`;
  const response = await fetch(url);

  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`FTCScout REST request failed with ${response.status}`);
  }

  const body = (await response.json()) as {
    number: number;
    name: string;
    schoolName?: string;
    city?: string;
    state?: string;
    country?: string;
    website?: string;
  };

  return {
    number: body.number,
    name: body.name,
    schoolName: body.schoolName,
    city: body.city,
    state: body.state,
    country: body.country,
    website: body.website
  };
}
