const pool = require("../config/database");
const { convertCurrency } = require("../utils/convertCurrency");

exports.list = async (req, res) => {
  const [expenses] = await pool.query(
    "SELECT e.*, u.name as paid_by_name FROM expenses e JOIN users u ON u.id = e.paid_by WHERE e.group_id = ? ORDER BY e.date DESC",
    [req.params.groupId]
  );
  for (let e of expenses) {
    const [splits] = await pool.query(
      "SELECT es.*, u.name FROM expense_splits es JOIN users u ON u.id = es.user_id WHERE es.expense_id = ?",
      [e.id]
    );
    e.splits = splits;
  }
  res.json(expenses);
};

exports.create = async (req, res) => {
  const { title, description, amount, currency = "INR", date, paid_by, category = "General", split_type = "EQUAL", participants } = req.body;
  const converted = await convertCurrency(amount, currency, "INR");
  
  const [result] = await pool.query(
    "INSERT INTO expenses (group_id, title, description, amount, currency, converted_amount, date, paid_by, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [req.params.groupId, title, description || "", amount, currency, converted, date, paid_by, category]
  );
  const expenseId = result.insertId;

  // Create splits
  if (participants && participants.length > 0) {
    const shareAmount = Number(amount) / participants.length;
    for (let i = 0; i < participants.length; i++) {
      let splitAmt = split_type === "EXACT" ? (participants[i].amount || 0)
        : split_type === "PERCENTAGE" ? (Number(amount) * (participants[i].percent || 0) / 100)
        : shareAmount;
      if (i === participants.length - 1 && split_type === "EQUAL") {
        splitAmt = Number(amount) - shareAmount * (participants.length - 1);
      }
      const convertedSplit = await convertCurrency(splitAmt, currency, "INR");
      await pool.query(
        "INSERT INTO expense_splits (expense_id, user_id, amount, share_type, share_value) VALUES (?, ?, ?, ?, ?)",
        [expenseId, participants[i].user_id, convertedSplit, split_type, split_type !== "EQUAL" ? (participants[i].percent || participants[i].amount || null) : null]
      );
    }
  }

  const [expense] = await pool.query("SELECT * FROM expenses WHERE id = ?", [expenseId]);
  res.status(201).json(expense[0]);
};

exports.update = async (req, res) => {
  const { title, description, amount, currency, date, category, split_type } = req.body;
  const converted = amount ? await convertCurrency(amount, currency || "INR", "INR") : undefined;
  await pool.query(
    "UPDATE expenses SET title=COALESCE(?,title), description=COALESCE(?,description), amount=COALESCE(?,amount), currency=COALESCE(?,currency), converted_amount=COALESCE(?,converted_amount), date=COALESCE(?,date), category=COALESCE(?,category), split_type=COALESCE(?,split_type) WHERE id=?",
    [title, description, amount, currency, converted, date, category, split_type, req.params.id]
  );
  const [expense] = await pool.query("SELECT * FROM expenses WHERE id = ?", [req.params.id]);
  res.json(expense[0]);
};

exports.remove = async (req, res) => {
  await pool.query("DELETE FROM expenses WHERE id = ?", [req.params.id]);
  res.json({ message: "Expense deleted" });
};

exports.balances = async (req, res) => {
  const groupId = req.params.groupId;
  
  // Get all members
  const [members] = await pool.query(
    "SELECT gm.*, u.name, u.email FROM group_members gm JOIN users u ON u.id = gm.user_id WHERE gm.group_id = ? AND gm.left_at IS NULL",
    [groupId]
  );
  
  // Calculate balances
  const balances = {};
  for (const m of members) {
    balances[m.user_id] = { user_id: m.user_id, name: m.name, email: m.email, paid: 0, owes: 0, balance: 0 };
  }

  // What each person paid
  const [paid] = await pool.query(
    "SELECT paid_by, SUM(converted_amount) as total FROM expenses WHERE group_id = ? GROUP BY paid_by",
    [groupId]
  );
  for (const p of paid) {
    if (balances[p.paid_by]) balances[p.paid_by].paid = Number(p.total);
  }

  // What each person owes (via splits)
  const [owed] = await pool.query(
    "SELECT es.user_id, SUM(es.amount) as total FROM expense_splits es JOIN expenses e ON e.id = es.expense_id WHERE e.group_id = ? GROUP BY es.user_id",
    [groupId]
  );
  for (const o of owed) {
    if (balances[o.user_id]) balances[o.user_id].owes = Number(o.total);
  }

  // Settlements
  const [settlements] = await pool.query(
    "SELECT paid_by, paid_to, SUM(converted_amount) as total FROM settlements WHERE group_id = ? GROUP BY paid_by, paid_to",
    [groupId]
  );
  for (const s of settlements) {
    if (balances[s.paid_by]) balances[s.paid_by].paid -= Number(s.total);
    if (balances[s.paid_to]) balances[s.paid_to].owes -= Number(s.total);
  }

  for (const id in balances) {
    balances[id].balance = Number(balances[id].paid) - Number(balances[id].owes);
  }

  // Debt simplification
  const debts = Object.values(balances).filter(b => b.balance !== 0).sort((a, b) => a.balance - b.balance);
  const plan = [];
  let i = 0, j = debts.length - 1;
  while (i < j) {
    const debtor = debts[i];
    const creditor = debts[j];
    const amount = Math.min(Math.abs(debtor.balance), creditor.balance);
    if (amount > 0.01) {
      plan.push({ from: debtor.name, from_id: debtor.user_id, to: creditor.name, to_id: creditor.user_id, amount: Math.round(amount * 100) / 100 });
    }
    debtor.balance += amount;
    creditor.balance -= amount;
    if (Math.abs(debtor.balance) < 0.01) i++;
    if (Math.abs(creditor.balance) < 0.01) j--;
  }

  res.json({ balances: Object.values(balances), settlement_plan: plan });
};