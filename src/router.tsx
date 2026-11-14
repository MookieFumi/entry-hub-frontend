import { createBrowserRouter, createMemoryRouter, type RouteObject } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { RequireAuth, RequireFacilities } from '@/components/layout/Guards'
import { AdminBookings } from '@/pages/AdminBookings'
import { AdminRooms } from '@/pages/AdminRooms'
import { BookingDetail } from '@/pages/BookingDetail'
import { Home } from '@/pages/Home'
import { Login } from '@/pages/Login'
import { MyBookings } from '@/pages/MyBookings'
import { NotFound } from '@/pages/NotFound'
import { RoomDetail } from '@/pages/RoomDetail'
import { Rooms } from '@/pages/Rooms'
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
          { path: 'search', element: <Search /> },
          { path: 'bookings', element: <MyBookings /> },
          { path: 'bookings/:id', element: <BookingDetail /> },
          { path: 'status', element: <Status /> },
          {
            path: 'admin',
            element: <RequireFacilities />,
            children: [
              { path: 'rooms', element: <AdminRooms /> },
              { path: 'bookings', element: <AdminBookings /> },
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
