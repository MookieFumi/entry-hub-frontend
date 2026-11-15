import { FALLBACK_TIME_ZONE } from '@/lib/dates'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, unwrap } from './client'
import type { components } from './schema'

export type Room = components['schemas']['RoomResponse']
export type Booking = components['schemas']['BookingResponse']
export type CreateBookingRequest = components['schemas']['CreateBookingRequest']
export type CreateRoomRequest = components['schemas']['CreateRoomRequest']
export type UpdateRoomRequest = components['schemas']['UpdateRoomRequest']
export type BookingStatus = components['schemas']['BookingStatus']

export const keys = {
  me: ['me'] as const,
  rules: ['rules'] as const,
  rooms: (params: object) => ['rooms', params] as const,
  room: (id: string) => ['room', id] as const,
  availability: (params: object) => ['availability', params] as const,
  schedule: (id: string, from: string, to: string) => ['schedule', id, from, to] as const,
  myBookings: (params: object) => ['bookings', 'mine', params] as const,
  allBookings: (params: object) => ['bookings', 'all', params] as const,
  booking: (id: string) => ['booking', id] as const,
}

export const useMe = (enabled = true) =>
  useQuery({
    queryKey: keys.me,
    queryFn: () => unwrap(api.GET('/api/v1/me')),
    enabled,
    staleTime: 5 * 60_000,
  })

export const useRules = (enabled = true) =>
  useQuery({
    queryKey: keys.rules,
    queryFn: () => unwrap(api.GET('/api/v1/rules')),
    enabled,
    staleTime: 10 * 60_000,
  })

/** Office time zone from the rules (with a provisional value while they load). */
export const useOfficeZone = () => useRules().data?.timeZone ?? FALLBACK_TIME_ZONE

export type RoomsParams = {
  floor?: number
  minCapacity?: number
  includeInactive?: boolean
  page?: number
  pageSize?: number
}

export const useRooms = (p: RoomsParams) =>
  useQuery({
    queryKey: keys.rooms(p),
    queryFn: () =>
      unwrap(
        api.GET('/api/v1/rooms', {
          params: {
            query: {
              Floor: p.floor,
              MinCapacity: p.minCapacity,
              IncludeInactive: p.includeInactive,
              Page: p.page,
              PageSize: p.pageSize,
            },
          },
        }),
      ),
    placeholderData: keepPreviousData,
  })

export const useRoom = (id: string) =>
  useQuery({
    queryKey: keys.room(id),
    queryFn: () => unwrap(api.GET('/api/v1/rooms/{id}', { params: { path: { id } } })),
  })

export const useSchedule = (id: string, from: string, to: string) =>
  useQuery({
    queryKey: keys.schedule(id, from, to),
    queryFn: () =>
      unwrap(
        api.GET('/api/v1/rooms/{id}/schedule', {
          params: { path: { id }, query: { From: from, To: to } },
        }),
      ),
  })

export type AvailabilityParams = {
  from: string
  to: string
  attendees?: number
  minCapacity?: number
  floor?: number
}

export const useAvailability = (p: AvailabilityParams | null) =>
  useQuery({
    queryKey: keys.availability(p ?? {}),
    enabled: p !== null,
    queryFn: () =>
      unwrap(
        api.GET('/api/v1/rooms/availability', {
          params: {
            query: {
              From: p!.from,
              To: p!.to,
              Attendees: p!.attendees,
              MinCapacity: p!.minCapacity,
              Floor: p!.floor,
            },
          },
        }),
      ),
  })

export type BookingsParams = { includeCancelled?: boolean; page?: number; pageSize?: number }

export const useMyBookings = (p: BookingsParams) =>
  useQuery({
    queryKey: keys.myBookings(p),
    queryFn: () =>
      unwrap(
        api.GET('/api/v1/bookings/mine', {
          params: {
            query: { IncludeCancelled: p.includeCancelled, Page: p.page, PageSize: p.pageSize },
          },
        }),
      ),
    placeholderData: keepPreviousData,
  })

export type AllBookingsParams = {
  roomId?: string
  from?: string
  to?: string
  status?: BookingStatus
  page?: number
  pageSize?: number
}

export const useAllBookings = (p: AllBookingsParams, enabled: boolean) =>
  useQuery({
    queryKey: keys.allBookings(p),
    enabled,
    queryFn: () =>
      unwrap(
        api.GET('/api/v1/bookings', {
          params: {
            query: {
              RoomId: p.roomId,
              From: p.from,
              To: p.to,
              Status: p.status,
              Page: p.page,
              PageSize: p.pageSize,
            },
          },
        }),
      ),
    placeholderData: keepPreviousData,
  })

export const useBooking = (id: string) =>
  useQuery({
    queryKey: keys.booking(id),
    queryFn: () => unwrap(api.GET('/api/v1/bookings/{id}', { params: { path: { id } } })),
  })

export function useCreateBooking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateBookingRequest) => unwrap(api.POST('/api/v1/bookings', { body })),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['bookings'] })
      void qc.invalidateQueries({ queryKey: ['schedule'] })
      void qc.invalidateQueries({ queryKey: ['availability'] })
    },
  })
}

export function useCancelBooking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      unwrap(api.POST('/api/v1/bookings/{id}/cancel', { params: { path: { id } } })),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['bookings'] })
      void qc.invalidateQueries({ queryKey: ['booking'] })
      void qc.invalidateQueries({ queryKey: ['schedule'] })
      void qc.invalidateQueries({ queryKey: ['availability'] })
    },
  })
}

export function useCreateRoom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateRoomRequest) => unwrap(api.POST('/api/v1/rooms', { body })),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['rooms'] }),
  })
}

export function useUpdateRoom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateRoomRequest }) =>
      unwrap(api.PATCH('/api/v1/rooms/{id}', { params: { path: { id } }, body })),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['rooms'] })
      void qc.invalidateQueries({ queryKey: ['room'] })
    },
  })
}
