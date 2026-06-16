/**
 * PRAGMA — MAPs API
 * Owner: Ashwin + Diyasha — M2/M3
 */

import api from '../services/api'

export const getMAPs = (filters = {}) =>
  api.get('/maps', { params: filters }).then((r) => r.data)

export const getMAPById = (id) =>
  api.get(`/maps/${id}`).then((r) => r.data)

export const updateMAPStatus = (id, status) => {
  // Normalise "IN_PROGRESS" -> "In Progress" to match the backend's stored form
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  return api.patch(`/maps/${id}/status`, { status: label }).then((r) => r.data)
}
