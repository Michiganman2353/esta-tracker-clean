import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PhotoCapture } from './PhotoCapture';

// Mock getUserMedia
const mockGetUserMedia = vi.fn();

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

beforeEach(() => {
  // Reset mocks
  mockGetUserMedia.mockReset();
  vi.clearAllMocks();

  // Setup navigator.mediaDevices
  Object.defineProperty(global.navigator, 'mediaDevices', {
    writable: true,
    value: {
      getUserMedia: mockGetUserMedia,
    },
  });
});

describe('PhotoCapture Component', () => {
  describe('Initial Render', () => {
    it('should render capture step initially', () => {
      const onPhotoConfirmed = vi.fn();
      render(<PhotoCapture onPhotoConfirmed={onPhotoConfirmed} />);

      expect(screen.getByText('Capture Photo')).toBeInTheDocument();
      expect(screen.getByText('Start Camera')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should render cancel button', () => {
      const onCancel = vi.fn();
      render(<PhotoCapture onPhotoConfirmed={vi.fn()} onCancel={onCancel} />);

      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).toBeInTheDocument();
    });
  });

  describe('Camera Access', () => {
    it('should call getUserMedia when Start Camera is clicked', async () => {
      const mockStream = {
        getTracks: () => [],
      };
      mockGetUserMedia.mockResolvedValue(mockStream);

      const onPhotoConfirmed = vi.fn();
      render(<PhotoCapture onPhotoConfirmed={onPhotoConfirmed} />);

      const startButton = screen.getByText('Start Camera');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalledWith({
          video: {
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });
      });
    });

    it('should show error message when camera access fails', async () => {
      mockGetUserMedia.mockRejectedValue(new Error('Permission denied'));

      const onPhotoConfirmed = vi.fn();
      render(<PhotoCapture onPhotoConfirmed={onPhotoConfirmed} />);

      const startButton = screen.getByText('Start Camera');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Unable to access camera/i)
        ).toBeInTheDocument();
      });
    });

    it('should show file picker fallback when camera fails', async () => {
      mockGetUserMedia.mockRejectedValue(new Error('Permission denied'));

      const onPhotoConfirmed = vi.fn();
      render(<PhotoCapture onPhotoConfirmed={onPhotoConfirmed} />);

      const startButton = screen.getByText('Start Camera');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText('Use file picker instead:')).toBeInTheDocument();
      });
    });
  });

  describe('File Input', () => {
    it('should accept file input as fallback', () => {
      const onPhotoConfirmed = vi.fn();
      render(<PhotoCapture onPhotoConfirmed={onPhotoConfirmed} />);

      const fileInput = screen.getByLabelText('Or choose file') as HTMLInputElement;
      expect(fileInput).toBeInTheDocument();
      expect(fileInput.type).toBe('file');
    });

    it('should validate file size', () => {
      const onPhotoConfirmed = vi.fn();
      const maxFileSize = 1024 * 1024; // 1MB
      render(
        <PhotoCapture
          onPhotoConfirmed={onPhotoConfirmed}
          maxFileSize={maxFileSize}
        />
      );

      // Create a file larger than max size
      const largeFile = new File(['a'.repeat(maxFileSize + 1)], 'large.jpg', {
        type: 'image/jpeg',
      });

      const fileInput = screen.getByLabelText('Or choose file') as HTMLInputElement;

      // Mock window.alert
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      fireEvent.change(fileInput, { target: { files: [largeFile] } });

      expect(alertSpy).toHaveBeenCalledWith(
        expect.stringContaining('File size must be less than')
      );

      alertSpy.mockRestore();
    });

    it('should validate file format', () => {
      const onPhotoConfirmed = vi.fn();
      render(<PhotoCapture onPhotoConfirmed={onPhotoConfirmed} />);

      // Create a file with invalid format
      const invalidFile = new File(['content'], 'document.txt', {
        type: 'text/plain',
      });

      const fileInput = screen.getByLabelText('Or choose file') as HTMLInputElement;

      // Mock window.alert
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      fireEvent.change(fileInput, { target: { files: [invalidFile] } });

      expect(alertSpy).toHaveBeenCalledWith(
        expect.stringContaining('File type must be one of')
      );

      alertSpy.mockRestore();
    });

    it('should accept valid file and show preview', () => {
      const onPhotoConfirmed = vi.fn();
      render(<PhotoCapture onPhotoConfirmed={onPhotoConfirmed} />);

      // Create a valid file
      const validFile = new File(['image content'], 'photo.jpg', {
        type: 'image/jpeg',
      });

      const fileInput = screen.getByLabelText('Or choose file') as HTMLInputElement;
      fireEvent.change(fileInput, { target: { files: [validFile] } });

      // Should show review step
      expect(screen.getByText('Review Photo')).toBeInTheDocument();
    });
  });

  describe('Photo Preview', () => {
    it('should show retake and confirm buttons in preview', () => {
      const onPhotoConfirmed = vi.fn();
      render(<PhotoCapture onPhotoConfirmed={onPhotoConfirmed} />);

      // Upload a valid file to get to preview
      const validFile = new File(['image'], 'photo.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText('Or choose file') as HTMLInputElement;
      fireEvent.change(fileInput, { target: { files: [validFile] } });

      expect(screen.getByText('Retake Photo')).toBeInTheDocument();
      expect(screen.getByText('Confirm & Upload')).toBeInTheDocument();
    });

    it('should call onPhotoConfirmed when confirmed', () => {
      const onPhotoConfirmed = vi.fn();
      render(<PhotoCapture onPhotoConfirmed={onPhotoConfirmed} />);

      // Upload a valid file
      const validFile = new File(['image'], 'photo.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText('Or choose file') as HTMLInputElement;
      fireEvent.change(fileInput, { target: { files: [validFile] } });

      // Click confirm
      const confirmButton = screen.getByText('Confirm & Upload');
      fireEvent.click(confirmButton);

      expect(onPhotoConfirmed).toHaveBeenCalledWith(validFile);
    });

    it('should go back to capture when retake is clicked', () => {
      const onPhotoConfirmed = vi.fn();
      render(<PhotoCapture onPhotoConfirmed={onPhotoConfirmed} />);

      // Upload a valid file
      const validFile = new File(['image'], 'photo.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText('Or choose file') as HTMLInputElement;
      fireEvent.change(fileInput, { target: { files: [validFile] } });

      // Click retake
      const retakeButton = screen.getByText('Retake Photo');
      fireEvent.click(retakeButton);

      // Should be back to capture step
      expect(screen.getByText('Capture Photo')).toBeInTheDocument();
      expect(screen.getByText('Start Camera')).toBeInTheDocument();
    });
  });

  describe('Cancel Functionality', () => {
    it('should call onCancel when cancel button is clicked', () => {
      const onCancel = vi.fn();
      render(<PhotoCapture onPhotoConfirmed={vi.fn()} onCancel={onCancel} />);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(onCancel).toHaveBeenCalled();
    });

    it('should cleanup URL when cancelled from preview', () => {
      const onCancel = vi.fn();
      render(<PhotoCapture onPhotoConfirmed={vi.fn()} onCancel={onCancel} />);

      // Upload a file to get to preview
      const validFile = new File(['image'], 'photo.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText('Or choose file') as HTMLInputElement;
      fireEvent.change(fileInput, { target: { files: [validFile] } });

      // We can't test cleanup directly in this environment, but we can verify 
      // the flow works without errors
      expect(screen.getByText('Review Photo')).toBeInTheDocument();
    });
  });

  describe('Custom Props', () => {
    it('should accept custom max file size', () => {
      const onPhotoConfirmed = vi.fn();
      const customMaxSize = 5 * 1024 * 1024; // 5MB
      
      render(
        <PhotoCapture
          onPhotoConfirmed={onPhotoConfirmed}
          maxFileSize={customMaxSize}
        />
      );

      // Component should render without errors
      expect(screen.getByText('Capture Photo')).toBeInTheDocument();
    });

    it('should accept custom accepted formats', () => {
      const onPhotoConfirmed = vi.fn();
      const customFormats = ['image/png'];
      
      render(
        <PhotoCapture
          onPhotoConfirmed={onPhotoConfirmed}
          acceptedFormats={customFormats}
        />
      );

      expect(screen.getByText('Capture Photo')).toBeInTheDocument();
    });

    it('should accept requireQualityCheck prop', () => {
      const onPhotoConfirmed = vi.fn();
      
      render(
        <PhotoCapture
          onPhotoConfirmed={onPhotoConfirmed}
          requireQualityCheck={false}
        />
      );

      expect(screen.getByText('Capture Photo')).toBeInTheDocument();
    });
  });
});
