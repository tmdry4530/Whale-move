import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { buildServer } from '../src/server.js'
import type { FastifyInstance } from 'fastify'

let app: FastifyInstance

beforeAll(async () => {
  app = await buildServer()
})

afterAll(async () => {
  await app.close()
})

describe('api routes', () => {
  it('returns health', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' })
    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ status: 'ok' })
  })

  it('returns events', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/events' })
    expect(response.statusCode).toBe(200)
    const payload = response.json() as Array<{ id: string }>
    expect(payload.length).toBe(21)
    expect(payload.some((item) => item.id === 'ftx_collapse')).toBe(true)
  })

  it('returns event window', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/events/ftx_collapse/window' })
    expect(response.statusCode).toBe(200)
    const payload = response.json() as { window: Array<{ dayOffset: number }> }
    expect(payload.window).toHaveLength(15)
  })

  it('returns event news', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/events/ftx_collapse/news?limit=5' })
    expect(response.statusCode).toBe(200)
    const payload = response.json() as Array<{ url: string }>
    expect(payload.length).toBeGreaterThan(0)
  })

  it('returns fear greed series', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/fear-greed?from=2022-11-04&to=2022-11-18' })
    expect(response.statusCode).toBe(200)
    const payload = response.json() as Array<{ indexDate: string }>
    expect(payload.length).toBeGreaterThan(0)
  })
})
