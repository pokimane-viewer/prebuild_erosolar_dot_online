import React from 'react'
import Chart from 'chart.js/auto'
import { Bar } from 'react-chartjs-2'
import axios from 'axios'
import * as cheerio from 'cheerio'
import { useRouter } from 'next/router'

async function priorityBFSCrawl(startUrl, maxPages = 3) {
  const visited = new Set()
  const results = []
  const queue = [{ url: startUrl, priority: 0 }]
  const logs = []

  while (queue.length && results.length < maxPages) {
    queue.sort((a, b) => a.priority - b.priority)
    const current = queue.shift()
    logs.push(`Now visiting: ${current.url} with priority ${current.priority}`)
    if (visited.has(current.url)) {
      logs.push(`Already visited: ${current.url}`)
      continue
    }
    visited.add(current.url)
    try {
      const { data } = await axios.get(current.url)
      logs.push(`Successfully crawled: ${current.url}`)
      const $ = cheerio.load(data)
      $('div.job-tile').each((i, el) => {
        const title = $(el).find('.job-title').text().trim()
        const location = $(el).find('p.location-and-id').text().trim()
        const company = 'Twitch'
        const salary = ''
        if (title && location) {
          results.push({ title, location, company, salary })
          logs.push(`Found job: ${title} | ${location}`)
        }
      })
      $('a').each((i, el) => {
        const href = $(el).attr('href')
        if (href && href.startsWith('/en/jobs') && !visited.has('https://www.amazon.jobs' + href)) {
          queue.push({ url: 'https://www.amazon.jobs' + href, priority: current.priority + 1 })
          logs.push(`Queueing link: https://www.amazon.jobs${href}`)
        }
      })
    } catch (e) {
      logs.push(`Error crawling: ${current.url} - ${e.message}`)
    }
  }
  return { results, logs }
}

export async function getServerSideProps() {
  const { results: scraped, logs } = await priorityBFSCrawl('https://www.amazon.jobs/en/teams/twitch')
  const jobs = scraped.filter((job) => {
    const loc = job.location.toLowerCase()
    return !(
      loc.includes('china') ||
      loc.includes('beijing') ||
      loc.includes('shanghai') ||
      loc.includes('shenzhen')
    )
  })
  return { props: { jobs, logs } }
}

export default function Jobs({ jobs, logs }) {
  const router = useRouter()

  const chartData = {
    labels: ['Frontend', 'Backend', 'DevOps', 'Full Stack', 'Mobile', 'Data'],
    datasets: [
      {
        label: 'Number of Openings (Approx)',
        data: [60, 80, 40, 70, 50, 65],
        backgroundColor: ['#a29bfe', '#81ecec', '#fdcb6e', '#fab1a0', '#74b9ff', '#55efc4']
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    scales: {
      y: { beginAtZero: true }
    }
  }

  const renderJobCards = (jobs) => {
    return jobs.map((job, index) => (
      <div
        key={index}
        style={{
          border: '1px solid #ddd',
          borderRadius: 8,
          padding: 16,
          margin: 8,
          minWidth: 250
        }}
      >
        <h3 style={{ margin: '4px 0' }}>{job.title}</h3>
        <p style={{ margin: '4px 0' }}>{job.company}</p>
        <p style={{ margin: '4px 0' }}>{job.location}</p>
        <p style={{ margin: '4px 0', fontWeight: 'bold' }}>{job.salary}</p>
      </div>
    ))
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: 20 }}>
      <video width="100%" controls>
        <source src="/assets/Orchestral.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <h1>Jobs</h1>
      <p>Find your next opportunity here.</p>
      <a href="https://www.twitch.tv/jobs/en/careers/">Twitch Jobs</a>
      <p>
        It has been suggested that Twitch's likelihood (0%) of ever achieving profitability
        is even smaller than Bo Shang's chances of securing a job while high on meth,
        though we sincerely hope for the best for everyone involved.
      </p>
      <button onClick={() => router.replace(router.asPath)}>Crawl</button>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 30 }}>
        <h2>Software Jobs Overview</h2>
        <div style={{ width: '80%', maxWidth: 600 }}>
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>
      <div style={{ marginTop: 30 }}>
        <h2>Openings</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {renderJobCards(jobs)}
        </div>
      </div>
      <div style={{ marginTop: 30 }}>
        <h2>Crawl Status</h2>
        <pre
          style={{
            background: '#f0f0f0',
            padding: 10,
            whiteSpace: 'pre-wrap',
            borderRadius: 6
          }}
        >
          {logs && logs.join('\n')}
        </pre>
      </div>
    </div>
  )
}