'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AlertTriangle, Bug, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Update state with error info
    this.setState({ errorInfo });

    // Log the error for debugging
    console.error('Error caught by ErrorBoundary:', error, errorInfo);

    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log additional context if available
    if (error.stack) {
      console.error('Error stack:', error.stack);
    }

    // Log component stack for better debugging
    if (errorInfo.componentStack) {
      console.error('Component stack:', errorInfo.componentStack);
    }
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
          <Card className="max-w-lg mx-auto">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-red-600 mb-4">
                <AlertTriangle className="h-6 w-6" />
                <h2 className="text-xl font-bold">Something went wrong</h2>
              </div>

              <p className="text-muted-foreground mb-4">
                An error occurred in the application. Please try refreshing the
                page or navigate back to the home page.
              </p>

              <Accordion type="single" collapsible className="mb-4">
                <AccordionItem value="error-details">
                  <AccordionTrigger className="text-sm">
                    <div className="flex items-center gap-2">
                      <Bug className="h-4 w-4" />
                      <span>View Error Details</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-xs">
                    {this.state.error && (
                      <div className="bg-muted p-3 rounded mb-2 overflow-auto max-h-40">
                        <p className="font-mono break-words">
                          {this.state.error.toString()}
                        </p>
                      </div>
                    )}

                    {this.state.errorInfo &&
                      this.state.errorInfo.componentStack && (
                        <div className="mt-2">
                          <p className="font-semibold mb-1">Component Stack:</p>
                          <div className="bg-muted p-3 rounded overflow-auto max-h-60">
                            <pre className="text-xs font-mono whitespace-pre-wrap">
                              {this.state.errorInfo.componentStack}
                            </pre>
                          </div>
                        </div>
                      )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="default"
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh Page
                </Button>

                <Button
                  variant="outline"
                  onClick={this.resetError}
                  className="flex items-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Try Again
                </Button>

                <Button
                  variant="outline"
                  asChild
                  className="flex items-center gap-1"
                >
                  {' '}
                  <Link href="/">
                    <Home className="h-4 w-4" />
                    Go to Home
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
