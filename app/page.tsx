'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Transaction = {
  id: number;
  description: string;
  category: string;
  type: 'profit' | 'loss';
  amount: number;
  date: string;
  created_at: string;
};

type Session = {
  user: {
    id: string;
    email: string | null;
    user_metadata: { full_name?: string };
  };
};

export default function HomePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Sales');
  const [type, setType] = useState<'profit' | 'loss'>('profit');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [errorMessage, setErrorMessage] = useState('');

  const totalProfit = useMemo(
    () => transactions.filter((tx) => tx.type === 'profit').reduce((sum, tx) => sum + tx.amount, 0),
    [transactions]
  );

  const totalLoss = useMemo(
    () => transactions.filter((tx) => tx.type === 'loss').reduce((sum, tx) => sum + tx.amount, 0),
    [transactions]
  );

  const netProfit = totalProfit - totalLoss;

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session as Session | null);
      if (data.session) {
        fetchTransactions(data.session.user.id);
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange((event, authSession) => {
      setSession(authSession?.session as Session | null);
      if (authSession?.session) {
        fetchTransactions(authSession.session.user.id);
      } else {
        setTransactions([]);
      }
    });

    return () => listener?.subscription.unsubscribe();
  }, []);

  const fetchTransactions = async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from<Transaction>('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    setLoading(false);
    if (error) {
      setErrorMessage(error.message);
      return;
    }
    setTransactions(data || []);
  };

  const handleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) {
      setErrorMessage(error.message);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setTransactions([]);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    if (!session) {
      setErrorMessage('Please log in first.');
      return;
    }

    const parsedAmount = Number(amount);
    if (!description || !category || !date || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('Please fill all fields and enter a valid amount.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('transactions').insert({
      user_id: session.user.id,
      description,
      category,
      type,
      amount: parsedAmount,
      date,
    });

    setLoading(false);
    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setDescription('');
    setCategory('Sales');
    setType('profit');
    setAmount('');
    setDate(new Date().toISOString().slice(0, 10));
    fetchTransactions(session.user.id);
  };

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 text-slate-900">
      <div className="mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">Profit & Loss Statement Tracker</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-900">Saify Traders</h1>
            <p className="max-w-2xl text-slate-600">Track business income, expenses, and net profit using Supabase data storage and Google login.</p>
          </div>
          <div className="flex items-center gap-3">
            {session ? (
              <>
                <span className="text-sm text-slate-600">Signed in as {session.user.email ?? 'user'}</span>
                <button onClick={handleSignOut} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700">
                  Sign out
                </button>
              </>
            ) : (
              <button onClick={handleSignIn} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700">
                Sign in with Google
              </button>
            )}
          </div>
        </header>

        {errorMessage ? (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">{errorMessage}</div>
        ) : null}

        {session ? (
          <section className="grid gap-8 lg:grid-cols-[360px_1fr]">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <h2 className="mb-4 text-xl font-semibold">Add transaction</h2>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <label className="block text-sm font-medium text-slate-700">
                  Description
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Sale, rent, utilities"
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Category
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900"
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    placeholder="Sales"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Amount
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900"
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                      placeholder="0.00"
                    />
                  </label>

                  <label className="block text-sm font-medium text-slate-700">
                    Date
                    <input
                      type="date"
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900"
                      value={date}
                      onChange={(event) => setDate(event.target.value)}
                    />
                  </label>
                </div>

                <label className="block text-sm font-medium text-slate-700">
                  Transaction type
                  <select
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900"
                    value={type}
                    onChange={(event) => setType(event.target.value as 'profit' | 'loss')}
                  >
                    <option value="profit">Profit</option>
                    <option value="loss">Loss</option>
                  </select>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? 'Saving…' : 'Save transaction'}
                </button>
              </form>
            </div>

            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <p className="text-sm text-slate-500">Total profit</p>
                  <p className="mt-2 text-3xl font-semibold text-emerald-600">${totalProfit.toFixed(2)}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <p className="text-sm text-slate-500">Total loss</p>
                  <p className="mt-2 text-3xl font-semibold text-rose-600">${totalLoss.toFixed(2)}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <p className="text-sm text-slate-500">Net profit</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">${netProfit.toFixed(2)}</p>
                </div>
              </div>

              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
                <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
                  <h2 className="text-lg font-semibold text-slate-900">Recent transactions</h2>
                </div>
                <div className="divide-y divide-slate-200">
                  {loading && transactions.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">Loading transactions…</div>
                  ) : transactions.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">No transactions yet. Add one to begin tracking.</div>
                  ) : (
                    transactions.map((transaction) => (
                      <div key={transaction.id} className="px-6 py-4 sm:flex sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{transaction.description}</p>
                          <p className="mt-1 text-sm text-slate-500">{transaction.category} · {transaction.date}</p>
                        </div>
                        <div className="mt-3 flex items-center gap-3 sm:mt-0">
                          <span className={`rounded-full px-3 py-1 text-sm font-medium ${transaction.type === 'profit' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {transaction.type}
                          </span>
                          <p className="text-lg font-semibold text-slate-900">${transaction.amount.toFixed(2)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center">
            <p className="text-lg font-medium text-slate-900">Use Google login to start tracking profits and losses.</p>
            <p className="mt-3 text-sm text-slate-600">Your transactions are stored securely in Supabase and are scoped to your account.</p>
          </div>
        )}
      </div>
    </main>
  );
}
