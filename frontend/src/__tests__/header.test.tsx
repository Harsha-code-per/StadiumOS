import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Header from '@/components/Header';

describe('Header Navigation Component', () => {
  it('should render brand logo title and links', () => {
    render(<Header />);
    
    // Check main title
    const titleElement = screen.getByText(/StadiumOS/i);
    expect(titleElement).toBeInTheDocument();

    // Check link navigation titles
    expect(screen.getByText(/Control Room/i)).toBeInTheDocument();
    expect(screen.getByText(/Ground Crew/i)).toBeInTheDocument();
    expect(screen.getByText(/Fan Portal/i)).toBeInTheDocument();
  });

  it('should render system health connection indicator', () => {
    render(<Header />);
    
    // Checks that the initial loading connection indicator badge is present
    expect(screen.getByText(/Connecting...|System Connected/i)).toBeInTheDocument();
  });
});
