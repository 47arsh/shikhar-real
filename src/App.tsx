import { Route, Routes } from 'react-router-dom'
import { Landing } from './routes/Landing'
import { Climb } from './routes/Climb'
import { Rooms } from './routes/Rooms'

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/climb" element={<Climb />} />
      <Route path="/rooms/:code?" element={<Rooms />} />
      <Route path="*" element={<Landing />} />
    </Routes>
  )
}
