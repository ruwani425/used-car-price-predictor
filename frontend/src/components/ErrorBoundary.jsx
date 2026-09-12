import { Component } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';
import RefreshIcon from '@mui/icons-material/Refresh';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            minHeight: '60vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3,
          }}
        >
          <Paper
            elevation={6}
            sx={{
              p: 4,
              borderRadius: 4,
              backgroundColor: '#131C2E',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              textAlign: 'center',
              maxWidth: 540,
            }}
          >
            <ErrorIcon sx={{ fontSize: 56, color: '#EF4444', mb: 2 }} />
            <Typography variant="h5" fontWeight="bold" gutterBottom color="#F8FAFC">
              Application Error Detected
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              {this.state.error?.message ||
                'An unexpected rendering error occurred in the user interface. You can reload safely without losing your session.'}
            </Typography>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={this.handleReset}
              sx={{
                background: 'linear-gradient(135deg, #00E5FF 0%, #0077B6 100%)',
                color: '#031024',
                fontWeight: 700,
                borderRadius: 2.5,
              }}
            >
              Reload Application
            </Button>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}
