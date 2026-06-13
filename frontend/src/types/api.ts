export type User = { id: number; name: string; email: string; created_at: string };
export type Group = { id: number; name: string; description?: string; default_currency: string; created_at: string; members?: GroupMember[] };
export type GroupMember = { id: number; group_id: number; user_id: number; joined_at: string; left_at?: string; user: User };
export type ExpenseParticipant = { user_id: number; share_value?: number; amount_owed?: number; user?: User };
export type Expense = {
  id: number;
  group_id: number;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  converted_amount_inr: number;
  date: string;
  paid_by_id: number;
  split_type: "EQUAL" | "EXACT" | "PERCENTAGE" | "SHARES";
  participants: ExpenseParticipant[];
  paid_by: User;
};
export type Dashboard = {
  total_expenses: number;
  amount_spent: number;
  amount_owed: number;
  amount_to_receive: number;
  active_groups: number;
  pending_settlements: number;
  monthly_expenses: { month: string; amount: number }[];
  category_breakdown: { name: string; value: number }[];
  recent_activity: { id: number; group: string; title: string; amount: number; date: string }[];
};

