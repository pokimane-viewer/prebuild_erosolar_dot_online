import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FaHome, FaBriefcase } from 'react-icons/fa';
import '../styles/globals.css';

export default function MyApp({ Component, pageProps }) {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <>
      <Head>
        <link rel="icon" href="/assets/favicon.ico" />
      </Head>
      <div className={darkMode ? 'dark-mode' : ''}>
        <nav className="nav-bar">
          <Link href="/">
            <a className="nav-link">
              <FaHome size={30} style={{ marginRight: '8px' }} />
              Home
            </a>
          </Link>
          <Link href="/jobs">
            <a className="nav-link">
              <FaBriefcase size={30} style={{ marginRight: '8px' }} />
              Jobs
            </a>
          </Link>
          <Link href="https://erosolar.online/xcode" passHref>
            <a className="nav-link" target="_blank" rel="noopener noreferrer">
              Xcode
            </a>
          </Link>
          <button className="toggle-button" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </nav>
        <Component {...pageProps} />
      </div>
    </>
  );
}
