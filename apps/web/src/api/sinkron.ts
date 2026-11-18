import type { ResponsSinkron } from '../domain/tipe'
import { request } from './client'

export const sinkronApi = {
  kesehatan: () => request<{ status: string; build: string }>('GET', '/api/kesehatan'),
  sinkron: (sejak: number) => request<ResponsSinkron>('GET', `/api/sinkron?sejak=${sejak}`),
}
