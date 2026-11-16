import { FALLBACK_TIME_ZONE } from '@/lib/dates'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, unwrap } from './client'
import type { components } from './schema'

export type Room = components['schemas']['RoomResponse']
// The contract declares BookingStatus as an extensible enum (no JSON type), which the
// generator maps to `unknown` in responses, so the known values are listed here.
export type BookingStatus = 'Confirmed' | 'Cancelled' | 'Pending'
export type Booking = components['schemas']['BookingResponse']
export type CreateBookingRequest = components['schemas']['CreateBookingRequest']
export type RescheduleBookingRequest = components['schemas']['RescheduleBookingRequest']
export type CreateRoomRequest = components['schemas']['CreateRoomRequest']
export type UpdateRoomRequest = components['schemas']['UpdateRoomRequest']
export type Feature = components['schemas']['FeatureResponse']
export type Site = components['schemas']['SiteResponse']
export type SiteHoliday = components['schemas']['SiteHolidayResponse']
export type CreateHolidayRequest = components['schemas']['CreateHolidayRequest']

export const keys = {
  me: ['me'] as const,
  rules: ['rules'] as const,
  rooms: (params: object) => ['rooms', params] as const,
  room: (id: string) => ['room', id] as const,
  features: (includeInactive: boolean) => ['features', includeInactive] as const,
  availability: (params: object) => ['availability', params] as const,
  schedule: (id: string, from: string, to: string) => ['schedule', id, from, to] as const,
  myBookings: (params: object) => ['bookings', 'mine', params] as const,
  allBookings: (params: object) => ['bookings', 'all', params] as const,
  booking: (id: string) => ['booking', id] as const,
  sites: (includeInactive: boolean) => ['sites', includeInactive] as const,
  holidays: (siteId: string, from?: string, to?: string) =>
    ['holidays', siteId, from ?? '', to ?? ''] as const,
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

export type UpdateRulesRequest = components['schemas']['UpdateRulesRequest']

export function useUpdateRules() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateRulesRequest) => unwrap(api.PUT('/api/v1/rules', { body })),
    onSuccess: (data) => qc.setQueryData(keys.rules, data),
  })
}

/** Office time zone from the rules (with a provisional value while they load). */
export const useOfficeZone = () => useRules().data?.timeZone ?? FALLBACK_TIME_ZONE

export type RoomsParams = {
  floor?: number
  minCapacity?: number
  includeInactive?: boolean
  /** Codes from the catalog; only rooms that have all of them. */
  features?: string[]
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
              Features: p.features?.length ? p.features.join(',') : undefined,
              Page: p.page,
              PageSize: p.pageSize,
            },
          },
        }),
      ),
    placeholderData: keepPreviousData,
  })

/** Equipment and accessibility catalog of the tenant. Inactive entries are only returned to Facilities. */
export const useFeatures = (includeInactive = false) =>
  useQuery({
    queryKey: keys.features(includeInactive),
    queryFn: () =>
      unwrap(
        api.GET('/api/v1/features', { params: { query: { IncludeInactive: includeInactive } } }),
      ),
    staleTime: 10 * 60_000,
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
  features?: string[]
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
              Features: p!.features?.length ? p!.features.join(',') : undefined,
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
    mutationFn: ({
      body,
      idempotencyKey,
    }: {
      body: CreateBookingRequest
      /** Sent as `Idempotency-Key`: a retry with the same key and body returns the first booking. */
      idempotencyKey?: string
    }) =>
      unwrap(
        api.POST('/api/v1/bookings', {
          body,
          params: { header: { 'Idempotency-Key': idempotencyKey } },
        }),
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['bookings'] })
      void qc.invalidateQueries({ queryKey: ['schedule'] })
      void qc.invalidateQueries({ queryKey: ['availability'] })
    },
  })
}

export function useRescheduleBooking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: { id: string; body: RescheduleBookingRequest }) =>
      unwrap(
        api.POST('/api/v1/bookings/{id}/reschedule', {
          params: { path: { id: args.id } },
          body: args.body,
        }),
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['bookings'] })
      void qc.invalidateQueries({ queryKey: ['booking'] })
      void qc.invalidateQueries({ queryKey: ['schedule'] })
      void qc.invalidateQueries({ queryKey: ['availability'] })
    },
  })
}

export type CancelScope = 'occurrence' | 'series'
export type CancelSeriesResponse = components['schemas']['CancelSeriesResponse']

export function useCancelBooking() {
  const qc = useQueryClient()
  return useMutation({
    /** With `scope: 'series'` the API answers with what was cancelled and what was kept. */
    mutationFn: async ({ id, scope = 'occurrence' }: { id: string; scope?: CancelScope }) => {
      const result = await unwrap(
        api.POST('/api/v1/bookings/{id}/cancel', {
          params: { path: { id }, query: scope === 'series' ? { scope } : {} },
        }),
      )
      return (scope === 'series' ? result : null) as CancelSeriesResponse | null
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['bookings'] })
      void qc.invalidateQueries({ queryKey: ['booking'] })
      void qc.invalidateQueries({ queryKey: ['schedule'] })
      void qc.invalidateQueries({ queryKey: ['availability'] })
    },
  })
}

function invalidateBookings(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: ['bookings'] })
  void qc.invalidateQueries({ queryKey: ['booking'] })
  void qc.invalidateQueries({ queryKey: ['schedule'] })
  void qc.invalidateQueries({ queryKey: ['availability'] })
}

export function useApproveBooking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      unwrap(api.POST('/api/v1/bookings/{id}/approve', { params: { path: { id } } })),
    onSuccess: () => invalidateBookings(qc),
  })
}

export function useRejectBooking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string | null }) =>
      unwrap(
        api.POST('/api/v1/bookings/{id}/reject', {
          params: { path: { id } },
          body: { reason },
        }),
      ),
    onSuccess: () => invalidateBookings(qc),
  })
}

export function useCheckInBooking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      unwrap(api.POST('/api/v1/bookings/{id}/check-in', { params: { path: { id } } })),
    onSuccess: () => invalidateBookings(qc),
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

export const useSites = (includeInactive = false, enabled = true) =>
  useQuery({
    queryKey: keys.sites(includeInactive),
    queryFn: () =>
      unwrap(api.GET('/api/v1/sites', { params: { query: { IncludeInactive: includeInactive } } })),
    enabled,
    staleTime: 5 * 60_000,
  })

/** Closed days of a site, optionally between two dates (`yyyy-MM-dd`, in the site's time zone). */
export const useSiteHolidays = (siteId: string | undefined, from?: string, to?: string) =>
  useQuery({
    queryKey: keys.holidays(siteId ?? '', from, to),
    queryFn: () =>
      unwrap(
        api.GET('/api/v1/sites/{siteId}/holidays', {
          params: { path: { siteId: siteId! }, query: { From: from, To: to } },
        }),
      ),
    enabled: Boolean(siteId),
    staleTime: 60_000,
  })

export function useCreateHoliday(siteId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateHolidayRequest) =>
      unwrap(api.POST('/api/v1/sites/{siteId}/holidays', { params: { path: { siteId } }, body })),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['holidays', siteId] }),
  })
}

export function useDeleteHoliday(siteId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (holidayId: string) =>
      unwrap(
        api.DELETE('/api/v1/sites/{siteId}/holidays/{holidayId}', {
          params: { path: { siteId, holidayId } },
        }),
      ),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['holidays', siteId] }),
  })
}
