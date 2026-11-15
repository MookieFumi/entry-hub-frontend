import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Alert } from '@/components/ui/Feedback'
import { Button } from '@/components/ui/Button'

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack)
  }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 p-6">
        <Alert tone="error" title="Algo ha fallado">
          Recarga la página. Si el problema continúa, vuelve a iniciar sesión.
        </Alert>
        <Button onClick={() => location.reload()}>Recargar</Button>
      </div>
    )
  }
}
