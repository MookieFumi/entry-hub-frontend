import { createBrowserRouter, createMemoryRouter, type RouteObject } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { RequireAuth, RequireFacilities } from '@/components/layout/Guards'
import { AdminBookings } from '@/pages/AdminBookings'
import { WebhookDeliveries } from '@/pages/WebhookDeliveries'
import { AdminWebhooks } from '@/pages/AdminWebhooks'
import { AdminRules } from '@/pages/AdminRules'
import { AdminAudit } from '@/pages/AdminAudit'
import { AdminData } from '@/pages/AdminData'
import { AdminClosedDays } from '@/pages/AdminClosedDays'
import { AdminRooms } from '@/pages/AdminRooms'
import { BookingDetail } from '@/pages/BookingDetail'
import { Home } from '@/pages/Home'
import { Login } from '@/pages/Login'
import { MyBookings } from '@/pages/MyBookings'
import { NotFound } from '@/pages/NotFound'
import { Reschedule } from '@/pages/Reschedule'
import { RoomDetail } from '@/pages/RoomDetail'
import { Rooms } from '@/pages/Rooms'
import { RoomWeek } from '@/pages/RoomWeek'
import { Search } from '@/pages/Search'
import { Status } from '@/pages/Status'

export const routes: RouteObject[] = [
  { path: '/login', element: <Login /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Home /> },
          { path: 'rooms', element: <Rooms /> },
          { path: 'rooms/:id', element: <RoomDetail /> },
          { path: 'rooms/:id/week', element: <RoomWeek /> },
          { path: 'search', element: <Search /> },
          { path: 'bookings', element: <MyBookings /> },
          { path: 'bookings/:id', element: <BookingDetail /> },
          { path: 'bookings/:id/reschedule', element: <Reschedule /> },
          { path: 'status', element: <Status /> },
          {
            path: 'admin',
            element: <RequireFacilities />,
            children: [
              { path: 'rooms', element: <AdminRooms /> },
              { path: 'bookings', element: <AdminBookings /> },
              { path: 'closed-days', element: <AdminClosedDays /> },
              { path: 'rules', element: <AdminRules /> },
              { path: 'data', element: <AdminData /> },
              { path: 'audit', element: <AdminAudit /> },
              { path: 'webhooks', element: <AdminWebhooks /> },
              { path: 'webhooks/:id/deliveries', element: <WebhookDeliveries /> },
            ],
          },
          { path: '*', element: <NotFound /> },
        ],
      },
    ],
  },
]

export const createRouter = () => createBrowserRouter(routes)
export const createTestRouter = (path: string) =>
  createMemoryRouter(routes, { initialEntries: [path] })
