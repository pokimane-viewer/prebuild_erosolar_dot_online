'use client';

import React, { useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import bcrypt from 'bcryptjs';
import dynamic from 'next/dynamic';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

/* detectLeak now logs user count and Σ2^cost×|pw| each run */

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Bar = dynamic(() => import('react-chartjs-2').then((m) => m.Bar), {
  ssr: false
});

export default function Home() {
  const [showMore, setShowMore] = useState(true);
  const [showExplanation, setShowExplanation] = useState(true);
  const [showAdvancedInfo, setShowAdvancedInfo] = useState(true);

  const [users, setUsers] = useState<
    { email: string; salt: string; hash: string; len: number }[]
  >([]);
  const [log, setLog] = useState<string[]>([]);
  const [math, setMath] = useState<Record<string, unknown>>({});
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPw, setSignupPw] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPw, setLoginPw] = useState('');
  const [leakPw, setLeakPw] = useState('');
  const [nextCost, setNextCost] = useState(10);

  const addLog = useCallback((m: string) => setLog((p) => [...p, m]), []);

  const parseBcrypt = useCallback((h: string) => {
    const [, alg, costStr, tail] = h.split('$');
    const cost = Number(costStr);
    const salt = tail.slice(0, 22);
    const hash = tail.slice(22);
    return { fullHash: h, alg, cost, salt, hash };
  }, []);

  const signup = useCallback(
    (email: string, pw: string) => {
      if (!email || !pw) {
        addLog('Signup failed – email and password required');
        return;
      }
      if (users.find((u) => u.email === email)) {
        addLog(`Signup failed – ${email} exists`);
        return;
      }
      const salt = bcrypt.genSaltSync(nextCost);
      const hash = bcrypt.hashSync(pw, salt);
      setUsers((p) => [...p, { email, salt, hash, len: pw.length }]);
      setMath((m) => ({ ...m, [email]: parseBcrypt(hash) }));
      addLog(`Signup ${email} → hash saved (cost=${nextCost})`);
    },
    [addLog, nextCost, parseBcrypt, users]
  );

  const login = useCallback(() => {
    const u = users.find((x) => x.email === loginEmail.trim());
    if (!u) {
      addLog(`Login failed – unknown user ${loginEmail}`);
      return;
    }
    const ok = bcrypt.compareSync(loginPw, u.hash);
    addLog(`Login ${u.email} with "${loginPw}" → ${ok ? 'success' : 'failure'}`);
  }, [addLog, loginEmail, loginPw, users]);

  const detectLeak = useCallback(() => {
    addLog(`Users in DB: ${users.length}`);
    const checkComplexity = users.reduce((s, u) => {
      const { cost } = parseBcrypt(u.hash);
      return s + (1 << cost) * u.len;
    }, 0);
    addLog(`Complexity this check: ${checkComplexity}`);
    let found = false;
    users.forEach((u) => {
      const h = bcrypt.hashSync(leakPw, u.salt);
      if (h === u.hash) {
        const { cost } = parseBcrypt(u.hash);
        addLog(`Leak match: "${leakPw}" for ${u.email} (cost=${cost})`);
        found = true;
      }
    });
    if (!found) addLog(`Leak check: "${leakPw}" matched no users`);
  }, [addLog, leakPw, parseBcrypt, users]);

  const detectLeakValue = useCallback(
    (pw: string) => {
      addLog(`Users in DB: ${users.length}`);
      const checkComplexity = users.reduce((s, u) => {
        const { cost } = parseBcrypt(u.hash);
        return s + (1 << cost) * u.len;
      }, 0);
      addLog(`Complexity this check: ${checkComplexity}`);
      let found = false;
      users.forEach((u) => {
        const h = bcrypt.hashSync(pw, u.salt);
        if (h === u.hash) {
          const { cost } = parseBcrypt(u.hash);
          addLog(`Leak match: "${pw}" for ${u.email} (cost=${cost})`);
          found = true;
        }
      });
      if (!found) addLog(`Leak check: "${pw}" matched no users`);
    },
    [addLog, parseBcrypt, users]
  );

  const autoSetup = useCallback(() => {
    ['password123', 'password321'].forEach((pw, idx) => {
      const email = `erosolar_bits_${Date.now()}_${idx}@auto.bot`;
      signup(email, pw);
      setTimeout(() => detectLeakValue(pw), 0);
    });
  }, [detectLeakValue, signup]);

  const perUserComplexities = useMemo(
    () =>
      users.map((u) => {
        const { cost } = parseBcrypt(u.hash);
        return (1 << cost) * u.len;
      }),
    [parseBcrypt, users]
  );

  const complexity = useMemo(
    () => perUserComplexities.reduce((a, b) => a + b, 0),
    [perUserComplexities]
  );

  const erosolarData = useMemo(
    () => ({
      labels: ['Love', 'Courage', 'Wonder', 'Joy', 'Resilience', 'Peace'],
      datasets: [
        {
          label: 'Erosolar Spirit',
          data: [100, 98, 95, 99, 97, 100],
          backgroundColor: [
            'rgba(255, 99, 132, 0.5)',
            'rgba(255, 159, 64, 0.5)',
            'rgba(255, 205, 86, 0.5)',
            'rgba(75, 192, 192, 0.5)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(153, 102, 255, 0.5)'
          ]
        }
      ]
    }),
    []
  );

  const erosolarOptions = useMemo(
    () => ({
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        title: { display: true, text: 'For erosolar – a lovely chart by Bo' }
      }
    }),
    []
  );

  const complexityData = useMemo(
    () => ({
      labels: [`Users: ${users.length}`],
      datasets: [
        {
          label: 'Σ 2^cost × |pw|',
          data: [complexity],
          backgroundColor: 'rgba(255, 99, 132, 0.5)'
        }
      ]
    }),
    [complexity, users.length]
  );

  const perUserData = useMemo(
    () => ({
      labels: users.map((u) => u.email),
      datasets: [
        {
          label: '2^cost × |pw| (per user)',
          data: perUserComplexities,
          backgroundColor: 'rgba(54, 162, 235, 0.5)'
        }
      ]
    }),
    [perUserComplexities, users]
  );

  const complexityOptions = useMemo(
    () => ({
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        title: { display: true, text: 'Total Algorithmic Complexity' }
      }
    }),
    []
  );

  const perUserOptions = useMemo(
    () => ({
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        title: { display: true, text: 'Per-User Complexity' }
      }
    }),
    []
  );

  return (
    <main className="prose mx-auto p-4">
      <Link href="https://boshang9.wordpress.com/blog/">
        <a>
          <h2>
            I only need to prove my HYPOTHESIS that AWS total compute + quantum
            chips cannot solve this problem, since its not a quantum problem.
          </h2>
        </a>
      </Link>

      <Link href="www.baidu.com">
        <a>
          <h1>
            Believe me or not, to manually check this, since Im only considering
            auto-mode, but I dont work for Andy Jassy lol he utilizes the H1B
            program, more than anyone else, you need to get a list of all the
            leaked plaintext in the world, then check ur little hearts out. try
            manually checking for password321 after u auto make some accts, then
            try again after making another acct with not password321 or
            password123 pw; then HOLY FUCK. <br />
            <br />
            Here’s the time and space complexity of each approach, in plain
            English:
            <br />
            <br />
            Hashing N passwords with raw SHA-256<br />
            Time: O(N)<br />
            Space: O(N)<br />
            Hashing N passwords with per-password salts<br />
            Time: O(N)<br />
            Space: O(N)<br />
            Checking N passwords against a leaked list of M plaintexts (naïve)<br />
            Time: O(N × M)<br />
            Space: O(N + M)<br />
            Checking N passwords against M leaked plaintexts using a hash
            set<br />
            Time: O(N + M)<br />
            Space: O(N + M)
            <br />
            <br />
            Bottom line: simple hashing is linear; naïve leak checking is
            quadratic; using a set brings it back to linear.
          </h1>
        </a>
      </Link>

      <section>
        <h2>Signup, Login, Leak Detection</h2>

        <div className="flex flex-wrap gap-2">
          <input
            placeholder="cost (e.g., 12)"
            value={nextCost}
            onChange={(e) => setNextCost(Number(e.target.value) || 10)}
            className="w-20 px-2 py-1 border rounded"
          />
          <input
            placeholder="signup email"
            value={signupEmail}
            onChange={(e) => setSignupEmail(e.target.value)}
            className="flex-1 px-2 py-1 border rounded"
          />
          <input
            placeholder="password"
            value={signupPw}
            type="password"
            onChange={(e) => setSignupPw(e.target.value)}
            className="flex-1 px-2 py-1 border rounded"
          />
          <button onClick={() => signup(signupEmail, signupPw)} className="btn">
            Sign Up
          </button>
          <button onClick={autoSetup} className="btn">
            Auto Setup erosolar_bits
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <input
            placeholder="login email"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            className="flex-1 px-2 py-1 border rounded"
          />
          <input
            placeholder="password"
            value={loginPw}
            type="password"
            onChange={(e) => setLoginPw(e.target.value)}
            className="flex-1 px-2 py-1 border rounded"
          />
          <button onClick={login} className="btn">
            Login
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <input
            placeholder="leaked plaintext"
            value={leakPw}
            onChange={(e) => setLeakPw(e.target.value)}
            className="flex-1 px-2 py-1 border rounded"
          />
          <button onClick={detectLeak} className="btn">
            Check Leak
          </button>
        </div>

        <pre className="bg-black text-green-400 p-4 mt-4 whitespace-pre-wrap overflow-x-auto">
          {log.join('\n')}
        </pre>

        <h3>Bcrypt Math</h3>
        <pre className="bg-gray-900 text-cyan-300 p-4 overflow-x-auto">
          {JSON.stringify(math, null, 2)}
        </pre>
      </section>

      <section className="mt-8">
        <Bar data={erosolarData} options={erosolarOptions} />
        <Bar data={complexityData} options={complexityOptions} className="mt-8" />
        {users.length > 0 && (
          <Bar data={perUserData} options={perUserOptions} className="mt-8" />
        )}
      </section>

      <p className="mt-8">
        SHA-256 is a one-way hash, which is why Twitch allegedly stores SHA-256
        hashes of plaintext passwords in
      </p>
    </main>
  );
}
