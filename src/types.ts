export type Language = "en" | "zh";

export type AppTab = "recon" | "pit" | "batteries" | "notes";

export interface Workspace {
  id: string;
  teamName: string;
  teamCode: string;
  createdBy: string;
  members: string[];
  createdAt: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  workspaceId: string | null;
  language: Language;
  updatedAt: number;
}

export interface ReconEntry {
  id: string;
  phase: "auto" | "teleop";
  observation: string;
  penalty: string;
  strategyUpdate: string;
  createdBy: string;
  createdAt: number;
}

export interface PitIssue {
  id: string;
  title: string;
  description: string;
  status: "open" | "in_progress" | "resolved";
  createdAt: number;
  updatedAt: number;
}

export interface Battery {
  id: string;
  label: string;
  status: "ready" | "charging" | "retired";
  notes: string;
  updatedAt: number;
}

export interface TeamNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  updatedAt: number;
}
