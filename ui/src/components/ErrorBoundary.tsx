'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card variant="glass" className="p-8 text-center max-w-md mx-auto mt-8">
          <CardContent className="space-y-4">
            <AlertTriangle className="w-12 h-12 text-warning mx-auto" />
            <h3 className="text-lg font-semibold text-white">Something went wrong</h3>
            <p className="text-gray-400 text-sm">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <Button
              onClick={() => {
                this.setState({ hasError: false, error: undefined });
                window.location.reload();
              }}
              variant="primary"
              size="sm"
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reload Page
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
