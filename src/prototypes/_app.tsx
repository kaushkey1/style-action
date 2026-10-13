import '../index.css'
import { StrictMode, Suspense, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route, NavLink, useParams, Navigate } from 'react-router-dom'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { prototypes } from './registry'
import type { PrototypeEntry } from './registry'
import { Menu, X, FlaskConical } from 'lucide-react'

function PrototypeContent() {
  const { name } = useParams<{ name: string }>()
  const entry = prototypes.find((p) => p.name === name)

  if (!entry) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Prototype not found</h2>
        <p className="text-sm text-gray-500 mb-4">
          No prototype registered with the slug &ldquo;{name}&rdquo;.
        </p>
        <NavLink to="/" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
          Back to gallery
        </NavLink>
      </div>
    )
  }

  const Component = entry.component

  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600" />
          </div>
        }
      >
        <Component />
      </Suspense>
    </ErrorBoundary>
  )
}

function GalleryIndex() {
  if (prototypes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
        <FlaskConical className="h-10 w-10 text-gray-300 mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">No prototypes yet</h2>
        <p className="text-sm text-gray-500 max-w-md">
          Create your first prototype by copying <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">src/prototypes/_example</code> to a new folder and adding an entry to <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">registry.ts</code>.
        </p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Prototype Gallery</h1>
      <p className="text-sm text-gray-500 mb-6">Select a prototype from the sidebar or click below.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {prototypes.map((p) => (
          <NavLink
            key={p.name}
            to={`/p/${p.name}`}
            className="block rounded-lg border border-gray-200 bg-white p-4 hover:border-indigo-300 hover:shadow-sm transition-all"
          >
            <h3 className="font-medium text-gray-900">{p.title}</h3>
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">{p.description}</p>
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
              <span>{p.author}</span>
              <span>&middot;</span>
              <span>{p.date}</span>
            </div>
          </NavLink>
        ))}
      </div>
    </div>
  )
}

function SidebarEntry({ entry }: { entry: PrototypeEntry }) {
  return (
    <NavLink
      to={`/p/${entry.name}`}
      className={({ isActive }) =>
        `block rounded-lg px-3 py-2 text-sm transition-colors ${
          isActive
            ? 'bg-indigo-50 text-indigo-700 font-medium'
            : 'text-gray-700 hover:bg-gray-100'
        }`
      }
    >
      <div className="font-medium truncate">{entry.title}</div>
      <div className="text-xs text-gray-400 truncate mt-0.5">{entry.description}</div>
    </NavLink>
  )
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          role="presentation"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-white border-r border-gray-200 transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3">
          <FlaskConical className="h-5 w-5 text-indigo-600" />
          <span className="font-semibold text-gray-900">Prototypes</span>
          <button
            className="ml-auto p-1 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>
        <nav className="p-3 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 57px)' }}>
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `block rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            Gallery
          </NavLink>
          <div className="border-t border-gray-100 my-2" />
          {prototypes.map((entry) => (
            <SidebarEntry key={entry.name} entry={entry} />
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5 text-gray-700" />
          </button>
          <span className="font-semibold text-gray-900">Prototypes</span>
        </header>

        {/* Content area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Routes>
            <Route index element={<GalleryIndex />} />
            <Route path="p/:name" element={<PrototypeContent />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

const rootEl = document.getElementById('root')
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </StrictMode>,
  )
}
